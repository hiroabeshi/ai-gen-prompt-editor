/**
 * 【敗者復活戦】リカバリースクリプト
 * 
 * 人間の手で「毒（NSFW等）」が抜かれ、安全になった隔離CSVファイルを読み込み、
 * 再度Gemini APIに投げて本番の `dictionary.json` にマージするスクリプト。
 * 
 * 実行方法:
 *   npx tsx scripts/recovery_dictionary.ts
 */

import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// APIキー設定
const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// パス設定
const PROHIBITED_DIR = path.resolve(__dirname, '../csv/prohibited');
const RECOVERED_DIR = path.resolve(__dirname, '../csv/prohibited/recovered');
const DICTIONARY_PATH = path.resolve(__dirname, '../src/data/json/dictionary.json');
const CATEGORIES_PATH = path.resolve(__dirname, '../src/data/json/master_categories.json');

// リトライ設定
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;
const SLEEP_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
        console.log('隔離フォルダが存在しません。処理を終了します。');
        return;
    }

    // 処理済み(リカバリー成功)を移動するフォルダを作成
    if (!fs.existsSync(RECOVERED_DIR)) {
        fs.mkdirSync(RECOVERED_DIR, { recursive: true });
    }

    // 隔離されたCSVファイルの一覧を取得
    const files = fs.readdirSync(PROHIBITED_DIR).filter(f => f.endsWith('.csv'));

    if (files.length === 0) {
        console.log('[ Info ] リカバリー対象のCSVファイルが見つかりません。');
        return;
    }

    console.log(`[ Info ] ${files.length} 件の隔離ファイルをリカバリー処理します...`);

    // 辞書とカテゴリの読み込み
    const categoriesRaw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
    const masterCategories: string[] = JSON.parse(categoriesRaw);

    const dictRaw = fs.readFileSync(DICTIONARY_PATH, 'utf-8');
    const dict = JSON.parse(dictRaw);

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

    // 各ファイルを順次処理
    for (const file of files) {
        const filePath = path.join(PROHIBITED_DIR, file);
        const tagText = fs.readFileSync(filePath, 'utf-8');

        // 空行を除外してタグの配列にする
        const tags = tagText.split(/\r?\n/).filter(line => line.trim().length > 0);

        if (tags.length === 0) {
            console.log(`[ Skip ] ${file} は空のためスキップします。`);
            continue;
        }

        console.log(`[ → ] ${file} (${tags.length}件) を処理中...`);
        const prompt = `${systemPrompt}\n\n【分類対象データ】\n${tags.join('\n')}`;

        try {
            const responseText = await callWithRetry(prompt, file);
            const resultMap = parseResponse(responseText);

            let missingCount = 0;
            tags.forEach((enTag) => {
                if (resultMap[enTag]) {
                    dict.tags[enTag] = resultMap[enTag];
                } else {
                    // APIが翻訳を漏らしたタグ
                    dict.tags[enTag] = [enTag, 0];
                    missingCount++;
                }
            });

            if (missingCount > 0) {
                console.warn(`[ Warn ] ${file} : ${missingCount}件のタグがAIの回答から欠落しましたが、未分類として登録しました。`);
            }

            console.log(`[ ✓ ] ${file} の辞書マージ完了！`);

            // 成功したファイルは recovered フォルダへ移動
            const destPath = path.join(RECOVERED_DIR, file);
            fs.renameSync(filePath, destPath);

        } catch (err: any) {
            console.error(`[ Error ] ${file} の処理に失敗しました。このファイルはスキップします。`, err.message);
        }

        // 次のファイルへ行く前にウェイトを入れる
        await sleep(SLEEP_MS);
    }

    // 最後に上書き保存
    fs.writeFileSync(DICTIONARY_PATH, JSON.stringify(dict, null, 2));
    console.log(`\n🎉 リカバリー完了！ 辞書データを上書き保存しました -> ${DICTIONARY_PATH}`);
}

main().catch(console.error);
