<template>
  <div class="slot-card" :class="{ 'slot-card--negative': slot.type === 'negative' }">
    <!-- スロットヘッダー -->
    <div class="slot-header">
      <div
        class="slot-header__left"
        @click="$emit('edit-slot', slot.id)"
        title="スロットを編集"
        role="button"
        tabindex="0"
      >
        <span class="slot-type-badge" :class="slot.type === 'negative' ? 'badge--neg' : 'badge--pos'">
          {{ slot.type === 'negative' ? 'NEG' : 'POS' }}
        </span>
        <span class="slot-name">{{ slot.name }}</span>
      </div>
      <div class="slot-header__actions">
        <button class="icon-btn icon-btn--blue" @click="copyPrompt">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          プロンプトをコピー
        </button>
        <button class="icon-btn icon-btn--teal" @click="$emit('duplicate')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          スロットを複製
        </button>
        <button class="icon-btn icon-btn--danger" @click="confirmDelete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          削除
        </button>
      </div>
    </div>

    <!-- 削除確認エリア -->
    <div v-if="showDeleteConfirm" class="slot-confirm-box">
      <p class="confirm-msg">
        スロット<strong>「{{ slot.name || '名称未設定' }}」</strong>を削除しますか？
      </p>
      <div class="confirm-actions">
        <button class="btn-danger" @click="doDelete">削除する</button>
        <button class="btn-ghost" @click="showDeleteConfirm = false">キャンセル</button>
      </div>
    </div>

    <!-- プロンプト出力プレビュー -->
    <div v-if="promptText" class="prompt-preview" :title="promptText">
      {{ promptText }}
    </div>

    <!-- D&D パーツリスト -->
    <div class="parts-area">
      <VueDraggable
        v-model="localParts"
        :group="{ name: 'parts', put: ['library'] }"
        handle=".drag-handle"
        item-key="id"
        :animation="150"
        :remove-on-spill="true"
        @end="onEnd"
        class="draggable-list"
        :class="{ 'draggable-list--empty': localParts.length === 0 }"
        ghost-class="drag-ghost"
      >
        <PromptPart
          v-for="element in localParts"
          :key="element.id"
          :part="element"
          :is-selected="selectedInstanceId === element.id"
          @select="$emit('select-part', slot.id, element.id)"
          @toggle="store.togglePart(slot.id, element.id)"
          @update-weight="store.setPartWeight(slot.id, element.id, $event)"
        />
      </VueDraggable>
      <!-- 空スロットのヒント: pointer-events:none で draggable の背面に配置 -->
      <div v-if="localParts.length === 0" class="drop-zone-hint" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.4">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        <span>ここにパーツをドラッグ</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import PromptPart from './PromptPart.vue'
import { usePromptStore } from '../store/promptStore'
import { generatePrompt } from '../utils/promptGenerator'
import type { Slot, SelectedPart } from '../types'

const props = defineProps<{
  slot: Slot
  selectedInstanceId: string | null
}>()

const emit = defineEmits<{
  delete: []
  duplicate: []
  'select-part': [slotId: string, instanceId: string]
  'edit-slot': [slotId: string]
  copied: []
}>()

const store = usePromptStore()

// ─── 表示用ローカルリスト ──────────────────────────────────────
// computed writable: get は store から、set は store へ直接書き込む。
const localParts = computed<SelectedPart[]>({
  get: () => props.slot.parts,
  set: (newVal: SelectedPart[]) => {
    store.reorderSlotParts(props.slot.id, newVal)
  },
})

const promptText = computed(() =>
  generatePrompt(props.slot.parts, store.library)
)

// ─── D&D・イベント処理 ────────────────────────────────────────

const showDeleteConfirm = ref(false)

function confirmDelete(): void {
  showDeleteConfirm.value = true
}

function doDelete(): void {
  showDeleteConfirm.value = false
  emit('delete')
}

// remove-on-spill で枠外ドロップにより要素が削除されたときのハンドラ
// SortableJS は spill による削除時に DOM要素を removeChild しますが
// VueDraggable の v-model には反映されないため、@end で DOM 状態を見て手動適用します
function onEnd(evt: any): void {
  const item = evt.item
  // 親ノードが存在しない＝DOMから削除された（spillされた）と判定
  if (item && !item.parentNode) {
    if (evt.oldIndex !== undefined) {
      const newParts = [...props.slot.parts]
      newParts.splice(evt.oldIndex, 1)
      store.reorderSlotParts(props.slot.id, newParts)
    }
  }
}

async function copyPrompt(): Promise<void> {
  if (!promptText.value) return
  try {
    await navigator.clipboard.writeText(promptText.value)
    emit('copied')
  } catch {
    // clipboard 失敗時は何もしない
  }
}
</script>

<style scoped>
.slot-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.slot-card--negative {
  border-top: 2px solid #991b1b;
}

.slot-card:not(.slot-card--negative) {
  border-top: 2px solid #1d4ed8;
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #1f2937;
  gap: 8px;
}

.slot-header__left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.15s;
}

.slot-header__left:hover {
  background: rgba(255, 255, 255, 0.05);
}

.slot-type-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
  flex-shrink: 0;
  letter-spacing: 0.03em;
}

.badge--pos {
  background: #1e40af;
  color: #93c5fd;
}

.badge--neg {
  background: #7f1d1d;
  color: #fca5a5;
}

.slot-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e5e7eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-header__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.icon-btn {
  background: transparent;
  border: 1px solid #374151; /* Default fallback */
  color: #9ca3af;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

/* プロンプトをコピー: Blue */
.icon-btn--blue {
  border-color: #1e3a8a;
  color: #93c5fd;
}
.icon-btn--blue:hover {
  background: #172554;
  color: #bfdbfe;
  border-color: #1e40af;
}

/* スロットを複製: Teal */
.icon-btn--teal {
  border-color: #134e4a;
  color: #5eead4;
}
.icon-btn--teal:hover {
  background: #042f2e;
  color: #99f6e4;
  border-color: #0f766e;
}

/* 削除: Danger/Red */
.icon-btn--danger {
  border-color: #7f1d1d;
  color: #fca5a5;
}
.icon-btn--danger:hover {
  background: #450a0a;
  color: #f87171;
  border-color: #991b1b;
}

.prompt-preview {
  font-size: 0.7rem;
  color: #6b7280;
  padding: 4px 10px;
  background: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid #1f2937;
}

.parts-area {
  padding: 6px;
  flex: 1;
  position: relative;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 80px;
  position: relative;
  z-index: 1;
}

/* 空のとき: 点線ボーダーでドロップ可能エリアを示す */
.draggable-list--empty {
  border: 1px dashed #374151;
  border-radius: 6px;
}

/* ヒントテキストは draggable の背面に絶対配置し、マウスイベントを貫通させる */
.drop-zone-hint {
  position: absolute;
  inset: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #4b5563;
  font-size: 0.75rem;
  pointer-events: none;
  z-index: 0;
}

.drag-ghost {
  opacity: 0.3;
}

/* ─── 削除確認ダイアログ ─── */
.slot-confirm-box {
  padding: 10px 12px;
  background: #1a0a0a;
  border-bottom: 1px solid #450a0a;
}

.confirm-msg {
  font-size: 0.8rem;
  color: #d1d5db;
  margin: 0 0 10px;
  line-height: 1.5;
}

.confirm-warn {
  color: #fca5a5;
  font-size: 0.75rem;
}

.confirm-actions {
  display: flex;
  gap: 8px;
}

.btn-danger {
  background: #450a0a;
  color: #f87171;
  border: 1px solid #7f1d1d;
  border-radius: 4px;
  padding: 5px 12px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-danger:hover {
  background: #7f1d1d;
}

.btn-ghost {
  background: transparent;
  border: 1px solid #374151;
  color: #9ca3af;
  border-radius: 4px;
  padding: 5px 12px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-ghost:hover {
  background: #1f2937;
  color: #d1d5db;
}
</style>
