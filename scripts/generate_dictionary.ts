import fs from 'fs';
import path from 'path';
import readline from 'readline';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// APIキーを環境変数から取得（.env等を利用）
const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ファイルパスの設定
const CSV_PATH = path.resolve(__dirname, '../csv/danbooru-machine-jp.csv');
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/json/dictionary.json');
const FAILED_OUTPUT_PATH = path.resolve(__dirname, '../csv/unclassified_tags.csv');
const CATEGORIES_PATH = path.resolve(__dirname, '../src/data/json/master_categories.json');

// 1回のリクエストでGeminiに分類させる件数（Tier 1なので増量）
const BATCH_SIZE = 500;

// Geminiへのリクエスト時のインターバル（Tier 1なので待機時間を短縮、ミリ秒）
const SLEEP_MS = 1000;

// sleepヘルパー関数
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    if (!API_KEY) {
        console.error('エラー: 環境変数 GEMINI_API_KEY が設定されていません。');
        process.exit(1);
    }

    // マスターカテゴリの読み込み
    const categoriesRaw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
    const masterCategories: string[] = JSON.parse(categoriesRaw);

    const systemPrompt = `
あなたは画像生成AI（Danbooruタグ等）のプロンプト分類アシスタントです。
以下のカテゴリリスト（インデックス番号と名前）を使用し、渡された英語タグと日本語訳のリストをそれぞれ最も適切なカテゴリに分類してください。

【カテゴリリスト】
${masterCategories.map((c, i) => `${i}: ${c}`).join('\n')}

【出力フォーマット】
入力された行の順番通りに、対応するカテゴリの「インデックス番号（数字のみ）」をカンマ区切りでワンラインで出力してください。
例: 3,8,22,0,14
※ 余計な説明テキストやマークダウン表記は一切不要です。
  `.trim();

    // CSVから全行を読み込む（メモリが許せば一括読み込みでもOKだが、念のためストリームで）
    const fileStream = fs.createReadStream(CSV_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const lines: string[] = [];
    // 開発用途では件数を絞る場合
    let count = 0;
    for await (const line of rl) {
        if (line.trim()) lines.push(line.trim());
        count++;
        if (count >= 100) break; // まずはテストとして最初の100件（1バッチ）だけでストップ
    }

    console.log(`[ Info ] CSV読み込み完了。総行数: ${lines.length}`);

    // マスタ分離型の最終出力データ構造
    const finalData: {
        categories: string[];
        tags: Record<string, [string, number]>;
    } = {
        categories: masterCategories,
        tags: {}
    };

    // 失敗した行・未分類になった行を保存する配列
    const failedLines: string[] = [];

    // バッチごとに処理
    let processed = 0;
    for (let i = 0; i < lines.length; i += BATCH_SIZE) {
        const batch = lines.slice(i, i + BATCH_SIZE);

        // 入力リスト文字列の作成 (例: "1girl,一人の女の子\nblue_eyes,青い目...")
        const batchText = batch.join('\n');
        const prompt = `${systemPrompt}\n\n【分類対象データ】\n${batchText}`;

        try {
            console.log(`[ Batch ] ${i + 1} 〜 ${i + batch.length} 件目を処理中...`);
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();

            // レスポンスの解析 (想定: "3,8,22,0,14")
            // ※ AIの回答ブレ（スペース混入等）を防ぐため正規表現で抽出
            const categoryIndices = responseText.split(',').map(s => parseInt(s.replace(/\D/g, ''), 10));

            // 分類結果数が合わない場合の安全策
            if (categoryIndices.length !== batch.length) {
                console.warn(`[ Warn ] ${i + 1} 〜 ${i + batch.length} : リクエスト件数(${batch.length})と回答件数(${categoryIndices.length})が一致しません。一部未分類(0)とします。`);
                // エラー内容を出力しておくとデバッグしやすい
                console.debug(`    Response: ${responseText.substring(0, 100)}...`);
            }

            batch.forEach((line, index) => {
                const [enTag, jaTag] = line.split(',');
                // エラー等で取得できなかった、または範囲外のインデックスは「0: 未分類」とする
                let catId = categoryIndices[index];
                if (isNaN(catId) || catId < 0 || catId >= masterCategories.length) {
                    catId = 0; // 未分類
                }

                // 未分類になったものは後で人間が救出できるようにリストアップ
                if (catId === 0) {
                    failedLines.push(line);
                }

                finalData.tags[enTag] = [jaTag, catId];
            });

            processed += batch.length;
            console.log(`[ Success ] ${processed} 件完了`);

        } catch (err: any) {
            console.error(`[ Error ] ${i + 1} 〜 ${i + batch.length} 件目でAPIエラー発生。スキップします。`, err.message);
            // エラー時はすべて未分類(0)で登録して破綻を防ぐ
            batch.forEach(line => {
                const [enTag, jaTag] = line.split(',');
                finalData.tags[enTag] = [jaTag, 0];
                failedLines.push(line);
            });
        }

        // Rate Limit 回避のためのWait
        if (i + BATCH_SIZE < lines.length) {
            await sleep(SLEEP_MS);
        }
    }

    // JSONとして書き出し
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalData, null, 2));
    console.log(`\n🎉 生成完了！ JSONファイルを書き出しました -> ${OUTPUT_PATH}`);

    // 未分類・失敗行の書き出し
    if (failedLines.length > 0) {
        fs.writeFileSync(FAILED_OUTPUT_PATH, failedLines.join('\n'));
        console.log(`⚠️ 未分類または処理に失敗したタグを書き出しました -> ${FAILED_OUTPUT_PATH} (全 ${failedLines.length} 件)`);
    }
}

main().catch(console.error);
