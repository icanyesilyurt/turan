import { ContentItem } from '../types'
import { useApp } from '../context/AppContext'

interface Props {
  item: ContentItem
  label?: string
  onOpen?: () => void
}

export default function ContentCard({ item, label, onOpen }: Props) {
  const { t, savedContentIds, toggleSaveContent } = useApp()

  const isSaved = savedContentIds.includes(item.id)

  return (
    <div className="card" onClick={onOpen} style={{ cursor: onOpen ? 'pointer' : 'default' }}>
      {label && <div className="card-label">{label}</div>}
      <div className="card-title">{item.title}</div>
      <div className="card-desc">{item.short_description}</div>
      <div className="card-actions" onClick={e => e.stopPropagation()}>
        <button
          className={`btn-icon ${isSaved ? 'active' : ''}`}
          onClick={() => toggleSaveContent(item.id)}
          title={t('save')}
        >
          {isSaved ? '🔖' : '☆'}
        </button>
        <button className="btn-icon" title={t('share')}>↗</button>
        {onOpen && (
          <button
            className="btn btn-secondary"
            onClick={onOpen}
            style={{ marginLeft: 'auto', fontSize: 13 }}
          >
            {t('detail')} →
          </button>
        )}
      </div>
    </div>
  )
}
