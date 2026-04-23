<template>
  <div v-if="instancePart" class="transparent-overlay" @click.self="$emit('close')">
    <div class="modal" :style="{ top: `${y}px`, left: `${x}px` }">
      <div class="modal__header">
        <span class="modal__title">パーツ プロパティ</span>
        <button class="icon-btn" @click="$emit('close')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <div class="modal__body">
        <div class="part-label-display">
          {{ masterLabel }}
        </div>

        <label class="field-label">マスター参照タグ</label>
        <input
          class="field-input field-input--readonly"
          :class="{ 'is-disabled': isRandomizer }"
          :value="masterTag"
          readonly
          :disabled="isRandomizer"
          title="マスターデータを参照"
        />
        <p class="field-hint">このスロットインスタンスが参照しているタグ</p>

        <div class="divider"></div>
        <label class="field-label" :class="{ 'is-disabled-text': isRandomizer }">
          強度調整（このスロット限定）
        </label>
        <div class="weight-row">
          <input
            type="range"
            class="weight-slider"
            :value="instancePart.weight"
            @input="onWeightInput"
            min="-2.5" max="5.0" step="0.1"
            :disabled="isRandomizer"
          />
          <span class="weight-val" :class="{ 'is-disabled-text': isRandomizer }">
            {{ instancePart.weight.toFixed(2) }}
          </span>
        </div>

        <div class="divider"></div>
        <button class="btn-danger" @click="$emit('remove-from-slot')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          スロットから外す
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePromptStore } from '../store/promptStore'
import { isRandomizerPartId } from '../types'

type SlotKind = 'positive' | 'negative'

const props = defineProps<{
  kind: SlotKind
  instanceId: string
  x: number
  y: number
}>()

defineEmits<{
  close: []
  'remove-from-slot': []
}>()

const store = usePromptStore()

const instancePart = computed(() => store.findInstance(props.kind, props.instanceId)?.part ?? null)

const isRandomizer = computed(() =>
  instancePart.value ? isRandomizerPartId(instancePart.value.partId) : false,
)

const masterLabel = computed(() => {
  if (!instancePart.value) return ''
  return store.getMasterPart(instancePart.value.partId)?.label ?? '不明なパーツ'
})

const masterTag = computed(() => {
  if (!instancePart.value) return ''
  if (isRandomizer.value) return 'ランダマイザ'
  return store.getMasterPart(instancePart.value.partId)?.values.anima ?? ''
})

function onWeightInput(e: Event): void {
  const val = parseFloat((e.target as HTMLInputElement).value)
  store.setPartWeight(props.kind, props.instanceId, val)
}
</script>

<style scoped>
.transparent-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.modal {
  position: absolute;
  background: #111827;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  width: 300px;
  max-width: 95vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: modal-in 0.15s ease-out;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(-8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #1f2937;
}

.modal__title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #e5e7eb;
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
}

.icon-btn:hover { color: #d1d5db; }

.modal__body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
}

.part-label-display {
  font-size: 0.95rem;
  font-weight: 700;
  color: #e5e7eb;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1f2937;
  word-break: break-all;
}

.field-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 4px;
  letter-spacing: 0.03em;
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
  margin: 12px 0;
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
</style>
