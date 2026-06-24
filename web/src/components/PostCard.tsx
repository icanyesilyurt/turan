import { CommunityPost } from '../types'
import { useApp } from '../context/AppContext'

interface Props {
  post: CommunityPost
  onOpen?: () => void
  showActions?: boolean
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function PostCard({ post, onOpen, showActions = true }: Props) {
  const { t, toggleLikePost, toggleSavePost } = useApp()

  return (
    <div className="post-card" onClick={onOpen} style={{ cursor: onOpen ? 'pointer' : 'default' }}>
      <div className="post-header">
        <div className="avatar">
          {post.user ? getInitials(post.user.display_name) : '?'}
        </div>
        <div className="post-user-info">
          <div className="post-display-name">{post.user?.display_name}</div>
          <div className="post-username">@{post.user?.username} · {timeAgo(post.created_at)}</div>
        </div>
      </div>
      <div className="post-text">{post.text}</div>
      {post.quoted_post && (
        <div className="quoted-post">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {post.quoted_post.user?.display_name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {post.quoted_post.text.slice(0, 100)}...
          </div>
        </div>
      )}
      {showActions && (
        <div className="post-actions" onClick={e => e.stopPropagation()}>
          <button
            className={`post-action ${post.is_liked ? 'liked' : ''}`}
            onClick={() => toggleLikePost(post.id)}
          >
            {post.is_liked ? '❤' : '♡'} {post.likes_count}
          </button>
          <button className="post-action" onClick={onOpen}>
            💬 {post.comments_count}
          </button>
          <button className="post-action">
            🔄 {post.reposts_count}
          </button>
          <button
            className={`post-action ${post.is_saved ? 'saved' : ''}`}
            onClick={() => toggleSavePost(post.id)}
          >
            {post.is_saved ? '🔖' : '☆'} {t('save')}
          </button>
        </div>
      )}
    </div>
  )
}
