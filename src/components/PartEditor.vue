<template>
  <aside class="editor-panel" :class="{ 'flash-highlight': isFlashing }">
    <div class="editor-panel__header">
      <span class="editor-panel__title">
        <template v-if="mode === 'master'">マスターパーツ編集</template>
        <template v-else-if="mode === 'category'">カテゴリ編集</template>
        <template v-else-if="mode === 'slot-info'">スロット編集</template>
        <template v-else>プロパティ</template>
      </span>
      <button class="icon-btn" @click="$emit('close')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    </div>

    <!-- マスターパーツ編集 -->
    <div v-if="mode === 'master' && masterPart" class="editor-body">
      <label class="field-label">表示ラベル名</label>
      <input
        class="field-input"
        v-model="editLabel"
        placeholder="例: 金髪ロング"
        @blur="saveMaster"
      />
      <p class="field-hint">アプリ内で表示される名前</p>

      <label class="field-label mt">NovelAI タグ</label>
      <input
        class="field-input"
        v-model="editNovelai"
        placeholder="例: blonde hair, long hair"
        @blur="saveMaster"
      />
      <p class="field-hint">AI に送信される実際の文字列</p>

      <label class="field-label mt">カテゴリ</label>
      <select class="field-input" v-model="editCategoryId" @change="saveMaster">
        <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </option>
      </select>

      <!-- 削除 -->
      <div class="divider"></div>
      <button class="btn-danger" @click="confirmDelete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        マスターから削除
      </button>

      <!-- 削除確認ダイアログ -->
      <div v-if="showDeleteConfirm" class="confirm-box">
        <p class="confirm-msg">
          <strong>{{ masterPart.label }}</strong> を削除しますか？<br/>
          <span v-if="isUsed" class="confirm-warn">⚠️ このパーツはスロットで使用中です。削除すると全スロットから除去されます。</span>
        </p>
        <div class="confirm-actions">
          <button class="btn-danger btn-sm" @click="doDelete">削除する</button>
          <button class="btn-ghost btn-sm" @click="showDeleteConfirm = false">キャンセル</button>
        </div>
      </div>
    </div>

    <!-- スロットインスタンス編集 -->
    <div v-else-if="mode === 'slot' && instancePart" class="editor-body">
      <div class="part-label-display">
        {{ masterLabelOfInstance }}
      </div>

      <label class="field-label">マスター参照タグ</label>
      <input
        class="field-input field-input--readonly"
        :class="{ 'is-disabled': isRandomizer }"
        :value="masterTagOfInstance"
        readonly
        :disabled="isRandomizer"
        title="マスターデータを参照"
      />
      <p class="field-hint">このスロットインスタンスが参照しているタグ</p>

      <div class="divider"></div>
      <label class="field-label" :class="{ 'is-disabled-text': isRandomizer }">強度調整（このスロット限定）</label>
      <div class="weight-row">
        <input
          type="range"
          class="weight-slider"
          v-model.number="instanceWeight"
          min="-2.5" max="5.0" step="0.1"
          :disabled="isRandomizer"
        />
        <span class="weight-val" :class="{ 'is-disabled-text': isRandomizer }">{{ instanceWeight.toFixed(2) }}</span>
      </div>

      <div class="divider"></div>
      <button class="btn-danger" @click="$emit('remove-from-slot')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        スロットから外す
      </button>
    </div>

    <!-- スロット編集 -->
    <div v-else-if="mode === 'slot-info' && slot" class="editor-body">
      <label class="field-label">スロット名</label>
      <input
        class="field-input"
        v-model="editSlotName"
        @blur="saveSlot"
        @keydown.enter="saveSlot"
      />

      <label class="field-label mt">タイプ</label>
      <div class="type-toggle">
        <button
          class="type-btn"
          :class="{ 'type-btn--active type-btn--pos': editSlotType === 'positive' }"
          @click="setSlotType('positive')"
        >
          ✚ ポジティブ
        </button>
        <button
          class="type-btn"
          :class="{ 'type-btn--active type-btn--neg': editSlotType === 'negative' }"
          @click="setSlotType('negative')"
        >
          ✖ ネガティブ
        </button>
      </div>

      <div class="divider"></div>
      <button class="btn-danger" @click="confirmDeleteSlot">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        スロットを削除
      </button>

      <!-- スロット削除確認ダイアログ -->
      <div v-if="showDeleteSlotConfirm" class="confirm-box">
        <p class="confirm-msg">
          スロット<strong>「{{ slot.name || '名称未設定' }}」</strong>を削除しますか？
        </p>
        <div class="confirm-actions">
          <button class="btn-danger btn-sm" @click="doDeleteSlot">削除する</button>
          <button class="btn-ghost btn-sm" @click="showDeleteSlotConfirm = false">キャンセル</button>
        </div>
      </div>
    </div>

    <!-- カテゴリ編集 -->
    <div v-else-if="mode === 'category' && category" class="editor-body">
      <label class="field-label">カテゴリ名</label>
      <input
        class="field-input"
        v-model="editCategoryName"
        @blur="saveCategory"
      />

      <label class="field-label mt">テーマカラー</label>
      <div class="color-picker-wrap">
        <input
          type="color"
          v-model="editCategoryColor"
          class="color-input"
          @change="saveCategory"
        />
        <span class="color-code">{{ editCategoryColor }}</span>
      </div>

      <div class="divider"></div>
      <button class="btn-danger" @click="confirmDeleteCategory">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        カテゴリを削除
      </button>

      <!-- カテゴリ削除確認ダイアログ -->
      <div v-if="showDeleteCategoryConfirm" class="confirm-box">
        <p class="confirm-msg">
          <strong>{{ category.name }}</strong> を削除しますか？<br/>
          <span class="confirm-warn">⚠️ このカテゴリ内の全パーツも削除され、スロットからも除去されます。</span>
        </p>
        <div class="confirm-actions">
          <button class="btn-danger btn-sm" @click="doDeleteCategory">削除する</button>
          <button class="btn-ghost btn-sm" @click="showDeleteCategoryConfirm = false">キャンセル</button>
        </div>
      </div>
    </div>

    <!-- 未選択時 -->
    <div v-else class="editor-empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.25">
        <path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z"/>
      </svg>
      <p>パーツをクリックすると<br/>詳細を編集できます</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { usePromptStore } from '../store/promptStore'
import { isRandomizerPartId, type PromptPart, type SelectedPart, type Category, type Slot } from '../types'

const props = defineProps<{
  mode: 'master' | 'slot' | 'category' | 'slot-info' | null
  masterPart: PromptPart | null
  instancePart: SelectedPart | null
  slotId: string | null
  category?: Category | null
  slot?: Slot | null
}>()

const emit = defineEmits<{
  close: []
  'remove-from-slot': []
  deleted: []
}>()

const store = usePromptStore()

// 視線誘導のフラッシュ効果用
const isFlashing = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | null = null

const flashTrigger = computed(() => {
  if (props.mode === 'master') return `master-${props.masterPart?.id}`
  if (props.mode === 'category') return `category-${props.category?.id}`
  if (props.mode === 'slot-info') return `slot-info-${props.slot?.id}`
  return null
})

watch(flashTrigger, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    isFlashing.value = false
    if (flashTimer) clearTimeout(flashTimer)
    setTimeout(() => {
      isFlashing.value = true
      flashTimer = setTimeout(() => {
        isFlashing.value = false
      }, 1200)
    }, 10)
  }
})

// マスター編集フォーム
const editLabel = ref('')
const editNovelai = ref('')
const editCategoryId = ref('')

watch(
  () => props.masterPart,
  (p) => {
    if (p) {
      editLabel.value = p.label
      editNovelai.value = p.values.novelai
      editCategoryId.value = p.categoryId
    }
  },
  { immediate: true },
)

function saveMaster(): void {
  if (!props.masterPart) return
  store.updatePart(props.masterPart.id, {
    label: editLabel.value,
    categoryId: editCategoryId.value,
    values: {
      novelai: editNovelai.value,
    },
  })
}

// インスタンス weight
const instanceWeight = computed({
  get: () => props.instancePart?.weight ?? 1.0,
  set: (val: number) => {
    if (props.slotId && props.instancePart) {
      store.setPartWeight(props.slotId, props.instancePart.id, val)
    }
  },
})

const masterLabelOfInstance = computed(() => {
  if (!props.instancePart) return ''
  return store.getMasterPart(props.instancePart.partId)?.label ?? '不明なパーツ'
})

const isRandomizer = computed(() => {
  return props.instancePart ? isRandomizerPartId(props.instancePart.partId) : false
})

const masterTagOfInstance = computed(() => {
  if (!props.instancePart) return ''
  if (isRandomizer.value) return 'ランダマイザ'
  return store.getMasterPart(props.instancePart.partId)?.values.novelai ?? ''
})

// 削除確認
const showDeleteConfirm = ref(false)
const isUsed = computed(() =>
  props.masterPart ? store.isPartUsedInSlots(props.masterPart.id) : false
)

function confirmDelete(): void {
  showDeleteConfirm.value = true
}

function doDelete(): void {
  if (!props.masterPart) return
  store.deletePart(props.masterPart.id)
  showDeleteConfirm.value = false
  emit('deleted')
}

// スロット編集フォーム
const editSlotName = ref('')
const editSlotType = ref<'positive' | 'negative'>('positive')

watch(
  () => props.slot,
  (s) => {
    if (s) {
      editSlotName.value = s.name
      editSlotType.value = s.type
    }
  },
  { immediate: true },
)

function saveSlot(): void {
  if (!props.slot) return
  store.updateSlot(props.slot.id, {
    name: editSlotName.value.trim() || '名称未設定',
    type: editSlotType.value,
  })
}

function setSlotType(type: 'positive' | 'negative'): void {
  editSlotType.value = type
  saveSlot()
}

// スロット削除確認
const showDeleteSlotConfirm = ref(false)

function confirmDeleteSlot(): void {
  showDeleteSlotConfirm.value = true
}

function doDeleteSlot(): void {
  if (!props.slot) return
  store.deleteSlot(props.slot.id)
  showDeleteSlotConfirm.value = false
  emit('deleted')
}

// カテゴリ編集フォーム
const editCategoryName = ref('')
const editCategoryColor = ref('')

watch(
  () => props.category,
  (c) => {
    if (c) {
      editCategoryName.value = c.name
      editCategoryColor.value = c.color
    }
  },
  { immediate: true },
)

function saveCategory(): void {
  if (!props.category) return
  store.updateCategory(props.category.id, {
    name: editCategoryName.value,
    color: editCategoryColor.value,
  })
}

// カテゴリ削除確認
const showDeleteCategoryConfirm = ref(false)

function confirmDeleteCategory(): void {
  showDeleteCategoryConfirm.value = true
}

function doDeleteCategory(): void {
  if (!props.category) return
  store.deleteCategory(props.category.id)
  showDeleteCategoryConfirm.value = false
  emit('deleted')
}
</script>

<style scoped>
.editor-panel {
  width: 280px;
  min-width: 240px;
  background: #0f172a;
  border-left: 1px solid #1f2937;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@keyframes highlightFlash {
  0% { background-color: #0f172a; box-shadow: inset 0 0 0 rgba(99, 102, 241, 0); }
  15% { background-color: #1e293b; box-shadow: inset 0 0 8px rgba(99, 102, 241, 0.15); }
  100% { background-color: #0f172a; box-shadow: inset 0 0 0 rgba(99, 102, 241, 0); }
}

.flash-highlight {
  animation: highlightFlash 1.2s ease-in-out;
}

.editor-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #1f2937;
}

.editor-panel__title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 0.03em;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: background 0.15s;
}

.icon-btn:hover {
  background: #1f2937;
  color: #d1d5db;
}

.editor-body {
  padding: 14px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #374151;
  font-size: 0.78rem;
  text-align: center;
  padding: 24px;
}

.field-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 4px;
  letter-spacing: 0.03em;
}

.part-label-display {
  font-size: 0.95rem;
  font-weight: 700;
  color: #e5e7eb;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1f2937;
  word-break: break-all;
}

.field-label.mt {
  margin-top: 14px;
}

.field-input {
  width: 100%;
  box-sizing: border-box;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 0.82rem;
  color: #e5e7eb;
  outline: none;
}

.field-input:focus {
  border-color: #6366f1;
}

.field-input--readonly {
  opacity: 0.6;
  cursor: default;
}

.field-hint {
  font-size: 0.68rem;
  color: #4b5563;
  margin: 3px 0 0;
}

.weight-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weight-slider {
  flex: 1;
  accent-color: #6366f1;
}

.weight-slider:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.weight-val {
  font-size: 0.82rem;
  font-weight: 600;
  color: #c4b5fd;
  min-width: 36px;
  text-align: right;
}

.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.is-disabled-text {
  opacity: 0.4;
}

.divider {
  height: 1px;
  background: #1f2937;
  margin: 14px 0;
}

.btn-danger {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #450a0a;
  color: #f87171;
  border: 1px solid #7f1d1d;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.82rem;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: background 0.15s;
}

.btn-danger:hover {
  background: #7f1d1d;
}

.btn-ghost {
  background: transparent;
  border: 1px solid #374151;
  color: #9ca3af;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-ghost:hover {
  background: #1f2937;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.78rem;
}

.confirm-box {
  margin-top: 12px;
  padding: 12px;
  background: #1a0a0a;
  border: 1px solid #7f1d1d;
  border-radius: 8px;
}

.confirm-msg {
  font-size: 0.8rem;
  color: #d1d5db;
  margin: 0 0 10px;
  line-height: 1.5;
}

.confirm-warn {
  color: #fbbf24;
  font-size: 0.75rem;
}

.confirm-actions {
  display: flex;
  gap: 8px;
}

.color-picker-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-input {
  width: 40px;
  height: 32px;
  padding: 0;
  border: 1px solid #374151;
  border-radius: 4px;
  background: none;
  cursor: pointer;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}

.color-code {
  font-size: 0.82rem;
  color: #e5e7eb;
  font-family: monospace;
}

.type-toggle {
  display: flex;
  gap: 8px;
}

.type-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid #374151;
  border-radius: 6px;
  background: #1f2937;
  color: #6b7280;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.type-btn--active {
  font-weight: 600;
}

.type-btn--pos {
  border-color: #1d4ed8;
  color: #93c5fd;
  background: #1e3a5f;
}

.type-btn--neg {
  border-color: #991b1b;
  color: #fca5a5;
  background: #450a0a;
}
</style>
