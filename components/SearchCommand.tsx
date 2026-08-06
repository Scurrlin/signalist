"use client"

import { type KeyboardEvent, type MouseEvent, useEffect, useState, useTransition } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import {Button} from "@/components/ui/button";
import {CornerDownLeft, Loader2, TrendingUp} from "lucide-react";
import Link from "next/link";
import {searchStocksWithStatus} from "@/lib/actions/finnhub.actions";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SearchCommand({
  renderAs = 'button',
  label = 'Add stock',
  initialStocks,
  onSearchOpen,
  externalOpen,
  onExternalOpenChange,
  userId,
  isGuest = false,
  watchlistSymbols,
  onWatchlistToggle,
}: SearchCommandProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen ?? internalOpen;
  const setOpen = onExternalOpenChange ?? setInternalOpen;
  const [searchTerm, setSearchTerm] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);
  const [updatingSymbol, setUpdatingSymbol] = useState<string | null>(null);
  const [trackedSymbols, setTrackedSymbols] = useState<Set<string>>(() => {
    const symbols = watchlistSymbols ?? initialStocks.filter(stock => stock.isInWatchlist).map(stock => stock.symbol);
    return new Set(symbols.map(symbol => symbol.toUpperCase()));
  });
  const [, startTransition] = useTransition();
  const router = useRouter();

  const trimmedSearchTerm = searchTerm.trim();
  const isSearchMode = !!submittedQuery;
  const hasPendingSearch = !!trimmedSearchTerm && trimmedSearchTerm !== submittedQuery && !loading;
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);
  const resultCount = displayStocks?.length ?? 0;
  const resultCountLabel = resultCount >= 11 ? '10+' : resultCount;

  useEffect(() => {
    const symbols = watchlistSymbols ?? initialStocks.filter(stock => stock.isInWatchlist).map(stock => stock.symbol);
    setTrackedSymbols(new Set(symbols.map(symbol => symbol.toUpperCase())));
    if (!submittedQuery) {
      setStocks(initialStocks);
    }
  }, [initialStocks, watchlistSymbols, submittedQuery]);

  const performSearch = async () => {
    const trimmed = searchTerm.trim();

    if (!trimmed) {
      setSubmittedQuery("");
      setSearchError(null);
      setStocks(initialStocks);
      return;
    }

    if (trimmed === submittedQuery) return;

    setSubmittedQuery(trimmed);
    setSearchError(null);
    setLoading(true);
    try {
      const result = await searchStocksWithStatus(trimmed);
      setStocks(result.stocks);
      if (result.success) {
        setSearchError(null);
      } else {
        setSearchError(result.error ?? 'Search failed. Please try again.');
      }
    } catch {
      setStocks([]);
      setSearchError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    if (!value.trim() && submittedQuery) {
      setSubmittedQuery("");
      setSearchError(null);
      setStocks(initialStocks);
    }
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      void performSearch();
    }
  }

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setSubmittedQuery("");
    setStocks(initialStocks);
  }

  const handleToggleWatchlist = async (event: MouseEvent<HTMLButtonElement>, stock: StockWithWatchlistStatus) => {
    event.preventDefault();
    event.stopPropagation();

    if (isGuest || !userId) {
      toast.info('Create a free account', {
        description: 'Sign up to add to your watchlist',
        action: {
          label: 'Sign Up',
          onClick: () => router.push('/sign-up'),
        },
      });
      return;
    }

    const symbol = stock.symbol.toUpperCase();
    const wasAdded = trackedSymbols.has(symbol);
    const nextSymbols = new Set(trackedSymbols);

    if (wasAdded) {
      nextSymbols.delete(symbol);
    } else {
      nextSymbols.add(symbol);
    }

    setTrackedSymbols(nextSymbols);
    setUpdatingSymbol(symbol);

    const result = wasAdded
      ? await removeFromWatchlist(symbol)
      : await addToWatchlist(symbol, stock.name || symbol);

    if (result.success || (!wasAdded && result.error === 'Stock already in watchlist')) {
      onWatchlistToggle?.(stock, !wasAdded);
      toast.success(wasAdded ? 'Removed from watchlist' : 'Added to watchlist');
      startTransition(() => {
        router.refresh();
      });
    } else {
      const revertedSymbols = new Set(nextSymbols);
      if (wasAdded) {
        revertedSymbols.add(symbol);
      } else {
        revertedSymbols.delete(symbol);
      }
      setTrackedSymbols(revertedSymbols);
      toast.error(result.error || 'Failed to update watchlist');
    }

    setUpdatingSymbol(null);
  }

  return (
    <>
      {renderAs === 'text' ? (
          <span onClick={() => { setOpen(true); onSearchOpen?.(); }} className="search-text w-full block">
            {label}
          </span>
      ) : renderAs === 'hidden' ? null : (
          <Button onClick={() => { setOpen(true); onSearchOpen?.(); }} className="search-btn">
            {label}
          </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog" overlayClassName="search-dialog-overlay">
        <div className="search-field">
          <CommandInput
            value={searchTerm}
            onValueChange={handleSearchTermChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search stocks..."
            className="search-input"
          />
          {loading ? (
            <Loader2 className="search-loader" />
          ) : hasPendingSearch ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void performSearch()}
              className="search-enter-btn"
              title="Press Enter to search"
              aria-label="Press Enter to search"
            >
              <span>Enter</span>
              <CornerDownLeft className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <CommandList className="search-list">
          {loading ? (
              <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
          ) : searchError ? (
              <div className="search-list-indicator">
                {searchError}
              </div>
          ) : displayStocks?.length === 0 ? (
              <div className="search-list-indicator">
                {isSearchMode ? 'No results found' : 'No stocks available'}
              </div>
            ) : (
            <ul>
              <div className="search-count">
                {isSearchMode ? 'Search results' : 'Popular stocks'}
                {` `}({resultCountLabel})
              </div>
              {displayStocks?.map((stock) => (
                  <li key={stock.symbol} className="search-item">
                    <div className="search-item-row">
                    <Link
                        href={`/stocks/${encodeURIComponent(stock.symbol)}`}
                        onClick={handleSelectStock}
                        className="search-item-link"
                    >
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <div className="min-w-0 flex-1">
                        <div className="search-item-name">
                          {stock.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {stock.symbol} | {stock.type}
                        </div>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={(event) => handleToggleWatchlist(event, stock)}
                      disabled={updatingSymbol === stock.symbol.toUpperCase()}
                      className={`search-watchlist-btn ${trackedSymbols.has(stock.symbol.toUpperCase()) ? 'search-watchlist-btn-added' : ''}`}
                      title={trackedSymbols.has(stock.symbol.toUpperCase()) ? `Remove ${stock.symbol} from watchlist` : `Add ${stock.symbol} to watchlist`}
                      aria-label={trackedSymbols.has(stock.symbol.toUpperCase()) ? `Remove ${stock.symbol} from watchlist` : `Add ${stock.symbol} to watchlist`}
                    >
                      <span className="search-watchlist-star" aria-hidden="true" />
                    </button>
                    </div>
                  </li>
              ))}
            </ul>
          )
          }
        </CommandList>
      </CommandDialog>
    </>
  )
}
