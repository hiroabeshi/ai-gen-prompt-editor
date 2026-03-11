<template>
  <aside class="sidebar">
    <!-- ヘッダー -->
    <div class="sidebar__header">
      <span class="sidebar__title">パーツ倉庫</span>
      <button class="header-add-btn" title="カテゴリを追加" @click="$emit('open-add-category')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        カテゴリを追加
      </button>
    </div>

    <!-- 検索 -->
    <div class="search-wrap">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <input
        v-model="search"
        class="search-input"
        type="text"
        placeholder="パーツを検索..."
      />
      <button v-if="search" class="search-clear" @click="search = ''">×</button>
    </div>

    <!-- カテゴリリスト -->
    <div class="category-list">
      <VueDraggable
        v-model="draggableCategories"
        group="categories"
        handle=".category-header"
        item-key="id"
        :animation="150"
      >
        <div
          v-for="cat in draggableCategories"
          :key="cat.id"
          class="category-group"
        >
          <!-- カテゴリヘッダー -->
          <div
            class="category-header"
            :style="{ borderLeftColor: cat.color }"
            @click="onCategoryClick(cat.id, $event)"
          >
          <span class="category-color-dot" :style="{ background: cat.color }"></span>
          <span class="category-name">{{ cat.name }}</span>
          <button
            class="category-add-btn"
            title="このカテゴリにパーツを追加"
            @click.stop="$emit('open-add-part', cat.id)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            パーツを追加
          </button>
          <svg
            class="category-chevron"
            :class="{ 'category-chevron--open': openCategories.has(cat.id) }"
            width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
          </div>

        <div v-if="openCategories.has(cat.id)" class="parts-list">
          <VueDraggable
            :model-value="getPartsWithRandomizer(cat.id)"
            :group="{ name: 'library', pull: 'clone', put: false }"
            item-key="id"
            :sort="false"
            :clone="clonePart"
          >
            <div
              v-for="element in getPartsWithRandomizer(cat.id)"
              :key="element.id"
              class="library-part"
              :class="{
                'library-part--randomizer': isRandomizerPartId(element.id),
                'library-part--glow': glowingPartId === element.id
              }"
              :data-part-id="element.id"
              :style="{ borderLeftColor: cat.color }"
              @click="!isRandomizerPartId(element.id) && $emit('select-master', element.id, $event)"
            >
              <template v-if="isRandomizerPartId(element.id)">
                <span class="randomizer-icon">🎲</span>
                <span class="library-part__label">{{ element.label }}</span>
                <span class="library-part__tag library-part__tag--randomizer">RANDOM</span>
              </template>
              <template v-else>
                <svg class="drag-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 3h2v2H9zm4 0h2v2h-2zM9 7h2v2H9zm4 0h2v2h-2zM9 11h2v2H9zm4 0h2v2h-2zM9 15h2v2H9zm4 0h2v2h-2zM9 19h2v2H9zm4 0h2v2h-2z"/>
                </svg>
                <span class="library-part__label">{{ element.label }}</span>
                <span class="library-part__tag">{{ element.values.novelai }}</span>
              </template>
            </div>
          </VueDraggable>

          <div
            v-if="getPartsForCategory(cat.id).length === 0"
            class="parts-empty parts-empty--clickable"
            title="パーツを追加"
            @click="$emit('open-add-part', cat.id)"
          >
            パーツがありません (クリックで追加)
          </div>
        </div>
        </div>
      </VueDraggable>

      <div v-if="categories.length === 0" class="parts-empty" style="padding: 24px;">
        カテゴリがありません
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { v4 as uuidv4 } from 'uuid'
import { usePromptStore } from '../store/promptStore'
import type { PromptPart } from '../types'
import { DEFAULT_PART_WEIGHT, randomizerPartId, isRandomizerPartId } from '../types'

const emit = defineEmits<{
  'open-add-part': [categoryId?: string]
  'open-add-category': []
  'select-master': [partId: string, event: MouseEvent]
  'select-category': [categoryId: string, event: MouseEvent]
}>()

const store = usePromptStore()
const search = ref('')

const catParts = ref<Record<string, PromptPart[]>>({})

watch(
  () => [store.library, search.value, store.categories] as const,
  ([library, searchVal, cats]) => {
    const next: Record<string, PromptPart[]> = {}
    for (const cat of cats) {
      const parts = library.filter((p: PromptPart) => p.categoryId === cat.id)
      if (!searchVal) {
        next[cat.id] = parts
      } else {
        const lower = searchVal.toLowerCase()
        next[cat.id] = parts.filter((p: PromptPart) =>
          p.label.toLowerCase().includes(lower) ||
          p.values.novelai.toLowerCase().includes(lower)
        )
      }
    }
    catParts.value = next
  },
  { deep: true, immediate: true }
)

const categories = computed(() =>
  store.categories.filter(cat => {
    const parts = catParts.value[cat.id] || []
    return parts.length > 0 || cat.name.toLowerCase().includes(search.value.toLowerCase())
  })
)

const draggableCategories = computed({
  get: () => categories.value,
  set: (newVal) => {
    // 検索中でなければ並び替えを保存する
    if (!search.value) {
      store.reorderCategories(newVal)
    }
  }
})

function getPartsForCategory(categoryId: string): PromptPart[] {
  return catParts.value[categoryId] || []
}

/** ランダマイザを先頭に含むパーツリストを返す */
function getPartsWithRandomizer(categoryId: string): PromptPart[] {
  const cat = store.categories.find(c => c.id === categoryId)
  if (!cat) return getPartsForCategory(categoryId)
  const randPart: PromptPart = {
    id: randomizerPartId(categoryId),
    categoryId,
    label: `${cat.name} @ランダマイザ`,
    values: { novelai: '' },
  }
  return [randPart, ...getPartsForCategory(categoryId)]
}

// 初期状態で全カテゴリを閉じる
const openCategories = ref(new Set<string>())

function toggleCategory(id: string): void {
  if (openCategories.value.has(id)) {
    openCategories.value.delete(id)
  } else {
    openCategories.value.add(id)
  }
}

function onCategoryClick(id: string, event: MouseEvent): void {
  if (openCategories.value.has(id)) {
    // すでに開いている → popup を出す（閉じない）
    emit('select-category', id, event)
  } else {
    // 閉じている → 開くだけ（popup なし）
    toggleCategory(id)
  }
}

// vuedraggable の clone 用: SelectedPart の形に変換
function clonePart(part: PromptPart) {
  return {
    id: uuidv4(),
    partId: part.id,
    weight: DEFAULT_PART_WEIGHT,
    enabled: true,
  }
}

// 外部から特定パーツへフォーカスする（カテゴリを開き、スクロールして光らせる）
const glowingPartId = ref<string | null>(null)

function focusPart(partId: string): void {
  const master = store.getMasterPart(partId)
  if (master) {
    openCategories.value.clear()
    openCategories.value.add(master.categoryId)

    glowingPartId.value = partId
    setTimeout(() => {
      if (glowingPartId.value === partId) {
        glowingPartId.value = null
      }
    }, 1500)

    // DOM更新後にスクロール
    nextTick(() => {
      const el = document.querySelector(`.library-part[data-part-id="${partId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }
}

defineExpose({
  focusPart
})
</script>

<style scoped>
.sidebar {
  width: 360px;
  min-width: 320px;
  background: #0f172a;
  border-right: 1px solid #1f2937;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #1f2937;
}

.sidebar__title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #e5e7eb;
  letter-spacing: 0.03em;
}

.header-add-btn {
  background: transparent;
  border: 1px dashed #374151;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.header-add-btn:hover {
  background: #1f2937;
  color: #d1d5db;
  border-color: #6b7280;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.15s;
}

.btn-sm {
  padding: 4px 8px;
}

.btn-primary:hover {
  background: #4338ca;
}

.search-wrap {
  position: relative;
  padding: 8px 10px;
  border-bottom: 1px solid #1f2937;
}

.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #4b5563;
  pointer-events: none;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 6px 28px 6px 28px;
  font-size: 0.8rem;
  color: #e5e7eb;
  outline: none;
}

.search-input:focus {
  border-color: #6366f1;
}

.search-input::placeholder {
  color: #4b5563;
}

.search-clear {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.category-list {
  flex: 1;
  overflow-y: auto;
}

.category-group {
  border-bottom: 1px solid #1a2236;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.15s;
  user-select: none;
}

.category-header:hover {
  background: #1a2236;
}

.category-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.category-name {
  flex: 1;
  font-size: 0.82rem;
  font-weight: 600;
  color: #d1d5db;
}

.category-add-btn {
  background: transparent;
  border: 1px dashed #374151;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  margin-right: 8px;
}

.category-add-btn:hover {
  background: #374151;
  color: #d1d5db;
  border-color: #6b7280;
}

.category-chevron {
  color: #4b5563;
  transition: transform 0.2s;
}

.category-chevron--open {
  transform: rotate(180deg);
}

.parts-list {
  padding: 4px 6px 6px;
}

.library-part {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  margin-bottom: 3px;
  border-radius: 5px;
  border-left: 2px solid transparent;
  background: #1a2236;
  cursor: grab;
  transition: background 0.15s;
  user-select: none;
}

.library-part:hover {
  background: #223048;
}

.library-part:active {
  cursor: grabbing;
}

.library-part--glow {
  animation: glow-pulse 1.5s ease-out;
}

@keyframes glow-pulse {
  0% { box-shadow: 0 0 0px #6366f1; background: #312e81; }
  30% { box-shadow: 0 0 12px 2px #818cf8; background: #312e81; }
  100% { box-shadow: 0 0 0px transparent; }
}

.drag-icon {
  color: #374151;
  flex-shrink: 0;
}

.library-part__label {
  font-size: 0.8rem;
  color: #d1d5db;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.library-part__tag {
  font-size: 0.68rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.parts-empty {
  font-size: 0.75rem;
  color: #374151;
  padding: 8px 12px;
  text-align: center;
}

.parts-empty--clickable {
  cursor: pointer;
  border: 1px dashed #374151;
  border-radius: 6px;
  margin: 4px;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.parts-empty--clickable:hover {
  background: #1f2937;
  color: #d1d5db;
  border-color: #4b5563;
}

/* ランダマイザパーツ */
.library-part--randomizer {
  background: #1a1a2e;
  border-left-width: 2px;
  border-style: dashed;
  border-color: #374151;
  border-left-style: solid;
}

.library-part--randomizer:hover {
  background: #252540;
}

.randomizer-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.library-part__tag--randomizer {
  font-size: 0.6rem;
  font-weight: 700;
  color: #a78bfa;
  background: #2e1065;
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.05em;
}
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    min-width: 0;
    border-right: none;
  }
}
</style>
