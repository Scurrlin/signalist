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

// Build a stable URL key that ignores tracking params and trailing-slash
// noise so two links to the same article fingerprint identically.
const canonicalUrl = (url?: string): string => {
  if (!url) return '';
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    let path = u.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return `${u.protocol}//${u.host.toLowerCase()}${path}`;
  } catch {
    return url.toLowerCase();
  }
};

// First 120 chars of the decoded, lowercased, whitespace-collapsed summary.
// Republished press releases share this prefix word-for-word even when ids,
// urls, and headlines differ, which makes it the workhorse dedup signal.
const summaryFingerprint = (summary?: string): string =>
  decodeHtmlEntities((summary || '').toLowerCase())
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

// Stateful dedup tracker for one news result set. Treats an article as a
// duplicate if any one of (id, canonical url, summary fingerprint) matches a
// previously-accepted article. Use one instance per request.
export const createArticleDedupe = () => {
  const seenIds = new Set<number>();
  const seenUrls = new Set<string>();
  const seenSummaries = new Set<string>();

  return {
    tryAccept(article: { id?: number; url?: string; summary?: string }): boolean {
      if (typeof article.id === 'number' && seenIds.has(article.id)) return false;
      const cu = canonicalUrl(article.url);
      if (cu && seenUrls.has(cu)) return false;
      const sk = summaryFingerprint(article.summary);
      if (sk && seenSummaries.has(sk)) return false;

      if (typeof article.id === 'number') seenIds.add(article.id);
      if (cu) seenUrls.add(cu);
      if (sk) seenSummaries.add(sk);
      return true;
    },
  };
};

// Headlines like "Transcript: ..." or "Transcript : ..." are auto-generated
// earnings-call transcripts on Finnhub that have no real article body, so we
// drop them at the validation step (case-insensitive, optional whitespace
// before the colon to match Finnhub's actual formatting).
const TRANSCRIPT_HEADLINE_RE = /^\s*transcript\s*:/i;

// Check for required article fields and filter out low-substance headlines.
export const validateArticle = (article: RawNewsArticle) =>
    !!article.headline
    && !TRANSCRIPT_HEADLINE_RE.test(article.headline)
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
