<template>
  <div class="slot-card" :class="`slot-card--${kind}`">
    <!-- スロットヘッダー -->
    <div class="slot-header">
      <div class="slot-header__left">
        <span class="slot-type-badge" :class="kind === 'negative' ? 'badge--neg' : 'badge--pos'">
          {{ kind === 'negative' ? 'NEG' : 'POS' }}
        </span>
        <span class="slot-name">{{ kind === 'negative' ? 'ネガティブ' : 'ポジティブ' }}</span>
      </div>
      <div class="slot-header__actions">
        <button class="icon-btn icon-btn--blue" @click="copyPrompt" :disabled="!promptCopy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          <span class="btn-text">プロンプトをコピー</span>
        </button>
      </div>
    </div>

    <!-- プロンプト出力プレビュー -->
    <div class="prompt-preview" :title="promptCopy">
      {{ promptPreview || '\u00A0' }}
    </div>

    <!-- ポジティブ専用: レーティング / データセットタグ -->
    <div v-if="kind === 'positive'" class="slot-meta">
      <div class="meta-row">
        <label class="meta-label">レーティング</label>
        <div class="rating-group">
          <label
            v-for="r in RATINGS"
            :key="r.id"
            class="rating-opt"
            :class="{ 'rating-opt--active': slot.rating === r.id }"
          >
            <input
              type="radio"
              name="rating"
              :value="r.id"
              :checked="slot.rating === r.id"
              @change="store.setRating(r.id)"
            />
            <span>{{ r.label }}</span>
          </label>
          <label
            class="rating-opt"
            :class="{ 'rating-opt--active': slot.rating == null }"
          >
            <input
              type="radio"
              name="rating"
              value=""
              :checked="slot.rating == null"
              @change="store.setRating(null)"
            />
            <span>未指定</span>
          </label>
        </div>
      </div>
      <div class="meta-row">
        <label class="meta-label">データセット</label>
        <select
          class="meta-input"
          :value="slot.datasetTag ?? ''"
          @change="onDatasetChange"
        >
          <option value="">未指定</option>
          <option value="deviantart">deviantart</option>
          <option value="ye-pop">ye-pop</option>
        </select>
      </div>
    </div>

    <!-- セクション単位のパーツリスト -->
    <div class="sections-area">
      <div v-for="sid in SECTION_IDS" :key="sid" class="section-block">
        <div class="section-header">
          <span class="section-label">{{ SECTION_LABELS[sid] }}</span>
          <span class="section-count">{{ slot.sections[sid].length }}</span>
          <button
            class="section-add-btn"
            :title="`${SECTION_LABELS[sid]} にパーツを追加`"
            @click="$emit('open-add-part', kind, sid)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>
        <VueDraggable
          :key="`${kind}-${sid}-${remountKey}`"
          :model-value="sectionSnapshots[sid]"
          @update:model-value="(v: SelectedPart[]) => onSectionUpdate(sid, v)"
          :group="{ name: `parts-${kind}`, put: ['library', `parts-${kind}`] }"
          handle=".drag-handle"
          item-key="id"
          :animation="150"
          :remove-on-spill="true"
          @end="(e: any) => onEnd(sid, e)"
          class="draggable-list"
          :class="{ 'draggable-list--empty': slot.sections[sid].length === 0 }"
          ghost-class="drag-ghost"
        >
          <PromptPart
            v-for="element in slot.sections[sid]"
            :key="`${sid}-${element.id}`"
            :part="element"
            :is-selected="selectedInstanceId === element.id"
            @select="(e) => $emit('select-part', element.id, e)"
            @toggle="store.togglePart(kind, element.id)"
            @update-weight="store.setPartWeight(kind, element.id, $event)"
            @remove="store.removePartFromSlot(kind, element.id)"
          />
        </VueDraggable>
        <div v-if="slot.sections[sid].length === 0" class="section-empty" aria-hidden="true">
          ここにドラッグ
        </div>
      </div>
    </div>

    <!-- 自由記述 -->
    <div class="freetext-block">
      <label class="freetext-label">自由記述（自然言語・追加タグ）</label>
      <textarea
        class="freetext-input"
        :value="slot.freeText"
        @input="onFreeTextInput"
        rows="2"
        placeholder="例: 1girl, smiling, looking at viewer"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import PromptPart from './PromptPart.vue'
import { usePromptStore } from '../store/promptStore'
import { generatePromptFromSlot } from '../utils/promptGenerator'
import type { SelectedPart, Rating } from '../types'
import { SECTION_IDS, SECTION_LABELS, type SectionId } from '../data/sections'

type SlotKind = 'positive' | 'negative'

const props = defineProps<{
  kind: SlotKind
  selectedInstanceId: string | null
}>()

const emit = defineEmits<{
  'select-part': [instanceId: string, event: MouseEvent]
  copied: []
  'open-add-part': [kind: SlotKind, sectionId?: SectionId]
}>()

const store = usePromptStore()

const slot = computed(() => store.getSlot(props.kind))

const RATINGS: { id: Rating; label: string }[] = [
  { id: 'safe', label: 'safe' },
  { id: 'sensitive', label: 'sensitive' },
  { id: 'nsfw', label: 'nsfw' },
  { id: 'explicit', label: 'explicit' },
]

const promptPreview = computed(() =>
  generatePromptFromSlot(slot.value, store.library, store.categories, true)
)

const promptCopy = computed(() =>
  generatePromptFromSlot(slot.value, store.library)
)

// VueDraggable に Pinia の reactive 配列を直接渡すと内部的に splice で
// ミューテートされ、Vue の v-for 再レンダリングと DOM 操作が競合する。
// セクション毎に shallow copy を渡して隔離する。
const sectionSnapshots = computed<Record<SectionId, SelectedPart[]>>(() => {
  const result = {} as Record<SectionId, SelectedPart[]>
  for (const sid of SECTION_IDS) {
    result[sid] = [...slot.value.sections[sid]]
  }
  return result
})

// セクション間ドラッグ後、VueDraggable が残した DOM と Vue の v-for が競合するため、
// key を変更して全セクションを強制再マウントし、Pinia state に基づくクリーンな DOM を再構築する。
const remountKey = ref<number>(0)

function onSectionUpdate(sid: SectionId, newParts: SelectedPart[]): void {
  store.reorderSectionParts(props.kind, sid, newParts)
}

function onEnd(sid: SectionId, evt: any): void {
  const item = evt.item
  // 画面外ドロップ (remove-on-spill) による削除処理
  if (item && !item.parentNode) {
    if (evt.oldIndex !== undefined) {
      const current = slot.value.sections[sid]
      const newParts = [...current]
      newParts.splice(evt.oldIndex, 1)
      store.reorderSectionParts(props.kind, sid, newParts)
    }
    return
  }
  // セクション間ドラッグでは update:model-value のタイミング次第で
  // 同一 id のパーツが複数セクションに残ることがあるため、最終整合性を確保する。
  if (evt.from && evt.to && evt.from !== evt.to) {
    store.dedupeSlotInstances(props.kind)
    // VueDraggable が動かした DOM と Vue の v-for が競合した状態を解消するため、
    // 次ティックで全セクションを強制再マウントする。
    nextTick(() => {
      remountKey.value++
    })
  }
}

function onFreeTextInput(e: Event): void {
  store.setFreeText(props.kind, (e.target as HTMLTextAreaElement).value)
}

function onDatasetChange(e: Event): void {
  store.setDatasetTag((e.target as HTMLSelectElement).value)
}

async function copyPrompt(): Promise<void> {
  if (!promptCopy.value) return
  try {
    await navigator.clipboard.writeText(promptCopy.value)
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

.slot-card--positive {
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
  padding: 4px;
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
  border: 1px solid #374151;
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

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-btn--blue {
  border-color: #1e3a8a;
  color: #93c5fd;
}

.icon-btn--blue:hover:not(:disabled) {
  background: #172554;
  color: #bfdbfe;
  border-color: #1e40af;
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

/* ─── スロットメタ (rating / dataset) ─── */
.slot-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: #0f172a;
  border-bottom: 1px solid #1f2937;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  min-width: 78px;
  letter-spacing: 0.02em;
}

.rating-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  flex: 1;
}

.rating-opt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid #374151;
  border-radius: 99px;
  font-size: 0.72rem;
  color: #9ca3af;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.rating-opt input {
  display: none;
}

.rating-opt:hover {
  background: #1f2937;
  color: #d1d5db;
}

.rating-opt--active {
  background: #312e81;
  color: #c4b5fd;
  border-color: #4c1d95;
}

.meta-input {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 0.78rem;
  color: #e5e7eb;
  outline: none;
  flex: 1;
  min-width: 120px;
}

.meta-input:focus {
  border-color: #6366f1;
}

/* ─── セクションエリア ─── */
.sections-area {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-block {
  border: 1px solid #1f2937;
  border-radius: 6px;
  background: #0f172a;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #1a2236;
  border-bottom: 1px solid #1f2937;
}

.section-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
  flex: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.section-count {
  font-size: 0.65rem;
  color: #6b7280;
  background: #111827;
  padding: 1px 6px;
  border-radius: 99px;
  min-width: 22px;
  text-align: center;
}

.section-add-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 3px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: background 0.15s, color 0.15s;
}

.section-add-btn:hover {
  background: #1f2937;
  color: #d1d5db;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px 6px;
  min-height: 24px;
  position: relative;
}

.draggable-list--empty {
  min-height: 30px;
}

.section-empty {
  font-size: 0.7rem;
  color: #374151;
  text-align: center;
  padding: 0 0 6px;
  pointer-events: none;
  margin-top: -22px;
}

.drag-ghost {
  opacity: 0.3;
}

/* ─── 自由記述 ─── */
.freetext-block {
  padding: 8px 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid #1f2937;
}

.freetext-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  letter-spacing: 0.02em;
}

.freetext-input {
  width: 100%;
  box-sizing: border-box;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 0.78rem;
  color: #e5e7eb;
  outline: none;
  resize: vertical;
  font-family: inherit;
  min-height: 48px;
}

.freetext-input:focus {
  border-color: #6366f1;
}

.freetext-input::placeholder {
  color: #4b5563;
}

@media (max-width: 768px) {
  .btn-text {
    display: none;
  }

  .icon-btn {
    padding: 6px;
  }

  .meta-label {
    min-width: 0;
    flex-basis: 100%;
  }
}
</style>
