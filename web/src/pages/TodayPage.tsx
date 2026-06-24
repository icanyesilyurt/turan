import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ContentCard from '../components/ContentCard'
import { DailyFeedType } from '../types'

const feedTypeKeys: Record<DailyFeedType, string> = {
  quote: 'daily_quote',
  history: 'daily_history',
  personality: 'daily_personality',
  city: 'daily_city',
  culture: 'daily_culture',
  words: 'daily_words',
  news: 'daily_news',
}

export default function TodayPage() {
  const { t, contents } = useApp()
  const navigate = useNavigate()

  const dailyItems = contents.filter(c => c.show_in_daily_feed && c.daily_feed_type)

  const orderedTypes: DailyFeedType[] = ['quote', 'history', 'personality', 'city', 'culture', 'words', 'news']

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>{t('today_title')}</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {orderedTypes.map(type => {
        const item = dailyItems.find(c => c.daily_feed_type === type)
        if (!item) return null
        return (
          <ContentCard
            key={item.id}
            item={item}
            label={t(feedTypeKeys[type])}
            onOpen={() => navigate(`/content/${item.id}`)}
          />
        )
      })}
    </div>
  )
}
