import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const tabs = [
  { path: '/', key: 'tab_today', icon: '☀' },
  { path: '/content', key: 'tab_content', icon: '📚' },
  { path: '/community', key: 'tab_community', icon: '👥' },
  { path: '/saved', key: 'tab_saved', icon: '🔖' },
  { path: '/profile', key: 'tab_profile', icon: '👤' },
]

export default function BottomNav() {
  const { t } = useApp()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '10px 0',
            background: 'transparent',
            border: 'none',
            color: isActive(tab.path) ? 'var(--teal)' : 'var(--text-muted)',
            fontSize: 10,
            fontWeight: isActive(tab.path) ? 600 : 400,
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
        >
          <span style={{ fontSize: 22 }}>{tab.icon}</span>
          <span>{t(tab.key)}</span>
        </button>
      ))}
    </nav>
  )
}
