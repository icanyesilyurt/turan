import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PostCard from '../components/PostCard'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, posts, comments, setComments, user, isLoggedIn } = useApp()
  const [commentText, setCommentText] = useState('')

  const post = posts.find(p => p.id === id)
  const postComments = comments.filter(c => c.post_id === id)

  if (!post) {
    return (
      <div className="page">
        <button className="detail-back" onClick={() => navigate(-1)}>← {t('back')}</button>
        <div className="empty-state">
          <div className="empty-state-text">{t('no_posts')}</div>
        </div>
      </div>
    )
  }

  const canComment = isLoggedIn && user && (user.membership_status === 'member' || user.membership_status === 'admin')

  const handleComment = () => {
    if (!commentText.trim() || !user) return
    const newComment = {
      id: `cm${Date.now()}`,
      post_id: post.id,
      user_id: user.id,
      user,
      text: commentText.trim(),
      created_at: new Date().toISOString(),
    }
    setComments(prev => [...prev, newComment])
    setCommentText('')
  }

  return (
    <div className="page" style={{ padding: 0 }}>
      <div style={{ padding: '16px 16px 0' }}>
        <button className="detail-back" onClick={() => navigate(-1)}>← {t('back')}</button>
      </div>

      <PostCard post={post} showActions={true} />

      <div style={{ padding: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          {t('comments_title')} ({postComments.length})
        </h3>

        {canComment && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              className="input"
              placeholder={t('write_comment')}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
            />
            <button className="btn btn-primary" onClick={handleComment} disabled={!commentText.trim()}>
              {t('send')}
            </button>
          </div>
        )}

        {postComments.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 20 }}>
            {t('no_posts')}
          </div>
        ) : (
          postComments.map(c => (
            <div key={c.id} className="comment-card">
              <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                {c.user ? getInitials(c.user.display_name) : '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {c.user?.display_name}
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
                    @{c.user?.username}
                  </span>
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
