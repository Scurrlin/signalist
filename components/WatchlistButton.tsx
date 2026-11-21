"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const WatchlistButton = ({
  symbol,
  isInWatchlist,
  onWatchlistChange,
  isGuest = false,
}: WatchlistButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const label = isInWatchlist ? "Remove from watchlist" : "Add to watchlist";

  const handleClick = async () => {
    if (isGuest) {
      toast.info('Watchlists need a free account', {
        action: {
          label: 'Sign Up',
          onClick: () => router.push('/sign-up'),
        },
      });
      return;
    }

    if (isLoading) return;
    if (!onWatchlistChange) return;

    const next = !isInWatchlist;
    setIsLoading(true);

    try {
      await onWatchlistChange(symbol, next);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`watchlist-btn ${isInWatchlist ? "watchlist-remove" : ""} ${isGuest ? "opacity-75" : ""} ${isLoading ? "opacity-50 cursor-wait" : ""}`}
      onClick={handleClick}
      disabled={isLoading}
    >
      <span>{isGuest ? "Sign up to add to your watchlist" : label}</span>
    </button>
  );
};

export default WatchlistButton;
