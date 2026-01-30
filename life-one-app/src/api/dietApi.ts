/**
 * Diet operations via API. Used by useDiets when a profile is selected.
 */
import type { Diet, DietSection } from '../data/types'
import {
  apiAddDietSection,
  apiAddFoodsToDietSection,
  apiCreateDiet,
  apiDeleteDiet,
  apiDeleteDietSection,
  apiGetDiet,
  apiGetDiets,
  apiRemoveFoodFromDietSection,
  apiReorderFoodsInDietSection,
  apiUpdateDiet,
  apiUpdateDietSection,
  type DietResponse,
} from './client'

function toDiet(p: DietResponse): Diet {
  return {
    id: p.id,
    name: p.name,
    sections: p.sections.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      days: s.days,
      foodNames: s.foodNames,
    })),
  }
}

export async function apiGetDietsList(profileName: string): Promise<Diet[]> {
  const list = await apiGetDiets(profileName)
  return list.map(toDiet)
}

export async function apiGetDietById(profileName: string, dietId: string): Promise<Diet | undefined> {
  try {
    const p = await apiGetDiet(profileName, dietId)
    return toDiet(p)
  } catch {
    return undefined
  }
}

export async function apiAddDiet(profileName: string, name: string): Promise<Diet> {
  const p = await apiCreateDiet(profileName, name)
  return toDiet(p)
}

export async function apiUpdateDietById(
  profileName: string,
  dietId: string,
  diet: Diet
): Promise<Diet> {
  const p = await apiUpdateDiet(profileName, dietId, { name: diet.name })
  return toDiet(p)
}

export async function apiDeleteDietById(profileName: string, dietId: string): Promise<void> {
  await apiDeleteDiet(profileName, dietId)
}

export async function apiAddSectionToDiet(
  profileName: string,
  dietId: string,
  section: DietSection
): Promise<Diet> {
  const p = await apiAddDietSection(profileName, dietId, {
    name: section.name,
    description: section.description,
    days: section.days,
  })
  return toDiet(p)
}

export async function apiUpdateSectionInDiet(
  profileName: string,
  dietId: string,
  sectionId: string,
  patch: Partial<Pick<DietSection, 'name' | 'description' | 'days'>>
): Promise<Diet> {
  const p = await apiUpdateDietSection(profileName, dietId, sectionId, patch)
  return toDiet(p)
}

export async function apiDeleteSectionFromDiet(
  profileName: string,
  dietId: string,
  sectionId: string
): Promise<Diet> {
  const p = await apiDeleteDietSection(profileName, dietId, sectionId)
  return toDiet(p)
}

export async function apiAddFoodsToSectionInDiet(
  profileName: string,
  dietId: string,
  sectionId: string,
  foodNames: string[],
  avoidDuplicates = true
): Promise<Diet> {
  const p = await apiAddFoodsToDietSection(
    profileName,
    dietId,
    sectionId,
    foodNames,
    avoidDuplicates
  )
  return toDiet(p)
}

export async function apiRemoveFoodFromSectionInDiet(
  profileName: string,
  dietId: string,
  sectionId: string,
  foodName: string
): Promise<Diet> {
  const p = await apiRemoveFoodFromDietSection(
    profileName,
    dietId,
    sectionId,
    foodName
  )
  return toDiet(p)
}

export async function apiReorderFoodsInSectionInDiet(
  profileName: string,
  dietId: string,
  sectionId: string,
  foodNames: string[]
): Promise<Diet> {
  const p = await apiReorderFoodsInDietSection(
    profileName,
    dietId,
    sectionId,
    foodNames
  )
  return toDiet(p)
}
