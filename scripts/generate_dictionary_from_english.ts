/**
 * 【確定プラン】 Danbooru 1万件タグ 翻訳＆カテゴリ付与パイプライン
 * 
 * 1. データとバッチサイズの基本仕様
 *    - 入力データ: `csv/origin/danbooru_top_tags.json` （Danbooru人気上位 10,000件）
 *    - バッチサイズ: 1回あたり 100件 （全100バッチ）
 *    - API実行モデル: `gemini-2.5-flash`
 * 
 * 2. スクリプトの処理フロー
 *    1) 初期化・読み込み: danbooru_top_tags.json (10,000件) と master_categories.json (30種) を読み込む。
 *    2) バッチループ: データを100件ずつに切り出し、Gemini APIへ「翻訳＋カテゴリID分類（JSON出力）」をリクエスト。
 *       ※API制限を回避するため、適度なウェイトを挟む。
 *       ※チェックポイント機能（前回終了位置からの再開）を備える。
 *    3) 正常終了時: パースに成功したJSONをメモリ上の辞書データにマージ。
 *    4) エラー（PROHIBITED_CONTENT 等）発生時の隔離ロジック（重要）:
 *       - Geminiが「NSFW等が含まれているため回答を拒否（エラー）」した場合、そのバッチ（100件）全体の実処理をスキップする。
 *       - スキップされた100件の元データ（英語タグ等）を、専用の隔離CSVファイルに書き出す。
 *       - ファイル命名規則: `csv/prohibited/failed_batch_[開始インデックス]_[終了インデックス].csv` 
 *    5) 最終出力: 正常に処理できたすべてのデータを結合し、`src/data/json/dictionary.json` として書き出す。
 * 
 * 3. 「敗者復活戦（人間による精査・マージ）」のワークフロー (別スクリプト)
 *    1) 隔離されたCSVを人間が目視精査し、エグいNSFWタグの行を手動削除する。
 *    2) リカバリースクリプト (`recovery_dictionary.ts`) で毒抜きされたCSVを再処理し、辞書にマージする。
 */

import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// APIキーを環境変数から取得
const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ファイルパスの設定
const INPUT_PATH = path.resolve(__dirname, '../csv/origin/danbooru_top_tags.json');
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/json/dictionary.json');
const PROHIBITED_DIR = path.resolve(__dirname, '../csv/prohibited');
const CATEGORIES_PATH = path.resolve(__dirname, '../src/data/json/master_categories.json');

// チェックポイントファイル（途中再開用）
const CHECKPOINT_PATH = path.resolve(__dirname, '../csv/checkpoint_english.json');

// 1回のリクエストでGeminiに分類させる件数
const BATCH_SIZE = 100;

// Geminiへのリクエスト時のインターバル（ミリ秒）
const SLEEP_MS = 2000;

// リトライ設定
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Checkpoint {
    processedCount: number;
    tags: Record<string, [string, number]>;
}

function loadCheckpoint(): Checkpoint | null {
    if (!fs.existsSync(CHECKPOINT_PATH)) return null;
    try {
        const raw = fs.readFileSync(CHECKPOINT_PATH, 'utf-8');
        return JSON.parse(raw) as Checkpoint;
    } catch {
        console.warn('[ Checkpoint ] チェックポイントファイルの読み込みに失敗しました。最初から処理します。');
        return null;
    }
}

function saveCheckpoint(checkpoint: Checkpoint): void {
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
}

function clearCheckpoint(): void {
    if (fs.existsSync(CHECKPOINT_PATH)) {
        fs.unlinkSync(CHECKPOINT_PATH);
        console.log('[ Checkpoint ] 処理完了のためチェックポイントを削除しました。');
    }
}

async function callWithRetry(prompt: string, batchLabel: string): Promise<string> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (err: any) {
            const waitMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
            if (attempt < MAX_RETRIES) {
                console.warn(`[ Retry ] ${batchLabel} : APIエラー (試行 ${attempt}/${MAX_RETRIES})。${waitMs / 1000}秒後にリトライします... (${err.message})`);
                await sleep(waitMs);
            } else {
                throw new Error(`${batchLabel} : ${MAX_RETRIES}回リトライ後も失敗: ${err.message}`);
            }
        }
    }
    throw new Error('unreachable');
}

function parseResponse(responseText: string): Record<string, [string, number]> {
    let cleaned = responseText.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        throw new Error('レスポンスが正しいJSONフォーマットではありません。');
    }
}

async function main() {
    if (!API_KEY) {
        console.error('エラー: 環境変数 GEMINI_API_KEY が設定されていません。');
        process.exit(1);
    }

    if (!fs.existsSync(PROHIBITED_DIR)) {
        fs.mkdirSync(PROHIBITED_DIR, { recursive: true });
    }

    const categoriesRaw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
    const masterCategories: string[] = JSON.parse(categoriesRaw);

    const systemPrompt = `
あなたは画像生成AIプロンプトの専門翻訳・分類アシスタントです。
以下のカテゴリリスト（インデックス番号と名前）を使用し、渡された英語タグの「自然な日本語訳」と「最も適切なカテゴリのインデックス番号」を推測してください。

【カテゴリリスト】
${masterCategories.map((c, i) => `${i}: ${c}`).join('\n')}

【出力フォーマット】
入力された英語タグをキーとし、値に「日本語訳」と「カテゴリ番号」の配列を持つJSONオブジェクトを出力してください。
余計な説明テキストやマークダウン表記は一切不要です。純粋なJSON文字列のみを出力してください。

例:
{"1girl": ["一人の女の子", 1], "long_hair": ["ロングヘア", 2], "blue_eyes": ["青い目", 3]}
    `.trim();

    console.log('[ Info ] JSONを読み込み中...');
    const rawData = fs.readFileSync(INPUT_PATH, 'utf-8');
    const allTags: { name: string, id: number, category: number, post_count: number }[] = JSON.parse(rawData);
    const tagNames = allTags.map(t => t.name);

    console.log(`[ Info ] 入力データ読み込み完了。総件数: ${tagNames.length}`);

    const checkpoint = loadCheckpoint();
    let startIndex = 0;

    const finalData: {
        categories: string[];
        tags: Record<string, [string, number]>;
    } = {
        categories: masterCategories,
        tags: {}
    };

    if (checkpoint) {
        startIndex = checkpoint.processedCount;
        finalData.tags = checkpoint.tags;
        console.log(`[ Checkpoint ] ${startIndex} 件目から再開します。...`);
    }

    let processed = startIndex;
    for (let i = startIndex; i < tagNames.length; i += BATCH_SIZE) {
        const batch = tagNames.slice(i, i + BATCH_SIZE);
        const batchLabel = `Batch [${i + 1}〜${i + batch.length}]`;
        const batchText = batch.join('\n');
        const prompt = `${systemPrompt}\n\n【分類対象データ】\n${batchText}`;

        try {
            console.log(`[ → ] ${batchLabel} を処理中...`);
            const responseText = await callWithRetry(prompt, batchLabel);
            const resultMap = parseResponse(responseText);

            // 結果をマージ
            let missingCount = 0;
            batch.forEach((enTag) => {
                if (resultMap[enTag]) {
                    finalData.tags[enTag] = resultMap[enTag];
                } else {
                    // APIが翻訳を漏らしたタグは未分類・未翻訳のフォールバック
                    finalData.tags[enTag] = [enTag, 0];
                    missingCount++;
                }
            });

            if (missingCount > 0) {
                console.warn(`[ Warn ] ${batchLabel} : ${missingCount}件のタグがAIの回答から欠落しました。`);
            }

            processed += batch.length;
            console.log(`[ ✓ ] ${processed} / ${tagNames.length} 件完了`);

        } catch (err: any) {
            console.error(`[ Error ] ${batchLabel} : 失敗しました。このバッチを隔離します。`, err.message);

            // 隔離用CSVの作成 (タグ名だけを1行ずつ書き出す)
            const failedBatchPath = path.join(PROHIBITED_DIR, `failed_batch_${i + 1}_${i + batch.length}.csv`);
            fs.writeFileSync(failedBatchPath, batch.join('\n'));
            console.log(`[ Isolate ] -> 隔離ファイル作成: ${failedBatchPath}`);

            // プログレスは進める（このバッチはスキップ扱いのためメイン辞書には含めない）
            processed += batch.length;
        }

        saveCheckpoint({ processedCount: processed, tags: finalData.tags });

        if (i + BATCH_SIZE < tagNames.length) {
            await sleep(SLEEP_MS);
        }
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalData, null, 2));
    console.log(`\n🎉 生成完了！ メインのJSONファイルを書き出しました -> ${OUTPUT_PATH}`);

    // 隔離ファイルの存在確認アナウンス
    const prohibitedFiles = fs.readdirSync(PROHIBITED_DIR).filter(f => f.startsWith('failed_batch_'));
    if (prohibitedFiles.length > 0) {
        console.log(`\n⚠️ 注意: ${prohibitedFiles.length}個のバッチ（計 ${prohibitedFiles.length * BATCH_SIZE} 件相当）がエラーにより隔離・スキップされました。`);
        console.log(`-> ${PROHIBITED_DIR} フォルダ内のCSVを確認し、手動で問題のタグを削除してからリカバリースクリプトを実行してください。`);
    }

    clearCheckpoint();
}

main().catch(console.error);
