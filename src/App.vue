<template>
  <div class="app-layout">
    <!-- ─── ヘッダー ─── -->
    <header class="app-header">
      <div class="app-header__brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#6366f1">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span class="app-header__title">NovelAI プロンプト管理</span>
      </div>

      <nav class="app-header__nav">
        <button class="header-btn" title="使い方を見る" @click="showGuide = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
          使い方
        </button>

        <a
          href="https://novelai.net/image"
          target="_blank"
          rel="noopener"
          class="header-link"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
          NovelAI を開く
        </a>

        <button class="header-btn" title="未実装…" disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
          AIインポート
        </button>
        <input ref="aiImportInput" type="file" accept=".json" hidden @change="onAIImport" />

        <button class="header-btn header-btn--green" title="JSONを読み込む" @click="triggerImport">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zm0-10h4v6h6v-6h4l-7-7-7 7z"/></svg>
          JSON を読み込む
        </button>
        <input ref="importInput" type="file" accept=".json" hidden @change="onImport" />

        <button class="header-btn header-btn--accent" title="JSONを保存する" @click="onExport">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zm14-9h-4V3H9v8H5l7 7 7-7z"/></svg>
          JSON を保存する
        </button>
      </nav>
    </header>

    <!-- ─── ボディ (2カラム) ─── -->
    <div class="app-body">
      <!-- 左: パーツ倉庫 -->
      <CategoryList
        ref="categoryListRef"
        @open-add-part="openAddPartModal"
        @open-add-category="openAddCategoryModal"
        @select-master="onSelectMaster"
        @select-category="onSelectCategory"
      />

      <!-- センター: スロット一覧 (縦スクロール) -->
      <main class="main-area">
        <div class="slots-container">
          <PromptSlot
            v-for="slot in store.slots"
            :key="slot.id + '_' + store.loadCount"
            :slot="slot"
            :selected-instance-id="selectedInstanceId"
            @delete="store.deleteSlot(slot.id)"
            @duplicate="store.duplicateSlot(slot.id)"
            @select-part="onSelectSlotPart"
            @edit-slot="onEditSlot"
            @copied="showToast('プロンプトをコピーしました！')"
          />

          <!-- スロット追加ボタン -->
          <button class="add-slot-btn" @click="showAddSlot = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            新しいスロットを追加
          </button>
        </div>
      </main>
    </div>

    <!-- モーダル群 -->
    <AddPartModal
      v-if="showAddPart"
      :initial-category-id="addPartCategoryId"
      @close="closeAddPartModal"
      @added="() => {}"
    />
    <AddSlotModal v-if="showAddSlot" @close="showAddSlot = false" @added="() => {}" />
    <AddCategoryModal v-if="showAddCategory" @close="showAddCategory = false" @added="() => {}" />
    <GuideModal v-if="showGuide" @close="showGuide = false" />
    <EditCategoryModal v-if="showEditCategory" :category-id="selectedCategoryId!" :x="modalX" :y="modalY" @close="closeEditCategory" @deleted="clearSelection" />
    <EditMasterPartModal v-if="showEditMasterPart" :part-id="selectedMasterPartId!" :x="modalX" :y="modalY" @close="closeEditMasterPart" @deleted="clearSelection" />
    <PartEditor
      v-if="showPartEditor && editorMode"
      :mode="editorMode"
      :instance-part="selectedInstance"
      :slot-id="selectedSlotId"
      :slot="selectedSlot"
      :x="modalX"
      :y="modalY"
      @close="clearSelection"
      @remove-from-slot="removeSelectedFromSlot"
      @deleted="clearSelection"
    />

    <!-- AIインポート: 重複カテゴリ確認ダイアログ -->
    <div v-if="aiConflictQueue.length > 0" class="modal-overlay" @click.self="resolveAllConflicts('add')">
      <div class="confirm-dialog">
        <div class="confirm-dialog__header">AIインポート: カテゴリ名の重複</div>
        <div class="confirm-dialog__body">
          <p>既存のカテゴリ <strong>「{{ aiConflictQueue[0] }}」</strong> と名前が重複しています。</p>
          <p class="sub-text">どちらを選択しますか？</p>
        </div>
        <div class="confirm-dialog__footer">
          <button class="btn-primary" @click="resolveConflict('merge')">既存にマージ（パーツを追加）</button>
          <button class="btn-ghost" @click="resolveConflict('add')">別名で新規追加</button>
        </div>
      </div>
    </div>

    <!-- トースト通知 -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>

    <!-- エラー通知 -->
    <Transition name="toast">
      <div v-if="errorMsg" class="toast toast--error">{{ errorMsg }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePromptStore } from './store/promptStore'
import { exportToJSON, importFromJSON } from './utils/dataIO'
import { parseAIImportFile, mergeAIImport, AI_IMPORT_SCHEMA_VERSION } from './utils/aiImport'
import CategoryList from './components/CategoryList.vue'
import PromptSlot from './components/PromptSlot.vue'
import PartEditor from './components/PartEditor.vue'
import AddPartModal from './components/AddPartModal.vue'
import AddSlotModal from './components/AddSlotModal.vue'
import AddCategoryModal from './components/AddCategoryModal.vue'
import GuideModal from './components/GuideModal.vue'
import EditCategoryModal from './components/EditCategoryModal.vue'
import EditMasterPartModal from './components/EditMasterPartModal.vue'
import type { SelectedPart, AIImportData } from './types'

const store = usePromptStore()

const categoryListRef = ref<InstanceType<typeof CategoryList> | null>(null)

// ─── モーダル制御 ────────────────────────────────────────────
const showAddPart = ref(false)
const showAddSlot = ref(false)
const showAddCategory = ref(false)
const showGuide = ref(false)
const addPartCategoryId = ref<string | undefined>(undefined)

function openAddCategoryModal(): void {
  showAddCategory.value = true
}

function openAddPartModal(categoryId?: string): void {
  addPartCategoryId.value = categoryId
  showAddPart.value = true
}

function closeAddPartModal(): void {
  showAddPart.value = false
  addPartCategoryId.value = undefined
}

const showEditCategory = ref(false)
const showEditMasterPart = ref(false)
const modalX = ref(0)
const modalY = ref(0)

// ─── パーツ選択・エディタ ─────────────────────────────────────
type EditorMode = 'slot' | 'slot-info' | null

const editorMode = ref<EditorMode>(null)
const showPartEditor = ref(false)
const selectedMasterPartId = ref<string | null>(null)
const selectedInstance = ref<SelectedPart | null>(null)
const selectedSlotId = ref<string | null>(null)
const selectedCategoryId = ref<string | null>(null)
const selectedInstanceId = computed(() => selectedInstance.value?.id ?? null)



const selectedSlot = computed(() => {
  return store.slots.find(s => s.id === selectedSlotId.value) ?? null
})

function onSelectCategory(categoryId: string, event: MouseEvent): void {
  selectedCategoryId.value = categoryId
  modalX.value = event.clientX
  modalY.value = event.clientY
  showEditCategory.value = true
}

function closeEditCategory(): void {
  showEditCategory.value = false
  selectedCategoryId.value = null
}

function onSelectMaster(partId: string, event: MouseEvent): void {
  selectedMasterPartId.value = partId
  modalX.value = event.clientX
  modalY.value = event.clientY
  showEditMasterPart.value = true
}

function closeEditMasterPart(): void {
  showEditMasterPart.value = false
  selectedMasterPartId.value = null
}

function onSelectSlotPart(slotId: string, instanceId: string, event: MouseEvent): void {
  const slot = store.slots.find(s => s.id === slotId)
  const inst = slot?.parts.find(p => p.id === instanceId)
  if (!inst) return

  const alreadySelected = selectedInstance.value?.id === instanceId

  editorMode.value = 'slot'
  selectedSlotId.value = slotId
  selectedInstance.value = inst
  selectedMasterPartId.value = null
  selectedCategoryId.value = null

  // 2回目クリック（既に選択済み）でポップアップを開く
  if (alreadySelected) {
    modalX.value = event.clientX
    modalY.value = event.clientY
    showPartEditor.value = true
  } else {
    showPartEditor.value = false
  }

  // Target part focus in CategoryList
  categoryListRef.value?.focusPart(inst.partId)
}

function onEditSlot(slotId: string, event: MouseEvent): void {
  editorMode.value = 'slot-info'
  selectedSlotId.value = slotId
  selectedInstance.value = null
  selectedMasterPartId.value = null
  selectedCategoryId.value = null
  modalX.value = event.clientX
  modalY.value = event.clientY
  showPartEditor.value = true
}

function clearSelection(): void {
  editorMode.value = null
  showPartEditor.value = false
  selectedMasterPartId.value = null
  selectedInstance.value = null
  selectedSlotId.value = null
  selectedCategoryId.value = null
}

function removeSelectedFromSlot(): void {
  if (!selectedSlotId.value || !selectedInstance.value) return
  store.removePartFromSlot(selectedSlotId.value, selectedInstance.value.id)
  clearSelection()
}

// ─── JSON エクスポート / インポート ──────────────────────────
const importInput = ref<HTMLInputElement>()

function onExport(): void {
  exportToJSON(store.getFullState())
}

function triggerImport(): void {
  importInput.value?.click()
}

async function onImport(e: Event): Promise<void> {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    if (target) target.value = ''
    return
  }
  try {
    const state = await importFromJSON(file)
    store.initFromData(state)
    clearSelection()
    showToast('データを読み込みました！')
  } catch (err) {
    showError(String(err))
  } finally {
    target.value = ''
  }
}

// ─── AI インポート ────────────────────────────────────────────
const aiImportInput = ref<HTMLInputElement>()
const aiImportData = ref<AIImportData | null>(null)
const aiConflictQueue = ref<string[]>([])
const aiConflictResolutions = ref<Map<string, 'merge' | 'add'>>(new Map())

// TODO: AI機能の本格実装時に有効化する
// function triggerAIImport(): void {
//   aiImportInput.value?.click()
// }

async function onAIImport(e: Event): Promise<void> {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    if (target) target.value = ''
    return
  }
  try {
    const data = await parseAIImportFile(file)
    if (data.schemaVersion !== AI_IMPORT_SCHEMA_VERSION) {
      showError(`スキーマバージョンが一致しません: ${data.schemaVersion}`)
      return
    }
    aiImportData.value = data

    // 重複チェック
    const conflicts = data.categories
      .filter(c => store.categories.some(ec => ec.name === c.name))
      .map(c => c.name)

    if (conflicts.length > 0) {
      aiConflictQueue.value = [...new Set(conflicts)]
      aiConflictResolutions.value = new Map()
    } else {
      doAIImport()
    }
  } catch (err) {
    showError(String(err))
  } finally {
    target.value = ''
  }
}

function resolveConflict(decision: 'merge' | 'add'): void {
  const catName = aiConflictQueue.value[0]
  aiConflictResolutions.value.set(catName, decision)
  aiConflictQueue.value.shift()
  if (aiConflictQueue.value.length === 0) {
    doAIImport()
  }
}

function resolveAllConflicts(decision: 'merge' | 'add'): void {
  for (const name of aiConflictQueue.value) {
    aiConflictResolutions.value.set(name, decision)
  }
  aiConflictQueue.value = []
  doAIImport()
}

function doAIImport(): void {
  if (!aiImportData.value) return
  const { newCategories, newParts } = mergeAIImport(
    aiImportData.value,
    store.categories,
    store.library,
    (name) => aiConflictResolutions.value.get(name) ?? 'add',
  )
  store.mergeAIImportResult(newCategories, newParts)
  showToast(`AIインポート完了: カテゴリ ${newCategories.length}個, パーツ ${newParts.length}個 追加`)
  aiImportData.value = null
  aiConflictResolutions.value = new Map()
}

// ─── トースト通知 ─────────────────────────────────────────────
const toastMsg = ref('')
const errorMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout>

function showToast(msg: string): void {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2500)
}

function showError(msg: string): void {
  errorMsg.value = msg
  setTimeout(() => { errorMsg.value = '' }, 4000)
}
</script>

<style>
/* ─── グローバルリセット ─── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #app { height: 100%; overflow: hidden; }
body {
  font-family: 'Inter', 'Noto Sans JP', 'Segoe UI', sans-serif;
  background: #030712;
  color: #e5e7eb;
}

/* Toast animation */
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(16px); }
</style>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ─── ヘッダー ─── */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 50px;
  background: #0c0e1a;
  border-bottom: 1px solid #1f2937;
  flex-shrink: 0;
  gap: 16px;
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-header__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #e5e7eb;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-link {
  display: flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  color: #a5b4fc;
  font-size: 0.78rem;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #312e81;
  transition: background 0.15s;
}

.header-link:hover {
  background: #1e1b4b;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid #374151;
  color: #9ca3af;
  font-size: 0.78rem;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.header-btn:hover:not(:disabled) {
  background: #1f2937;
  color: #e5e7eb;
}

.header-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-btn--green {
  border-color: #064e3b;
  color: #6ee7b7;
}

.header-btn--green:hover {
  background: #022c22;
  color: #86efac;
}

.header-btn--accent {
  border-color: #92400e;
  color: #fcd34d;
}

.header-btn--accent:hover {
  background: #451a03;
  color: #fef08a;
}

/* ─── ボディ ─── */
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ─── メインエリア ─── */
.main-area {
  flex: 1;
  overflow-y: auto;
  background: #030712;
  padding: 16px;
}

.slots-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 720px;
  margin: 0 auto;
}

.add-slot-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: transparent;
  border: 1.5px dashed #1f2937;
  border-radius: 10px;
  color: #4b5563;
  font-size: 0.82rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.add-slot-btn:hover {
  border-color: #6366f1;
  color: #a5b4fc;
  background: #111827;
}

/* ─── 重複確認ダイアログ ─── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 12px;
  width: 420px;
  max-width: 95vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: modal-in 0.15s ease-out;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

.confirm-dialog__header {
  font-size: 0.9rem;
  font-weight: 700;
  color: #f59e0b;
  padding: 14px 16px;
  border-bottom: 1px solid #1f2937;
}

.confirm-dialog__body {
  padding: 16px;
  font-size: 0.85rem;
  color: #d1d5db;
  line-height: 1.6;
}

.sub-text {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 8px;
}

.confirm-dialog__footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #1f2937;
  flex-direction: column;
}

.btn-primary {
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 9px 16px;
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
  padding: 9px 16px;
  font-size: 0.82rem;
  cursor: pointer;
  text-align: center;
}

.btn-ghost:hover { background: #1f2937; }

/* ─── トースト ─── */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  border: 1px solid #374151;
  color: #e5e7eb;
  font-size: 0.82rem;
  padding: 10px 20px;
  border-radius: 99px;
  z-index: 3000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  white-space: nowrap;
}

.toast--error {
  background: #450a0a;
  border-color: #7f1d1d;
  color: #f87171;
}
</style>
