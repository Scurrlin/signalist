import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getDateRange = (days: number) => {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - days);
  return {
    to: toDate.toISOString().split('T')[0],
    from: fromDate.toISOString().split('T')[0],
  };
};

const getSafeHttpUrl = (url?: string) => {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
      ? parsedUrl.toString()
      : null;
  } catch {
    return null;
  }
};

// Decode the HTML entities Finnhub emits in headline/summary text so they
// render as readable characters when interpolated into JSX (which never
// decodes entities itself). Covers numeric (&#39;), hex (&#x27;), and the
// handful of named entities seen in practice.
const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
};

const decodeHtmlEntities = (input: string): string =>
  input.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === '#') {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const code = isHex
        ? parseInt(entity.slice(2), 16)
        : parseInt(entity.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return NAMED_HTML_ENTITIES[entity.toLowerCase()] ?? match;
  });

// Articles whose source is Finnhub itself tend to be auto-generated press
// releases / earnings-call transcripts that are near-duplicates of articles
// from real outlets (Benzinga, Yahoo, SeekingAlpha, etc.), so drop them all
// at the validation step. Case-insensitive and trimmed to be robust to any
// formatting quirks in the upstream feed.
const BLOCKED_SOURCES = new Set(['finnhub']);

// Check for required article fields and filter out low-substance sources.
export const validateArticle = (article: RawNewsArticle) =>
    !!article.headline
    && !BLOCKED_SOURCES.has((article.source ?? '').trim().toLowerCase())
    && !!article.summary
    && !!getSafeHttpUrl(article.url)
    && !!article.datetime;

export const formatArticle = (
    article: RawNewsArticle,
    isCompanyNews: boolean,
    symbol?: string,
    index: number = 0
) => {
  const headline = decodeHtmlEntities(article.headline!.trim());
  const decodedSummary = decodeHtmlEntities(article.summary!.trim());
  const summaryLimit = isCompanyNews ? 200 : 150;
  const summary =
      decodedSummary.length > summaryLimit
          ? decodedSummary.substring(0, summaryLimit).trimEnd() + '...'
          : decodedSummary;

  return {
    id: isCompanyNews ? Date.now() + Math.random() : article.id + index,
    headline,
    summary,
    source: article.source || (isCompanyNews ? 'Company News' : 'Market News'),
    url: getSafeHttpUrl(article.url)!,
    datetime: article.datetime!,
    image: article.image || '',
    category: isCompanyNews ? 'company' : article.category || 'general',
    related: isCompanyNews ? symbol! : article.related || '',
  };
};
