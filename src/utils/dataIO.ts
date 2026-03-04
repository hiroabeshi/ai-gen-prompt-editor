import type { AppState } from '../types'

/**
 * AppState 全体を JSON ファイルとしてローカルにダウンロードする
 */
export function exportToJSON(state: AppState): void {
    const json = JSON.stringify(state, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const now = new Date()
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    a.download = `prompt-edit-${ts}.json`
    a.click()
    URL.revokeObjectURL(url)
}

/**
 * ファイルを読み込み AppState としてパースして返す
 * バリデーションエラー時は例外を投げる
 */
export function importFromJSON(file: File): Promise<AppState> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string
                const data = JSON.parse(text) as AppState
                // 最低限のキー存在チェック
                if (!data.version || !Array.isArray(data.categories) || !Array.isArray(data.library) || !Array.isArray(data.slots)) {
                    reject(new Error('無効な JSON フォーマットです。必要なキー (version, categories, library, slots) が不足しています。'))
                    return
                }
                resolve(data)
            } catch {
                reject(new Error('JSON の解析に失敗しました。ファイルを確認してください。'))
            }
        }
        reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'))
        reader.readAsText(file, 'utf-8')
    })
}
