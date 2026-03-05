<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="guide-modal">
      <div class="guide-modal__header">
        <h2 class="guide-modal__title">はじめに：このアプリの使い方</h2>
        <button class="icon-btn" @click="$emit('close')" title="閉じる">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div class="guide-modal__body">
        <p class="guide-text">このアプリは、NovelAI用のプロンプトを視覚的に組み立て・管理するためのツールです。</p>

        <div class="alpha-warning">
          <strong>⚠️ アルファ版について</strong><br>
          現在このツールはアルファ版（開発初期段階）です。予期せぬ不具合が発生する可能性があります。あらかじめご了承ください。
        </div>

        <div class="guide-step">
          <h3 class="guide-step__title">1. パーツを選ぶ</h3>
          <p class="guide-text">画面左側のライブラリには、ポーズや服装などのカテゴリごとにプロンプトのパーツが用意されています。<br>使いたいパーツを、中央の枠（スロット）にドラッグ＆ドロップして追加してください。</p>
        </div>

        <div class="guide-step">
          <h3 class="guide-step__title">2. プロンプトを調整する</h3>
          <p class="guide-text">スロットに追加したパーツは、クリックして強弱（ウェイト）を調整できます。<br>スロット内でドラッグして順番を入れ替えることも可能です。</p>
        </div>

        <div class="guide-step">
          <h3 class="guide-step__title">3. コピーして NovelAI で使う</h3>
          <p class="guide-text">プロンプトが完成したら、各スロットの上にある「コピー」ボタンを押します。<br>あとは NovelAI の画面を開き、プロンプト入力欄にそのまま貼り付けて画像を生成してください。</p>
        </div>

        <div class="guide-step">
          <h3 class="guide-step__title">4. データを保存する（最重要）</h3>
          <p class="guide-text">画面右上の「JSON保存」ボタンから、現在のプロンプトやパーツの状態をJSONファイルとしてパソコンに保存（バックアップ）できます。</p>
        </div>

        <div class="guide-step">
          <h3 class="guide-step__title">5. データを読み込む</h3>
          <p class="guide-text">画面右上の「JSON読込」ボタンから、保存したJSONファイルを読み込んで前回の状態を復元できます。</p>
        </div>

        <div class="guide-tips">
          <h3 class="guide-tips__title">💡 その他の便利な機能</h3>
          <ul class="guide-tips__list">
            <li><strong>自作パーツの登録:</strong> 各カテゴリの「＋」ボタンから、お気に入りのタグを新規登録できます。</li>
            <li><strong>スロットの追加:</strong> 「新しいスロットを追加」ボタンから、新しいスロットを作成できます。<br>
            <strong>キャラクターに関しては、１スロット１キャラクターとすることをお勧めします</strong>。</li>
          </ul>
        </div>

        <div class="guide-faq">
          <h3 class="guide-faq__title">❓ よくある質問</h3>
          <dl class="guide-faq__list">
            <dt><strong>🔒 プライバシーについて</strong></dt>
            <dd>
              当アプリのプロンプト処理やデータ保存は、<br>
              すべてお使いのブラウザ上・JSONファイルで完結しており、<br>
              意図せず入力データが外部サーバーに送信されることはありません。
            </dd>
          </dl>
        </div>

        <div class="guide-patch-notes">
          <h3 class="guide-patch-notes__title">📝 パッチノート</h3>
          <ul class="guide-patch-notes__list">
            <li><strong>ver 0.1:</strong> リリース</li>
          </ul>
        </div>
      </div>
      <div class="guide-modal__footer">
        <button class="btn-primary" @click="$emit('close')">はじめる</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ (e: 'close'): void }>()
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
  padding: 16px;
}

.guide-modal {
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
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.guide-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #1f2937;
}

.guide-modal__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #e5e7eb;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.icon-btn:hover {
  background: #1f2937;
  color: #f3f4f6;
}

.guide-modal__body {
  padding: 24px;
  overflow-y: auto;
  color: #d1d5db;
  font-size: 0.95rem;
  line-height: 1.7;
}

.guide-text {
  margin-bottom: 18px;
}

.alpha-warning {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 24px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.guide-faq {
  margin-top: 32px;
  padding: 16px;
  background: #1f2937;
  border-radius: 8px;
  border: 1px solid #374151;
}

.guide-faq__title {
  font-size: 1rem;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 12px;
}

.guide-faq__list {
  margin: 0;
}

.guide-faq__list dt {
  margin-bottom: 4px;
  color: #e5e7eb;
}

.guide-faq__list dd {
  margin: 0 0 16px 0;
  padding-left: 12px;
  color: #9ca3af;
  line-height: 1.6;
}

.guide-faq__list dd:last-child {
  margin-bottom: 0;
}

.guide-patch-notes {
  margin-top: 32px;
  padding: 16px;
  background: #1f2937;
  border-radius: 8px;
  border: 1px solid #374151;
}

.guide-patch-notes__title {
  font-size: 1rem;
  font-weight: 700;
  color: #60a5fa;
  margin-bottom: 12px;
}

.guide-patch-notes__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guide-patch-notes__list li {
  position: relative;
  padding-left: 20px;
  margin-bottom: 8px;
  color: #d1d5db;
  font-size: 0.9rem;
}

.guide-patch-notes__list li:last-child {
  margin-bottom: 0;
}

.guide-patch-notes__list li::before {
  content: "-";
  position: absolute;
  left: 4px;
  color: #9ca3af;
}

.guide-step {
  margin-bottom: 24px;
}

.guide-step__title {
  font-size: 1rem;
  font-weight: 700;
  color: #a5b4fc;
  margin-bottom: 8px;
}

.guide-tips {
  margin-top: 32px;
  padding: 16px;
  background: #1f2937;
  border-radius: 8px;
  border: 1px solid #374151;
}

.guide-tips__title {
  font-size: 1rem;
  font-weight: 700;
  color: #fcd34d;
  margin-bottom: 12px;
}

.guide-tips__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guide-tips__list li {
  position: relative;
  padding-left: 20px;
  margin-bottom: 10px;
}

.guide-tips__list li:last-child {
  margin-bottom: 0;
}

.guide-tips__list li::before {
  content: "・";
  position: absolute;
  left: 0;
  color: #9ca3af;
  font-weight: bold;
}

.guide-modal__footer {
  padding: 16px 24px;
  border-top: 1px solid #1f2937;
  display: flex;
  justify-content: flex-end;
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

.btn-primary:hover {
  background: #4338ca;
}
</style>
