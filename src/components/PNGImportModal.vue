<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content png-import-modal">
      <div class="modal-header">
        <h2 class="modal-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: text-bottom; margin-right: 4px;">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          PNG メタデータ取り込み
        </h2>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <p class="intro-text">
          ComfyUI で Anima モデルを使って生成した PNG 画像から、<br>
          プロンプト情報（ポジティブ / ネガティブ / rating / dataset tag）を自動で取り込みます。
        </p>

        <section class="step-card">
          <h3 class="step-title"><span class="step-icon">📁</span> 画像ファイルを選択</h3>
          <div
            class="drop-zone"
            :class="{ 'is-dragover': isDragover, 'has-file': !!file }"
            @dragover.prevent="isDragover = true"
            @dragleave.prevent="isDragover = false"
            @drop.prevent="onDrop"
            @click="pickerInput?.click()"
          >
            <input
              type="file"
              ref="pickerInput"
              accept="image/png"
              style="display: none"
              @change="onFileChange"
            />
            <template v-if="!file">
              <p class="drop-hint">📥 ここに PNG 画像をドロップ<br>または クリックしてファイルを選択</p>
            </template>
            <template v-else>
              <p class="file-info">
                <strong>{{ file.name }}</strong>
                <span class="file-size">({{ formatSize(file.size) }})</span>
              </p>
              <button class="btn-ghost btn-sm" @click.stop="reset">別のファイルを選ぶ</button>
            </template>
          </div>
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
          <div v-if="loading" class="loading-msg">抽出中...</div>
        </section>

        <section v-if="result" class="step-card">
          <h3 class="step-title"><span class="step-icon">📊</span> 抽出結果</h3>
          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">ポジティブ配置:</span>
              <strong class="summary-value">{{ result.positivePlacedCount }} 件</strong>
            </div>
            <div class="summary-row">
              <span class="summary-label">ネガティブ配置:</span>
              <strong class="summary-value">{{ result.negativePlacedCount }} 件</strong>
            </div>
            <div class="summary-row">
              <span class="summary-label">新規 library 登録:</span>
              <strong class="summary-value">{{ result.newParts.length }} 件</strong>
              <span class="summary-hint" v-if="result.newParts.length > 0">（辞書にないタグは仮パーツとして追加されます）</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">除外 (boilerplate):</span>
              <strong class="summary-value">{{ result.positiveExcluded.length + result.negativeExcluded.length }} 件</strong>
            </div>
            <div v-if="result.datasetTag" class="summary-row">
              <span class="summary-label">Dataset tag:</span>
              <strong class="summary-value">{{ result.datasetTag }}</strong>
            </div>
            <div v-if="result.rating" class="summary-row">
              <span class="summary-label">Rating:</span>
              <strong class="summary-value">{{ result.rating }}</strong>
            </div>
          </div>

          <details class="info-details" v-if="hasMeta">
            <summary>🔧 生成パラメータ（参考・保存はされません）</summary>
            <dl class="meta-list">
              <template v-if="result.meta.steps !== undefined">
                <dt>Steps</dt><dd>{{ result.meta.steps }}</dd>
              </template>
              <template v-if="result.meta.cfg !== undefined">
                <dt>CFG</dt><dd>{{ result.meta.cfg }}</dd>
              </template>
              <template v-if="result.meta.sampler">
                <dt>Sampler</dt><dd>{{ result.meta.sampler }}</dd>
              </template>
              <template v-if="result.meta.seed !== undefined">
                <dt>Seed</dt><dd>{{ result.meta.seed }}</dd>
              </template>
            </dl>
          </details>

          <details class="info-details" v-if="excludedList.length > 0">
            <summary>🚫 除外されたタグ ({{ excludedList.length }} 件)</summary>
            <p class="excluded-list">{{ excludedList.join(', ') }}</p>
          </details>

          <details class="info-details">
            <summary>📝 元プロンプト文字列</summary>
            <div class="raw-block">
              <h4>Positive</h4>
              <pre>{{ result.rawPositive || '(なし)' }}</pre>
              <h4>Negative</h4>
              <pre>{{ result.rawNegative || '(なし)' }}</pre>
            </div>
          </details>

          <p class="hint-note">
            ※ 現在のスロットに<strong>追記</strong>されます。置き換えではありません。
          </p>
        </section>

        <details class="advanced-hints">
          <summary>⚠️ うまく取り込めない場合</summary>
          <dl class="faq-list">
            <dt><strong>🔍 ComfyUI 以外の PNG が取り込めない</strong></dt>
            <dd>
              本機能は ComfyUI の `SaveImage` ノードが埋め込む `prompt` メタデータを解析します。<br>
              Civitai などでダウンロードした PNG は再エンコードでメタデータが失われている可能性があります。
            </dd>

            <dt><strong>⚙️ ワークフロー構成によっては抽出できない</strong></dt>
            <dd>
              `KSampler` / `KSamplerAdvanced` と `CLIPTextEncode` を標準的に使うワークフローのみ対応しています。<br>
              カスタムノード（`BNK_CLIPTextEncodeAdvanced` 等）を使っている場合は取り込みに失敗することがあります。
            </dd>

            <dt><strong>🏷️ 取り込まれたタグが全部「その他」セクションに入る</strong></dt>
            <dd>
              library にまだパーツが少ない場合、ほとんどのタグが新規仮パーツとして扱われます。<br>
              辞書にヒットしたタグは対応カテゴリに、ヒットしないタグは「未分類」カテゴリに登録されます。<br>
              取り込み後にマスターパーツの編集画面から整理してください。
            </dd>
          </dl>
        </details>
      </div>

      <div class="modal-footer">
        <button class="btn-ghost" @click="$emit('close')">キャンセル</button>
        <button
          class="btn-primary"
          :disabled="!result || loading"
          @click="handleImport"
        >インポート実行</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePromptStore } from '../store/promptStore'
import { extractPNGMetadata, type PNGExtractResult } from '../utils/pngMetadata'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported', msg: string): void
}>()

const store = usePromptStore()

const file = ref<File | null>(null)
const result = ref<PNGExtractResult | null>(null)
const errorMsg = ref('')
const isDragover = ref(false)
const loading = ref(false)
const pickerInput = ref<HTMLInputElement | null>(null)

const hasMeta = computed(() => {
  if (!result.value) return false
  const m = result.value.meta
  return (
    m.steps !== undefined ||
    m.cfg !== undefined ||
    m.sampler !== undefined ||
    m.seed !== undefined
  )
})

const excludedList = computed(() => {
  if (!result.value) return []
  return [...result.value.positiveExcluded, ...result.value.negativeExcluded]
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function reset(): void {
  file.value = null
  result.value = null
  errorMsg.value = ''
  if (pickerInput.value) pickerInput.value.value = ''
}

function onFileChange(e: Event): void {
  const target = e.target as HTMLInputElement
  const f = target.files?.[0]
  if (f) processFile(f)
}

function onDrop(e: DragEvent): void {
  isDragover.value = false
  const f = e.dataTransfer?.files[0]
  if (f) processFile(f)
}

async function processFile(f: File): Promise<void> {
  file.value = f
  result.value = null
  errorMsg.value = ''
  loading.value = true
  try {
    result.value = await extractPNGMetadata(f, store.library, store.categories)
  } catch (e: any) {
    errorMsg.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

function handleImport(): void {
  if (!result.value) return
  store.mergeAIImportResult({
    newCategories: result.value.newCategories,
    newParts: result.value.newParts,
    positive: result.value.positive,
    negative: result.value.negative,
    positiveFreeText: result.value.positiveFreeText,
    negativeFreeText: result.value.negativeFreeText,
    datasetTag: result.value.datasetTag,
    rating: result.value.rating,
  })
  const posCount = result.value.positivePlacedCount
  const negCount = result.value.negativePlacedCount
  const newCount = result.value.newParts.length
  const excCount = result.value.positiveExcluded.length + result.value.negativeExcluded.length
  emit(
    'imported',
    `PNG 取り込み完了: ポジ ${posCount}件 / ネガ ${negCount}件 / 新規パーツ ${newCount}件 / 除外 ${excCount}件`,
  )
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
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.modal-content.png-import-modal {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 12px;
  width: 800px;
  max-width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
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

.modal-close:hover {
  color: #e5e7eb;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #d1d5db;
  font-size: 0.95rem;
  line-height: 1.7;
}

.intro-text {
  font-size: 0.95rem;
  color: #d1d5db;
  line-height: 1.7;
  margin: 0;
}

.step-card {
  background: #1f2937;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #374151;
}

.step-title {
  font-size: 1rem;
  color: #a5b4fc;
  margin-top: 0;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-icon {
  font-size: 1.1rem;
}

.drop-zone {
  background: #0b1220;
  border: 2px dashed #374151;
  border-radius: 8px;
  padding: 32px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.drop-zone:hover {
  border-color: #6366f1;
  background: #0f172a;
}

.drop-zone.is-dragover {
  border-color: #818cf8;
  background: #1e1b4b;
}

.drop-zone.has-file {
  border-style: solid;
  border-color: #374151;
  padding: 16px;
}

.drop-hint {
  margin: 0;
  color: #9ca3af;
  line-height: 1.6;
}

.file-info {
  margin: 0 0 10px 0;
  color: #e5e7eb;
}

.file-size {
  margin-left: 8px;
  color: #9ca3af;
  font-size: 0.85rem;
}

.error-msg {
  color: #f87171;
  font-size: 0.9rem;
  background: #450a0a;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #7f1d1d;
  white-space: pre-wrap;
  margin-top: 12px;
}

.loading-msg {
  color: #a5b4fc;
  font-size: 0.9rem;
  margin-top: 12px;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #0b1220;
  border-radius: 6px;
  padding: 12px 16px;
  border: 1px solid #374151;
}

.summary-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.9rem;
}

.summary-label {
  color: #9ca3af;
  min-width: 160px;
}

.summary-value {
  color: #e5e7eb;
}

.summary-hint {
  color: #6b7280;
  font-size: 0.8rem;
}

.info-details {
  margin-top: 12px;
  background: #0b1220;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #374151;
  font-size: 0.9rem;
}

.info-details summary {
  cursor: pointer;
  color: #a5b4fc;
  font-weight: 600;
}

.meta-list {
  margin: 10px 0 0 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 16px;
}

.meta-list dt {
  color: #9ca3af;
  font-size: 0.85rem;
}

.meta-list dd {
  margin: 0;
  color: #e5e7eb;
  font-size: 0.85rem;
  font-family: ui-monospace, monospace;
}

.excluded-list {
  margin: 10px 0 0 0;
  color: #9ca3af;
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  word-break: break-all;
  line-height: 1.5;
}

.raw-block {
  margin-top: 10px;
}

.raw-block h4 {
  margin: 8px 0 4px 0;
  color: #a5b4fc;
  font-size: 0.85rem;
  font-weight: 600;
}

.raw-block pre {
  margin: 0;
  background: #030712;
  padding: 10px;
  border-radius: 4px;
  color: #d1d5db;
  font-size: 0.8rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

.hint-note {
  margin: 12px 0 0 0;
  color: #9ca3af;
  font-size: 0.85rem;
}

.advanced-hints {
  background: #1f2937;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #d1d5db;
}

.advanced-hints summary {
  cursor: pointer;
  font-weight: 600;
  color: #fca5a5;
  outline: none;
}

.faq-list {
  margin: 12px 0 0 0;
}

.faq-list dt {
  margin-bottom: 4px;
  color: #e5e7eb;
}

.faq-list dd {
  margin: 0 0 16px 0;
  padding-left: 12px;
  color: #9ca3af;
  line-height: 1.6;
}

.faq-list dd:last-child {
  margin-bottom: 0;
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
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
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
  transition: background 0.15s, color 0.15s;
}

.btn-ghost:hover {
  background: #1f2937;
  color: #e5e7eb;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.8rem;
}
</style>
