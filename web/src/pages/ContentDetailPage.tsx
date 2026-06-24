import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ContentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, contents, savedContentIds, toggleSaveContent } = useApp()

  const item = contents.find(c => c.id === id)

  if (!item) {
    return (
      <div className="page">
        <button className="detail-back" onClick={() => navigate(-1)}>← {t('back')}</button>
        <div className="empty-state">
          <div className="empty-state-text">{t('no_content')}</div>
        </div>
      </div>
    )
  }

  const isSaved = savedContentIds.includes(item.id)

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        ← {t('back')}
      </button>

      <div className="card-label">{item.category_id}</div>
      <h1 className="detail-title">{item.title}</h1>
      <div className="detail-meta">
        <span>{new Date(item.published_at).toLocaleDateString('tr-TR')}</span>
      </div>
      <p className="detail-content">{item.content}</p>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button
          className={`btn ${isSaved ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => toggleSaveContent(item.id)}
        >
          {isSaved ? '🔖' : '☆'} {t('save')}
        </button>
        <button className="btn btn-secondary">↗ {t('share')}</button>
      </div>
    </div>
  )
}
