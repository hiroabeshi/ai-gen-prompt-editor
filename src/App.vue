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
          <span class="hide-on-mobile">使い方</span>
        </button>

        <a
          href="https://novelai.net/image"
          target="_blank"
          rel="noopener"
          class="header-link hide-on-mobile"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
          NovelAI を開く
        </a>

        <button class="header-btn hide-on-mobile" title="AIからプロンプト構成を取り込む" @click="showAIImport = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
          AIインポート
        </button>

        <!-- ＋モバイル用ドロップダウン -->
        <div class="mobile-menu-container" v-if="isMobile">
          <button class="header-btn" title="その他" @click="showMobileMenu = !showMobileMenu">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
          
          <div v-if="showMobileMenu" class="mobile-dropdown-overlay" @click="showMobileMenu = false"></div>
          <div v-if="showMobileMenu" class="mobile-dropdown">
            <a
              href="https://novelai.net/image"
              target="_blank"
              rel="noopener"
              class="mobile-dropdown-item"
              @click="showMobileMenu = false"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="margin-right:6px"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
              NovelAI を開く
            </a>
            <button class="mobile-dropdown-item" @click="showAIImport = true; showMobileMenu = false">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right:6px"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
              AIインポート
            </button>
          </div>
        </div>

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

    <!-- ─── ボディ (2カラム / スマホ時はタブ切替) ─── -->
    <div class="app-body">
      <!-- 左: パーツ倉庫 -->
      <CategoryList
        v-show="!isMobile || mobileTab === 'warehouse'"
        ref="categoryListRef"
        @open-add-part="openAddPartModal"
        @open-add-category="openAddCategoryModal"
        @select-master="onSelectMaster"
        @select-category="onSelectCategory"
      />

      <!-- センター: スロット一覧 (縦スクロール) -->
      <main v-show="!isMobile || mobileTab === 'slots'" class="main-area">
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
            @open-add-part="openAddPartToSlotModal"
          />

          <!-- スロット追加ボタン -->
          <button class="add-slot-btn" @click="showAddSlot = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            新しいスロットを追加
          </button>
        </div>
      </main>
    </div>

    <!-- モバイル用タブバー -->
    <nav v-if="isMobile" class="mobile-nav">
      <button 
        class="mobile-nav-btn" 
        :class="{ 'mobile-nav-btn--active': mobileTab === 'warehouse' }"
        @click="mobileTab = 'warehouse'"
      >
        <span class="mobile-nav-icon">📦</span>
        倉庫
      </button>
      <button 
        class="mobile-nav-btn" 
        :class="{ 'mobile-nav-btn--active': mobileTab === 'slots' }"
        @click="mobileTab = 'slots'"
      >
        <span class="mobile-nav-icon">🎛️</span>
        スロット
      </button>
    </nav>

    <!-- モーダル群 -->
    <AddPartModal
      v-if="showAddPart"
      :initial-category-id="addPartCategoryId"
      @close="closeAddPartModal"
      @added="() => {}"
    />
    <AddSlotModal v-if="showAddSlot" @close="showAddSlot = false" @added="() => {}" />
    <AddCategoryModal v-if="showAddCategory" @close="showAddCategory = false" @added="() => {}" />
    <AddPartToSlotModal
      v-if="showAddPartToSlot"
      :slot-id="addPartToSlotTargetId!"
      @close="showAddPartToSlot = false"
      @added="showToast('スロットにパーツを追加しました！')"
    />
    <GuideModal v-if="showGuide" @close="showGuide = false" />
    <AIImportModal v-if="showAIImport" @close="showAIImport = false" @imported="onAIImportSuccess" />
    <EditCategoryModal v-if="showEditCategory" :category-id="selectedCategoryId!" :x="modalX" :y="modalY" @close="closeEditCategory" @deleted="clearSelection" />
    <EditMasterPartModal 
      v-if="showEditMasterPart" 
      :part-id="selectedMasterPartId!" 
      :x="modalX" :y="modalY" 
      @close="closeEditMasterPart" 
      @deleted="clearSelection" 
      @added-to-slot="showToast('スロットにパーツを追加しました！')" 
    />
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePromptStore } from './store/promptStore'
import { exportToJSON, importFromJSON } from './utils/dataIO'
import CategoryList from './components/CategoryList.vue'
import PromptSlot from './components/PromptSlot.vue'
import PartEditor from './components/PartEditor.vue'
import AddPartModal from './components/AddPartModal.vue'
import AddSlotModal from './components/AddSlotModal.vue'
import AddCategoryModal from './components/AddCategoryModal.vue'
import AddPartToSlotModal from './components/AddPartToSlotModal.vue'
import GuideModal from './components/GuideModal.vue'
import EditCategoryModal from './components/EditCategoryModal.vue'
import EditMasterPartModal from './components/EditMasterPartModal.vue'
import AIImportModal from './components/AIImportModal.vue'
import type { SelectedPart } from './types'

const store = usePromptStore()

const categoryListRef = ref<InstanceType<typeof CategoryList> | null>(null)

// ─── モバイル対応 ────────────────────────────────────────────
const isMobile = ref(false)
const mobileTab = ref<'warehouse' | 'slots'>('slots')
const showMobileMenu = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// ─── モーダル制御 ────────────────────────────────────────────
const showAddPart = ref(false)
const showAddSlot = ref(false)
const showAddCategory = ref(false)
const showAddPartToSlot = ref(false)
const addPartToSlotTargetId = ref<string | null>(null)
const showGuide = ref(false)
const showAIImport = ref(false)
const addPartCategoryId = ref<string | undefined>(undefined)

function openAddCategoryModal(): void {
  showAddCategory.value = true
}

function openAddPartModal(categoryId?: string): void {
  addPartCategoryId.value = categoryId
  showAddPart.value = true
}

function openAddPartToSlotModal(slotId: string): void {
  addPartToSlotTargetId.value = slotId
  showAddPartToSlot.value = true
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
  const result = exportToJSON(store.getFullState())
  if (result.isIOS) {
    showToast('iOSの場合は、開いた別タブで長押しをして保存してください', 5000)
  }
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
function onAIImportSuccess(msg: string): void {
  showAIImport.value = false
  showToast(msg, 5000)
}

// ─── トースト通知 ─────────────────────────────────────────────
const toastMsg = ref('')
const errorMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout>

function showToast(msg: string, duration: number = 2500): void {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, duration)
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

@media (max-width: 768px) {
  .app-header__title {
    display: none; /* スマホではタイトルを隠す */
  }
  
  .hide-on-mobile {
    display: none !important;
  }
  
  .header-btn {
    padding: 6px 8px;
    font-size: 0.75rem;
  }
  
  .header-link {
    padding: 6px 8px;
    font-size: 0.75rem;
  }

  .slots-container {
    padding-bottom: 80px; /* タブバーの高さ分 */
  }
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

/* ─── モバイルナビ ─── */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #0c0e1a;
  border-top: 1px solid #1f2937;
  display: flex;
  z-index: 500;
}

.mobile-nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 0.7rem;
  font-weight: 600;
  gap: 4px;
  cursor: pointer;
  transition: color 0.15s;
}

.mobile-nav-icon {
  font-size: 1.2rem;
}

.mobile-nav-btn--active {
  color: #a5b4fc;
}

/* ─── モバイル ヘッダードロップダウン ─── */
.mobile-menu-container {
  position: relative;
}

.mobile-dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 1500;
}

.mobile-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: auto;
  margin-top: 12px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  padding: 6px;
  z-index: 2000;
  min-width: 180px;
  max-width: calc(100vw - 32px);
}

.mobile-dropdown-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  color: #e5e7eb;
  font-size: 0.85rem;
  text-decoration: none;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
}

.mobile-dropdown-item:hover:not(:disabled) {
  background: #1f2937;
}

.mobile-dropdown-item:disabled {
  color: #6b7280;
  cursor: not-allowed;
}
</style>
