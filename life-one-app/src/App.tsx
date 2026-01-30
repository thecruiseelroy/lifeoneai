import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LibraryPage } from './features/library/LibraryPage'
import { ExercisePage } from './features/exercise-detail/ExercisePage'
import { ProgramsListPage } from './features/programs/ProgramsListPage'
import { ProgramDetailPage } from './features/programs/ProgramDetailPage'
import { SectionDetailPage } from './features/programs/SectionDetailPage'
import { FoodsLibraryPage } from './features/food-library/FoodsLibraryPage'
import { DietsListPage } from './features/diets/DietsListPage'
import { DietDetailPage } from './features/diets/DietDetailPage'
import { DietSectionDetailPage } from './features/diets/DietSectionDetailPage'
import { MealsPage } from './features/meals/MealsPage'
import { ProfileSelector } from './features/profile/ProfileSelector'
import { ProfilePage } from './features/profile/ProfilePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { LoginPage } from './features/auth/LoginPage'
import { MobileNav } from './components/MobileNav'
import { Dumbbell } from 'lucide-react'

function App() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isDashboard = location.pathname === '/'
  const isLibrary =
    location.pathname === '/library' || location.pathname.startsWith('/exercise')

  if (!loading && !user) {
    return <LoginPage />
  }

  return (
    <div className="app">
      <header className="app-bar">
        <div className="app-bar-inner">
          <Link to="/" className="logo">
            <Dumbbell size={28} strokeWidth={2} />
            <h1>Life ONE</h1>
          </Link>
          <MobileNav />
          <nav className="app-bar-nav">
            <Link
              to="/"
              className={`app-bar-link ${isDashboard ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/library"
              className={`app-bar-link ${isLibrary ? 'active' : ''}`}
            >
              Library
            </Link>
            <Link
              to="/programs"
              className={`app-bar-link ${location.pathname.startsWith('/programs') ? 'active' : ''}`}
            >
              Programs
            </Link>
            <Link
              to="/foods"
              className={`app-bar-link ${location.pathname === '/foods' ? 'active' : ''}`}
            >
              Foods
            </Link>
            <Link
              to="/diets"
              className={`app-bar-link ${location.pathname.startsWith('/diets') ? 'active' : ''}`}
            >
              Diets
            </Link>
            <Link
              to="/meals"
              className={`app-bar-link ${location.pathname === '/meals' ? 'active' : ''}`}
            >
              Meals
            </Link>
            <Link
              to="/profile"
              className={`app-bar-link ${location.pathname === '/profile' ? 'active' : ''}`}
            >
              Profile
            </Link>
            <Link
              to="/settings"
              className={`app-bar-link ${location.pathname === '/settings' ? 'active' : ''}`}
            >
              Settings
            </Link>
          </nav>
          <ProfileSelector />
        </div>
      </header>

      <div className="app-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/exercise/:exerciseSlug" element={<ExercisePage />} />
          <Route path="/programs" element={<ProgramsListPage />} />
          <Route path="/programs/:programId" element={<ProgramDetailPage />} />
          <Route
            path="/programs/:programId/sections/:sectionId"
            element={<SectionDetailPage />}
          />
          <Route path="/foods" element={<FoodsLibraryPage />} />
          <Route path="/diets" element={<DietsListPage />} />
          <Route path="/diets/:dietId" element={<DietDetailPage />} />
          <Route
            path="/diets/:dietId/sections/:sectionId"
            element={<DietSectionDetailPage />}
          />
          <Route path="/meals" element={<MealsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
