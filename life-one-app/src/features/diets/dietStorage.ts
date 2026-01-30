import type { Diet, DietSection } from '../../data/types'

const STORAGE_KEY = 'life-one-diets'

function loadDiets(): Diet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Diet[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveDiets(diets: Diet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diets))
}

export function getDiets(): Diet[] {
  return loadDiets()
}

export function getDiet(id: string): Diet | undefined {
  return loadDiets().find((p) => p.id === id)
}

export function addDiet(diet: Diet): void {
  const all = loadDiets()
  all.push(diet)
  saveDiets(all)
}

export function updateDiet(id: string, diet: Diet): void {
  const all = loadDiets()
  const i = all.findIndex((p) => p.id === id)
  if (i === -1) return
  all[i] = diet
  saveDiets(all)
}

export function deleteDiet(id: string): void {
  const all = loadDiets().filter((p) => p.id !== id)
  saveDiets(all)
}

export function createDiet(name: string): Diet {
  return {
    id: crypto.randomUUID(),
    name,
    sections: [],
  }
}

export function createSection(
  name: string,
  description: string,
  days: string[] = []
): DietSection {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    days,
    foodNames: [],
  }
}

export function addSectionToDiet(dietId: string, section: DietSection): void {
  const diet = getDiet(dietId)
  if (!diet) return
  const updated: Diet = {
    ...diet,
    sections: [...diet.sections, section],
  }
  updateDiet(dietId, updated)
}

export function updateSectionInDiet(
  dietId: string,
  sectionId: string,
  patch: Partial<Pick<DietSection, 'name' | 'description' | 'days'>>
): void {
  const diet = getDiet(dietId)
  if (!diet) return
  const sections = diet.sections.map((s) =>
    s.id === sectionId ? { ...s, ...patch } : s
  )
  updateDiet(dietId, { ...diet, sections })
}

export function deleteSectionFromDiet(dietId: string, sectionId: string): void {
  const diet = getDiet(dietId)
  if (!diet) return
  const sections = diet.sections.filter((s) => s.id !== sectionId)
  updateDiet(dietId, { ...diet, sections })
}

export function addFoodsToSection(
  dietId: string,
  sectionId: string,
  foodNames: string[],
  avoidDuplicates = true
): void {
  const diet = getDiet(dietId)
  if (!diet) return
  const section = diet.sections.find((s) => s.id === sectionId)
  if (!section) return
  const existing = new Set(section.foodNames)
  const toAdd = avoidDuplicates ? foodNames.filter((n) => !existing.has(n)) : foodNames
  if (toAdd.length === 0) return
  const sections = diet.sections.map((s) =>
    s.id === sectionId
      ? { ...s, foodNames: [...s.foodNames, ...toAdd] }
      : s
  )
  updateDiet(dietId, { ...diet, sections })
}

export function removeFoodFromSection(
  dietId: string,
  sectionId: string,
  foodName: string
): void {
  const diet = getDiet(dietId)
  if (!diet) return
  const sections = diet.sections.map((s) =>
    s.id === sectionId
      ? { ...s, foodNames: s.foodNames.filter((n) => n !== foodName) }
      : s
  )
  updateDiet(dietId, { ...diet, sections })
}

export function reorderFoodsInSection(
  dietId: string,
  sectionId: string,
  foodNames: string[]
): void {
  const diet = getDiet(dietId)
  if (!diet) return
  const sections = diet.sections.map((s) =>
    s.id === sectionId ? { ...s, foodNames: [...foodNames] } : s
  )
  updateDiet(dietId, { ...diet, sections })
}
