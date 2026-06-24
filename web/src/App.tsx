import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import TodayPage from './pages/TodayPage'
import ContentPage from './pages/ContentPage'
import ContentDetailPage from './pages/ContentDetailPage'
import CommunityPage from './pages/CommunityPage'
import PostDetailPage from './pages/PostDetailPage'
import SavedPage from './pages/SavedPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/content" element={<ContentPage />} />
            <Route path="/content/:id" element={<ContentDetailPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/:id" element={<PostDetailPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
