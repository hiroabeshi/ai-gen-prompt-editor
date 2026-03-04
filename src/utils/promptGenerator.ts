import type { SelectedPart, PromptPart } from '../types'

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
 * スロット内の有効なパーツを連結して最終プロンプトを生成する
 * 出力タグはマスターデータ（library）を正として参照する
 */
export function generatePrompt(parts: SelectedPart[], library: PromptPart[]): string {
    return parts
        .filter(p => p.enabled)
        .map(p => {
            const master = library.find(m => m.id === p.partId)
            const tag = master ? master.values.novelai : ''
            return formatByWeight(tag, p.weight)
        })
        .filter(t => t !== '')
        .join(', ')
}
