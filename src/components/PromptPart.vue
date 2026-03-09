<template>
  <!-- masterPart が存在しない場合は何も描画しない (D&D 中のライブラリクローン対策) -->
  <div v-if="masterPart"
    class="part-card"
    :class="{
      'part-card--disabled': !part.enabled,
      'part-card--selected': isSelected,
      'part-card--randomizer': isRandomizer,
    }"
    :style="{ borderLeftColor: categoryColor }"
    @click="$emit('select', $event)"
  >
    <!-- 左側全体をドラッグハンドルにする -->
    <div class="part-left-side drag-handle" title="ドラッグして並び替え">
      <div class="drag-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 3h2v2H9zm4 0h2v2h-2zM9 7h2v2H9zm4 0h2v2h-2zM9 11h2v2H9zm4 0h2v2h-2zM9 15h2v2H9zm4 0h2v2h-2zM9 19h2v2H9zm4 0h2v2h-2z"/>
        </svg>
      </div>

      <!-- チェックボックス (ON/OFF) -->
      <input
        type="checkbox"
        class="part-checkbox"
        :checked="part.enabled"
        @change.stop="$emit('toggle')"
        @click.stop
        title="有効/無効の切り替え"
      />

      <!-- ランダマイザアイコン -->
      <span v-if="isRandomizer" class="randomizer-icon">🎲</span>

      <!-- ラベル -->
      <span class="part-label" :class="{ 'part-label--off': !part.enabled }">
        {{ masterLabel }}
      </span>
    </div>

    <!-- インライン強度調整スライダー（ランダマイザは非表示） -->
    <input
      v-if="isSelected && !isRandomizer"
      type="range"
      class="inline-slider"
      :value="part.weight"
      min="-2.5" max="5.0" step="0.1"
      @input="onWeightInput"
      @click.stop
    />

    <!-- weight バッジ（ランダマイザは非表示） -->
    <span
      v-if="!isRandomizer && (part.weight !== 1.0 || isSelected)"
      class="weight-badge"
      :class="{
        'weight-badge--high': part.weight > 1.0,
        'weight-badge--low': part.weight < 1.0,
      }"
    >
      {{ displayWeight }}
    </span>

    <!-- ランダマイザバッジ -->
    <span v-if="isRandomizer" class="randomizer-badge">RANDOM</span>

    <!-- スロット内から削除ボタン -->
    <button
      class="part-delete-btn"
      title="スロットから削除"
      @click.stop="$emit('remove')"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePromptStore } from '../store/promptStore'
import type { SelectedPart } from '../types'
import { isRandomizerPartId } from '../types'

const props = defineProps<{
  part: SelectedPart
  isSelected: boolean
}>()

const emit = defineEmits<{
  select: [event: MouseEvent]
  toggle: []
  'update-weight': [weight: number]
  remove: []
}>()

function onWeightInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update-weight', parseFloat(target.value))
}

const store = usePromptStore()

const isRandomizer = computed(() => isRandomizerPartId(props.part.partId))

const masterPart = computed(() => store.getMasterPart(props.part.partId))
const masterLabel = computed(() => masterPart.value?.label ?? '不明なパーツ')

const categoryColor = computed(() => {
  if (!masterPart.value) return '#6b7280'
  const cat = store.categories.find(c => c.id === masterPart.value!.categoryId)
  return cat?.color ?? '#6b7280'
})

const displayWeight = computed(() => {
  const w = props.part.weight
  return `×${Number.isInteger(w) ? w : w.toFixed(2).replace(/\.?0+$/, '')}`
})
</script>

<style scoped>
.part-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #374151;
  border-left: 3px solid #6366f1;
  background: #1f2937;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  user-select: none;
}

.part-card:hover {
  background: #283141;
}

.part-card--selected {
  background: #2d3a4f;
  border-color: #6366f1;
}

.part-card--disabled {
  opacity: 0.45;
}

.drag-handle {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-icon {
  color: #4b5563;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.part-checkbox {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: #6366f1;
}

.part-label {
  flex: 1;
  font-size: 0.82rem;
  color: #e5e7eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.part-label--off {
  color: #6b7280;
}

.inline-slider {
  width: 160px;
  accent-color: #6366f1;
  flex-shrink: 0;
  cursor: pointer;
  margin: 0 4px;
}

.weight-badge {
  font-size: 0.7rem;
  padding: 1px 5px;
  border-radius: 99px;
  flex-shrink: 0;
  font-weight: 600;
  width: 44px;
  text-align: center;
  display: inline-block;
  box-sizing: border-box;
}

.weight-badge--high {
  background: #4c1d95;
  color: #c4b5fd;
}

.weight-badge--low {
  background: #1e3a5f;
  color: #93c5fd;
}

/* ランダマイザ */
.part-card--randomizer {
  background: #1a1a2e;
  border-style: dashed;
  border-left-style: solid;
}

.part-card--randomizer:hover {
  background: #252540;
}

.part-card--randomizer.part-card--selected {
  background: #2d2d50;
  border-color: #7c3aed;
}

.randomizer-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.randomizer-badge {
  font-size: 0.6rem;
  font-weight: 700;
  color: #a78bfa;
  background: #2e1065;
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.part-delete-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}

.part-delete-btn:hover {
  background: #7f1d1d;
  color: #fca5a5;
}
</style>
