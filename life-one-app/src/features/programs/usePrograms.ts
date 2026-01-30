import { useCallback, useEffect, useState } from 'react'
import type { Program, ProgramSection } from '../../data/types'
import { useProfile } from '../../context/ProfileContext'
import * as programApi from '../../api/programApi'
import {
  addExercisesToSection as storageAddExercisesToSection,
  addProgram as storageAddProgram,
  addSectionToProgram as storageAddSectionToProgram,
  createProgram as createProgramRecord,
  createSection as createSectionRecord,
  deleteProgram as storageDeleteProgram,
  deleteSectionFromProgram as storageDeleteSectionFromProgram,
  getPrograms,
  removeExerciseFromSection as storageRemoveExerciseFromSection,
  updateProgram as storageUpdateProgram,
  updateSectionInProgram as storageUpdateSectionInProgram,
} from './programStorage'

/** Hook for programs state. Uses API when profile is set; falls back to localStorage otherwise. */
export function usePrograms() {
  const { profileName } = useProfile()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (profileName) {
      setLoading(true)
      setError(null)
      try {
        const list = await programApi.apiGetProgramsList(profileName)
        setPrograms(list)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load programs')
        setPrograms([])
      } finally {
        setLoading(false)
      }
    } else {
      setPrograms(getPrograms())
    }
  }, [profileName])

  useEffect(() => {
    refresh()
  }, [refresh])

  const getProgram = useCallback(
    (id: string) => programs.find((p) => p.id === id),
    [programs]
  )

  const addProgram = useCallback(
    async (name: string) => {
      if (profileName) {
        const program = await programApi.apiAddProgram(profileName, name)
        await refresh()
        return program
      }
      const program = createProgramRecord(name)
      storageAddProgram(program)
      setPrograms(getPrograms())
      return program
    },
    [profileName, refresh]
  )

  const updateProgram = useCallback(
    async (id: string, program: Program) => {
      if (profileName) {
        await programApi.apiUpdateProgramById(profileName, id, program)
        await refresh()
        return
      }
      storageUpdateProgram(id, program)
      setPrograms(getPrograms())
    },
    [profileName, refresh]
  )

  const deleteProgram = useCallback(
    async (id: string) => {
      if (profileName) {
        await programApi.apiDeleteProgramById(profileName, id)
        await refresh()
        return
      }
      storageDeleteProgram(id)
      setPrograms(getPrograms())
    },
    [profileName, refresh]
  )

  const addSection = useCallback(
    async (programId: string, section: ProgramSection) => {
      if (profileName) {
        await programApi.apiAddSectionToProgram(profileName, programId, section)
        await refresh()
        return
      }
      storageAddSectionToProgram(programId, section)
      setPrograms(getPrograms())
    },
    [profileName, refresh]
  )

  const updateSection = useCallback(
    async (
      programId: string,
      sectionId: string,
      patch: Partial<Pick<ProgramSection, 'name' | 'description' | 'days'>>
    ) => {
      if (profileName) {
        await programApi.apiUpdateSectionInProgram(profileName, programId, sectionId, patch)
        await refresh()
        return
      }
      storageUpdateSectionInProgram(programId, sectionId, patch)
      setPrograms(getPrograms())
    },
    [profileName, refresh]
  )

  const deleteSection = useCallback(
    async (programId: string, sectionId: string) => {
      if (profileName) {
        await programApi.apiDeleteSectionFromProgram(profileName, programId, sectionId)
        await refresh()
        return
      }
      storageDeleteSectionFromProgram(programId, sectionId)
      setPrograms(getPrograms())
    },
    [profileName, refresh]
  )

  const addExercisesToSection = useCallback(
    async (
      programId: string,
      sectionId: string,
      exerciseNames: string[],
      avoidDuplicates = true
    ) => {
      if (profileName) {
        await programApi.apiAddExercisesToSectionInProgram(
          profileName,
          programId,
          sectionId,
          exerciseNames,
          avoidDuplicates
        )
        await refresh()
        return
      }
      storageAddExercisesToSection(programId, sectionId, exerciseNames, avoidDuplicates)
      setPrograms(getPrograms())
    },
    [profileName, refresh]
  )

  const duplicateProgram = useCallback(
    async (id: string) => {
      const program = programs.find((p) => p.id === id)
      if (!program) return undefined
      const newProgram = await addProgram(program.name + ' (copy)')
      for (const s of program.sections) {
        const newSection = createSectionRecord(s.name, s.description, s.days)
        await addSection(newProgram.id, newSection)
        if (s.exerciseNames.length > 0) {
          await addExercisesToSection(newProgram.id, newSection.id, s.exerciseNames, false)
        }
      }
      return newProgram
    },
    [programs, addProgram, addSection, addExercisesToSection]
  )

  const removeExerciseFromSection = useCallback(
    async (programId: string, sectionId: string, exerciseName: string) => {
      if (profileName) {
        await programApi.apiRemoveExerciseFromSectionInProgram(
          profileName,
          programId,
          sectionId,
          exerciseName
        )
        await refresh()
        return
      }
      storageRemoveExerciseFromSection(programId, sectionId, exerciseName)
      setPrograms(getPrograms())
    },
    [profileName, refresh]
  )

  return {
    programs,
    loading,
    error,
    getProgram,
    addProgram,
    updateProgram,
    deleteProgram,
    duplicateProgram,
    addSection,
    updateSection,
    deleteSection,
    addExercisesToSection,
    removeExerciseFromSection,
    createSection: createSectionRecord,
    createProgram: createProgramRecord,
  }
}
