import PageHeader from '../components/PageHeader'
import NewsApp from '../news/NewsApp'
import './NewsPage.css'

export default function NewsPage() {
  return (
    <div className="news-page">
      <PageHeader title="Global News" className="news-page-header" />
      <NewsApp />
    </div>
  )
}
