import type { AppState, PromptPart, Category } from '../types'
import { isRandomizerPartId, RANDOMIZER_PREFIX } from '../types'
import { defaultData } from '../data/defaultData'
import {
    v1_0_0_defaultData,
    V1_0_0_OFFICIAL_CATEGORY_IDS,
    CATEGORY_MIGRATION_MAP,
    PART_ID_MIGRATION_MAP,
} from '../data/migrations/v1_0_0'

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
//  V1.0.0 → V1.0.1 マイグレーション
// ============================================================

/**
 * V1.0.0 のデフォルトパーツと「完全一致」するかどうかを判定する。
 * 完全一致 = ユーザーが手を加えていない公式パーツ → 移行時に捨ててよい。
 */
function isDefaultV1Part(part: PromptPart): boolean {
    // V1.0.1 への引き継ぎ先（マイグレーション先）が存在しない旧デフォルトパーツは、
    // 切り捨てずに「カスタムパーツ」として旧名と数値をそのまま維持し救済する
    if (PART_ID_MIGRATION_MAP[part.id] === '') {
        return false
    }

    return v1_0_0_defaultData.library.some(
        (def) =>
            def.id === part.id &&
            def.label === part.label &&
            def.values.novelai === part.values.novelai
    )
}

/**
 * V1.0.0 データを V1.0.1 形式にマイグレーションする。
 *
 * 処理の流れ:
 * 1. ユーザー独自のカテゴリ（公式10種以外）をそのまま保持
 * 2. ライブラリから「公式デフォルトと完全一致するパーツ」を除外し、
 *    残ったカスタムパーツの categoryId を新カテゴリIDに変換
 * 3. スロット内の partId を新IDに変換（ランダマイザも含む）
 * 4. V1.0.1 のデフォルトデータにカスタムデータをマージして返却
 */
function migrateV1_0_0_to_V1_0_1(data: AppState): AppState {
    // --- 1. ユーザー独自カテゴリの抽出 ---
    const userCustomCategories: Category[] = data.categories.filter(
        (cat) => !V1_0_0_OFFICIAL_CATEGORY_IDS.has(cat.id)
    )

    // --- 2. カスタムパーツの抽出と categoryId 変換 ---
    const customParts: PromptPart[] = data.library
        .filter((part) => !isDefaultV1Part(part))
        .map((part) => {
            // 古い公式カテゴリに属している場合 → 新カテゴリIDに変換
            if (V1_0_0_OFFICIAL_CATEGORY_IDS.has(part.categoryId)) {
                return {
                    ...part,
                    values: { ...part.values },
                    categoryId:
                        CATEGORY_MIGRATION_MAP[part.categoryId] || 'mc_unclassified',
                }
            }
            // ユーザー独自カテゴリに属している場合 → そのまま保持
            return { ...part, values: { ...part.values } }
        })

    // --- 3. スロット内の partId を変換 ---
    const migratedSlots = data.slots.map((slot) => ({
        ...slot,
        parts: slot.parts.map((sp) => {
            let newPartId = sp.partId

            if (isRandomizerPartId(sp.partId)) {
                // ランダマイザ: "randomizer__cat_xxx" → "randomizer__mc_xxx"
                const oldCatId = sp.partId.slice(RANDOMIZER_PREFIX.length)
                if (V1_0_0_OFFICIAL_CATEGORY_IDS.has(oldCatId)) {
                    const newCatId =
                        CATEGORY_MIGRATION_MAP[oldCatId] || 'mc_unclassified'
                    newPartId = `${RANDOMIZER_PREFIX}${newCatId}`
                }
                // ユーザー独自カテゴリのランダマイザ → そのまま
            } else if (PART_ID_MIGRATION_MAP[sp.partId] !== undefined) {
                // 通常パーツの書き換え
                const mapped = PART_ID_MIGRATION_MAP[sp.partId]
                if (mapped === '') {
                    // V1.0.1 に対応なし → カスタムパーツとして残す可能性があるか確認
                    // カスタムパーツに同一IDがあればそのまま維持、なければ参照切れ（そのまま保持）
                    newPartId = sp.partId
                } else {
                    newPartId = mapped
                }
            }
            // ユーザー独自パーツの partId → そのまま

            return { ...sp, partId: newPartId }
        }),
    }))

    // --- 4. V1.0.1 デフォルトデータとマージ ---
    // カテゴリ: V1.0.1のマスターカテゴリ + ユーザー独自カテゴリ
    const mergedCategories = [
        ...defaultData.categories.map((c) => ({ ...c })),
        ...userCustomCategories,
    ]

    // ライブラリ: V1.0.1のデフォルトパーツ + カスタムパーツ（同一IDなら上書き）
    const defaultLibraryMap = new Map(
        defaultData.library.map((p) => [p.id, { ...p, values: { ...p.values } }])
    )
    for (const cp of customParts) {
        defaultLibraryMap.set(cp.id, cp) // 同一IDのデフォルトパーツをカスタムで上書き
    }
    const mergedLibrary = Array.from(defaultLibraryMap.values())

    return {
        version: defaultData.version,
        categories: mergedCategories,
        library: mergedLibrary,
        slots: migratedSlots,
    }
}

/**
 * ファイルを読み込み AppState としてパースして返す
 * バリデーションエラー時は例外を投げる
 * V1.0.0 のデータが読み込まれた場合は自動的に V1.0.1 にマイグレーションする
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

                // V1.0.0 → V1.0.1 マイグレーション
                if (data.version === '1.0.0') {
                    const migrated = migrateV1_0_0_to_V1_0_1(data)
                    resolve(migrated)
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
