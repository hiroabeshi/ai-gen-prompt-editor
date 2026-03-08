import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 保存先パス
const OUTPUT_PATH = path.resolve(__dirname, '../csv/danbooru_top_tags.json');

// 取得対象ページ数 (1ページ1000件 x 5 = 5000件)
const MAX_PAGES = 5;
const LIMIT_PER_PAGE = 1000;

// ウェイト（仕様上の「一般的な制限の5倍」を担保するため、5秒待つ）
// Danbooruの匿名API制限は通常1秒間にアクセス数回。5秒待機なら極めて安全。
const SLEEP_MS = 5000;

// sleepヘルパー関数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('[ Info ] Danbooru APIから人気タグの取得を開始します...');

    let allTags: any[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
        // search[order]=count で使用回数の多い人気タグから取得
        // search[hide_empty]=yes で空タグを除外
        const url = `https://danbooru.donmai.us/tags.json?search[hide_empty]=yes&search[order]=count&limit=${LIMIT_PER_PAGE}&page=${page}`;
        console.log(`[ Fetch ] ページ ${page}/${MAX_PAGES} を取得中... (${url})`);

        try {
            const response = await fetch(url, {
                headers: {
                    // API制限対策でUser-Agentを適切に設定するのがマナー
                    'User-Agent': 'PromptEdit/1.0 (Integration/TagFetcher; test)'
                }
            });

            if (!response.ok) {
                console.error(`[ Error ] ページ ${page} の取得に失敗しました。ステータスコード: ${response.status}`);
                // エラーの内容を出力
                console.error(await response.text());
                break; // エラーが起きたら中断してそこまでの分を保存する
            }

            const tags = await response.json();

            // タグ情報から必要なもの（id, 英語タグ名, 投稿数, カテゴリ）だけを抽出
            // category: 0(General), 1(Artist), 3(Copyright), 4(Character), 5(Meta)
            const extracted = tags.map((t: any) => ({
                id: t.id,
                name: t.name,
                category: t.category,
                post_count: t.post_count
            }));

            allTags = allTags.concat(extracted);
            console.log(`[ ✓ ] ページ ${page} の処理完了: ${extracted.length} 件取得 (累計 ${allTags.length} 件)`);

        } catch (error) {
            console.error(`[ Error ] ページ ${page} の通信中に例外が発生しました:`, error);
            break;
        }

        // 最後のページ以外でウェイトを入れる
        if (page < MAX_PAGES) {
            console.log(`[ Sleep ] 制限回避のため ${SLEEP_MS / 1000}秒間待機します...`);
            await sleep(SLEEP_MS);
        }
    }

    console.log(`\n[ Save ] 取得結果の保存中... 総件数: ${allTags.length} 件`);

    // csvディレクトリが存在しない場合は作成
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allTags, null, 2));
    console.log(`🎉 完了: データを保存しました -> ${OUTPUT_PATH}`);
}

main().catch(console.error);
