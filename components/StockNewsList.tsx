import Link from 'next/link';
import Image from 'next/image';

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
              <article key={`${article.url}-${article.datetime}`} className="stock-news-panel-item">
                <h4 className="stock-news-panel-item-title">
                  <Link
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stock-news-panel-title-link"
                  >
                    {article.headline}
                  </Link>
                </h4>
                <p className="news-meta">
                  {article.source} | {formatStockNewsDate(article.datetime)}
                </p>
                <p className="stock-news-panel-item-summary">{article.summary}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="stock-news-panel-empty">
            <Image
              src="/assets/icons/Finnhub.png"
              alt=""
              width={804}
              height={512}
              className="stock-news-panel-empty-icon"
              aria-hidden="true"
            />
            <span>No recent news found for {symbol.toUpperCase()}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default StockNewsList;
