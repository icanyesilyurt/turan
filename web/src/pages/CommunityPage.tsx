import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PostCard from '../components/PostCard'

export default function CommunityPage() {
  const { t, user, posts, setPosts, isLoggedIn } = useApp()
  const navigate = useNavigate()
  const [showCompose, setShowCompose] = useState(false)
  const [newText, setNewText] = useState('')

  const handlePost = () => {
    if (!newText.trim() || !user) return
    const newPost = {
      id: `p${Date.now()}`,
      user_id: user.id,
      user,
      text: newText.trim(),
      likes_count: 0,
      comments_count: 0,
      reposts_count: 0,
      created_at: new Date().toISOString(),
      is_liked: false,
      is_saved: false,
    }
    setPosts(prev => [newPost, ...prev])
    setNewText('')
    setShowCompose(false)
  }

  const canPost = isLoggedIn && user && (user.membership_status === 'member' || user.membership_status === 'admin')

  return (
    <div className="page" style={{ padding: 0 }}>
      <div style={{ padding: '16px 16px 0' }}>
        <h1 className="page-title">{t('community_title')}</h1>
      </div>

      {canPost && (
        <div style={{ padding: '0 16px 12px' }}>
          {showCompose ? (
            <div className="compose-box">
              <textarea
                className="compose-textarea"
                placeholder={t('community_placeholder')}
                value={newText}
                onChange={e => setNewText(e.target.value)}
                autoFocus
              />
              <div className="compose-footer" style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => { setShowCompose(false); setNewText('') }}>
                  {t('cancel')}
                </button>
                <button className="btn btn-primary" onClick={handlePost} disabled={!newText.trim()}>
                  {t('community_write')}
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowCompose(true)} style={{ width: '100%', justifyContent: 'center' }}>
              ✏ {t('community_write')}
            </button>
          )}
        </div>
      )}

      {!isLoggedIn && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ background: 'var(--teal-glow)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 10 }}>{t('upgrade_prompt')}</p>
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>
              {t('login')}
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-text">{t('no_posts')}</div>
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onOpen={() => navigate(`/community/${post.id}`)}
          />
        ))
      )}
    </div>
  )
}
