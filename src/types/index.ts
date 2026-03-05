// ============================================================
//  型定義 (移植元: _archive_mock/types.ts)
// ============================================================

export type PromptPart = {
    id: string;            // マスターID (UUIDv4)
    categoryId: string;    // カテゴリ参照用
    label: string;         // 表示名
    values: {
        novelai: string;     // NovelAI 用タグ
        sd?: string;         // Stable Diffusion 用タグ（省略可）
    };
}

export const DEFAULT_PART_WEIGHT = 1.0;

export type Category = {
    id: string;            // カテゴリID (UUIDv4)
    name: string;
    color: string;         // カテゴリ識別カラー (例: "#F59E0B")
}

export type SelectedPart = {
    id: string;            // インスタンスID (UUIDv4, スロット内一意)
    partId: string;        // 参照元マスターID
    weight: number;
    enabled: boolean;
}

export type Slot = {
    id: string;            // スロットID (UUIDv4)
    name: string;          // スロット名 (例: Base, Char1_Negative)
    type: 'positive' | 'negative';
    parts: SelectedPart[]; // 格納されたパーツ (順序が重要)
}

export type AppState = {
    version: string;
    categories: Category[];
    library: PromptPart[];
    slots: Slot[];
}

// AI インポート用スキーマ型
export type AIImportPart = {
    label: string;
    values: { novelai: string; sd?: string };
}

export type AIImportCategory = {
    name: string;
    color: string;
    parts: AIImportPart[];
}

export type AIImportData = {
    schemaVersion: string;
    categories: AIImportCategory[];
}

// ============================================================
//  ランダマイザ ユーティリティ
// ============================================================

/** ランダマイザ partId の固定プレフィックス */
export const RANDOMIZER_PREFIX = 'randomizer__'

/** partId がランダマイザかどうか判定する */
export function isRandomizerPartId(partId: string): boolean {
    return partId.startsWith(RANDOMIZER_PREFIX)
}

/** categoryId からランダマイザ用の固定 partId を生成する */
export function randomizerPartId(categoryId: string): string {
    return `${RANDOMIZER_PREFIX}${categoryId}`
}

/** ランダマイザ partId から categoryId を取り出す */
export function categoryIdFromRandomizer(partId: string): string {
    return partId.slice(RANDOMIZER_PREFIX.length)
}
