import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { AppState, Category, PromptPart, SelectedPart, Slot } from '../types'
import { DEFAULT_PART_WEIGHT, isRandomizerPartId, randomizerPartId, categoryIdFromRandomizer } from '../types'
import { defaultData } from '../data/defaultData'

export const usePromptStore = defineStore('prompt', () => {
    // ─── State ───────────────────────────────────────────────
    const version = ref<string>(defaultData.version)
    const categories = ref<Category[]>([...defaultData.categories])
    const library = ref<PromptPart[]>([...defaultData.library])
    const slots = ref<Slot[]>(defaultData.slots.map(s => ({
        ...s,
        parts: s.parts.map(p => ({ ...p })),
    })))
    const loadCount = ref<number>(0)

    // ─── Getters ─────────────────────────────────────────────
    const getPartsByCategory = computed(() => (categoryId: string) =>
        library.value.filter(p => p.categoryId === categoryId)
    )

    function getMasterPart(partId: string): PromptPart | undefined {
        // ランダマイザの場合は仮想的な PromptPart を返す
        if (isRandomizerPartId(partId)) {
            const catId = categoryIdFromRandomizer(partId)
            const cat = categories.value.find(c => c.id === catId)
            if (!cat) return undefined
            return {
                id: partId,
                categoryId: catId,
                label: `${cat.name} @ランダマイザ`,
                values: { novelai: '' }, // 実際のタグは generatePrompt 側で動的生成
            }
        }
        return library.value.find(p => p.id === partId)
    }

    function isPartUsedInSlots(partId: string): boolean {
        return slots.value.some(s => s.parts.some(p => p.partId === partId))
    }

    // ─── Actions: State 初期化 ────────────────────────────────
    function initFromData(state: AppState): void {
        version.value = state.version
        categories.value = state.categories.map(c => ({ ...c }))
        library.value = state.library.map(p => ({ ...p, values: { ...p.values } }))
        slots.value = state.slots.map(s => ({
            ...s,
            parts: s.parts.map(p => ({ ...p })),
        }))
        loadCount.value++
    }

    function getFullState(): AppState {
        return {
            version: version.value,
            categories: categories.value.map(c => ({ ...c })),
            library: library.value.map(p => ({ ...p, values: { ...p.values } })),
            slots: slots.value.map(s => ({
                ...s,
                parts: s.parts.map(p => ({ ...p })),
            })),
        }
    }

    // ─── Actions: カテゴリ ────────────────────────────────────
    function addCategory(name: string, color: string): Category {
        const cat: Category = { id: uuidv4(), name, color }
        categories.value.push(cat)
        return cat
    }

    function updateCategory(id: string, changes: Partial<Omit<Category, 'id'>>): void {
        const cat = categories.value.find(c => c.id === id)
        if (cat) Object.assign(cat, changes)
    }

    function deleteCategory(id: string): void {
        // カテゴリ削除時は library のパーツも削除され、slots からも除去される
        const partIds = library.value.filter(p => p.categoryId === id).map(p => p.id)
        for (const partId of partIds) {
            removePartFromAllSlots(partId)
        }
        // ランダマイザインスタンスもスロットから除去
        removePartFromAllSlots(randomizerPartId(id))
        library.value = library.value.filter(p => p.categoryId !== id)
        categories.value = categories.value.filter(c => c.id !== id)
    }

    function reorderCategories(newCategories: Category[]): void {
        categories.value = newCategories
    }

    // ─── Actions: マスターパーツ ──────────────────────────────
    function addPart(
        categoryId: string,
        label: string,
        novelai: string,
        sd?: string,
    ): PromptPart {
        const part: PromptPart = {
            id: uuidv4(),
            categoryId,
            label,
            values: { novelai, ...(sd ? { sd } : {}) },
        }
        library.value.push(part)
        return part
    }

    function updatePart(partId: string, changes: Partial<Omit<PromptPart, 'id'>>): void {
        const part = library.value.find(p => p.id === partId)
        if (!part) return
        if (changes.label !== undefined) part.label = changes.label
        if (changes.categoryId !== undefined) part.categoryId = changes.categoryId
        if (changes.values) {
            part.values = { ...part.values, ...changes.values }
        }
    }

    /**
     * マスターパーツを削除する。
     * 使用中チェックは呼び出し元（UI）で行い、確認済みの場合のみ呼ぶ。
     */
    function deletePart(partId: string): void {
        removePartFromAllSlots(partId)
        library.value = library.value.filter(p => p.id !== partId)
    }

    function removePartFromAllSlots(partId: string): void {
        for (const slot of slots.value) {
            slot.parts = slot.parts.filter(p => p.partId !== partId)
        }
    }

    // ─── Actions: スロット ────────────────────────────────────
    function addSlot(name: string, type: 'positive' | 'negative'): Slot {
        const slot: Slot = { id: uuidv4(), name, type, parts: [] }
        slots.value.push(slot)
        return slot
    }

    function updateSlot(slotId: string, changes: Partial<Omit<Slot, 'id' | 'parts'>>): void {
        const slot = slots.value.find(s => s.id === slotId)
        if (slot) Object.assign(slot, changes)
    }

    function renameSlot(slotId: string, name: string): void {
        const slot = slots.value.find(s => s.id === slotId)
        if (slot) slot.name = name
    }

    function deleteSlot(slotId: string): void {
        slots.value = slots.value.filter(s => s.id !== slotId)
    }

    function duplicateSlot(slotId: string): Slot | undefined {
        const original = slots.value.find(s => s.id === slotId)
        if (!original) return undefined
        const copy: Slot = {
            id: uuidv4(),
            name: `${original.name} (コピー)`,
            type: original.type,
            parts: original.parts.map(p => ({ ...p, id: uuidv4() })),
        }
        const idx = slots.value.findIndex(s => s.id === slotId)
        slots.value.splice(idx + 1, 0, copy)
        return copy
    }

    // ─── Actions: スロット内パーツ ────────────────────────────
    function addPartToSlot(slotId: string, partId: string, insertIndex?: number): SelectedPart | undefined {
        const slot = slots.value.find(s => s.id === slotId)
        if (!slot) return undefined

        // ランダマイザパーツの場合は library に存在しなくてもOK
        const isRandomizer = isRandomizerPartId(partId)
        if (!isRandomizer) {
            const master = library.value.find(p => p.id === partId)
            if (!master) return undefined
        }

        const inst: SelectedPart = {
            id: uuidv4(),
            partId,
            weight: DEFAULT_PART_WEIGHT,
            enabled: true,
        }
        if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= slot.parts.length) {
            slot.parts.splice(insertIndex, 0, inst)
        } else {
            slot.parts.push(inst)
        }
        return inst
    }

    function togglePart(slotId: string, instanceId: string): void {
        const slot = slots.value.find(s => s.id === slotId)
        const part = slot?.parts.find(p => p.id === instanceId)
        if (part) part.enabled = !part.enabled
    }

    function setPartWeight(slotId: string, instanceId: string, weight: number): void {
        const slot = slots.value.find(s => s.id === slotId)
        const part = slot?.parts.find(p => p.id === instanceId)
        if (part) part.weight = Math.round(weight * 100) / 100
    }

    function removePartFromSlot(slotId: string, instanceId: string): void {
        const slot = slots.value.find(s => s.id === slotId)
        if (slot) slot.parts = slot.parts.filter(p => p.id !== instanceId)
    }

    function reorderSlotParts(slotId: string, newParts: SelectedPart[]): void {
        const slot = slots.value.find(s => s.id === slotId)
        if (slot) slot.parts = newParts
    }

    // ─── Actions: AI インポート ───────────────────────────────
    function mergeAIImportResult(newCategories: Category[], newParts: PromptPart[]): void {
        categories.value.push(...newCategories)
        library.value.push(...newParts)
    }

    return {
        // state (reaktív refs)
        version,
        categories,
        library,
        slots,
        loadCount,
        // getters
        getPartsByCategory,
        getMasterPart,
        isPartUsedInSlots,
        // actions
        initFromData,
        getFullState,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        addPart,
        updatePart,
        deletePart,
        addSlot,
        updateSlot,
        renameSlot,
        deleteSlot,
        duplicateSlot,
        addPartToSlot,
        togglePart,
        setPartWeight,
        removePartFromSlot,
        reorderSlotParts,
        mergeAIImportResult,
    }
})
