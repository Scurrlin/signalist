'use client';

import { useState, useTransition } from 'react';
import WatchlistButton from './WatchlistButton';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface StockDetailsClientProps {
  symbol: string;
  company: string;
  isInWatchlist: boolean;
  isGuest: boolean;
  userId?: string;
}

export default function StockDetailsClient({
  symbol,
  company,
  isInWatchlist,
  isGuest,
  userId,
}: StockDetailsClientProps) {
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleWatchlistChange = async (sym: string, isAdded: boolean) => {
    if (!userId) return;

    // Optimistic update
    setInWatchlist(isAdded);

    try {
      const result = isAdded
        ? await addToWatchlist(userId, sym, company)
        : await removeFromWatchlist(userId, sym);

      if (result.success) {
        toast.success(isAdded ? 'Added to watchlist' : 'Removed from watchlist');
        // Refresh server data
        startTransition(() => {
          router.refresh();
        });
      } else {
        // Revert on error
        setInWatchlist(!isAdded);
        toast.error(result.error || 'Something went wrong');
      }
    } catch {
      // Revert on error
      setInWatchlist(!isAdded);
      toast.error('Failed to update watchlist');
    }
  };

  return (
    <div className="flex items-center justify-center">
      <WatchlistButton
        symbol={symbol.toUpperCase()}
        company={company.toUpperCase()}
        isInWatchlist={inWatchlist}
        isGuest={isGuest}
        userId={userId}
        onWatchlistChange={handleWatchlistChange}
      />
    </div>
  );
}
