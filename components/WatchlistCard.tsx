'use client';

import Link from 'next/link';
import { useState } from 'react';
import { X } from 'lucide-react';

interface WatchlistCardProps {
  stock: StockWithData;
  onRemove?: (symbol: string) => void;
  showStar?: boolean;
}

const WatchlistCard = ({ stock, onRemove, showStar = true }: WatchlistCardProps) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isRemoving) return;
    
    setIsRemoving(true);
    await onRemove?.(stock.symbol);
    setIsRemoving(false);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Generate a color for the company icon based on symbol
  const getColorFromSymbol = (symbol: string) => {
    const colors = [
      'bg-orange-500',
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-blue-600',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index = symbol.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const isPositive = (stock.changePercent ?? 0) >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <Link href={`/stocks/${stock.symbol}`} className="mx-auto block w-full max-w-[340px]">
      <div className="watchlist-card group relative">
        {/* Star marker - reminder that this stock is in the watchlist */}
        {showStar && (
          <div className="watchlist-card-star absolute top-2 left-3" title="In your watchlist" onClick={handleStarClick}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#2962FF"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            className="watchlist-card-remove"
            title={`Remove ${stock.symbol} from watchlist`}
            aria-label={`Remove ${stock.symbol} from watchlist`}
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        )}

        {/* Main horizontal layout */}
        <div className="flex items-center gap-8">
          {/* Left side - Logo and Ticker */}
          <div className="flex flex-col items-center gap-3">
            {/* Company Icon/Logo */}
            {stock.logo ? (
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0">
                <img
                  src={stock.logo}
                  alt={`${stock.company} logo`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to letter if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.className = `w-16 h-16 rounded-full ${getColorFromSymbol(stock.symbol)} flex items-center justify-center shrink-0`;
                      target.parentElement.innerHTML = `<span class="text-white font-bold text-2xl">${stock.symbol.charAt(0)}</span>`;
                    }
                  }}
                />
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-full ${getColorFromSymbol(stock.symbol)} flex items-center justify-center shrink-0`}>
                <span className="text-white font-bold text-2xl">
                  {stock.symbol.charAt(0)}
                </span>
              </div>
            )}
            
            {/* Ticker Symbol */}
            <div className="text-gray-300 font-bold text-xl">
              {stock.symbol}
            </div>
          </div>

          {/* Center - Price and Change */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {/* Price */}
            <div className="text-white text-3xl font-bold">
              {stock.priceFormatted || '—'}
            </div>

            {/* Change */}
            {stock.changePercent !== undefined && (
              <div className={`text-base font-medium ${changeColor}`}>
                {isPositive ? '+' : ''}{stock.currentPrice ? (stock.currentPrice * (stock.changePercent / 100)).toFixed(2) : '—'} ({stock.changeFormatted || '—'})
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default WatchlistCard;
