export interface Exercise {
  name: string
  category: string
  description?: string
  instructions: string[]
  equipment: string[]
  primary_muscles: string[]
  secondary_muscles: string[]
  video?: string
  images?: string[]
  tips?: string[]
  tempo?: string
  aliases?: string[]
  variation_on?: string[]
  variations_on?: string[]
  license_author?: string
  license?: { full_name?: string; short_name?: string; url?: string }
}

export interface ExercisesData {
  categories: string[]
  equipment: string[]
  muscles: string[]
  muscle_groups: Record<string, string[]>
  exercises: Exercise[]
}

/** One set: reps, optional weight, optional note */
export interface SetEntry {
  reps: number
  weight?: number
  note?: string
}

/** One day's log for one exercise */
export interface WorkoutLogEntry {
  exerciseName: string
  date: string // YYYY-MM-DD
  sets: SetEntry[]
}

/** One section of a program (e.g. Push, Pull, Legs) */
export interface ProgramSection {
  id: string
  name: string
  description: string
  days: string[]
  exerciseNames: string[]
}

/** Optional metadata for program blueprint (e.g. AI-generated). */
export interface ProgramMeta {
  source?: 'user' | 'ai'
  generatedAt?: string
  prompt?: string
}

/** Program blueprint: one JSON file per program. */
export interface Program {
  id: string
  name: string
  sections: ProgramSection[]
  meta?: ProgramMeta
}

// --- Foods (library) ---
export interface Food {
  id: number
  name: string
  usda_id?: string | null
  fat: number
  calories: number
  proteins: number
  carbohydrates: number
  serving: number
  nutrients?: Record<string, number> | null
}

export interface FoodsListResponse {
  foods: Food[]
  count: number
}

// --- Diets (= Programs for nutrition) ---
export interface DietSection {
  id: string
  name: string
  description: string
  days: string[]
  foodNames: string[]
}

export interface Diet {
  id: string
  name: string
  sections: DietSection[]
}

// --- Meals (= Workout log for nutrition) ---
export interface MealFoodEntry {
  id: string
  foodId?: number
  foodName?: string
  amountGrams: number
  note?: string | null
}

export interface MealLogEntry {
  date: string
  foods: MealFoodEntry[]
}
