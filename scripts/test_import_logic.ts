import { readFileSync } from 'fs';
import { resolve } from 'path';

// --- 統合辞書データをロード ---
const DICT_PATH = resolve('src/data/json/dictionary.json');
let loadedDictionary: { categories: string[], tags: Record<string, [string, number]> } | null = null;
try {
    const dictContent = readFileSync(DICT_PATH, 'utf-8');
    loadedDictionary = JSON.parse(dictContent);
} catch (e) {
    console.error("Failed to load dictionary.json:", e);
}

// タグを綺麗にするヘルパー関数（先頭・末尾の空白を消す）
function cleanTag(tag: string): string {
    return tag.trim();
}

// 辞書と照合する関数
function lookupTag(tag: string) {
    const cleaned = cleanTag(tag);
    if (!cleaned) return null;

    // 強度などの特殊記法を除去したプレーンテキストで照合するための工夫も将来的には必要になるかもですが
    // 今回はそのまま照合します
    const lower = cleaned.toLowerCase();

    // 辞書にあればその情報を、無ければ空を返す
    if (loadedDictionary && loadedDictionary.tags[lower]) {
        const [label, categoryIndex] = loadedDictionary.tags[lower];
        const category = loadedDictionary.categories[categoryIndex] || '未分類';
        return { original: cleaned, label: label, category: category, isKnown: true };
    } else {
        return { original: cleaned, label: '', category: 'Unknown', isKnown: false };
    }
}

// NovelAI お約束（デフォルト付与）タグのリスト
const NOVEL_AI_BOILERPLATE = [
    'nsfw', 'lowres', 'artistic error', 'film grain', 'scan artifacts',
    'worst quality', 'bad quality', 'jpeg artifacts', 'very displeasing',
    'chromatic aberration', 'dithering', 'halftone', 'screentone',
    'multiple views', 'logo', 'too many watermarks', 'negative space',
    'blank page', '@_@', 'mismatched pupils', 'glowing eyes', 'bad anatomy',
    'low_quality', 'worst_quality', 'text', 'signature',
    'watermark', 'bad_anatomy', 'jpeg_artifacts', 'blurry'
];

// カンマ区切りの文字列をパージして辞書照合結果の配列にする関数
function processPromptString(promptStr: string) {
    if (!promptStr) return [];
    const tags = promptStr.split(',');

    return tags
        .map(lookupTag)
        .filter((result): result is NonNullable<typeof result> => result !== null) // null除外
        .filter(result => !NOVEL_AI_BOILERPLATE.includes(result.original.toLowerCase())); // お約束タグを除外
}

// メタデータ抽出と整形処理の実装
function extractAndFormatMetadata(filePath: string) {
    const buffer = readFileSync(filePath);
    let offset = 8; // skip signature

    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.toString('ascii', offset + 4, offset + 8);
        offset += 8;

        if (type === 'tEXt' || type === 'iTXt') {
            const data = buffer.subarray(offset, offset + length);
            const nullIdx = data.indexOf(0);

            if (nullIdx !== -1) {
                const keyword = data.toString('utf8', 0, nullIdx);
                if (keyword === 'Comment') {
                    let contentStr = '';
                    if (type === 'tEXt') {
                        contentStr = data.toString('utf8', nullIdx + 1);
                    } else {
                        // iTXt header: [keyword]\0[compression flag(1)][compression method(1)][lang tag]\0[trans keyword]\0[content]
                        let pos = nullIdx + 3;
                        while (pos < data.length && data[pos] !== 0) pos++;
                        pos++; // skip \0
                        while (pos < data.length && data[pos] !== 0) pos++;
                        pos++; // skip \0
                        contentStr = data.toString('utf8', pos);
                    }

                    const jsonStart = contentStr.indexOf('{');
                    if (jsonStart !== -1) {
                        try {
                            const jsonObj = JSON.parse(contentStr.substring(jsonStart));

                            // --- 整形用オブジェクト ---
                            type TagResult = { original: string; label: string; category: string; isKnown: boolean; };
                            const formattedData: {
                                main: TagResult[],
                                mainNegative: TagResult[],
                                characters: { characterIndex: number, tags: TagResult[] }[],
                                charactersNegative: { characterIndex: number, tags: TagResult[] }[]
                            } = {
                                main: [],
                                mainNegative: [],
                                characters: [],
                                charactersNegative: []
                            };

                            // 1. メインプロンプト
                            const mainStr = jsonObj.v4_prompt?.caption?.base_caption || jsonObj.v4_prompt?.base_caption || jsonObj.prompt || '';
                            formattedData.main = processPromptString(mainStr) as TagResult[];

                            // 2. メインのネガティブプロンプト
                            const negativeStr = 
                                jsonObj.v4_negative_prompt?.caption?.base_caption || 
                                jsonObj.v4_negative_prompt?.base_caption ||
                                jsonObj.v4_negative_prompt?.caption ||
                                (typeof jsonObj.v4_negative_prompt === 'string' ? jsonObj.v4_negative_prompt : '') ||
                                jsonObj.uc || 
                                jsonObj.negative_prompt || 
                                '';
                            formattedData.mainNegative = processPromptString(negativeStr) as TagResult[];

                            // 3. キャラクタープロンプト
                            const charCaps = jsonObj.v4_prompt?.caption?.char_captions || jsonObj.v4_prompt?.char_captions || [];
                            formattedData.characters = charCaps.map((c: any, index: number) => {
                                return {
                                    characterIndex: index + 1,
                                    tags: processPromptString(c.char_caption || '') as TagResult[]
                                };
                            });

                            // 4. キャラクターのネガティブプロンプト
                            const charNegCaps = jsonObj.v4_negative_prompt?.caption?.char_captions || jsonObj.v4_negative_prompt?.char_captions || [];
                            formattedData.charactersNegative = charNegCaps.map((c: any, index: number) => {
                                return {
                                    characterIndex: index + 1,
                                    tags: processPromptString(c.char_caption || '') as TagResult[]
                                };
                            });

                            // 結果を人間に見やすく表示
                            console.log('----- メタデータ抽出・整形結果 -----');
                            console.log(JSON.stringify(formattedData, null, 2));
                            console.log('------------------------------------');

                            return formattedData;

                        } catch (e) {
                            console.error("JSON Parse Error:", e);
                        }
                    }
                }
            }
        }
        offset += length + 4;
    }
    console.log("No valid NovelAI metadata found.");
}

// 実行
const targetFile = process.argv[2] || "C:\\AI_Coding\\PromptEdit\\scripts\\1girl, dark_room s-1150428565.png";
console.log(`Analyzing file: ${targetFile}`);
extractAndFormatMetadata(targetFile);
