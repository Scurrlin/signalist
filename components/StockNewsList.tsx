import Link from 'next/link';

interface StockNewsListProps {
  symbol: string;
  articles: MarketNewsArticle[];
}

const formatStockNewsDate = (timestamp: number) => {
  if (!timestamp) return 'Recent';

  return new Date(timestamp * 1000).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const StockNewsList = ({ symbol, articles }: StockNewsListProps) => {
  const titleId = `${symbol.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-news-title`;

  return (
    <section className="stock-news-panel widget-overlay-frame" aria-labelledby={titleId}>
      <div className="stock-news-panel-header">
        <h3 id={titleId} className="stock-news-panel-title">
          <span className="stock-news-panel-symbol">{symbol.toUpperCase()}</span> News
        </h3>
      </div>

      <div className="stock-news-panel-scroll">
        {articles.length > 0 ? (
          <div className="stock-news-panel-list">
            {articles.map((article) => (
              <Link
                key={`${article.url}-${article.datetime}`}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="stock-news-panel-item"
              >
                <span className="news-tag">{(article.related || article.category || 'News').toUpperCase()}</span>
                <h4 className="news-title">{article.headline}</h4>
                <p className="news-meta">
                  {article.source} | {formatStockNewsDate(article.datetime)}
                </p>
                <p className="news-summary">{article.summary}</p>
                <span className="news-cta">Read More</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="stock-news-panel-empty">
            No recent news found for {symbol.toUpperCase()}.
          </div>
        )}
      </div>
    </section>
  );
};

export default StockNewsList;
