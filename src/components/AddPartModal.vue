<template>
  <div class="modal-overlay" @dblclick.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <span class="modal__title">新規パーツを追加</span>
        <button class="icon-btn" @click="$emit('close')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <!-- タブヘッダー -->
      <div class="tab-bar">
        <button
          :class="['tab-btn', { 'tab-btn--active': activeTab === 'dictionary' }]"
          @click="activeTab = 'dictionary'"
        >
          <span style="font-size: 1.1em; margin-right: 4px;">📦</span>
          Danbooru 人気順から検索
        </button>
        <button
          :class="['tab-btn', { 'tab-btn--active': activeTab === 'manual' }]"
          @click="activeTab = 'manual'"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          手入力
        </button>
      </div>

      <!-- タブコンテンツ -->
      <div class="modal__body">
        <DictionaryAddTab
          v-if="activeTab === 'dictionary'"
          :initial-category-id="initialCategoryId"
          @close="$emit('close')"
          @added="$emit('added')"
        />
        <ManualAddTab
          v-if="activeTab === 'manual'"
          :initial-category-id="initialCategoryId"
          @close="$emit('close')"
          @added="$emit('added')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DictionaryAddTab from './DictionaryAddTab.vue'
import ManualAddTab from './ManualAddTab.vue'

defineProps<{
  initialCategoryId?: string
}>()

defineEmits<{
  close: []
  added: []
}>()

const activeTab = ref<'dictionary' | 'manual'>('dictionary')
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
  padding: 16px;
}

.modal {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 12px;
  width: 900px;
  max-width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #1f2937;
}

.modal__title {
  font-size: 1rem;
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
  transition: color 0.15s;
}

.icon-btn:hover { color: #d1d5db; }

/* ─── タブバー ─── */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #1f2937;
  padding: 0 20px;
  background: #0d1117;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 10px 16px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn:hover {
  color: #d1d5db;
}

.tab-btn--active {
  color: #a5b4fc;
  border-bottom-color: #6366f1;
}

/* ─── ボディ ─── */
.modal__body {
  padding: 16px 20px;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 500px;
  max-height: 65vh;
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 12px 8px;
    display: flex;
    align-items: center; /* 中央に配置して見切れを防止 */
    justify-content: center;
    overflow: hidden;
  }
  .modal {
    width: 100%;
    margin: 0;
    height: auto;
    max-height: 92dvh; /* 画面高さを超えないように制限 */
    display: flex;
    flex-direction: column;
  }
  .modal__body {
    min-height: 0;
    max-height: none;
    padding: 12px;
    overflow-y: auto; /* ボディ内でスクロール */
    flex: 1;
  }
  .tab-bar {
    padding: 0 8px;
  }
  .tab-btn {
    font-size: 0.7rem;
    padding: 10px 8px;
  }
}
</style>
