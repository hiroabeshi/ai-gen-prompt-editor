<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content ai-import-modal">
      <div class="modal-header">
        <h2 class="modal-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: text-bottom; margin-right: 4px;">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
          AIインポート
        </h2>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <p class="intro-text">
          対話型AI（Claude, ChatGPT, Gemini等）を活用して、<br>NovelAI用のタグ構成を一括取り込みします。
        </p>

        <section class="step-card">
          <h3 class="step-title"><span class="step-icon">📄</span> ステップ 1: テンプレートのダウンロード</h3>
          <p class="step-desc">以下のファイルをダウンロードし、お使いの対話AIにアップロードまたは貼り付けてください。</p>
          <div class="template-actions">
            <a href="/ai-gen-prompt-editor/data/AI_Import_ver_4.txt" download="AI_Import_ver_4.txt" class="btn-primary-outline" target="_blank">
              ⬇️ 日本語版 (標準)
            </a>
            <a href="/ai-gen-prompt-editor/data/AI_Import_ver_4_en.txt" download="AI_Import_ver_4_en.txt" class="btn-primary-outline" title="より高い精度を求める場合は英語版推奨" target="_blank">
               ⬇️ 英語版 (高精度)
            </a>
          </div>
        </section>

        <section class="step-card">
          <h3 class="step-title"><span class="step-icon">💬</span> ステップ 2: AIにプロンプト作成を依頼</h3>
          <p class="step-desc">
            テンプレートを読み込ませたあと、「この指示に従って」と前置きして依頼します。<br/>
            情報が不足しているとAIから質問されることがありますので、短く回答してください。
          </p>
          <div class="example-box">
            <span class="example-label">依頼の例</span>
            <code>この指示に従って、海辺で水着を着てアイスを食べている女の子のプロンプトを作って</code>
          </div>
        </section>

        <section class="step-card">
          <h3 class="step-title"><span class="step-icon">📥</span> ステップ 3: データの貼り付けと取り込み</h3>
          <p class="step-desc">
            AIが指示通りに <span class="highlight-text">JSONデータ（黒い背景のコードブロック）</span> を出力したらコピーし、<br>下のテキストエリアに貼り付けて <strong>[インポート実行]</strong> をクリックします。
          </p>
          <textarea 
            v-model="importText" 
            class="ai-textarea" 
            placeholder="AIが出力した JSON (```json ... ```) をそのままペーストしてください。"
            spellcheck="false"
          ></textarea>
          
          <div v-if="errorMsg" class="error-msg">
            {{ errorMsg }}
          </div>
        </section>
        
        <details class="advanced-hints caution-hints">
           <summary>⚠️ 注意事項・よくあるトラブル</summary>
           <dl class="faq-list">
             <dt><strong>🛑 性的表現・コンテンツの制限</strong></dt>
             <dd>
               露骨な性的表現等は対話AIの出力フィルターに弾かれる場合があります。<br>
               ベースのみ生成させ、取り込み後にアプリ内で調整がおすすめです。（マニアックな表現も同様）
             </dd>
             
             <dt><strong>⚠️ インポートに失敗する場合</strong></dt>
             <dd>
               対話AIの性質上、一度に依頼する要素が多すぎるとJSONの構造が崩れる原因になります。<br>
               失敗した場合は、依頼する要素を<strong>減らして</strong>再生成してください。
             </dd>

             <dt><strong>🧠 対話AIが指示を忘れてしまったら</strong></dt>
             <dd>
               対話AIの性質上、長い会話によりAIがルールを見失うことがあります。<br>
               おかしな出力になった場合は、テンプレートを再度アップロードし直してください。
             </dd>
           </dl>
        </details>

        <details class="advanced-hints">
           <summary>🛠️ 上級者向けヒント：手持ちのタグリストを取り込む</summary>
           <div class="hints-content">
             <p class="hints-intro">
               Excelやテキストメモで管理している<strong>「自分だけのプロンプト集」</strong>を一気にアプリへ取り込むことも可能です！以下の手順でお試しください。
             </p>

             <dl class="faq-list">
               <dt><strong>📝 手順 1: プロンプト文字の準備</strong></dt>
               <dd>
                 手持ちのプロンプト（カンマ区切りの英単語など）をコピーします。日本語のメモ書きが混ざっていてもAIが自動で整理してくれます。
               </dd>

               <dt><strong>🤖 手順 2: AIへ「変換」を依頼する</strong></dt>
               <dd>
                 ステップ1のテンプレートを読み込ませたAIに、次のように依頼します。
                 <div class="example-box">
                   <span class="example-label">依頼の例</span>
                   <code>手持ちのプロンプトリストを渡すので、指示にある OUTPUT FORMAT の JSON に変換して出力して。<br><br>(ここにコピーしたプロンプトをペースト)</code>
                 </div>
               </dd>

               <dt><strong>💡 成功させるためのコツ</strong></dt>
               <dd>
                 一度に大量のデータ（数十件以上）をまるごと渡すと、AIが途中で出力を省略したりエラーになったりします。<br>
                 <strong>「10〜20項目ずつ」</strong>に小分けにして依頼し、出てきたJSONを順番にこの画面で取り込んでいくのが確実です。
               </dd>

               <dt><strong>🔧 テンプレートを自分好みに改造する</strong></dt>
               <dd>
                 ステップ1でダウンロードするテンプレートファイルはテキストですので、自由にカスタマイズ可能です。<br>
                 <strong>「特定のネガティブタグを必ず入れたい」「こだわりの表現をAIに学ばせたい」</strong>といった場合、<br>メモ帳などでテンプレートの中身を直接書き換えてAIに読み込ませるのも面白い活用法です！
               </dd>
             </dl>
           </div>
        </details>
      </div>

      <div class="modal-footer">
        <button class="btn-ghost" @click="$emit('close')">キャンセル</button>
        <button class="btn-primary" :disabled="!importText.trim()" @click="handleImport">インポート実行</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { parseAIImportText, mergeAIImport } from '../utils/aiImport'
import { usePromptStore } from '../store/promptStore'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported', msg: string): void
}>()

const store = usePromptStore()
const importText = ref('')
const errorMsg = ref('')

function handleImport() {
  errorMsg.value = ''
  if (!importText.value.trim()) return

  try {
    const data = parseAIImportText(importText.value)
    
    // v4のルール仕様に従い、既存カテゴリが存在すれば常にマージ（'merge'）として扱う
    const { newCategories, newParts, newSlots } = mergeAIImport(
      data,
      store.categories,
      store.library,
      (_catName) => 'merge'
    )
    
    store.mergeAIImportResult(newCategories, newParts, newSlots)
    emit('imported', `AIインポート完了: カテゴリ ${newCategories.length}個, パーツ ${newParts.length}個, スロット ${newSlots.length}個 追加`)
    emit('close')
  } catch (err: any) {
    errorMsg.value = err.message || String(err)
  }
}
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

.modal-content.ai-import-modal {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 12px;
  width: 1200px;
  max-width: 100%;
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
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-icon {
  font-size: 1.1rem;
}

.step-desc {
  font-size: 0.95rem;
  color: #d1d5db;
  line-height: 1.7;
  margin: 0 0 12px 0;
}

.template-actions {
  display: flex;
  gap: 12px;
}

.btn-primary-outline {
  text-decoration: none;
  font-size: 0.95rem;
  padding: 8px 16px;
  border: 1px solid #4f46e5;
  color: #a5b4fc;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s;
}

.btn-primary-outline:hover {
  background: #4f46e5;
  color: white;
}

.example-box {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 12px;
  position: relative;
  margin-top: 12px;
}

.example-label {
  position: absolute;
  top: -10px;
  left: 12px;
  background: #374151;
  color: #d1d5db;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.example-box code {
  display: block;
  font-family: inherit;
  font-size: 0.95rem;
  color: #e5e7eb;
}

.highlight-text {
  color: #fcd34d;
  font-weight: 600;
}

.hints-content {
  padding-top: 12px;
}

.hint-note {
  color: #9ca3af;
  font-size: 0.8rem;
  margin-top: 12px;
}

.ai-textarea {
  width: 100%;
  height: 200px;
  background: #030712;
  border: 1px solid #374151;
  border-radius: 8px;
  color: #e5e7eb;
  padding: 12px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
}

.ai-textarea:focus {
  outline: none;
  border-color: #6366f1;
}

.error-msg {
  color: #f87171;
  font-size: 0.95rem;
  background: #450a0a;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #7f1d1d;
  white-space: pre-wrap;
}

.advanced-hints {
  background: #1f2937;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #d1d5db;
}

.advanced-hints summary {
  cursor: pointer;
  font-weight: 600;
  color: #a5b4fc;
  outline: none;
}

.advanced-hints p {
  margin-top: 10px;
  line-height: 1.5;
}

.caution-hints {
  margin-bottom: 12px;
}
.caution-hints summary {
  color: #fca5a5;
}

.faq-list {
  margin: 12px 0 0 0;
}

.faq-list dt {
  margin-bottom: 4px;
  color: #e5e7eb;
}

.faq-list dt strong {
  display: flex;
  align-items: center;
  gap: 6px;
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
</style>
