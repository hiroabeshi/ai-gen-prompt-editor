<template>
  <div class="modal-overlay" @dblclick.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <span class="modal__title">新規カテゴリを追加</span>
        <button class="icon-btn" @click="$emit('close')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <div class="modal__body">
        <label class="field-label">カテゴリ名 <span class="required">*</span></label>
        <input
          v-model="form.name"
          class="field-input"
          placeholder="例: 髪型"
          autofocus
          @keyup.enter="submit"
        />

        <label class="field-label mt">テーマカラー</label>
        <div class="color-picker-wrap">
          <input
            type="color"
            v-model="form.color"
            class="color-input"
          />
          <span class="color-code">{{ form.color }}</span>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>
      </div>

      <div class="modal__footer">
        <button class="btn-ghost" @click="$emit('close')">キャンセル</button>
        <button class="btn-primary" @click="submit">追加する</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { usePromptStore } from '../store/promptStore'

const emit = defineEmits<{
  close: []
  added: []
}>()

const store = usePromptStore()
const error = ref('')

const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')

const form = reactive({
  name: '',
  color: getRandomColor(),
})

function submit(): void {
  if (!form.name.trim()) { error.value = 'カテゴリ名を入力してください。'; return }
  store.addCategory(form.name.trim(), form.color)
  emit('added')
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 12px;
  width: 320px;
  max-width: 95vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: modal-in 0.15s ease-out;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #1f2937;
}

.modal__title {
  font-size: 0.9rem;
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
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #1f2937;
}

.field-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 4px;
}

.field-label.mt { margin-top: 12px; }

.required { color: #f87171; }

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

.field-input:focus { border-color: #6366f1; }

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

.error-msg { font-size: 0.75rem; color: #f87171; margin: 8px 0 0; }

.btn-primary {
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover { background: #4338ca; }

.btn-ghost {
  background: transparent;
  border: 1px solid #374151;
  color: #9ca3af;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.82rem;
  cursor: pointer;
}

.btn-ghost:hover { background: #1f2937; }
</style>
