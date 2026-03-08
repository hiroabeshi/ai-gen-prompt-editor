import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DICT_PATH = path.resolve(__dirname, '../src/data/json/dictionary.json');
const OUTPUT_PATH = path.resolve(__dirname, '../csv/missing_translations.csv');

async function main() {
    console.log('[ Info ] 辞書データを読み込み中...');
    const dictRaw = fs.readFileSync(DICT_PATH, 'utf-8');
    const dict = JSON.parse(dictRaw);

    const missingLines: string[] = [];
    missingLines.push('English Tag,Translated Tag,Category ID'); // ヘッダー

    let count = 0;
    for (const [enTag, value] of Object.entries(dict.tags)) {
        const jaTag = (value as [string, number])[0];
        const catId = (value as [string, number])[1];

        // AIが回答を漏らした（キーと訳が同じ、または未分類0）タグを抽出
        if (enTag === jaTag || catId === 0) {
            missingLines.push(`${enTag},${jaTag},${catId}`);
            count++;
        }
    }

    fs.writeFileSync(OUTPUT_PATH, missingLines.join('\n'));
    console.log(`[ ✓ ] 完了！ 抽出された ${count} 件のデータをCSVに保存しました -> ${OUTPUT_PATH}`);
}

main().catch(console.error);
