<template>
  <div class="transparent-overlay" @click.self="$emit('close')">
    <div class="modal" ref="modalRef" :style="{ top: `${adjustedY}px`, left: `${adjustedX}px` }">
      <div class="modal__header">
        <span class="modal__title">カテゴリ編集</span>
        <button class="icon-btn" @click="$emit('close')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <div class="modal__body">
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
            <strong>{{ editCategoryName }}</strong> を削除しますか？<br/>
            <span class="confirm-warn">⚠️ このカテゴリ内の全パーツも削除され、スロットからも除去されます。</span>
          </p>
          <div class="confirm-actions">
            <button class="btn-danger btn-sm" @click="doDeleteCategory">削除する</button>
            <button class="btn-ghost btn-sm" @click="showDeleteCategoryConfirm = false">キャンセル</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { usePromptStore } from '../store/promptStore'

const props = defineProps<{
  categoryId: string
  x: number
  y: number
}>()

const emit = defineEmits<{
  close: []
  deleted: []
}>()

const store = usePromptStore()

const category = computed(() => store.categories.find(c => c.id === props.categoryId))

const editCategoryName = ref('')
const editCategoryColor = ref('')

const modalRef = ref<HTMLElement | null>(null)
const adjustedX = ref(props.x)
const adjustedY = ref(props.y)

onMounted(() => {
  nextTick(() => {
    if (modalRef.value) {
      const rect = modalRef.value.getBoundingClientRect()
      let newX = props.x
      let newY = props.y
      
      if (newX + rect.width > window.innerWidth) {
        newX = window.innerWidth - rect.width - 16
      }
      if (newY + rect.height > window.innerHeight) {
        newY = window.innerHeight - rect.height - 16
      }
      
      adjustedX.value = Math.max(16, newX)
      adjustedY.value = Math.max(16, newY)
    }
  })
})

watch(
  category,
  (c) => {
    if (c) {
      editCategoryName.value = c.name
      editCategoryColor.value = c.color
    }
  },
  { immediate: true }
)

function saveCategory(): void {
  if (!category.value) return
  store.updateCategory(category.value.id, {
    name: editCategoryName.value,
    color: editCategoryColor.value,
  })
}

const showDeleteCategoryConfirm = ref(false)

function confirmDeleteCategory(): void {
  showDeleteCategoryConfirm.value = true
}

function doDeleteCategory(): void {
  if (!category.value) return
  store.deleteCategory(category.value.id)
  showDeleteCategoryConfirm.value = false
  emit('deleted')
  emit('close')
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

.field-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 4px;
  letter-spacing: 0.03em;
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
</style>
