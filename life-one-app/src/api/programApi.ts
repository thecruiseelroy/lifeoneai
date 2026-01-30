/**
 * Program operations via API. Used by usePrograms when a profile is selected.
 */
import type { Program, ProgramSection } from '../data/types'
import {
  apiAddExercisesToSection,
  apiAddSection,
  apiCreateProgram,
  apiDeleteProgram,
  apiDeleteSection,
  apiGetProgram,
  apiGetPrograms,
  apiRemoveExerciseFromSection,
  apiReorderExercisesInSection,
  apiUpdateProgram,
  apiUpdateSection,
  type ProgramResponse,
} from './client'

function toProgram(p: ProgramResponse): Program {
  return {
    id: p.id,
    name: p.name,
    sections: p.sections.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      days: s.days,
      exerciseNames: s.exerciseNames,
    })),
  }
}

export async function apiGetProgramsList(profileName: string): Promise<Program[]> {
  const list = await apiGetPrograms(profileName)
  return list.map(toProgram)
}

export async function apiGetProgramById(profileName: string, programId: string): Promise<Program | undefined> {
  try {
    const p = await apiGetProgram(profileName, programId)
    return toProgram(p)
  } catch {
    return undefined
  }
}

export async function apiAddProgram(profileName: string, name: string): Promise<Program> {
  const p = await apiCreateProgram(profileName, name)
  return toProgram(p)
}

export async function apiUpdateProgramById(
  profileName: string,
  programId: string,
  program: Program
): Promise<Program> {
  const p = await apiUpdateProgram(profileName, programId, { name: program.name })
  return toProgram(p)
}

export async function apiDeleteProgramById(profileName: string, programId: string): Promise<void> {
  await apiDeleteProgram(profileName, programId)
}

export async function apiAddSectionToProgram(
  profileName: string,
  programId: string,
  section: ProgramSection
): Promise<Program> {
  const p = await apiAddSection(profileName, programId, {
    name: section.name,
    description: section.description,
    days: section.days,
  })
  return toProgram(p)
}

export async function apiUpdateSectionInProgram(
  profileName: string,
  programId: string,
  sectionId: string,
  patch: Partial<Pick<ProgramSection, 'name' | 'description' | 'days'>>
): Promise<Program> {
  const p = await apiUpdateSection(profileName, programId, sectionId, patch)
  return toProgram(p)
}

export async function apiDeleteSectionFromProgram(
  profileName: string,
  programId: string,
  sectionId: string
): Promise<Program> {
  const p = await apiDeleteSection(profileName, programId, sectionId)
  return toProgram(p)
}

export async function apiAddExercisesToSectionInProgram(
  profileName: string,
  programId: string,
  sectionId: string,
  exerciseNames: string[],
  avoidDuplicates = true
): Promise<Program> {
  const p = await apiAddExercisesToSection(
    profileName,
    programId,
    sectionId,
    exerciseNames,
    avoidDuplicates
  )
  return toProgram(p)
}

export async function apiRemoveExerciseFromSectionInProgram(
  profileName: string,
  programId: string,
  sectionId: string,
  exerciseName: string
): Promise<Program> {
  const p = await apiRemoveExerciseFromSection(
    profileName,
    programId,
    sectionId,
    exerciseName
  )
  return toProgram(p)
}

export async function apiReorderExercisesInSectionInProgram(
  profileName: string,
  programId: string,
  sectionId: string,
  exerciseNames: string[]
): Promise<Program> {
  const p = await apiReorderExercisesInSection(
    profileName,
    programId,
    sectionId,
    exerciseNames
  )
  return toProgram(p)
}
