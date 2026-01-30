/**
 * API client for Life One backend. All requests are scoped by current profile name and send auth token when present.
 */
import * as authStore from './authStore'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8765'

export function getApiBase(): string {
  return API_BASE
}

export function getCurrentProfile(): string | null {
  return authStore.getProfileName()
}

export function setCurrentProfile(_name: string | null): void {
  // No-op when using auth; profile comes from logged-in user. Kept for API compatibility.
}

/** Headers to attach to any fetch to the API when logged in (Authorization Bearer). */
export function getAuthHeaders(): Record<string, string> {
  const token = authStore.getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

/** Call after fetch(); clears auth and notifies app on 401 so user is sent back to login. */
export function checkAuthResponse(res: Response): void {
  if (res.status === 401 && authStore.getToken()) {
    authStore.clearAuth()
    window.dispatchEvent(new CustomEvent('life-one-401'))
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...init } = options
  let url = `${API_BASE}${path}`
  if (params && Object.keys(params).length > 0) {
    const search = new URLSearchParams(params).toString()
    url += (path.includes('?') ? '&' : '?') + search
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  const token = authStore.getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, {
    ...init,
    headers,
  })
  if (res.status === 401 && token) {
    authStore.clearAuth()
    window.dispatchEvent(new CustomEvent('life-one-401'))
  }
  if (!res.ok) {
    const text = await res.text()
    let detail = text
    try {
      const j = JSON.parse(text)
      detail = j.detail ?? text
    } catch {
      // use text
    }
    throw new Error(detail)
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }
  return res.json() as Promise<T>
}

function profilePath(profileName: string, suffix: string): string {
  const encoded = encodeURIComponent(profileName)
  return `/api/profiles/${encoded}${suffix}`
}

// --- Profiles
export async function apiListProfiles(): Promise<{ id: string; name: string }[]> {
  return request('/api/profiles')
}

export async function apiGetProfile(name: string): Promise<{ id: string; name: string }> {
  return request(profilePath(name, ''))
}

export async function apiCreateProfile(name: string): Promise<{ id: string; name: string }> {
  return request('/api/profiles', { method: 'POST', body: JSON.stringify({ name: name.trim() }) })
}

/** Ensure profile exists in DB (create if missing). Call when using profileName so localStorage name is synced to SQL. */
export async function ensureProfileExists(name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) return
  try {
    await apiGetProfile(trimmed)
  } catch {
    await apiCreateProfile(trimmed)
  }
}

// --- Profile handoff sheet (RAG context for coach) ---
export async function apiGetProfileSheet(profileName: string): Promise<{ content: string; updated_at: string | null }> {
  return request(profilePath(profileName, '/coach/profile-sheet'))
}

export async function apiUploadProfileSheet(
  profileName: string,
  file: File
): Promise<{ updated_at: string; length: number }> {
  const path = profilePath(profileName, '/coach/profile-sheet')
  const form = new FormData()
  form.append('file', file)
  const headers: Record<string, string> = {}
  const token = authStore.getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers,
    body: form,
  })
  checkAuthResponse(res)
  if (!res.ok) {
    const text = await res.text()
    let detail = text
    try {
      const j = JSON.parse(text)
      detail = j.detail ?? text
    } catch {
      // use text
    }
    throw new Error(detail)
  }
  return res.json()
}

// --- Programs
export async function apiGetPrograms(profileName: string): Promise<ProgramResponse[]> {
  return request(profilePath(profileName, '/programs'))
}

export async function apiGetProgram(profileName: string, programId: string): Promise<ProgramResponse> {
  return request(profilePath(profileName, `/programs/${programId}`))
}

export async function apiCreateProgram(profileName: string, name: string): Promise<ProgramResponse> {
  return request(profilePath(profileName, '/programs'), {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function apiUpdateProgram(
  profileName: string,
  programId: string,
  body: { name?: string }
): Promise<ProgramResponse> {
  return request(profilePath(profileName, `/programs/${programId}`), {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function apiDeleteProgram(profileName: string, programId: string): Promise<void> {
  return request(profilePath(profileName, `/programs/${programId}`), { method: 'DELETE' })
}

export async function apiAddSection(
  profileName: string,
  programId: string,
  section: { name: string; description: string; days: string[] }
): Promise<ProgramResponse> {
  return request(profilePath(profileName, `/programs/${programId}/sections`), {
    method: 'POST',
    body: JSON.stringify(section),
  })
}

export async function apiUpdateSection(
  profileName: string,
  programId: string,
  sectionId: string,
  patch: { name?: string; description?: string; days?: string[] }
): Promise<ProgramResponse> {
  return request(profilePath(profileName, `/programs/${programId}/sections/${sectionId}`), {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}

export async function apiDeleteSection(
  profileName: string,
  programId: string,
  sectionId: string
): Promise<ProgramResponse> {
  return request(profilePath(profileName, `/programs/${programId}/sections/${sectionId}`), {
    method: 'DELETE',
  })
}

export async function apiAddExercisesToSection(
  profileName: string,
  programId: string,
  sectionId: string,
  exerciseNames: string[],
  avoidDuplicates = true
): Promise<ProgramResponse> {
  return request(profilePath(profileName, `/programs/${programId}/sections/${sectionId}/exercises`), {
    method: 'POST',
    body: JSON.stringify({ exerciseNames, avoidDuplicates }),
  })
}

export async function apiRemoveExerciseFromSection(
  profileName: string,
  programId: string,
  sectionId: string,
  exerciseName: string
): Promise<ProgramResponse> {
  return request(
    profilePath(profileName, `/programs/${programId}/sections/${sectionId}/exercises/${encodeURIComponent(exerciseName)}`),
    { method: 'DELETE' }
  )
}

export async function apiReorderExercisesInSection(
  profileName: string,
  programId: string,
  sectionId: string,
  exerciseNames: string[]
): Promise<ProgramResponse> {
  return request(profilePath(profileName, `/programs/${programId}/sections/${sectionId}/exercises/reorder`), {
    method: 'PUT',
    body: JSON.stringify({ exerciseNames }),
  })
}

export interface ProgramSectionResponse {
  id: string
  name: string
  description: string
  days: string[]
  exerciseNames: string[]
}

export interface ProgramResponse {
  id: string
  name: string
  sections: ProgramSectionResponse[]
}

// --- Workout logs
export interface WorkoutLogEntryResponse {
  exerciseName: string
  date: string
  sets: { reps: number; weight?: number; note?: string }[]
}

export async function apiGetWorkoutLogs(
  profileName: string,
  exerciseName?: string
): Promise<WorkoutLogEntryResponse[]> {
  const path = profilePath(profileName, '/workout-logs')
  const url = exerciseName
    ? `${path}?exerciseName=${encodeURIComponent(exerciseName)}`
    : path
  return request(url)
}

export async function apiGetLogForDate(
  profileName: string,
  exerciseName: string,
  date: string
): Promise<WorkoutLogEntryResponse> {
  return request(
    profilePath(profileName, `/workout-logs/${encodeURIComponent(exerciseName)}/dates/${date}`)
  )
}

export async function apiGetOrCreateLog(
  profileName: string,
  exerciseName: string,
  date: string
): Promise<WorkoutLogEntryResponse> {
  return request(profilePath(profileName, '/workout-logs'), {
    method: 'POST',
    body: JSON.stringify({ exerciseName, date }),
  })
}

export async function apiGetLastDate(
  profileName: string,
  exerciseName: string
): Promise<{ date: string | null }> {
  return request(profilePath(profileName, '/workout-logs/last-date'), {
    params: { exerciseName },
  })
}

export async function apiAddSet(
  profileName: string,
  exerciseName: string,
  date: string,
  set: { reps: number; weight?: number; note?: string }
): Promise<WorkoutLogEntryResponse> {
  return request(profilePath(profileName, '/workout-logs/sets'), {
    method: 'POST',
    body: JSON.stringify({ exerciseName, date, set }),
  })
}

export async function apiUpdateSet(
  profileName: string,
  exerciseName: string,
  date: string,
  setIndex: number,
  set: Partial<{ reps: number; weight?: number; note?: string }>
): Promise<WorkoutLogEntryResponse> {
  return request(profilePath(profileName, '/workout-logs/sets'), {
    method: 'PUT',
    body: JSON.stringify({ exerciseName, date, setIndex, set }),
  })
}

// --- Foods ---
export interface FoodResponse {
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

export async function apiListFoods(
  q?: string,
  limit = 100,
  offset = 0
): Promise<{ foods: FoodResponse[]; count: number }> {
  const params: Record<string, string> = { limit: String(limit), offset: String(offset) }
  if (q != null && q.trim()) params.q = q.trim()
  const search = new URLSearchParams(params).toString()
  return request(`/api/foods?${search}`)
}

export async function apiGetFood(foodId: string | number): Promise<{ food: FoodResponse | null }> {
  return request(`/api/foods/${encodeURIComponent(String(foodId))}`)
}

// --- Diets ---
export interface DietSectionResponse {
  id: string
  name: string
  description: string
  days: string[]
  foodNames: string[]
}

export interface DietResponse {
  id: string
  name: string
  sections: DietSectionResponse[]
}

export async function apiGetDiets(profileName: string): Promise<DietResponse[]> {
  return request(profilePath(profileName, '/diets'))
}

export async function apiGetDiet(profileName: string, dietId: string): Promise<DietResponse> {
  return request(profilePath(profileName, `/diets/${dietId}`))
}

export async function apiCreateDiet(profileName: string, name: string): Promise<DietResponse> {
  return request(profilePath(profileName, '/diets'), {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function apiUpdateDiet(
  profileName: string,
  dietId: string,
  body: { name?: string }
): Promise<DietResponse> {
  return request(profilePath(profileName, `/diets/${dietId}`), {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function apiDeleteDiet(profileName: string, dietId: string): Promise<void> {
  return request(profilePath(profileName, `/diets/${dietId}`), { method: 'DELETE' })
}

export async function apiAddDietSection(
  profileName: string,
  dietId: string,
  section: { name: string; description: string; days: string[] }
): Promise<DietResponse> {
  return request(profilePath(profileName, `/diets/${dietId}/sections`), {
    method: 'POST',
    body: JSON.stringify(section),
  })
}

export async function apiUpdateDietSection(
  profileName: string,
  dietId: string,
  sectionId: string,
  patch: { name?: string; description?: string; days?: string[] }
): Promise<DietResponse> {
  return request(profilePath(profileName, `/diets/${dietId}/sections/${sectionId}`), {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}

export async function apiDeleteDietSection(
  profileName: string,
  dietId: string,
  sectionId: string
): Promise<DietResponse> {
  return request(profilePath(profileName, `/diets/${dietId}/sections/${sectionId}`), {
    method: 'DELETE',
  })
}

export async function apiAddFoodsToDietSection(
  profileName: string,
  dietId: string,
  sectionId: string,
  foodNames: string[],
  avoidDuplicates = true
): Promise<DietResponse> {
  return request(profilePath(profileName, `/diets/${dietId}/sections/${sectionId}/foods`), {
    method: 'POST',
    body: JSON.stringify({ foodNames, avoidDuplicates }),
  })
}

export async function apiRemoveFoodFromDietSection(
  profileName: string,
  dietId: string,
  sectionId: string,
  foodName: string
): Promise<DietResponse> {
  return request(
    profilePath(profileName, `/diets/${dietId}/sections/${sectionId}/foods/${encodeURIComponent(foodName)}`),
    { method: 'DELETE' }
  )
}

export async function apiReorderFoodsInDietSection(
  profileName: string,
  dietId: string,
  sectionId: string,
  foodNames: string[]
): Promise<DietResponse> {
  return request(profilePath(profileName, `/diets/${dietId}/sections/${sectionId}/foods/reorder`), {
    method: 'PUT',
    body: JSON.stringify({ foodNames }),
  })
}

// --- Meal logs ---
export interface MealFoodEntryResponse {
  id: string
  foodId?: number
  foodName?: string
  amountGrams: number
  note?: string | null
}

export interface MealLogEntryResponse {
  date: string
  foods: MealFoodEntryResponse[]
}

export async function apiGetMealLogs(
  profileName: string,
  opts?: { date?: string; dateFrom?: string; dateTo?: string }
): Promise<MealLogEntryResponse[]> {
  const params: Record<string, string> = {}
  if (opts?.date) params.date = opts.date
  if (opts?.dateFrom) params.dateFrom = opts.dateFrom
  if (opts?.dateTo) params.dateTo = opts.dateTo
  const search = new URLSearchParams(params).toString()
  const path = profilePath(profileName, '/meal-logs')
  const url = search ? `${path}?${search}` : path
  return request(url)
}

export async function apiGetMealLogForDate(
  profileName: string,
  date: string
): Promise<MealLogEntryResponse> {
  return request(profilePath(profileName, `/meal-logs/dates/${encodeURIComponent(date)}`))
}

export async function apiCreateMealLog(
  profileName: string,
  date: string
): Promise<MealLogEntryResponse> {
  return request(profilePath(profileName, '/meal-logs'), {
    method: 'POST',
    body: JSON.stringify({ date }),
  })
}

export async function apiAddFoodToMealLog(
  profileName: string,
  date: string,
  body: { foodId?: number; foodName?: string; amountGrams?: number; note?: string }
): Promise<MealLogEntryResponse> {
  return request(profilePath(profileName, '/meal-logs/foods'), {
    method: 'POST',
    body: JSON.stringify({ date, ...body }),
  })
}

export async function apiUpdateMealFood(
  profileName: string,
  foodEntryId: string,
  body: { amountGrams?: number; note?: string }
): Promise<MealLogEntryResponse> {
  return request(profilePath(profileName, `/meal-logs/foods/${foodEntryId}`), {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function apiDeleteMealFood(
  profileName: string,
  foodEntryId: string
): Promise<MealLogEntryResponse> {
  return request(profilePath(profileName, `/meal-logs/foods/${foodEntryId}`), {
    method: 'DELETE',
  })
}
