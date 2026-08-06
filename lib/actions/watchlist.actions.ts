'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { fetchJSON } from './finnhub.actions';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

const FINNHUB_BASE_URL = process.env.FINNHUB_BASE_URL;
const AUTH_REQUIRED_ERROR = 'Please sign in to update your watchlist';

const formatMarketCap = (marketCapitalization?: number) => {
  if (typeof marketCapitalization !== 'number' || !Number.isFinite(marketCapitalization) || marketCapitalization <= 0) {
    return undefined;
  }

  const capUsd = marketCapitalization * 1_000_000;

  if (capUsd >= 1_000_000_000_000) {
    return `$${(capUsd / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (capUsd >= 1_000_000_000) {
    return `$${(capUsd / 1_000_000_000).toFixed(2)}B`;
  }

  if (capUsd >= 1_000_000) {
    return `$${(capUsd / 1_000_000).toFixed(2)}M`;
  }

  return `$${capUsd.toFixed(0)}`;
};

const formatPERatio = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return value.toFixed(1);
};

const getCurrentUserId = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id;
};

export async function getCurrentWatchlistSymbols(): Promise<string[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    await connectToDatabase();

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getCurrentWatchlistSymbols error:', err);
    return [];
  }
}

export async function addToWatchlist(symbol: string, company: string) {
  if (!symbol || !company) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: AUTH_REQUIRED_ERROR };
    }

    await connectToDatabase();

    const upperSymbol = symbol.toUpperCase().trim();
    const trimmedCompany = company.trim();

    // Check if already exists
    const existing = await Watchlist.findOne({ userId, symbol: upperSymbol });
    if (existing) {
      return { success: false, error: 'Stock already in watchlist' };
    }

    // Create new watchlist item
    await Watchlist.create({
      userId,
      symbol: upperSymbol,
      company: trimmedCompany,
      addedAt: new Date(),
      newsEnabled: true,
    });

    return { success: true };
  } catch (err: unknown) {
    console.error('addToWatchlist error:', err);
    const error = err as { message?: string };
    return { success: false, error: error.message || 'Failed to add to watchlist' };
  }
}

export async function removeFromWatchlist(symbol: string) {
  if (!symbol) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: AUTH_REQUIRED_ERROR };
    }

    await connectToDatabase();

    const upperSymbol = symbol.toUpperCase().trim();

    const result = await Watchlist.deleteOne({ userId, symbol: upperSymbol });

    if (result.deletedCount === 0) {
      return { success: false, error: 'Stock not found in watchlist' };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('removeFromWatchlist error:', err);
    const error = err as { message?: string };
    return { success: false, error: error.message || 'Failed to remove from watchlist' };
  }
}

export async function updateWatchlistNewsPreference(symbol: string, newsEnabled: boolean) {
  if (!symbol) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: AUTH_REQUIRED_ERROR };
    }

    await connectToDatabase();

    const upperSymbol = symbol.toUpperCase().trim();
    const result = await Watchlist.updateOne(
      { userId, symbol: upperSymbol },
      { $set: { newsEnabled } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Stock not found in watchlist' };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('updateWatchlistNewsPreference error:', err);
    const error = err as { message?: string };
    return { success: false, error: error.message || 'Failed to update news preference' };
  }
}

export async function getCurrentWatchlistWithData(): Promise<StockWithData[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    await connectToDatabase();

    // Get watchlist items
    const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();
    if (!items || items.length === 0) return [];

    const token = process.env.FINNHUB_API_KEY;
    if (!token) {
      console.error('FINNHUB API key not configured');
      return items.map(item => ({
        userId: item.userId,
        symbol: item.symbol,
        company: item.company,
        addedAt: item.addedAt,
        newsEnabled: item.newsEnabled ?? true,
      }));
    }

    // Fetch live data for each stock
    const enrichedStocks = await Promise.all(
      items.map(async (item) => {
        try {
          // Fetch quote data, profile, and valuation metrics for the table view.
          const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(item.symbol)}&token=${token}`;
          const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(item.symbol)}&token=${token}`;
          const metricsUrl = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(item.symbol)}&metric=all&token=${token}`;
          
          const [quote, profile, financials] = await Promise.all([
            fetchJSON<QuoteData>(quoteUrl, 60).catch(() => null),
            fetchJSON<ProfileData>(profileUrl, 3600).catch(() => null),
            fetchJSON<FinancialsData>(metricsUrl, 3600).catch(() => null),
          ]);

          const currentPrice = quote?.c;
          const changePercent = quote?.dp;
          const logo = (profile as ProfileData & { logo?: string })?.logo || undefined;
          const company = profile?.name || item.company;
          const metric = financials?.metric;
          const marketCap = formatMarketCap(metric?.marketCapitalization ?? profile?.marketCapitalization);
          const peRatio = formatPERatio(
            metric?.peTTM ??
            metric?.peBasicExclExtraTTM ??
            metric?.peAnnual ??
            metric?.forwardPE
          );

          // Format the data
          const priceFormatted = typeof currentPrice === 'number' ? `$${currentPrice.toFixed(2)}` : undefined;
          const changeFormatted = changePercent !== undefined 
            ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%` 
            : undefined;

          return {
            userId: item.userId,
            symbol: item.symbol,
            company,
            addedAt: item.addedAt,
            currentPrice,
            changePercent,
            priceFormatted,
            changeFormatted,
            marketCap,
            peRatio,
            logo,
            newsEnabled: item.newsEnabled ?? true,
          };
        } catch (err) {
          console.error(`Error fetching data for ${item.symbol}:`, err);
          // Return basic data without live prices
          return {
            userId: item.userId,
            symbol: item.symbol,
            company: item.company,
            addedAt: item.addedAt,
            newsEnabled: item.newsEnabled ?? true,
          };
        }
      })
    );

    return enrichedStocks;
  } catch (err) {
    console.error('getCurrentWatchlistWithData error:', err);
    return [];
  }
}
