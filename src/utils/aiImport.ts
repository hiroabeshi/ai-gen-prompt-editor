import { v4 as uuidv4 } from 'uuid'
import type { AIImportData, AIImportCategory, Category, PromptPart, Slot, SelectedPart } from '../types'

/**
 * AI インポート JSON テキストをパースして検証する
 * マークダウンのコードブロック修飾などを取り除いてからパースを試みる
 */
export function parseAIImportText(text: string): AIImportData {
    // ```json や ``` の修飾を取り除く
    const cleanedText = text
        .replace(/^```json\s*/i, '') // 先頭の ```json を削除
        .replace(/\s*```$/i, '')     // 末尾の ``` を削除
        .trim()

    try {
        const data = JSON.parse(cleanedText) as AIImportData

        if (!data || typeof data !== 'object') {
             throw new Error('無効な JSON データです。')
        }
        if (!Array.isArray(data.library) || !Array.isArray(data.slots)) {
            throw new Error('JSON に "library" または "slots" 配列が含まれていません。AI側で生成が途切れたか、フォーマットが崩れている可能性があります。')
        }
        return data
    } catch (e: any) {
        throw new Error(`AI インポート JSON の解析に失敗しました: ${e.message}`)
    }
}

/**
 * AI インポートデータを既存の categories / library にマージする。
 * - 既存カテゴリと名前が重複する場合は既存カテゴリに Parts を追加する（マージ）
 * - 新規カテゴリの場合は UUIDv4 を付与して追加
 * - パーツは values.novelai で既存と照合し、存在すればその ID を流用し、重複を防ぐ
 * - スロットを生成し、パーツの UUID を利用して参照を持たせる
 *
 * @returns { addedCategories, addedParts, addedSlots } 追加情報
 */
export function mergeAIImport(
    importData: AIImportData,
    existingCategories: Category[],
    existingLibrary: PromptPart[],
    resolveConflict: (catName: string) => 'merge' | 'add', // コールバックで呼び出し側が判断
): { newCategories: Category[]; newParts: PromptPart[]; newSlots: Slot[] } {
    const newCategories: Category[] = []
    const newParts: PromptPart[] = []
    const newSlots: Slot[] = []

    // ---- 1. カテゴリとパーツの処理 ----
    const partTagToIdMap = new Map<string, string>() // novelai タグ -> UUID

    for (const importCat of importData.library) {
        const existingCat = existingCategories.find(c => c.name === importCat.name)
        let targetCategoryId: string

        if (existingCat) {
            const decision = resolveConflict(importCat.name)
            if (decision === 'merge') {
                targetCategoryId = existingCat.id
            } else {
                const newCat = buildCategory(importCat)
                newCat.name = `${importCat.name}（インポート）`
                newCategories.push(newCat)
                targetCategoryId = newCat.id
            }
        } else {
            const newCat = buildCategory(importCat)
            newCategories.push(newCat)
            targetCategoryId = newCat.id
        }

        for (const importPart of importCat.parts) {
            const novelaiTag = importPart.values.novelai
            
            // 既存ライブラリからの検索（完全一致）
            const duplicateInExisting = existingLibrary.find(p => p.values.novelai === novelaiTag)
            // 新規追加予定からの検索
            const duplicateInNew = newParts.find(p => p.values.novelai === novelaiTag)

            if (duplicateInExisting) {
                // 既存のIDを再利用
                partTagToIdMap.set(novelaiTag, duplicateInExisting.id)
            } else if (duplicateInNew) {
                // 今回追加予定のIDを再利用（データ重複時のフェイルセーフ）
                partTagToIdMap.set(novelaiTag, duplicateInNew.id)
            } else {
                // 新規パーツとして追加
                const newId = uuidv4()
                partTagToIdMap.set(novelaiTag, newId)
                newParts.push({
                    id: newId,
                    categoryId: targetCategoryId,
                    label: importPart.label,
                    values: {
                        novelai: novelaiTag,
                        ...(importPart.values.sd ? { sd: importPart.values.sd } : {}),
                    },
                })
            }
        }
    }

    // ---- 2. スロットの処理 ----
    for (const importSlot of importData.slots) {
        const selectedParts: SelectedPart[] = []

        for (const part of importSlot.parts) {
            const targetId = partTagToIdMap.get(part.values.novelai)
            if (targetId) {
                selectedParts.push({
                    id: uuidv4(), // インスタンスUUID
                    partId: targetId,
                    weight: 1.0,
                    enabled: true
                })
            }
        }

        newSlots.push({
            id: uuidv4(),
            name: importSlot.name,
            type: importSlot.type,
            parts: selectedParts,
        })
    }

    return { newCategories, newParts, newSlots }
}

function buildCategory(importCat: AIImportCategory): Category {
    return {
        id: uuidv4(),
        name: importCat.name,
        color: '#6366f1', // v4データフォーマットにはcolorがないため、デフォルト設定
    }
}
