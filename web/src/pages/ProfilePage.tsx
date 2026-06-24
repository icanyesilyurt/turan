import { useState } from 'react'
import { useApp } from '../context/AppContext'
import PostCard from '../components/PostCard'
import { AppLanguage, Theme } from '../types'
import { demoUser } from '../data/demo'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const languageNames: Record<AppLanguage, string> = {
  tr: 'Türkçe',
  az: 'Azerbaycanca',
  kk: 'Қазақша',
  ky: 'Кыргызча',
  uz: "O'zbekcha",
  tk: 'Türkmençe',
}

export default function ProfilePage() {
  const { t, user, setUser, isLoggedIn, posts, language, setLanguage, theme, setTheme } = useApp()
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const [loginEmail, setLoginEmail] = useState('ahmet@turan.app')
  const [loginPass, setLoginPass] = useState('123456')
  const [regForm, setRegForm] = useState({
    email: '', password: '', display_name: '', username: '', country: '', city: '',
  })

  const handleLogin = () => {
    setUser(demoUser)
    setShowLogin(false)
  }

  const handleRegister = () => {
    const newUser = {
      ...demoUser,
      id: `u${Date.now()}`,
      email: regForm.email,
      display_name: regForm.display_name || 'Yeni Kullanıcı',
      username: regForm.username || 'user' + Date.now(),
      country: regForm.country || 'Türkiye',
      city: regForm.city || 'İstanbul',
      app_language: language,
      theme,
    }
    setUser(newUser)
    setShowRegister(false)
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (!isLoggedIn) {
    return (
      <div className="page">
        <h1 className="page-title">{t('profile_title')}</h1>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏔</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{t('welcome')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            {t('upgrade_prompt')}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => setShowLogin(true)}>
              {t('login')}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowRegister(true)}>
              {t('register')}
            </button>
          </div>

          <div style={{ marginTop: 32, textAlign: 'left' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{t('settings')}</h3>
            <div className="input-group">
              <label className="input-label">{t('language')}</label>
              <select className="select" value={language} onChange={e => setLanguage(e.target.value as AppLanguage)}>
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">{t('theme')}</label>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <button className={`tab ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                  {t('theme_dark')}
                </button>
                <button className={`tab ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                  {t('theme_light')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showLogin && (
          <div className="modal-overlay" onClick={() => setShowLogin(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">{t('login')}</h2>
              <div className="input-group">
                <label className="input-label">{t('email')}</label>
                <input className="input" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('password')}</label>
                <input className="input" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => setShowLogin(false)}>{t('cancel')}</button>
                <button className="btn btn-primary" onClick={handleLogin}>{t('login')}</button>
              </div>
            </div>
          </div>
        )}

        {showRegister && (
          <div className="modal-overlay" onClick={() => setShowRegister(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">{t('register')}</h2>
              <div className="input-group">
                <label className="input-label">{t('email')}</label>
                <input className="input" type="email" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('password')}</label>
                <input className="input" type="password" value={regForm.password} onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('display_name')}</label>
                <input className="input" value={regForm.display_name} onChange={e => setRegForm(p => ({ ...p, display_name: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('username')}</label>
                <input className="input" value={regForm.username} onChange={e => setRegForm(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('country')}</label>
                <input className="input" value={regForm.country} onChange={e => setRegForm(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('city')}</label>
                <input className="input" value={regForm.city} onChange={e => setRegForm(p => ({ ...p, city: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => setShowRegister(false)}>{t('cancel')}</button>
                <button className="btn btn-primary" onClick={handleRegister}>{t('register')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const userPosts = posts.filter(p => p.user_id === user!.id)

  return (
    <div className="page" style={{ padding: 0 }}>
      <div style={{ padding: 16 }}>
        <div className="profile-header">
          <div className="avatar avatar-lg" style={{ margin: '0 auto 12px' }}>
            {getInitials(user!.display_name)}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{user!.display_name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>@{user!.username}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>{user!.bio}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            📍 {user!.city}, {user!.country}
          </p>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">{userPosts.length}</div>
              <div className="profile-stat-label">{t('profile_posts')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setShowSettings(!showSettings)}>
              ⚙ {t('settings')}
            </button>
            <button className="btn btn-secondary" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </div>

        {showSettings && (
          <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{t('settings')}</h3>
            <div className="input-group">
              <label className="input-label">{t('language')}</label>
              <select className="select" value={language} onChange={e => setLanguage(e.target.value as AppLanguage)}>
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">{t('theme')}</label>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <button className={`tab ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                  {t('theme_dark')}
                </button>
                <button className={`tab ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                  {t('theme_light')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, padding: '0 16px 12px' }}>{t('profile_posts')}</h3>
        {userPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">{t('no_posts')}</div>
          </div>
        ) : (
          userPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  )
}
