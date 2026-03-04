import { v4 as uuidv4 } from 'uuid'
import type { AIImportData, AIImportCategory, Category, PromptPart } from '../types'

export const AI_IMPORT_SCHEMA_VERSION = '1.0'

/**
 * AI インポート JSON ファイルをパースして検証する
 */
export function parseAIImportFile(file: File): Promise<AIImportData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string
                const data = JSON.parse(text) as AIImportData

                if (data.schemaVersion !== AI_IMPORT_SCHEMA_VERSION) {
                    reject(new Error(`スキーマバージョンが一致しません。\n期待値: ${AI_IMPORT_SCHEMA_VERSION}\n実際: ${data.schemaVersion}`))
                    return
                }
                if (!Array.isArray(data.categories)) {
                    reject(new Error('JSON に "categories" 配列が含まれていません。'))
                    return
                }
                resolve(data)
            } catch {
                reject(new Error('AI インポート JSON の解析に失敗しました。'))
            }
        }
        reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'))
        reader.readAsText(file, 'utf-8')
    })
}

/**
 * AI インポートデータを既存の categories / library にマージする。
 * - 既存カテゴリと名前が重複する場合は既存カテゴリに Parts を追加する（マージ）
 * - 新規カテゴリの場合は UUIDv4 を付与して追加
 * - パーツには常に新規 UUIDv4 を付与する
 *
 * @returns {added, merged} 追加カテゴリ数・マージパーツ数
 */
export function mergeAIImport(
    importData: AIImportData,
    existingCategories: Category[],
    _existingLibrary: PromptPart[],
    resolveConflict: (catName: string) => 'merge' | 'add', // コールバックで呼び出し側が判断
): { newCategories: Category[]; newParts: PromptPart[] } {
    const newCategories: Category[] = []
    const newParts: PromptPart[] = []

    for (const importCat of importData.categories) {
        const existingCat = existingCategories.find(c => c.name === importCat.name)
        let targetCategoryId: string

        if (existingCat) {
            const decision = resolveConflict(importCat.name)
            if (decision === 'merge') {
                // 既存カテゴリにマージ
                targetCategoryId = existingCat.id
            } else {
                // 名前を変えて新規追加
                const newCat = buildCategory(importCat)
                newCat.name = `${importCat.name}（インポート）`
                newCategories.push(newCat)
                targetCategoryId = newCat.id
            }
        } else {
            // 新規カテゴリ
            const newCat = buildCategory(importCat)
            newCategories.push(newCat)
            targetCategoryId = newCat.id
        }

        // パーツを生成
        for (const importPart of importCat.parts) {
            newParts.push({
                id: uuidv4(),
                categoryId: targetCategoryId,
                label: importPart.label,
                values: {
                    novelai: importPart.values.novelai,
                    ...(importPart.values.sd ? { sd: importPart.values.sd } : {}),
                },
            })
        }
    }

    return { newCategories, newParts }
}

function buildCategory(importCat: AIImportCategory): Category {
    return {
        id: uuidv4(),
        name: importCat.name,
        color: importCat.color,
    }
}
