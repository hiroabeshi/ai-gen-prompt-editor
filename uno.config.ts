import { defineConfig, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
    presets: [
        presetUno(), // Tailwind / Windi CSS 互換
        presetAttributify(),
    ],
})
