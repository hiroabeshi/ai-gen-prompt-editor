import dictionaryRaw from '../data/json/dictionary.json'

export interface TagResult {
  original: string;
  label: string;
  category: string;
  isKnown: boolean;
}

export interface PNGMetadata {
  main: TagResult[];
  mainNegative: TagResult[];
  characters: {
    characterIndex: number;
    tags: TagResult[];
    negativeTags: TagResult[];
  }[];
}

export interface DictionaryData {
  categories: string[];
  tags: Record<string, [string, number]>;
}

// 品質関連のお約束タグ（低品質を回避するためにネガティブに自動付与されるもの）
const BOILERPLATE_QUALITY = [
  'lowres', 'worst_quality', 'bad_quality', 'low_quality',
  'blurry', 'jpeg_artifacts', 'very_displeasing'
];

// その他の定型・不要なお約束タグ（UI、文字、不具合回避など）
const BOILERPLATE_OTHERS = [
  'no_text', 'artistic_error', 'film_grain', 'scan_artifacts',
  'chromatic_aberration', 'dithering', 'halftone', 'screentone',
  'multiple_views', 'logo', 'too_many_watermarks', 'negative_space',
  'blank_page', '@_@', 'mismatched_pupils', 'glowing_eyes', 'bad_anatomy',
  'text', 'signature', 'watermark'
];

// 合計除外リスト
const NOVEL_AI_BOILERPLATE = [...BOILERPLATE_QUALITY, ...BOILERPLATE_OTHERS];

let dictionaryCache: DictionaryData | null = null;

/**
 * 統合辞書データをロードする
 */
export async function loadDictionary(): Promise<DictionaryData> {
  if (dictionaryCache) return dictionaryCache;
  dictionaryCache = dictionaryRaw as any as DictionaryData;
  return dictionaryCache;
}

/**
 * タグを綺麗にする
 */
function cleanTag(tag: string): string {
  // 1. 強調（{ } [ ] ( ) ）を取り除く
  // 2. 半角スペースを _ に変換する
  return tag
    .replace(/[\{\}\[\]\(\)]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

/**
 * 辞書と照合する
 */
function lookupTag(tag: string, dictionary: DictionaryData): TagResult {
  const cleaned = cleanTag(tag);
  if (!cleaned) return { original: '', label: '', category: '', isKnown: false };

  const lower = cleaned.toLowerCase();

  if (dictionary.tags[lower]) {
    const [label, categoryIndex] = dictionary.tags[lower];
    const category = dictionary.categories[categoryIndex] || '未分類';
    return { original: cleaned, label, category, isKnown: true };
  } else {
    return { original: cleaned, label: '', category: 'Unknown', isKnown: false };
  }
}

/**
 * プロンプト文字列を処理してタグ結果の配列にする
 */
function processPromptString(promptStr: string, dictionary: DictionaryData): TagResult[] {
  if (!promptStr) return [];

  // 1. カンマで分割
  const rawParts = promptStr.split(',');
  const flattenedTags: string[] = [];

  for (const t of rawParts) {
    // 2. | または || (ランダマイザ) でさらに分割
    const subParts = t.split('|');
    for (const sub of subParts) {
      if (sub.trim()) flattenedTags.push(sub.trim());
    }
  }

  return flattenedTags
    .map(t => lookupTag(t, dictionary))
    .filter(res => res.original !== '')
    .filter(res => !NOVEL_AI_BOILERPLATE.includes(res.original.toLowerCase()));
}

/**
 * PNGファイルからメタデータを抽出する
 */
export async function extractPNGMetadata(file: File): Promise<PNGMetadata | null> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  // PNG Signature check: 89 50 4E 47 0D 0A 1A 0A
  if (view.byteLength < 8 || view.getUint32(0) !== 0x89504E47 || view.getUint32(4) !== 0x0D0A1A0A) {
    throw new Error('PNG画像ではありません。');
  }

  const dictionary = await loadDictionary();
  let offset = 8;
  let isNovelAI = false;

  while (offset < buffer.byteLength) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7)
    );
    offset += 8;

    if (type === 'tEXt' || type === 'iTXt') {
      const chunkData = new Uint8Array(buffer, offset, length);
      let nullIdx = -1;
      for (let i = 0; i < chunkData.length; i++) {
        if (chunkData[i] === 0) {
          nullIdx = i;
          break;
        }
      }

      if (nullIdx !== -1) {
        const keyword = new TextDecoder().decode(chunkData.slice(0, nullIdx));
        let contentStr = '';
        
        if (type === 'tEXt') {
          contentStr = new TextDecoder().decode(chunkData.slice(nullIdx + 1));
        } else if (type === 'iTXt') {
          // iTXt header: [keyword]\0[compression flag(1)][compression method(1)][lang tag]\0[trans keyword]\0[content]
          let pos = nullIdx + 3; // Skip \0, flag, method
          while (pos < chunkData.length && chunkData[pos] !== 0) pos++;
          pos++; // Skip lang \0
          while (pos < chunkData.length && chunkData[pos] !== 0) pos++;
          pos++; // Skip trans keyword \0
          contentStr = new TextDecoder().decode(chunkData.slice(pos));
        }

        // NovelAI の判定材料
        if (keyword === 'Software' && contentStr === 'NovelAI') {
          isNovelAI = true;
        }

        if (keyword === 'Comment') {
          const jsonStart = contentStr.indexOf('{');
          if (jsonStart !== -1) {
            try {
              const jsonObj = JSON.parse(contentStr.substring(jsonStart));
              
              // NovelAI 特有のキーが存在するかチェック
              const isNAIJson = !!(jsonObj.v4_prompt || jsonObj.prompt || jsonObj.uc || jsonObj.v4_negative_prompt);
              
              if (isNAIJson) {
                const result: PNGMetadata = {
                  main: [],
                  mainNegative: [],
                  characters: []
                };

                // 1. メインプロンプト
                const mainStr = jsonObj.v4_prompt?.caption?.base_caption || jsonObj.v4_prompt?.base_caption || jsonObj.prompt || '';
                result.main = processPromptString(mainStr, dictionary);

                // 2. メインネガティブ
                const negativeStr =
                  jsonObj.v4_negative_prompt?.caption?.base_caption ||
                  jsonObj.v4_negative_prompt?.base_caption ||
                  jsonObj.v4_negative_prompt?.caption ||
                  (typeof jsonObj.v4_negative_prompt === 'string' ? jsonObj.v4_negative_prompt : '') ||
                  jsonObj.uc ||
                  jsonObj.negative_prompt ||
                  '';
                
                result.mainNegative = processPromptString(negativeStr, dictionary);

                // 3. キャラクタープロンプト & ネガティブ
                const charCaps = jsonObj.v4_prompt?.caption?.char_captions || jsonObj.v4_prompt?.char_captions || [];
                const charNegCaps = jsonObj.v4_negative_prompt?.caption?.char_captions || jsonObj.v4_negative_prompt?.char_captions || [];
                
                const maxChars = Math.max(charCaps.length, charNegCaps.length);
                for (let i = 0; i < maxChars; i++) {
                  result.characters.push({
                    characterIndex: i + 1,
                    tags: charCaps[i] ? processPromptString(charCaps[i].char_caption || '', dictionary) : [],
                    negativeTags: charNegCaps[i] ? processPromptString(charNegCaps[i].char_caption || '', dictionary) : []
                  });
                }

                console.log('NovelAI metadata found:', result);
                return result;
              }
            } catch (e) {
              // Ignore parse errors, continue searching
            }
          }
        }
      }
    }

    offset += length + 4; // Data length + CRC
  }

  // ループ終了後に NovelAI と判定できなかった場合
  throw new Error('NovelAIで生成された画像ではない、または作品情報が含まれていません。');
}
