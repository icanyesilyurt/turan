import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ContentCard from '../components/ContentCard'
import PostCard from '../components/PostCard'

export default function SavedPage() {
  const { t, contents, posts, savedContentIds, savedPostIds } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'contents' | 'posts'>('contents')

  const savedContents = contents.filter(c => savedContentIds.includes(c.id))
  const savedPosts = posts.filter(p => savedPostIds.includes(p.id))

  return (
    <div className="page">
      <h1 className="page-title">{t('saved_title')}</h1>

      <div className="tabs">
        <button className={`tab ${tab === 'contents' ? 'active' : ''}`} onClick={() => setTab('contents')}>
          {t('saved_contents')}
        </button>
        <button className={`tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>
          {t('saved_posts')}
        </button>
      </div>

      {tab === 'contents' && (
        savedContents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📑</div>
            <div className="empty-state-text">{t('saved_empty')}</div>
          </div>
        ) : (
          savedContents.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              onOpen={() => navigate(`/content/${item.id}`)}
            />
          ))
        )
      )}

      {tab === 'posts' && (
        savedPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-text">{t('posts_empty')}</div>
          </div>
        ) : (
          savedPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onOpen={() => navigate(`/community/${post.id}`)}
            />
          ))
        )
      )}
    </div>
  )
}
