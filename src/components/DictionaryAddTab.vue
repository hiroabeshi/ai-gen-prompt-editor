<template>
  <div class="dict-tab">
    <div class="dict-layout">
      <!-- 左ペイン: カテゴリリスト -->
      <div class="dict-categories" :class="{ 'dict-categories--expanded': isCategoryExpanded }">
        <div class="dict-categories__header" @click="toggleCategories">
          <span class="dict-categories__title">
            カテゴリ
            <span v-if="isMobileView && selectedCategoryName" class="dict-categories__selected-hint">
              : {{ selectedCategoryName }}
            </span>
          </span>
          <svg
            v-if="isMobileView"
            class="dict-categories__toggle-icon"
            :class="{ 'dict-categories__toggle-icon--active': isCategoryExpanded }"
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <ul v-if="!isMobileView || isCategoryExpanded" class="dict-categories__list">
          <li
            v-for="(catName, idx) in dictCategories"
            :key="idx"
            :class="['dict-cat-item', { 'dict-cat-item--active': selectedCatIdx === idx }]"
            @click="selectCategory(idx)"
          >
            <span class="dict-cat-item__name">{{ catName }}</span>
            <span class="dict-cat-item__count">{{ getCategoryCount(idx) }}</span>
          </li>
        </ul>
      </div>

      <!-- 右ペイン: タグ一覧 -->
      <div class="dict-tags">
        <div class="dict-tags__header">
          <span v-if="selectedCatIdx >= 0">
            {{ dictCategories[selectedCatIdx] }}
            <span class="dict-tags__total">（{{ pageResult.totalCount }}件）</span>
          </span>
          <span v-else class="dict-tags__placeholder">← カテゴリを選択</span>
        </div>

        <div v-if="selectedCatIdx >= 0" class="dict-tags__filter">
          <input
            v-model="tagQuery"
            class="field-input field-input--sm"
            placeholder="このカテゴリ内を検索..."
            @input="currentPage = 1"
          />
        </div>

        <div v-if="selectedCatIdx >= 0" class="dict-tags__body">
          <ul class="dict-tags__list">
            <li
              v-for="entry in pageResult.entries"
              :key="entry.tag"
              :class="['dict-tag-item', { 'dict-tag-item--selected': selectedEntry?.tag === entry.tag }]"
              @click="selectEntry(entry)"
            >
              <span class="dict-tag-item__label">{{ entry.label }}</span>
              <span class="dict-tag-item__tag">{{ entry.tag }}</span>
            </li>
          </ul>

          <!-- ページネーション -->
          <div v-if="pageResult.totalPages > 1" class="dict-pager">
            <button
              class="pager-btn"
              :disabled="pageResult.page <= 1"
              @click="changePage(pageResult.page - 1)"
            >◀</button>
            <span class="pager-info">{{ pageResult.page }} / {{ pageResult.totalPages }}</span>
            <button
              class="pager-btn"
              :disabled="pageResult.page >= pageResult.totalPages"
              @click="changePage(pageResult.page + 1)"
            >▶</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 下部: フォーム入力欄 -->
    <div class="dict-form">
      <div class="dict-form__row">
        <div class="dict-form__field">
          <label class="field-label">カテゴリ <span class="required">*</span></label>
          <select v-model="form.categoryId" class="field-input">
            <option value="" disabled>カテゴリを選択...</option>
            <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="dict-form__row dict-form__row--two">
        <div class="dict-form__field">
          <label class="field-label">表示ラベル名 <span class="required">*</span></label>
          <AutocompleteInput
            v-model="form.label"
            placeholder="日本語で検索..."
            :search-fn="suggestByLabel"
            @select="onSuggestSelect"
          />
        </div>
        <div class="dict-form__field">
          <label class="field-label">NovelAI タグ <span class="required">*</span></label>
          <AutocompleteInput
            v-model="form.novelai"
            placeholder="英語タグで検索..."
            :search-fn="suggestByTag"
            @select="onSuggestSelect"
          />
        </div>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div class="tab-footer">
        <button class="btn-ghost" @click="$emit('close')">キャンセル</button>
        <button class="btn-primary" @click="submit">追加する</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { usePromptStore } from '../store/promptStore'
import {
  dictCategories,
  getTagsByCategory,
  suggestByLabel,
  suggestByTag,
  type DictEntry,
  type PageResult,
} from '../utils/dictionaryService'
import AutocompleteInput from './AutocompleteInput.vue'

const props = defineProps<{
  initialCategoryId?: string
}>()

const emit = defineEmits<{
  close: []
  added: []
}>()

const store = usePromptStore()
const error = ref('')

const selectedCatIdx = ref(-1)
const currentPage = ref(1)
const selectedEntry = ref<DictEntry | null>(null)
const tagQuery = ref('')

// ─── モバイル・アコーディオン制御 ──────────────────────────
const isMobileView = ref(false)
const isCategoryExpanded = ref(false)

function checkMobile() {
  isMobileView.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const selectedCategoryName = computed(() => {
  if (selectedCatIdx.value < 0) return ''
  return dictCategories[selectedCatIdx.value]
})

function toggleCategories() {
  if (isMobileView.value) {
    isCategoryExpanded.value = !isCategoryExpanded.value
  }
}

const form = reactive({
  categoryId: props.initialCategoryId || (store.categories[0]?.id ?? ''),
  label: '',
  novelai: '',
})

// 初期カテゴリからタグ一覧を展開
if (props.initialCategoryId) {
  const initialCat = store.categories.find(c => c.id === props.initialCategoryId)
  if (initialCat) {
    const dictIdx = dictCategories.indexOf(initialCat.name)
    if (dictIdx >= 0) {
      selectedCatIdx.value = dictIdx
    }
  }
}

// ─── カテゴリ別件数キャッシュ ──────────────────────────────
const categoryCounts = computed(() => {
  const counts: number[] = []
  for (let i = 0; i < dictCategories.length; i++) {
    counts.push(getTagsByCategory(i, 1, 1).totalCount)
  }
  return counts
})

function getCategoryCount(idx: number): number {
  return categoryCounts.value[idx] ?? 0
}

// ─── ページネーション ──────────────────────────────────────
const pageResult = computed<PageResult>(() => {
  if (selectedCatIdx.value < 0) {
    return { entries: [], totalCount: 0, page: 1, pageSize: 100, totalPages: 1 }
  }
  const pageSize = isMobileView.value ? 30 : 100
  return getTagsByCategory(selectedCatIdx.value, currentPage.value, pageSize, tagQuery.value)
})

function selectCategory(idx: number): void {
  selectedCatIdx.value = idx
  currentPage.value = 1
  selectedEntry.value = null
  tagQuery.value = ''
  
  if (isMobileView.value) {
    isCategoryExpanded.value = false
  }
}

function changePage(page: number): void {
  currentPage.value = page
}

// ─── タグ選択 ──────────────────────────────────────────────
function selectEntry(entry: DictEntry): void {
  selectedEntry.value = entry
  applyEntry(entry)
}

function onSuggestSelect(entry: DictEntry): void {
  selectedEntry.value = entry
  applyEntry(entry)
}

function applyEntry(entry: DictEntry): void {
  form.label = entry.label
  form.novelai = entry.tag

  // 辞書カテゴリとアプリカテゴリの名前一致チェック
  const dictCatName = dictCategories[entry.categoryIndex]
  const matchingCat = store.categories.find(c => c.name === dictCatName)
  if (matchingCat) {
    form.categoryId = matchingCat.id
  }
}

// ─── 送信 ──────────────────────────────────────────────────
function submit(): void {
  if (!form.categoryId) { error.value = 'カテゴリを選択してください。'; return }
  if (!form.label.trim()) { error.value = 'ラベル名を入力してください。'; return }
  if (!form.novelai.trim()) { error.value = 'NovelAI タグを入力してください。'; return }
  error.value = ''
  store.addPart(form.categoryId, form.label.trim(), form.novelai.trim())
  emit('added')
  emit('close')
}
</script>

<style scoped>
.dict-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* ─── 上部: 2カラムレイアウト ─── */
.dict-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  border: 1px solid #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

/* 左ペイン: カテゴリ */
.dict-categories {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid #1f2937;
  display: flex;
  flex-direction: column;
  background: #0d1117;
}

.dict-categories__header {
  font-size: 0.72rem;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 12px;
  border-bottom: 1px solid #1f2937;
}

.dict-categories__list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.dict-cat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 12px;
  cursor: pointer;
  font-size: 0.78rem;
  color: #9ca3af;
  transition: background 0.1s, color 0.1s;
  border-bottom: 1px solid transparent;
  min-width: 0; /* 子供の省略を有効にする */
}

.dict-cat-item:hover {
  background: #1f2937;
  color: #e5e7eb;
}

.dict-cat-item--active {
  background: #1e1b4b;
  color: #a5b4fc;
  border-left: 3px solid #6366f1;
}

.dict-cat-item__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dict-cat-item__count {
  font-size: 0.68rem;
  color: #4b5563;
  flex-shrink: 0;
  margin-left: 4px;
}

/* モバイル向けスタイル調整 */
@media (max-width: 768px) {
  .dict-layout {
    flex-direction: column;
  }

  .dict-categories {
    width: 100% !important;
    border-right: none;
    border-bottom: 1px solid #1f2937;
  }

  .dict-categories__header {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    background: #111827;
    user-select: none;
    min-width: 0;
    border-bottom: 1px solid #1f2937;
  }

  .dict-categories__title {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dict-categories__header:hover {
    background: #1f2937;
  }

  .dict-categories__selected-hint {
    color: #6366f1;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dict-categories__toggle-icon {
    transition: transform 0.2s ease;
    color: #4b5563;
  }

  .dict-categories__toggle-icon--active {
    transform: rotate(180deg);
    color: #6366f1;
  }

  .dict-categories__list {
    max-height: 160px; /* カテゴリはスクロール可能に */
    border-top: 1px solid #1f2937;
    display: block;
    overflow-y: auto;
  }

  .dict-tags__header {
    display: none;
  }

  .dict-tags {
    min-height: 150px;
  }

  .dict-tab {
    height: 100%;
    overflow: hidden;
  }

  .dict-layout {
    overflow: hidden;
    border: 1px solid #1f2937;
    border-radius: 8px;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .dict-tags__list {
    max-height: 280px; /* タグリストもスクロール可能に */
    overflow-y: auto;
  }
}

/* 右ペイン: タグ一覧 */
.dict-tags {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dict-tags__header {
  font-size: 0.78rem;
  font-weight: 600;
  color: #e5e7eb;
  padding: 10px 12px;
  border-bottom: 1px solid #1f2937;
  background: #0d1117;
}

.dict-tags__total {
  color: #6b7280;
  font-weight: 400;
}

.dict-tags__placeholder {
  color: #4b5563;
  font-style: italic;
}

.dict-tags__filter {
  padding: 8px 12px;
  border-bottom: 1px solid #1f2937;
  background: #0d1117;
}

.field-input--sm {
  padding: 5px 8px;
  font-size: 0.75rem;
  border-radius: 4px;
}

.dict-tags__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.dict-tags__list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
}

.dict-tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.78rem;
  transition: background 0.1s;
  border-bottom: 1px solid #111827;
}

.dict-tag-item:hover {
  background: #1f2937;
}

.dict-tag-item--selected {
  background: #1e1b4b;
  border-left: 3px solid #6366f1;
}

.dict-tag-item__label {
  color: #e5e7eb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dict-tag-item__tag {
  color: #6b7280;
  font-size: 0.72rem;
  margin-left: 8px;
  flex-shrink: 0;
  font-family: monospace;
}

/* ページネーション */
.dict-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px;
  border-top: 1px solid #1f2937;
  background: #0d1117;
}

.pager-btn {
  background: #1f2937;
  border: 1px solid #374151;
  color: #9ca3af;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background 0.15s, color 0.15s;
}

.pager-btn:hover:not(:disabled) {
  background: #374151;
  color: #e5e7eb;
}

.pager-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pager-info {
  font-size: 0.75rem;
  color: #6b7280;
}

/* ─── 下部: フォーム ─── */
.dict-form {
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid #1f2937;
}

.dict-form__row {
  margin-bottom: 10px;
}

.dict-form__row--two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dict-form__field {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 4px;
}

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

.error-msg { font-size: 0.75rem; color: #f87171; margin: 8px 0 0; }

.tab-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

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
