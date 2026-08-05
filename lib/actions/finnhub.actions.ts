'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { cache } from 'react';

type StockProfile = {
  name?: string;
  ticker?: string;
  exchange?: string;
  logo?: string;
} | null;

const FINNHUB_BASE_URL = process.env.FINNHUB_BASE_URL;

type StockSearchResponse =
  {
    success: boolean;
    stocks: StockWithWatchlistStatus[];
    error?: string;
    reason?: 'rate-limit' | 'config' | 'fetch';
  };

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export { fetchJSON };

export async function getStockProfile(symbol: string): Promise<ProfileData | null> {
  try {
    const token = process.env.FINNHUB_API_KEY;
    if (!token) {
      return null;
    }

    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) {
      return null;
    }

    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(trimmed)}&token=${token}`;
    return await fetchJSON<ProfileData>(url, 3600);
  } catch (err) {
    console.error('getStockProfile error:', err);
    return null;
  }
}

export async function getNews(symbols?: string[], limit = 8): Promise<MarketNewsArticle[]> {
  try {
    const ip = await getClientIp();
    if (!checkRateLimit(`getNews:${ip}`, 30, 60_000)) {
      return [];
    }

    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB API key is not configured');
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = limit;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            console.error('Error fetching company news for', sym, e);
            perSymbolArticles[sym] = [];
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      // Round-robin up to the requested article limit
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= Math.max(maxArticles, 20)) break; // cap early before final slicing
    }

    const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error('getNews error:', err);
    throw new Error('Failed to fetch news');
  }
}

const RECENT_STOCK_NEWS_DAYS = 30;
const HISTORICAL_STOCK_NEWS_DAYS = 365;
const MIN_STOCK_NEWS_ARTICLES = 3;

const getUniqueStockNewsArticles = (articles: RawNewsArticle[]) => {
  const seen = new Set<string>();

  return articles
    .filter(validateArticle)
    .filter((article) => {
      const key = `${article.id}-${article.url}-${article.headline}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
};

export async function getStockNews(symbol: string, limit = 6): Promise<MarketNewsArticle[]> {
  try {
    const ip = await getClientIp();
    if (!checkRateLimit(`getStockNews:${ip}`, 60, 60_000)) {
      return [];
    }

    const token = process.env.FINNHUB_API_KEY;
    if (!token) {
      console.error('getStockNews error:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const maxArticles = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
    if (!cleanSymbol || maxArticles === 0) {
      return [];
    }

    const recentRange = getDateRange(RECENT_STOCK_NEWS_DAYS);
    const recentUrl = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(cleanSymbol)}&from=${recentRange.from}&to=${recentRange.to}&token=${token}`;
    const recentResponse = await fetchJSON<RawNewsArticle[]>(recentUrl, 300);
    const recentArticles = getUniqueStockNewsArticles(recentResponse || []);
    const minimumArticleCount = Math.min(MIN_STOCK_NEWS_ARTICLES, maxArticles);

    let selectedArticles: RawNewsArticle[];

    if (recentArticles.length >= minimumArticleCount) {
      selectedArticles = recentArticles.slice(0, maxArticles);
    } else {
      selectedArticles = recentArticles.slice(0, minimumArticleCount);

      try {
        const historicalRange = getDateRange(HISTORICAL_STOCK_NEWS_DAYS);
        const historicalUrl = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(cleanSymbol)}&from=${historicalRange.from}&to=${historicalRange.to}&token=${token}`;
        const historicalResponse = await fetchJSON<RawNewsArticle[]>(historicalUrl, 300);

        selectedArticles = getUniqueStockNewsArticles([
          ...recentArticles,
          ...(historicalResponse || []),
        ]).slice(0, minimumArticleCount);
      } catch (fallbackError) {
        console.error(`getStockNews historical fallback error for ${cleanSymbol}:`, fallbackError);
      }
    }

    return selectedArticles.map((article, index) =>
      formatArticle(article, true, cleanSymbol, index)
    );
  } catch (err) {
    console.error('getStockNews error:', err);
    return [];
  }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  const result = await searchStocksWithStatus(query);
  return result.success ? result.stocks : [];
});

export async function searchStocksWithStatus(query?: string): Promise<StockSearchResponse> {
  try {
    const ip = await getClientIp();
    if (!checkRateLimit(`searchStocks:${ip}`, 100, 60_000)) {
      return {
        success: false,
        stocks: [],
        error: 'Search is temporarily rate limited. Please wait a moment and try again.',
        reason: 'rate-limit',
      };
    }

    const token = process.env.FINNHUB_API_KEY;
    if (!token) {
      // If no token, log and return empty to avoid throwing per requirements
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return {
        success: false,
        stocks: [],
        error: 'Search is unavailable right now. Please try again later.',
        reason: 'config',
      };
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: FinnhubSearchResult[] = [];

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<StockProfile>(url, 3600);
            return { sym, profile };
          } catch (e) {
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
          };
          // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
          // To keep pipeline simple, attach exchange via closure map stage
          // We'll reconstruct exchange when mapping to final type
          (r as FinnhubSearchResult & { __exchange?: string }).__exchange = exchange; // internal only
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = (r as FinnhubSearchResult & { __exchange?: string }).__exchange;
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: false,
        };
        return item;
      })
      .slice(0, 15);

    return { success: true, stocks: mapped };
  } catch (err) {
    console.error('Error in stock search:', err);
    return {
      success: false,
      stocks: [],
      error: 'Search failed. Please try again.',
      reason: 'fetch',
    };
  }
}
