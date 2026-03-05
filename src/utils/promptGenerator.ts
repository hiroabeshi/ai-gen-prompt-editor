import type { SelectedPart, PromptPart } from '../types'
import { isRandomizerPartId, categoryIdFromRandomizer } from '../types'

/**
 * 重み（Weight）を NovelAI のフォーマット（weight::tag::）に変換する
 * 重みが 1.0 の場合はそのままタグを返す
 */
export function formatByWeight(tag: string, weight: number): string {
    if (Math.abs(weight - 1.0) < 0.001) return tag

    const weightStr = weight.toFixed(2).replace(/0$/, '')
    return `${weightStr}::${tag}::`
}

/**
 * ランダマイザ partId からカテゴリ内の全パーツを ||..|| 構文に組み立てる
 * カテゴリにパーツが0個の場合は空文字を返す
 */
function buildRandomizerTag(partId: string, library: PromptPart[]): string {
    const catId = categoryIdFromRandomizer(partId)
    const catParts = library.filter(p => p.categoryId === catId)
    if (catParts.length === 0) return ''
    const tags = catParts.map(p => p.values.novelai)
    return `||${tags.join('|')}||`
}

/**
 * ランダマイザのプレビュー用テキストを生成する
 * 例: 🎲[体勢 から1つ]
 */
function buildRandomizerPreview(partId: string, library: PromptPart[], categories: { id: string; name: string }[]): string {
    const catId = categoryIdFromRandomizer(partId)
    const cat = categories.find(c => c.id === catId)
    if (!cat) return ''
    const catParts = library.filter(p => p.categoryId === catId)
    if (catParts.length === 0) return ''
    return `🎲[${cat.name} から1つ]`
}

/**
 * スロット内の有効なパーツを連結して最終プロンプトを生成する
 * 出力タグはマスターデータ（library）を正として参照する
 */
export function generatePrompt(
    parts: SelectedPart[],
    library: PromptPart[],
    categories?: { id: string; name: string }[],
    previewMode?: boolean,
): string {
    return parts
        .filter(p => p.enabled)
        .map(p => {
            // ランダマイザパーツの処理
            if (isRandomizerPartId(p.partId)) {
                if (previewMode && categories) {
                    return buildRandomizerPreview(p.partId, library, categories)
                }
                return buildRandomizerTag(p.partId, library)
            }
            // 通常パーツの処理
            const master = library.find(m => m.id === p.partId)
            const tag = master ? master.values.novelai : ''
            return formatByWeight(tag, p.weight)
        })
        .filter(t => t !== '')
        .join(', ')
}
