"use client";
import React, { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const WatchlistButton = ({
  symbol,
  company, // eslint-disable-line @typescript-eslint/no-unused-vars
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
  isGuest = false,
  userId, // eslint-disable-line @typescript-eslint/no-unused-vars
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const label = useMemo(() => {
    if (type === "icon") return added ? "" : "";
    return added ? "Remove from watchlist" : "Add to watchlist";
  }, [added, type]);

  const handleClick = async () => {
    if (isGuest) {
      toast.info('Create a Free Account', {
        description: 'Sign up to add to your watchlist',
        action: {
          label: 'Sign Up',
          onClick: () => router.push('/sign-up'),
        },
      });
      return;
    }

    if (isLoading) return;

    const next = !added;
    
    // Optimistic update
    setAdded(next);
    setIsLoading(true);

    // Call the callback if provided (for custom handling)
    if (onWatchlistChange) {
      onWatchlistChange(symbol, next);
      setIsLoading(false);
    } else {
      // Default behavior: show toast
      toast.success(next ? 'Added to watchlist' : 'Removed from watchlist');
      
      // Refresh the page to update watchlist data
      startTransition(() => {
        router.refresh();
        setIsLoading(false);
      });
    }
  };

  if (type === "icon") {
    return (
      <button
        title={isGuest ? 'Sign up to add to your watchlist' : (added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`)}
        aria-label={isGuest ? 'Sign up to add to your watchlist' : (added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`)}
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""} ${isGuest ? "opacity-50 cursor-pointer" : ""} ${isLoading ? "opacity-50 cursor-wait" : ""}`}
        onClick={handleClick}
        disabled={isLoading}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={added ? "#2962FF" : "none"}
          stroke="#2962FF"
          strokeWidth="1.5"
          className="watchlist-star"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button 
      className={`watchlist-btn ${added ? "watchlist-remove" : ""} ${isGuest ? "opacity-75" : ""} ${isLoading ? "opacity-50 cursor-wait" : ""}`} 
      onClick={handleClick}
      disabled={isLoading}
    >
      {showTrashIcon && added ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
        </svg>
      ) : null}
      <span>{isGuest ? "Sign up to add to your watchlist" : label}</span>
    </button>
  );
};

export default WatchlistButton;
