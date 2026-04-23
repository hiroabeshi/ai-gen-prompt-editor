// ============================================================
//  V2.0.0 マイグレーション
//  V1.x → V2.0.0 (Anima 対応) の変換処理
//  - values.novelai → values.anima にキー移動
//  - values.sd は破棄
//  - slots[] を positive / negative の 2 スロットに統合
//  - 各パーツを categoryId から CATEGORY_TO_SECTION で section に振り分け
// ============================================================

import type { AppState, Slot, SelectedPart } from '../../types'
import { CATEGORY_TO_SECTION, emptySectionsRecord } from '../sections'

// ─── V1.x 系データ形状（マイグレーション入力用） ─────────────────

type V1Part = {
    id: string
    categoryId: string
    label: string
    values: {
        novelai?: string
        anima?: string
        sd?: string
    }
}

type V1SelectedPart = {
    id: string
    partId: string
    weight: number
    enabled: boolean
}

type V1Slot = {
    id: string
    name?: string
    type: 'positive' | 'negative'
    parts: V1SelectedPart[]
}

export type V1AppState = {
    version: string
    categories: { id: string; name: string; color: string }[]
    library: V1Part[]
    slots: V1Slot[]
}

// ─── マイグレーション本体 ───────────────────────────────────────

/**
 * V1.x → V2.0.0 マイグレーション
 * 受け取った「v1 形式の AppState」を「v2 形式の AppState」に変換する。
 */
export function migrateV1ToV2(data: V1AppState): AppState {
    // --- 1. library のキー変換 (novelai → anima、sd 破棄) ---
    const migratedLibrary = data.library.map((p) => ({
        id: p.id,
        categoryId: p.categoryId,
        label: p.label,
        values: {
            anima: p.values.anima ?? p.values.novelai ?? '',
        },
    }))

    const partCategoryMap = new Map<string, string>(
        migratedLibrary.map((p) => [p.id, p.categoryId])
    )

    // --- 2. slots を positive / negative に統合 ---
    const positive = buildSlotFromV1Slots(data.slots, 'positive', partCategoryMap)
    const negative = buildSlotFromV1Slots(data.slots, 'negative', partCategoryMap)

    return {
        version: '2.0.0',
        categories: data.categories.map((c) => ({ ...c })),
        library: migratedLibrary,
        positive,
        negative,
    }
}

/**
 * 同じ type のスロットを走査し、各 parts を section に振り分けた単一 Slot を返す
 */
function buildSlotFromV1Slots(
    slots: V1Slot[],
    type: 'positive' | 'negative',
    partCategoryMap: Map<string, string>,
): Slot {
    const sections = emptySectionsRecord<SelectedPart>()

    for (const s of slots) {
        if (s.type !== type) continue
        for (const sp of s.parts) {
            const catId = partCategoryMap.get(sp.partId) ?? ''
            const sectionId = CATEGORY_TO_SECTION[catId] ?? 'other'
            sections[sectionId].push({
                id: sp.id,
                partId: sp.partId,
                weight: sp.weight,
                enabled: sp.enabled,
            })
        }
    }

    const base: Slot = {
        id: type === 'positive' ? 'slot_positive' : 'slot_negative',
        type,
        sections,
        freeText: '',
    }
    if (type === 'positive') {
        base.datasetTag = ''
        base.rating = null
    }
    return base
}

/** version 文字列から V1.x 系かどうかを判定する */
export function isV1Version(version: string): boolean {
    return /^1\./.test(version)
}
