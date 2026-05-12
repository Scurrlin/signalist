'use client';

import WatchlistCard from './WatchlistCard';
import { useState, useTransition } from 'react';
import { removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface WatchlistProps {
  initialStocks: StockWithData[];
  userId: string;
  maxItems?: number;
}

const Watchlist = ({ initialStocks, userId, maxItems }: WatchlistProps) => {
  const [stocks, setStocks] = useState(initialStocks);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const displayStocks = maxItems ? stocks.slice(0, maxItems) : stocks;

  const handleRemove = async (symbol: string) => {
    // Optimistic update
    setStocks(prev => prev.filter(s => s.symbol !== symbol));

    const result = await removeFromWatchlist(userId, symbol);

    if (result.success) {
      toast.success('Removed from watchlist');
      // Refresh the page data
      startTransition(() => {
        router.refresh();
      });
    } else {
      // Revert on error
      setStocks(initialStocks);
      toast.error(result.error || 'Failed to remove from watchlist');
    }
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
    <div>
      <div className="mx-auto grid w-full max-w-[340px] grid-cols-1 justify-center gap-4 md:max-w-[696px] md:grid-cols-2 lg:max-w-[1052px] lg:grid-cols-3">
        {displayStocks.map((stock) => (
          <WatchlistCard
            key={stock.symbol}
            stock={stock}
            onRemove={handleRemove}
            showStar={true}
          />
        ))}
      </div>
    </div>
  );
};

export default Watchlist;
