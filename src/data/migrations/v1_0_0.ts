// ============================================================
//  V1.0.0 デフォルトデータのスナップショット
//  マイグレーション時に「ユーザー独自データ」を判別するための基準データ
//  ※ このファイルは編集しないでください
// ============================================================
import type { AppState } from '../../types'

/** V1.0.0 の公式カテゴリID一覧 */
export const V1_0_0_OFFICIAL_CATEGORY_IDS = new Set([
    'cat_quality',
    'cat_people',
    'cat_pose',
    'cat_outfit',
    'cat_hair',
    'cat_expression',
    'cat_eye',
    'cat_body',
    'cat_background',
    'cat_camera',
])

/** V1.0.0 カテゴリID → V1.0.1 カテゴリID のマッピング */
export const CATEGORY_MIGRATION_MAP: Record<string, string> = {
    'cat_quality': 'mc_quality',
    'cat_people': 'mc_people_gender',
    'cat_pose': 'mc_base_pose',
    'cat_outfit': 'mc_full_body_outfit',
    'cat_hair': 'mc_hair',
    'cat_expression': 'mc_expression',
    'cat_eye': 'mc_eye',
    'cat_body': 'mc_body_skin',
    'cat_background': 'mc_indoor_bg',
    'cat_camera': 'mc_composition',
}

/** V1.0.0 デフォルトパーツID → V1.0.1 デフォルトパーツID のマッピング */
export const PART_ID_MIGRATION_MAP: Record<string, string> = {
    // 品質
    'q1': 'pt_quality_1',    // 最高品質 / masterpiece
    'q2': 'pt_quality_2',    // 高品質 / best quality
    'q3': 'pt_quality_3',    // 高精細 / highly detailed
    'q4': 'pt_quality_4',    // 超高精細 / ultra detailed
    'q5': 'pt_quality_5',    // シャープフォーカス / sharp focus
    'q6': 'pt_quality_6',    // 8K解像度 / 8k → 8k resolution
    'q7': 'pt_quality_7',    // プロ品質 / professional artwork
    'q8': 'pt_quality_8',    // アニメ調 / anime style
    'q9': 'pt_quality_9',    // 綺麗な線画 / clean lineart
    'q10': 'pt_quality_10',  // 柔らかい陰影 / soft shading
    // 人数
    'p1': 'pt_people_gender_1',   // 女性1人 / 1girl
    'p2': 'pt_people_gender_2',   // 女性2人 / 2girls
    'p3': 'pt_people_gender_5',   // ソロ / solo
    'p4': '',   // グループ / group → V1.0.1に対応なし
    'p5': 'pt_people_gender_6',   // 複数女性 / multiple girls → 複数人
    'p6': 'pt_people_gender_3',   // 男性1人 / 1boy
    'p7': 'pt_people_gender_4',   // 男性2人 / 2boys
    'p8': 'pt_people_gender_8',   // カップル / couple
    'p9': 'pt_people_gender_7',   // 群衆 / crowd
    'p10': '',  // 単体フォーカス / solo focus → V1.0.1に対応なし
    // ポーズ
    'pose1': 'pt_base_pose_1',    // 立ち姿 / standing
    'pose2': 'pt_base_pose_2',    // 座り姿 / sitting
    'pose3': 'pt_base_pose_3',    // 横たわり / lying
    'pose4': 'pt_base_pose_4',    // ひざ立ち / kneeling
    'pose5': 'pt_action_2',       // 走る / running → アクション
    'pose6': 'pt_action_3',       // ジャンプ / jumping → アクション
    'pose7': '',  // 振り向き / looking back → V1.0.1に対応なし
    'pose8': '',  // 両手上げ / arms up → V1.0.1に対応なし
    'pose9': '',  // 腰に手 / hand on hip → V1.0.1に対応なし
    'pose10': 'pt_action_1',      // 歩く / walking → アクション
    // 服装
    'o1': 'pt_full_body_outfit_1',  // 学生服 / school uniform
    'o2': 'pt_full_body_outfit_2',  // ドレス / dress
    'o3': '',   // カジュアル服 / casual clothes → V1.0.1に対応なし
    'o4': 'pt_full_body_outfit_4',  // 着物 / kimono
    'o5': 'pt_full_body_outfit_9',  // 鎧 / armor → 甲冑
    'o6': 'pt_swimsuit_1',          // 水着 / swimsuit → 水着・下着
    'o7': 'pt_full_body_outfit_5',  // メイド服 / maid outfit → maid
    'o8': 'pt_tops_5',              // ジャケット / jacket → トップス
    'o9': 'pt_tops_6',              // パーカー / hoodie → トップス
    'o10': '',  // ファンタジー衣装 / fantasy outfit → V1.0.1に対応なし
    // 髪型
    'h1': 'pt_hair_1',     // ロングヘア / long hair
    'h2': 'pt_hair_2',     // ショートヘア / short hair
    'h3': 'pt_hair_4',     // 金髪 / blonde hair
    'h4': 'pt_hair_5',     // 黒髪 / black hair
    'h5': 'pt_hair_6',     // 茶髪 / brown hair
    'h6': 'pt_hair_8',     // ツインテール / twintails
    'h7': 'pt_hair_9',     // ポニーテール / ponytail
    'h8': 'pt_hair_10',    // アホ毛 / ahoge
    'h9': '',   // ウェーブヘア / wavy hair → V1.0.1に対応なし
    'h10': '',  // 乱れ髪 / messy hair → V1.0.1に対応なし
    // 表情
    'e1': 'pt_expression_1',   // 笑顔 / smile
    'e2': '',   // 真剣 / serious → V1.0.1に対応なし
    'e3': '',   // 嬉しい / happy → V1.0.1に対応なし
    'e4': 'pt_expression_2',   // 怒り / angry
    'e5': 'pt_expression_3',   // 悲しい / sad
    'e6': 'pt_face_9',         // 赤面 / blush → 顔パーツに移動 (pt_face_9)
    'e7': 'pt_expression_6',   // 驚き / surprised
    'e8': 'pt_expression_8',   // ウインク / wink
    'e9': 'pt_expression_4',   // 泣き / crying
    'e10': '',  // 叫び / screaming → V1.0.1に対応なし
    // 目
    'eye1': 'pt_eye_1',    // 青い目 / blue eyes
    'eye2': 'pt_eye_2',    // 赤い目 / red eyes
    'eye3': 'pt_eye_3',    // 緑の目 / green eyes
    'eye4': 'pt_eye_4',    // 茶色の目 / brown eyes
    'eye5': 'pt_eye_6',    // オッドアイ / heterochromia
    'eye6': '',  // 目を閉じる / closed eyes → V1.0.1に対応なし
    'eye7': '',  // 輝く瞳 / sparkling eyes → V1.0.1に対応なし
    'eye8': 'pt_composition_1',  // 正面視線 / looking at viewer → 構図に移動
    'eye9': 'pt_composition_2',  // 横目 / looking to the side → 構図に移動
    'eye10': '',  // 半目 / half-closed eyes → V1.0.1に対応なし
    // 体型
    'b1': 'pt_body_skin_1',   // スリム体型 / slim → スリム
    'b2': '',   // 小柄 / petite → V1.0.1に対応なし
    'b3': 'pt_body_skin_2',   // 高身長 / tall
    'b4': 'pt_body_skin_3',   // 低身長 / short
    'b5': '',   // アスリート体型 / athletic → V1.0.1に対応なし
    'b6': 'pt_body_skin_5',   // 曲線的体型 / curvy → 曲線的
    'b7': 'pt_breast_2',      // 小胸 / small breasts → 胸カテゴリ
    'b8': 'pt_breast_4',      // 大胸 / large breasts → 胸カテゴリ
    'b9': '',   // 長い脚 / long legs → V1.0.1に対応なし
    'b10': '',  // 幼い体型 / childlike body → V1.0.1に対応なし
    // 背景
    'bg1': 'pt_indoor_bg_1',   // 室内 / indoors → 屋内
    'bg2': 'pt_outdoor_1',     // 屋外 / outdoors → 自然・屋外
    'bg3': 'pt_indoor_bg_3',   // 教室 / classroom
    'bg4': 'pt_indoor_bg_4',   // 寝室 / bedroom
    'bg5': 'pt_outdoor_4',     // 都市 / cityscape → 街並み
    'bg6': '',   // 自然 / nature → V1.0.1に対応なし
    'bg7': 'pt_weather_2',     // 夜 / night → 天候・時間
    'bg8': 'pt_weather_3',     // 夕焼け / sunset → 天候・時間
    'bg9': '',   // ファンタジー背景 / fantasy background → V1.0.1に対応なし
    'bg10': '',  // シンプル背景 / simple background → V1.0.1に対応なし
    // 構図
    'c1': 'pt_composition_3',    // 全身 / full body
    'c2': 'pt_composition_4',    // 上半身 / upper body
    'c3': 'pt_composition_5',    // ポートレート / portrait
    'c4': 'pt_composition_6',    // クローズアップ / close-up
    'c5': 'pt_composition_7',    // 俯瞰 / from above
    'c6': 'pt_composition_8',    // あおり / from below
    'c7': '',   // ダイナミック構図 / dynamic angle → V1.0.1に対応なし
    'c8': 'pt_composition_9',    // 斜め構図 / dutch angle
    'c9': 'pt_composition_10',   // ワイドショット / wide shot
    'c10': '',  // シネマティックライティング / cinematic lighting → V1.0.1に対応なし
}

/** V1.0.0 のデフォルトデータ全体（スナップショット） */
export const v1_0_0_defaultData: AppState = {
    version: '1.0.0',
    categories: [
        { id: 'cat_quality', name: '品質', color: '#6366F1' },
        { id: 'cat_people', name: '人数', color: '#10B981' },
        { id: 'cat_pose', name: 'ポーズ', color: '#F59E0B' },
        { id: 'cat_outfit', name: '服装', color: '#EC4899' },
        { id: 'cat_hair', name: '髪型', color: '#8B5CF6' },
        { id: 'cat_expression', name: '表情', color: '#EF4444' },
        { id: 'cat_eye', name: '目', color: '#3B82F6' },
        { id: 'cat_body', name: '体型', color: '#14B8A6' },
        { id: 'cat_background', name: '背景', color: '#A855F7' },
        { id: 'cat_camera', name: '構図', color: '#F97316' },
    ],
    library: [
        { id: 'q1', categoryId: 'cat_quality', label: '最高品質', values: { novelai: 'masterpiece' } },
        { id: 'q2', categoryId: 'cat_quality', label: '高品質', values: { novelai: 'best quality' } },
        { id: 'q3', categoryId: 'cat_quality', label: '高精細', values: { novelai: 'highly detailed' } },
        { id: 'q4', categoryId: 'cat_quality', label: '超高精細', values: { novelai: 'ultra detailed' } },
        { id: 'q5', categoryId: 'cat_quality', label: 'シャープフォーカス', values: { novelai: 'sharp focus' } },
        { id: 'q6', categoryId: 'cat_quality', label: '8K解像度', values: { novelai: '8k' } },
        { id: 'q7', categoryId: 'cat_quality', label: 'プロ品質', values: { novelai: 'professional artwork' } },
        { id: 'q8', categoryId: 'cat_quality', label: 'アニメ調', values: { novelai: 'anime style' } },
        { id: 'q9', categoryId: 'cat_quality', label: '綺麗な線画', values: { novelai: 'clean lineart' } },
        { id: 'q10', categoryId: 'cat_quality', label: '柔らかい陰影', values: { novelai: 'soft shading' } },
        { id: 'p1', categoryId: 'cat_people', label: '女性1人', values: { novelai: '1girl' } },
        { id: 'p2', categoryId: 'cat_people', label: '女性2人', values: { novelai: '2girls' } },
        { id: 'p3', categoryId: 'cat_people', label: 'ソロ', values: { novelai: 'solo' } },
        { id: 'p4', categoryId: 'cat_people', label: 'グループ', values: { novelai: 'group' } },
        { id: 'p5', categoryId: 'cat_people', label: '複数女性', values: { novelai: 'multiple girls' } },
        { id: 'p6', categoryId: 'cat_people', label: '男性1人', values: { novelai: '1boy' } },
        { id: 'p7', categoryId: 'cat_people', label: '男性2人', values: { novelai: '2boys' } },
        { id: 'p8', categoryId: 'cat_people', label: 'カップル', values: { novelai: 'couple' } },
        { id: 'p9', categoryId: 'cat_people', label: '群衆', values: { novelai: 'crowd' } },
        { id: 'p10', categoryId: 'cat_people', label: '単体フォーカス', values: { novelai: 'solo focus' } },
        { id: 'pose1', categoryId: 'cat_pose', label: '立ち姿', values: { novelai: 'standing' } },
        { id: 'pose2', categoryId: 'cat_pose', label: '座り姿', values: { novelai: 'sitting' } },
        { id: 'pose3', categoryId: 'cat_pose', label: '横たわり', values: { novelai: 'lying' } },
        { id: 'pose4', categoryId: 'cat_pose', label: 'ひざ立ち', values: { novelai: 'kneeling' } },
        { id: 'pose5', categoryId: 'cat_pose', label: '走る', values: { novelai: 'running' } },
        { id: 'pose6', categoryId: 'cat_pose', label: 'ジャンプ', values: { novelai: 'jumping' } },
        { id: 'pose7', categoryId: 'cat_pose', label: '振り向き', values: { novelai: 'looking back' } },
        { id: 'pose8', categoryId: 'cat_pose', label: '両手上げ', values: { novelai: 'arms up' } },
        { id: 'pose9', categoryId: 'cat_pose', label: '腰に手', values: { novelai: 'hand on hip' } },
        { id: 'pose10', categoryId: 'cat_pose', label: '歩く', values: { novelai: 'walking' } },
        { id: 'o1', categoryId: 'cat_outfit', label: '学生服', values: { novelai: 'school uniform' } },
        { id: 'o2', categoryId: 'cat_outfit', label: 'ドレス', values: { novelai: 'dress' } },
        { id: 'o3', categoryId: 'cat_outfit', label: 'カジュアル服', values: { novelai: 'casual clothes' } },
        { id: 'o4', categoryId: 'cat_outfit', label: '着物', values: { novelai: 'kimono' } },
        { id: 'o5', categoryId: 'cat_outfit', label: '鎧', values: { novelai: 'armor' } },
        { id: 'o6', categoryId: 'cat_outfit', label: '水着', values: { novelai: 'swimsuit' } },
        { id: 'o7', categoryId: 'cat_outfit', label: 'メイド服', values: { novelai: 'maid outfit' } },
        { id: 'o8', categoryId: 'cat_outfit', label: 'ジャケット', values: { novelai: 'jacket' } },
        { id: 'o9', categoryId: 'cat_outfit', label: 'パーカー', values: { novelai: 'hoodie' } },
        { id: 'o10', categoryId: 'cat_outfit', label: 'ファンタジー衣装', values: { novelai: 'fantasy outfit' } },
        { id: 'h1', categoryId: 'cat_hair', label: 'ロングヘア', values: { novelai: 'long hair' } },
        { id: 'h2', categoryId: 'cat_hair', label: 'ショートヘア', values: { novelai: 'short hair' } },
        { id: 'h3', categoryId: 'cat_hair', label: '金髪', values: { novelai: 'blonde hair' } },
        { id: 'h4', categoryId: 'cat_hair', label: '黒髪', values: { novelai: 'black hair' } },
        { id: 'h5', categoryId: 'cat_hair', label: '茶髪', values: { novelai: 'brown hair' } },
        { id: 'h6', categoryId: 'cat_hair', label: 'ツインテール', values: { novelai: 'twintails' } },
        { id: 'h7', categoryId: 'cat_hair', label: 'ポニーテール', values: { novelai: 'ponytail' } },
        { id: 'h8', categoryId: 'cat_hair', label: 'アホ毛', values: { novelai: 'ahoge' } },
        { id: 'h9', categoryId: 'cat_hair', label: 'ウェーブヘア', values: { novelai: 'wavy hair' } },
        { id: 'h10', categoryId: 'cat_hair', label: '乱れ髪', values: { novelai: 'messy hair' } },
        { id: 'e1', categoryId: 'cat_expression', label: '笑顔', values: { novelai: 'smile' } },
        { id: 'e2', categoryId: 'cat_expression', label: '真剣', values: { novelai: 'serious' } },
        { id: 'e3', categoryId: 'cat_expression', label: '嬉しい', values: { novelai: 'happy' } },
        { id: 'e4', categoryId: 'cat_expression', label: '怒り', values: { novelai: 'angry' } },
        { id: 'e5', categoryId: 'cat_expression', label: '悲しい', values: { novelai: 'sad' } },
        { id: 'e6', categoryId: 'cat_expression', label: '赤面', values: { novelai: 'blush' } },
        { id: 'e7', categoryId: 'cat_expression', label: '驚き', values: { novelai: 'surprised' } },
        { id: 'e8', categoryId: 'cat_expression', label: 'ウインク', values: { novelai: 'wink' } },
        { id: 'e9', categoryId: 'cat_expression', label: '泣き', values: { novelai: 'crying' } },
        { id: 'e10', categoryId: 'cat_expression', label: '叫び', values: { novelai: 'screaming' } },
        { id: 'eye1', categoryId: 'cat_eye', label: '青い目', values: { novelai: 'blue eyes' } },
        { id: 'eye2', categoryId: 'cat_eye', label: '赤い目', values: { novelai: 'red eyes' } },
        { id: 'eye3', categoryId: 'cat_eye', label: '緑の目', values: { novelai: 'green eyes' } },
        { id: 'eye4', categoryId: 'cat_eye', label: '茶色の目', values: { novelai: 'brown eyes' } },
        { id: 'eye5', categoryId: 'cat_eye', label: 'オッドアイ', values: { novelai: 'heterochromia' } },
        { id: 'eye6', categoryId: 'cat_eye', label: '目を閉じる', values: { novelai: 'closed eyes' } },
        { id: 'eye7', categoryId: 'cat_eye', label: '輝く瞳', values: { novelai: 'sparkling eyes' } },
        { id: 'eye8', categoryId: 'cat_eye', label: '正面視線', values: { novelai: 'looking at viewer' } },
        { id: 'eye9', categoryId: 'cat_eye', label: '横目', values: { novelai: 'looking to the side' } },
        { id: 'eye10', categoryId: 'cat_eye', label: '半目', values: { novelai: 'half-closed eyes' } },
        { id: 'b1', categoryId: 'cat_body', label: 'スリム体型', values: { novelai: 'slim' } },
        { id: 'b2', categoryId: 'cat_body', label: '小柄', values: { novelai: 'petite' } },
        { id: 'b3', categoryId: 'cat_body', label: '高身長', values: { novelai: 'tall' } },
        { id: 'b4', categoryId: 'cat_body', label: '低身長', values: { novelai: 'short' } },
        { id: 'b5', categoryId: 'cat_body', label: 'アスリート体型', values: { novelai: 'athletic' } },
        { id: 'b6', categoryId: 'cat_body', label: '曲線的体型', values: { novelai: 'curvy' } },
        { id: 'b7', categoryId: 'cat_body', label: '小胸', values: { novelai: 'small breasts' } },
        { id: 'b8', categoryId: 'cat_body', label: '大胸', values: { novelai: 'large breasts' } },
        { id: 'b9', categoryId: 'cat_body', label: '長い脚', values: { novelai: 'long legs' } },
        { id: 'b10', categoryId: 'cat_body', label: '幼い体型', values: { novelai: 'childlike body' } },
        { id: 'bg1', categoryId: 'cat_background', label: '室内', values: { novelai: 'indoors' } },
        { id: 'bg2', categoryId: 'cat_background', label: '屋外', values: { novelai: 'outdoors' } },
        { id: 'bg3', categoryId: 'cat_background', label: '教室', values: { novelai: 'classroom' } },
        { id: 'bg4', categoryId: 'cat_background', label: '寝室', values: { novelai: 'bedroom' } },
        { id: 'bg5', categoryId: 'cat_background', label: '都市', values: { novelai: 'cityscape' } },
        { id: 'bg6', categoryId: 'cat_background', label: '自然', values: { novelai: 'nature' } },
        { id: 'bg7', categoryId: 'cat_background', label: '夜', values: { novelai: 'night' } },
        { id: 'bg8', categoryId: 'cat_background', label: '夕焼け', values: { novelai: 'sunset' } },
        { id: 'bg9', categoryId: 'cat_background', label: 'ファンタジー背景', values: { novelai: 'fantasy background' } },
        { id: 'bg10', categoryId: 'cat_background', label: 'シンプル背景', values: { novelai: 'simple background' } },
        { id: 'c1', categoryId: 'cat_camera', label: '全身', values: { novelai: 'full body' } },
        { id: 'c2', categoryId: 'cat_camera', label: '上半身', values: { novelai: 'upper body' } },
        { id: 'c3', categoryId: 'cat_camera', label: 'ポートレート', values: { novelai: 'portrait' } },
        { id: 'c4', categoryId: 'cat_camera', label: 'クローズアップ', values: { novelai: 'close-up' } },
        { id: 'c5', categoryId: 'cat_camera', label: '俯瞰', values: { novelai: 'from above' } },
        { id: 'c6', categoryId: 'cat_camera', label: 'あおり', values: { novelai: 'from below' } },
        { id: 'c7', categoryId: 'cat_camera', label: 'ダイナミック構図', values: { novelai: 'dynamic angle' } },
        { id: 'c8', categoryId: 'cat_camera', label: '斜め構図', values: { novelai: 'dutch angle' } },
        { id: 'c9', categoryId: 'cat_camera', label: 'ワイドショット', values: { novelai: 'wide shot' } },
        { id: 'c10', categoryId: 'cat_camera', label: 'シネマティックライティング', values: { novelai: 'cinematic lighting' } },
    ],
    slots: [],
}
