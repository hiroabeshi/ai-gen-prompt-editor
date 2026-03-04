import type { AppState } from '../types'

// アプリ起動時のデフォルト初期データ
// sample_data.json をベースに、より多くのカテゴリ・パーツを含めたデモデータ
export const defaultData: AppState = {
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
        // 品質（10）
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

        // 人数（10）
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

        // ポーズ（10）
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

        // 服装（10）
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

        // 髪型（10）
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

        // 表情（10）
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

        // 目（10）
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

        // 体型（10）
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

        // 背景（10）
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

        // 構図（10）
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
    slots: [
        {
            id: 'slot_base',
            name: 'Base（ポジティブ）',
            type: 'positive',
            parts: [
                { id: 'inst_base_q1', partId: 'q1', weight: 1.0, enabled: true },
                { id: 'inst_base_q2', partId: 'q2', weight: 1.0, enabled: true },
                { id: 'inst_base_p1', partId: 'p1', weight: 1.0, enabled: true },
            ],
        },
        {
            id: 'slot_base_neg',
            name: 'Base_Negative（除外）',
            type: 'negative',
            parts: [],
        },
    ],
}
