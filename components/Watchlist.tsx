'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, RefreshCw, Trash2 } from 'lucide-react';
import { removeFromWatchlist, updateWatchlistNewsPreference } from '@/lib/actions/watchlist.actions';
import { getNews } from '@/lib/actions/finnhub.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import SearchCommand from './SearchCommand';

interface WatchlistProps {
  initialStocks: StockWithData[];
  initialSearchStocks: StockWithWatchlistStatus[];
  news: MarketNewsArticle[];
  userId: string;
}

type SortKey = 'company' | 'symbol' | 'price' | 'change' | 'marketCap' | 'peRatio';
type SortDirection = 'desc' | 'asc';

const getCurrencyValue = (value?: string) => {
  if (!value) return null;

  const multiplier = value.endsWith('T') ? 1_000_000_000_000
    : value.endsWith('B') ? 1_000_000_000
      : value.endsWith('M') ? 1_000_000
        : 1;
  const numeric = Number(value.replace(/[$,TBM]/g, ''));

  return Number.isFinite(numeric) ? numeric * multiplier : null;
};

const compareNullableNumbers = (a: number | null | undefined, b: number | null | undefined) => {
  const hasA = typeof a === 'number' && Number.isFinite(a);
  const hasB = typeof b === 'number' && Number.isFinite(b);

  if (!hasA && !hasB) return 0;
  if (!hasA) return 1;
  if (!hasB) return -1;

  return a - b;
};

const formatNewsDate = (timestamp: number) => {
  if (!timestamp) return 'Recent';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp * 1000));
};

const Watchlist = ({ initialStocks, initialSearchStocks, news, userId }: WatchlistProps) => {
  const [stocks, setStocks] = useState(initialStocks);
  const [currentNews, setCurrentNews] = useState(news);
  const [newsEmptyMessage, setNewsEmptyMessage] = useState(
    initialStocks.some(stock => stock.newsEnabled !== false)
      ? 'No watchlist news is available right now.'
      : 'No News is Good News'
  );
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);
  const [updatingNewsSymbol, setUpdatingNewsSymbol] = useState<string | null>(null);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [sortState, setSortState] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setStocks(initialStocks);
  }, [initialStocks]);

  const sortedStocks = sortState
    ? [...stocks].sort((a, b) => {
      const directionMultiplier = sortState.direction === 'desc' ? -1 : 1;
      let result = 0;

      switch (sortState.key) {
        case 'company':
          result = a.company.localeCompare(b.company);
          break;
        case 'symbol':
          result = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          result = compareNullableNumbers(a.currentPrice, b.currentPrice);
          break;
        case 'change':
          result = compareNullableNumbers(a.changePercent, b.changePercent);
          break;
        case 'marketCap':
          result = compareNullableNumbers(getCurrencyValue(a.marketCap), getCurrencyValue(b.marketCap));
          break;
        case 'peRatio':
          result = compareNullableNumbers(Number(a.peRatio), Number(b.peRatio));
          break;
      }

      if (result === 0) {
        return a.symbol.localeCompare(b.symbol);
      }

      if (sortState.key === 'price' || sortState.key === 'change' || sortState.key === 'marketCap' || sortState.key === 'peRatio') {
        const aValue = sortState.key === 'price' ? a.currentPrice
          : sortState.key === 'change' ? a.changePercent
            : sortState.key === 'marketCap' ? getCurrencyValue(a.marketCap)
              : Number(a.peRatio);
        const bValue = sortState.key === 'price' ? b.currentPrice
          : sortState.key === 'change' ? b.changePercent
            : sortState.key === 'marketCap' ? getCurrencyValue(b.marketCap)
              : Number(b.peRatio);
        const aMissing = typeof aValue !== 'number' || !Number.isFinite(aValue);
        const bMissing = typeof bValue !== 'number' || !Number.isFinite(bValue);

        if (aMissing || bMissing) {
          return result;
        }
      }

      return result * directionMultiplier;
    })
    : stocks;

  const handleSort = (key: SortKey) => {
    setSortState(prev => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'desc' };
      }

      return { key, direction: prev.direction === 'desc' ? 'asc' : 'desc' };
    });
  };

  const handleResetSort = () => {
    setSortState(null);
  };

  const renderSortButton = (key: SortKey, label: string) => {
    const isActive = sortState?.key === key;
    const SortIcon = isActive
      ? sortState.direction === 'desc'
        ? ArrowDown
        : ArrowUp
      : ChevronsUpDown;

    return (
      <button
        type="button"
        onClick={() => handleSort(key)}
        className="watchlist-sort-btn"
        aria-label={`Sort by ${label}`}
      >
        <span>{label}</span>
        <SortIcon className="h-3.5 w-3.5" />
      </button>
    );
  };

  const selectedNewsSymbols = stocks
    .filter(stock => stock.newsEnabled !== false)
    .map(stock => stock.symbol);

  const handleNewsPreferenceChange = async (symbol: string, newsEnabled: boolean) => {
    const previousStocks = stocks;

    setUpdatingNewsSymbol(symbol);
    setStocks(prev =>
      prev.map(stock =>
        stock.symbol === symbol ? { ...stock, newsEnabled } : stock
      )
    );

    const result = await updateWatchlistNewsPreference(symbol, newsEnabled);

    if (!result.success) {
      setStocks(previousStocks);
      toast.error(result.error || 'Failed to update news preference');
    }

    setUpdatingNewsSymbol(null);
  };

  const handleRefreshNews = async () => {
    if (selectedNewsSymbols.length === 0) {
      setCurrentNews([]);
      setNewsEmptyMessage('No News is Good News');
      return;
    }

    setIsRefreshingNews(true);

    try {
      const nextNews = await getNews(selectedNewsSymbols, 12);
      setCurrentNews(nextNews);
      setNewsEmptyMessage('No watchlist news is available right now.');
    } catch {
      toast.error('Failed to refresh news');
    } finally {
      setIsRefreshingNews(false);
    }
  };

  const handleRemove = async (symbol: string) => {
    if (removingSymbol) return;

    setRemovingSymbol(symbol);
    setStocks(prev => prev.filter(s => s.symbol !== symbol));

    const result = await removeFromWatchlist(symbol);

    if (result.success) {
      toast.success('Removed from watchlist');
      startTransition(() => {
        router.refresh();
      });
    } else {
      setStocks(initialStocks);
      toast.error(result.error || 'Failed to remove from watchlist');
    }

    setRemovingSymbol(null);
  };

  const handleSearchWatchlistToggle = (stock: StockWithWatchlistStatus, isAdded: boolean) => {
    const symbol = stock.symbol.toUpperCase();

    setStocks(prev => {
      if (!isAdded) {
        return prev.filter(item => item.symbol !== symbol);
      }

      if (prev.some(item => item.symbol === symbol)) {
        return prev;
      }

      return [
        {
          userId,
          symbol,
          company: stock.name || symbol,
          addedAt: new Date(),
          newsEnabled: true,
        },
        ...prev,
      ];
    });
  };

  if (stocks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-white mb-2">
            Your watchlist is empty
          </h3>
          <p className="text-gray-400">
            Search for stocks and add them to your watchlist to track their performance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-dashboard">
      <section className="watchlist-panel">
        <div className="watchlist-panel-header">
          <h1 className="watchlist-title">Watchlist</h1>
          <div className="watchlist-header-actions">
            <SearchCommand
              initialStocks={initialSearchStocks}
              label="Add Stock"
              userId={userId}
              watchlistSymbols={stocks.map(stock => stock.symbol)}
              onWatchlistToggle={handleSearchWatchlistToggle}
            />
            <button
              type="button"
              onClick={handleResetSort}
              disabled={!sortState}
              className="search-btn watchlist-reset-btn"
              title="Reset sort"
              aria-label="Reset sort"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="watchlist-table-scroll">
          <table className="watchlist-table">
            <thead>
              <tr className="table-header-row">
                <th className="table-header">{renderSortButton('company', 'Company')}</th>
                <th className="table-header">{renderSortButton('symbol', 'Symbol')}</th>
                <th className="table-header">{renderSortButton('price', 'Price')}</th>
                <th className="table-header">{renderSortButton('change', 'Change')}</th>
                <th className="table-header">{renderSortButton('marketCap', 'Market Cap')}</th>
                <th className="table-header">{renderSortButton('peRatio', 'P/E Ratio')}</th>
                <th className="table-header">
                  <button
                    type="button"
                    onClick={handleRefreshNews}
                    disabled={isRefreshingNews}
                    className="watchlist-news-header"
                    title="Refresh news"
                    aria-label="Refresh news"
                  >
                    <span>News</span>
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingNews ? 'animate-spin' : ''}`} />
                  </button>
                </th>
                <th className="table-header text-right" aria-label="Remove" />
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map((stock) => {
                const stockHref = `/stocks/${encodeURIComponent(stock.symbol)}`;
                const isPositive = (stock.changePercent ?? 0) >= 0;

                return (
                  <tr key={stock.symbol} className="table-row">
                    <td className="table-cell">
                      <Link href={stockHref} className="watchlist-row-link">
                        <span className="watchlist-company" title={stock.company}>{stock.company}</span>
                      </Link>
                    </td>
                    <td className="table-cell">
                      <Link href={stockHref} className="watchlist-row-link watchlist-symbol">
                        {stock.symbol}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <Link href={stockHref} className="watchlist-row-link">
                        {stock.priceFormatted || '-'}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <Link href={stockHref} className={`watchlist-row-link ${isPositive ? 'watchlist-change-positive' : 'watchlist-change-negative'}`}>
                        {stock.changeFormatted || '-'}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <Link href={stockHref} className="watchlist-row-link">
                        {stock.marketCap || '-'}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <Link href={stockHref} className="watchlist-row-link">
                        {stock.peRatio || '-'}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <input
                        type="checkbox"
                        checked={stock.newsEnabled !== false}
                        onChange={(event) => handleNewsPreferenceChange(stock.symbol, event.target.checked)}
                        disabled={updatingNewsSymbol === stock.symbol}
                        className="watchlist-news-checkbox"
                        aria-label={`Include ${stock.symbol} in news`}
                      />
                    </td>
                    <td className="table-cell text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(stock.symbol)}
                        disabled={removingSymbol === stock.symbol}
                        className="watchlist-table-remove"
                        title={`Remove ${stock.symbol} from watchlist`}
                        aria-label={`Remove ${stock.symbol} from watchlist`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="watchlist-news-section">
        <h2 className="watchlist-title">News</h2>
        {currentNews.length > 0 ? (
          <div className="watchlist-news">
            {currentNews.map((article) => (
              <Link
                key={`${article.id}-${article.url}`}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-item"
              >
                <span className="news-tag">{(article.related || article.category || 'News').toUpperCase()}</span>
                <h3 className="news-title">{article.headline}</h3>
                <p className="news-meta">
                  {article.source} | {formatNewsDate(article.datetime)}
                </p>
                <p className="news-summary">{article.summary}</p>
                <span className="news-cta">Read More</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="watchlist-news-empty">
            {newsEmptyMessage}
          </div>
        )}
      </section>
    </div>
  );
};

export default Watchlist;
