import type { Program, ProgramSection } from '../../data/types'

const STORAGE_KEY = 'life-one-programs'

function loadPrograms(): Program[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Program[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function savePrograms(programs: Program[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs))
}

export function getPrograms(): Program[] {
  return loadPrograms()
}

export function getProgram(id: string): Program | undefined {
  return loadPrograms().find((p) => p.id === id)
}

export function addProgram(program: Program): void {
  const all = loadPrograms()
  all.push(program)
  savePrograms(all)
}

export function updateProgram(id: string, program: Program): void {
  const all = loadPrograms()
  const i = all.findIndex((p) => p.id === id)
  if (i === -1) return
  all[i] = program
  savePrograms(all)
}

export function deleteProgram(id: string): void {
  const all = loadPrograms().filter((p) => p.id !== id)
  savePrograms(all)
}

export function createProgram(name: string): Program {
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
): ProgramSection {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    days,
    exerciseNames: [],
  }
}

export function addSectionToProgram(programId: string, section: ProgramSection): void {
  const program = getProgram(programId)
  if (!program) return
  const updated: Program = {
    ...program,
    sections: [...program.sections, section],
  }
  updateProgram(programId, updated)
}

export function updateSectionInProgram(
  programId: string,
  sectionId: string,
  patch: Partial<Pick<ProgramSection, 'name' | 'description' | 'days'>>
): void {
  const program = getProgram(programId)
  if (!program) return
  const sections = program.sections.map((s) =>
    s.id === sectionId ? { ...s, ...patch } : s
  )
  updateProgram(programId, { ...program, sections })
}

export function deleteSectionFromProgram(programId: string, sectionId: string): void {
  const program = getProgram(programId)
  if (!program) return
  const sections = program.sections.filter((s) => s.id !== sectionId)
  updateProgram(programId, { ...program, sections })
}

export function addExercisesToSection(
  programId: string,
  sectionId: string,
  exerciseNames: string[],
  avoidDuplicates = true
): void {
  const program = getProgram(programId)
  if (!program) return
  const section = program.sections.find((s) => s.id === sectionId)
  if (!section) return
  const existing = new Set(section.exerciseNames)
  const toAdd = avoidDuplicates ? exerciseNames.filter((n) => !existing.has(n)) : exerciseNames
  if (toAdd.length === 0) return
  const sections = program.sections.map((s) =>
    s.id === sectionId
      ? { ...s, exerciseNames: [...s.exerciseNames, ...toAdd] }
      : s
  )
  updateProgram(programId, { ...program, sections })
}

export function removeExerciseFromSection(
  programId: string,
  sectionId: string,
  exerciseName: string
): void {
  const program = getProgram(programId)
  if (!program) return
  const sections = program.sections.map((s) =>
    s.id === sectionId
      ? { ...s, exerciseNames: s.exerciseNames.filter((n) => n !== exerciseName) }
      : s
  )
  updateProgram(programId, { ...program, sections })
}

export function reorderExercisesInSection(
  programId: string,
  sectionId: string,
  exerciseNames: string[]
): void {
  const program = getProgram(programId)
  if (!program) return
  const sections = program.sections.map((s) =>
    s.id === sectionId ? { ...s, exerciseNames: [...exerciseNames] } : s
  )
  updateProgram(programId, { ...program, sections })
}
