<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content png-import-modal">
      <div class="modal-header">
        <h2 class="modal-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: text-bottom; margin-right: 4px;">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          PNG画像インポート
        </h2>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <p class="intro-text">
          NovelAI等で生成されたPNG画像をドロップして、プロンプトを抽出します。
        </p>

        <!-- ドロップエリア -->
        <div 
          class="drop-zone" 
          :class="{ 'drop-zone--active': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileSelect"
        >
          <input 
            type="file" 
            ref="fileInput" 
            accept="image/png" 
            hidden 
            @change="handleFileSelect"
          />
          <div class="drop-zone__content">
            <template v-if="!isLoading">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="color: #6366f1; margin-bottom: 12px;">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
              <p>画像をここにドラッグ＆ドロップ</p>
              <span class="sub-text">またはファイルを選択</span>
            </template>
            <template v-else>
              <div class="loader"></div>
              <p>解析中...</p>
            </template>
          </div>
        </div>

        <!-- エラー表示 -->
        <div v-if="errorMsg" class="error-msg">
          {{ errorMsg }}
        </div>

        <!-- プレビューエリア -->
        <div v-if="metadata" class="preview-section">
          <h3 class="section-title">抽出プロンプトのプレビュー</h3>
          
          <div class="preview-layout">
            <div class="preview-image-container">
              <img v-if="imageUrl" :src="imageUrl" class="preview-image" />
              <div v-else class="preview-image-placeholder">No Image</div>
            </div>
            
            <div class="preview-content">
              <!-- メイン -->
              <div v-if="metadata.main.length" class="tag-group">
                <span class="tag-group-label">メインプロンプト</span>
                <div class="tag-list">
                  <span 
                    v-for="(tag, i) in metadata.main" 
                    :key="i" 
                    class="tag-item"
                    :class="{ 'tag-item--unregistered': !tag.isKnown }"
                    :title="tag.isKnown ? `${tag.category}: ${tag.label}` : '未登録タグ'"
                  >
                    {{ tag.isKnown ? tag.label : tag.original }}
                    <button @click="removeTag('main', i)">×</button>
                  </span>
                </div>
              </div>

              <!-- メインネガティブ -->
              <div v-if="metadata.mainNegative.length" class="tag-group">
                <span class="tag-group-label">メインプロンプトのネガティブ</span>
                <div class="tag-list">
                  <span 
                    v-for="(tag, i) in metadata.mainNegative" 
                    :key="i" 
                    class="tag-item tag-item--negative"
                    :class="{ 'tag-item--unregistered': !tag.isKnown }"
                  >
                    {{ tag.isKnown ? tag.label : tag.original }}
                    <button @click="removeTag('mainNegative', i)">×</button>
                  </span>
                </div>
              </div>

              <!-- キャラクター -->
              <template v-for="(char, ci) in metadata.characters" :key="'char-group-' + ci">
                <!-- キャラクタータグ -->
                <div v-if="char.tags.length" class="tag-group">
                  <span class="tag-group-label">キャラクター {{ char.characterIndex }}</span>
                  <div class="tag-list">
                    <span 
                      v-for="(tag, i) in char.tags" 
                      :key="i" 
                      class="tag-item tag-item--char"
                      :class="{ 'tag-item--unregistered': !tag.isKnown }"
                    >
                      {{ tag.isKnown ? tag.label : tag.original }}
                      <button @click="removeCharacterTag(ci, i)">×</button>
                    </span>
                  </div>
                </div>

                <!-- キャラクターネガティブ -->
                <div v-if="char.negativeTags.length" class="tag-group">
                  <span class="tag-group-label">キャラクター {{ char.characterIndex }} (ネガティブ)</span>
                  <div class="tag-list">
                    <span 
                      v-for="(tag, i) in char.negativeTags" 
                      :key="i" 
                      class="tag-item tag-item--negative"
                      :class="{ 'tag-item--unregistered': !tag.isKnown }"
                    >
                      {{ tag.isKnown ? tag.label : tag.original }}
                      <button @click="removeCharacterNegativeTag(ci, i)">×</button>
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-ghost" @click="$emit('close')">キャンセル</button>
        <button class="btn-primary" :disabled="!metadata" @click="handleImport">
          インポートを実行
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { extractPNGMetadata } from '../utils/pngMetadata'
import type { PNGMetadata } from '../utils/pngMetadata'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported', msg: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')
const metadata = ref<PNGMetadata | null>(null)
const imageUrl = ref<string | null>(null)

function triggerFileSelect() {
  fileInput.value?.click()
}

async function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await processFile(file)
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) await processFile(file)
}

async function processFile(file: File) {
  if (file.type !== 'image/png') {
    errorMsg.value = 'PNG画像を選択してください。'
    return
  }

  errorMsg.value = ''
  isLoading.value = true
  metadata.value = null
  
  // URLのクリーンアップ
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  imageUrl.value = URL.createObjectURL(file)

  try {
    const data = await extractPNGMetadata(file)
    if (data) {
      metadata.value = data
    } else {
      errorMsg.value = '作品情報（メタデータ）が見つかりませんでした。'
    }
  } catch (e: any) {
    errorMsg.value = `エラー: ${e.message}`
  } finally {
    isLoading.value = false
  }
}

function removeTag(type: 'main' | 'mainNegative', index: number) {
  if (!metadata.value) return
  metadata.value[type].splice(index, 1)
}

function removeCharacterTag(charIndex: number, tagIndex: number) {
  if (!metadata.value) return
  metadata.value.characters[charIndex].tags.splice(tagIndex, 1)
}

function removeCharacterNegativeTag(charIndex: number, tagIndex: number) {
  if (!metadata.value) return
  metadata.value.characters[charIndex].negativeTags.splice(tagIndex, 1)
}

function handleImport() {
  // TODO: Implement actual store import logic (Next Step)
  console.log('Final data to import:', metadata.value)
  alert('インポート処理の実装はまだ完了していません。')
}

onUnmounted(() => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
})
</script>

<style scoped>
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

.modal-content.png-import-modal {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 12px;
  width: 900px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #1f2937;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #e5e7eb;
  display: flex;
  align-items: center;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #d1d5db;
}

.intro-text {
  font-size: 0.95rem;
  color: #9ca3af;
  line-height: 1.6;
  margin: 0;
}

.error-msg {
  background: #450a0a;
  color: #fca5a5;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #7f1d1d;
  font-size: 0.9rem;
}

/* ドロップエリア */
.drop-zone {
  border: 2px dashed #4b5563;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  background: #1f2937;
  transition: all 0.2s;
  cursor: pointer;
}

.drop-zone--active {
  border-color: #6366f1;
  background: #1e1b4b;
}

.drop-zone:hover {
  border-color: #6366f1;
}

.drop-zone__content p {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 4px;
}

.drop-zone__content .sub-text {
  font-size: 0.85rem;
  color: #9ca3af;
}

/* ローダー */
.loader {
  border: 3px solid #374151;
  border-top: 3px solid #6366f1;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* プレビュー */
.section-title {
  font-size: 0.95rem;
  color: #a5b4fc;
  margin-bottom: 12px;
  font-weight: 600;
}

.preview-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 20px;
  background: #0c0e1a;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #1f2937;
}

.preview-image-container {
  width: 100%;
}

.preview-image {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #374151;
}

.preview-image-placeholder {
  aspect-ratio: 1/1;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  font-size: 0.8rem;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tag-group-label {
  display: block;
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  background: #1e1b4b;
  color: #a5b4fc;
  border: 1px solid #312e81;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tag-item button {
  background: transparent;
  border: none;
  color: #6366f1;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  padding: 0;
}

.tag-item--unregistered {
  background: #111827;
  color: #9ca3af;
  border-color: #374151;
  border-style: dashed;
}

.tag-item--negative {
  background: #450a0a;
  color: #fca5a5;
  border-color: #7f1d1d;
}

.tag-item--negative button {
  color: #ef4444;
}

.tag-item--char {
  background: #064e3b;
  color: #6ee7b7;
  border-color: #065f46;
}
.tag-item--char button {
  color: #10b981;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #1f2937;
}

.btn-primary {
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 32px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  border: 1px solid #374151;
  color: #9ca3af;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.95rem;
  cursor: pointer;
}

@media (max-width: 768px) {
  .preview-layout {
    grid-template-columns: 1fr;
  }
}
</style>
