import type { AppState } from '../types'
import { migrateV1ToV2, isV1Version, type V1AppState } from '../data/migrations/v2_0_0'
import { defaultData } from '../data/defaultData'

/** iOS Safari かどうかを判定する */
function isIOSSafari(): boolean {
    const ua = navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)
    return isIOS && isSafari
}

/**
 * AppState 全体を JSON ファイルとしてローカルにダウンロードする
 * 端末・ブラウザ互換性の高い方法 (DOMへの一時追加と遅延revoke) を採用
 */
export function exportToJSON(state: AppState): { isIOS: boolean } {
    const json = JSON.stringify(state, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const now = new Date()
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-edit-${ts}.json`
    a.style.display = 'none'

    // Firefox や iOS Safari などでダウンロードを発火させるための確実な方法
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // 一部のブラウザでファイルの生成・保存完了前にURLが破棄されるのを防ぐため、revoke は少し遅延させる
    setTimeout(() => {
        URL.revokeObjectURL(url)
    }, 10000)

    return { isIOS: isIOSSafari() }
}

// ============================================================
//  バリデーション
// ============================================================

function isValidV1Shape(data: unknown): data is V1AppState {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    return (
        typeof d.version === 'string' &&
        Array.isArray(d.categories) &&
        Array.isArray(d.library) &&
        Array.isArray(d.slots)
    )
}

function isValidV2Shape(data: unknown): data is AppState {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    return (
        typeof d.version === 'string' &&
        Array.isArray(d.categories) &&
        Array.isArray(d.library) &&
        !!d.positive &&
        !!d.negative
    )
}

/**
 * ファイルを読み込み AppState としてパースして返す
 * バリデーションエラー時は例外を投げる
 * 旧形式 (V1.x) を検出した場合は自動的に V2.0.0 にマイグレーションする
 */
export function importFromJSON(file: File): Promise<AppState> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string
                const data = JSON.parse(text) as unknown

                // 旧形式 (V1.x) → マイグレーション
                if (isValidV1Shape(data) && isV1Version(data.version)) {
                    const migrated = migrateV1ToV2(data)
                    resolve(migrated)
                    return
                }

                // V2 形式 → そのまま検証して返す
                if (isValidV2Shape(data)) {
                    // version が `2.x` 系でない場合は警告したいが、破壊はしない
                    const merged: AppState = {
                        version: data.version || defaultData.version,
                        categories: data.categories,
                        library: data.library,
                        positive: data.positive,
                        negative: data.negative,
                    }
                    resolve(merged)
                    return
                }

                reject(
                    new Error(
                        '無効な JSON フォーマットです。必要なキーが不足しています。',
                    ),
                )
            } catch {
                reject(new Error('JSON の解析に失敗しました。ファイルを確認してください。'))
            }
        }
        reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'))
        reader.readAsText(file, 'utf-8')
    })
}
