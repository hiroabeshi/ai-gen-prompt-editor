<template>
  <div class="manual-tab">
    <label class="field-label">カテゴリ <span class="required">*</span></label>
    <select v-model="form.categoryId" class="field-input">
      <option value="" disabled>カテゴリを選択...</option>
      <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">
        {{ cat.name }}
      </option>
    </select>

    <label class="field-label mt">表示ラベル名 <span class="required">*</span></label>
    <AutocompleteInput
      v-model="form.label"
      placeholder="例: 金髪ロング"
      :search-fn="suggestByLabel"
      @select="onSuggestSelect"
    />

    <label class="field-label mt">Anima タグ <span class="required">*</span></label>
    <AutocompleteInput
      v-model="form.anima"
      placeholder="例: blonde hair, long hair"
      :search-fn="suggestByTag"
      @select="onSuggestSelect"
    />

    <p v-if="error" class="error-msg">{{ error }}</p>

    <div class="tab-footer">
      <button class="btn-ghost" @click="$emit('close')">キャンセル</button>
      <button class="btn-primary" @click="submit">追加する</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { usePromptStore } from '../store/promptStore'
import AutocompleteInput from './AutocompleteInput.vue'
import { suggestByLabel, suggestByTag, dictCategories, normalizeTagForAnima, type DictEntry } from '../utils/dictionaryService'

const props = defineProps<{
  initialCategoryId?: string
}>()

const emit = defineEmits<{
  close: []
  added: []
}>()

const store = usePromptStore()
const error = ref('')

const form = reactive({
  categoryId: props.initialCategoryId || (store.categories[0]?.id ?? ''),
  label: '',
  anima: '',
})

function onSuggestSelect(entry: DictEntry): void {
  form.label = entry.label
  // アンダースコア除去と `()[]:` エスケープをまとめて適用する。
  form.anima = normalizeTagForAnima(entry.tag)

  // 辞書カテゴリとアプリカテゴリの名前一致チェック
  const dictCatName = dictCategories[entry.categoryIndex]
  const matchingCat = store.categories.find(c => c.name === dictCatName)
  if (matchingCat) {
    form.categoryId = matchingCat.id
  }
}

function submit(): void {
  if (!form.categoryId) { error.value = 'カテゴリを選択してください。'; return }
  if (!form.label.trim()) { error.value = 'ラベル名を入力してください。'; return }
  if (!form.anima.trim()) { error.value = 'Anima タグを入力してください。'; return }
  store.addPart(form.categoryId, form.label.trim(), form.anima.trim())
  emit('added')
  emit('close')
}
</script>

<style scoped>
.manual-tab {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 4px; /* for scrollbar */
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

.error-msg { font-size: 0.75rem; color: #f87171; margin: 8px 0 0; }

.tab-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid #1f2937;
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
