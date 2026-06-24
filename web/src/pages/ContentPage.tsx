import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ContentCard from '../components/ContentCard'
import { demoLanguageComparisons } from '../data/demo'

const categories = [
  { id: 'history', key: 'cat_history', icon: '🏛' },
  { id: 'culture', key: 'cat_culture', icon: '🎭' },
  { id: 'language', key: 'cat_language', icon: '🗣' },
  { id: 'cities', key: 'cat_cities', icon: '🌆' },
  { id: 'personalities', key: 'cat_personalities', icon: '👤' },
  { id: 'literature', key: 'cat_literature', icon: '📖' },
  { id: 'traditions', key: 'cat_traditions', icon: '🎪' },
  { id: 'news', key: 'cat_news', icon: '📰' },
]

export default function ContentPage() {
  const { t, contents } = useApp()
  const navigate = useNavigate()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  if (selectedCat === 'language') {
    return (
      <div className="page">
        <button className="detail-back" onClick={() => setSelectedCat(null)}>
          ← {t('back')}
        </button>
        <h1 className="page-title">{t('cat_language')}</h1>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
          {t('lang_comparison')}
        </h2>
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
          <table className="lang-table">
            <thead>
              <tr>
                <th>Anlam</th>
                <th>TR</th>
                <th>AZ</th>
                <th>KK</th>
                <th>KY</th>
                <th>UZ</th>
                <th>TK</th>
              </tr>
            </thead>
            <tbody>
              {demoLanguageComparisons.map(row => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 500, color: 'var(--teal)' }}>{row.meaning}</td>
                  <td>{row.tr}</td>
                  <td>{row.az}</td>
                  <td>{row.kk}</td>
                  <td>{row.ky}</td>
                  <td>{row.uz}</td>
                  <td>{row.tk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 20 }}>
          {contents.filter(c => c.category_id === 'language').map(item => (
            <ContentCard
              key={item.id}
              item={item}
              onOpen={() => navigate(`/content/${item.id}`)}
            />
          ))}
        </div>
      </div>
    )
  }

  if (selectedCat) {
    const catItems = contents.filter(c => c.category_id === selectedCat)
    const cat = categories.find(c => c.id === selectedCat)
    return (
      <div className="page">
        <button className="detail-back" onClick={() => setSelectedCat(null)}>
          ← {t('back')}
        </button>
        <h1 className="page-title">{cat ? t(cat.key) : selectedCat}</h1>
        {catItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">{t('no_content')}</div>
          </div>
        ) : (
          catItems.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              onOpen={() => navigate(`/content/${item.id}`)}
            />
          ))
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">{t('tab_content')}</h1>
      <div className="category-grid">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="category-card"
            onClick={() => setSelectedCat(cat.id)}
          >
            <div className="category-icon">{cat.icon}</div>
            <div className="category-name">{t(cat.key)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
