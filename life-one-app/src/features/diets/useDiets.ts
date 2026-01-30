import { useCallback, useEffect, useState } from 'react'
import type { Diet, DietSection } from '../../data/types'
import { useProfile } from '../../context/ProfileContext'
import { ensureProfileExists } from '../../api/client'
import * as dietApi from '../../api/dietApi'
import {
  addDiet as storageAddDiet,
  addFoodsToSection as storageAddFoodsToSection,
  addSectionToDiet as storageAddSectionToDiet,
  createDiet as createDietRecord,
  createSection as createSectionRecord,
  deleteDiet as storageDeleteDiet,
  deleteSectionFromDiet as storageDeleteSectionFromDiet,
  getDiets,
  removeFoodFromSection as storageRemoveFoodFromSection,
  updateDiet as storageUpdateDiet,
  updateSectionInDiet as storageUpdateSectionInDiet,
} from './dietStorage'

/** Hook for diets state. Uses API when profile is set; falls back to localStorage otherwise. */
export function useDiets() {
  const { profileName } = useProfile()
  const [diets, setDiets] = useState<Diet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (profileName) {
      setLoading(true)
      setError(null)
      try {
        await ensureProfileExists(profileName)
        const list = await dietApi.apiGetDietsList(profileName)
        setDiets(list)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load diets')
        setDiets([])
      } finally {
        setLoading(false)
      }
    } else {
      setDiets(getDiets())
    }
  }, [profileName])

  useEffect(() => {
    refresh()
  }, [refresh])

  const getDiet = useCallback(
    (id: string) => diets.find((p) => p.id === id),
    [diets]
  )

  const addDiet = useCallback(
    async (name: string) => {
      if (profileName) {
        await ensureProfileExists(profileName)
        const diet = await dietApi.apiAddDiet(profileName, name)
        await refresh()
        return diet
      }
      const diet = createDietRecord(name)
      storageAddDiet(diet)
      setDiets(getDiets())
      return diet
    },
    [profileName, refresh]
  )

  const updateDiet = useCallback(
    async (id: string, diet: Diet) => {
      if (profileName) {
        await dietApi.apiUpdateDietById(profileName, id, diet)
        await refresh()
        return
      }
      storageUpdateDiet(id, diet)
      setDiets(getDiets())
    },
    [profileName, refresh]
  )

  const deleteDiet = useCallback(
    async (id: string) => {
      if (profileName) {
        await dietApi.apiDeleteDietById(profileName, id)
        await refresh()
        return
      }
      storageDeleteDiet(id)
      setDiets(getDiets())
    },
    [profileName, refresh]
  )

  const addSection = useCallback(
    async (dietId: string, section: DietSection) => {
      if (profileName) {
        await dietApi.apiAddSectionToDiet(profileName, dietId, section)
        await refresh()
        return
      }
      storageAddSectionToDiet(dietId, section)
      setDiets(getDiets())
    },
    [profileName, refresh]
  )

  const updateSection = useCallback(
    async (
      dietId: string,
      sectionId: string,
      patch: Partial<Pick<DietSection, 'name' | 'description' | 'days'>>
    ) => {
      if (profileName) {
        await dietApi.apiUpdateSectionInDiet(profileName, dietId, sectionId, patch)
        await refresh()
        return
      }
      storageUpdateSectionInDiet(dietId, sectionId, patch)
      setDiets(getDiets())
    },
    [profileName, refresh]
  )

  const deleteSection = useCallback(
    async (dietId: string, sectionId: string) => {
      if (profileName) {
        await dietApi.apiDeleteSectionFromDiet(profileName, dietId, sectionId)
        await refresh()
        return
      }
      storageDeleteSectionFromDiet(dietId, sectionId)
      setDiets(getDiets())
    },
    [profileName, refresh]
  )

  const addFoodsToSection = useCallback(
    async (
      dietId: string,
      sectionId: string,
      foodNames: string[],
      avoidDuplicates = true
    ) => {
      if (profileName) {
        await dietApi.apiAddFoodsToSectionInDiet(
          profileName,
          dietId,
          sectionId,
          foodNames,
          avoidDuplicates
        )
        await refresh()
        return
      }
      storageAddFoodsToSection(dietId, sectionId, foodNames, avoidDuplicates)
      setDiets(getDiets())
    },
    [profileName, refresh]
  )

  const duplicateDiet = useCallback(
    async (id: string) => {
      const diet = diets.find((p) => p.id === id)
      if (!diet) return undefined
      const newDiet = await addDiet(diet.name + ' (copy)')
      for (const s of diet.sections) {
        const newSection = createSectionRecord(s.name, s.description, s.days)
        await addSection(newDiet.id, newSection)
        if (s.foodNames.length > 0) {
          await addFoodsToSection(newDiet.id, newSection.id, s.foodNames, false)
        }
      }
      return newDiet
    },
    [diets, addDiet, addSection, addFoodsToSection]
  )

  const removeFoodFromSection = useCallback(
    async (dietId: string, sectionId: string, foodName: string) => {
      if (profileName) {
        await dietApi.apiRemoveFoodFromSectionInDiet(
          profileName,
          dietId,
          sectionId,
          foodName
        )
        await refresh()
        return
      }
      storageRemoveFoodFromSection(dietId, sectionId, foodName)
      setDiets(getDiets())
    },
    [profileName, refresh]
  )

  return {
    diets,
    loading,
    error,
    getDiet,
    addDiet,
    updateDiet,
    deleteDiet,
    duplicateDiet,
    addSection,
    updateSection,
    deleteSection,
    addFoodsToSection,
    removeFoodFromSection,
    createSection: createSectionRecord,
    createDiet: createDietRecord,
  }
}
