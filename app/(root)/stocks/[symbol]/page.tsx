import TradingViewWidget from "@/components/TradingViewWidget";
import ResponsiveStockChart from "@/components/ResponsiveStockChart";
import StockDetailsClient from "@/components/StockDetailsClient";
import {
  CANDLE_CHART_WIDGET_CONFIG,
  CANDLE_CHART_DETAILS_WIDGET_CONFIG,
  MINI_CHART_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { cookies } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getCurrentWatchlistSymbols } from "@/lib/actions/watchlist.actions";
import { getStockNews, getStockProfile } from "@/lib/actions/finnhub.actions";
import StockNewsList from "@/components/StockNewsList";

const getTradingViewSymbol = (symbol: string, exchange?: string) => {
  const upperSymbol = symbol.toUpperCase();
  const upperExchange = exchange?.toUpperCase() || '';

  if (upperExchange.includes('NASDAQ')) {
    return `NASDAQ:${upperSymbol}`;
  }

  if (upperExchange.includes('NYSE')) {
    return `NYSE:${upperSymbol}`;
  }

  if (upperExchange.includes('AMEX') || upperExchange.includes('NYSE AMERICAN')) {
    return `AMEX:${upperSymbol}`;
  }

  return upperSymbol;
};

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
  const profilePromise = getStockProfile(upperSymbol);
  const stockNewsPromise = getStockNews(upperSymbol, 8);
  
  // Check if user is a guest
  const cookieStore = await cookies();
  const guestMode = cookieStore.get('guest_mode');
  const session = await auth.api.getSession({ headers: await headers() });
  const isGuest = !session?.user && !!guestMode;

  // Get user's watchlist to check if this stock is in it
  let isInWatchlist = false;
  let userId: string | undefined;
  
  if (session?.user?.email) {
    userId = session.user.id;
    const watchlistSymbols = await getCurrentWatchlistSymbols();
    isInWatchlist = watchlistSymbols.includes(upperSymbol);
  }

  const [profile, stockNews] = await Promise.all([profilePromise, stockNewsPromise]);
  const company = profile?.name || upperSymbol;
  const tradingViewSymbol = getTradingViewSymbol(upperSymbol, profile?.exchange);

  return (
    <div className="flex min-h-screen px-2 pb-4 md:px-3 md:pb-5 lg:px-4 lg:pb-6">
      <section className="flex w-full flex-col gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col items-center">
            <StockDetailsClient
              symbol={upperSymbol}
              company={company}
              isInWatchlist={isInWatchlist}
              isGuest={isGuest}
              userId={userId}
            />
          </div>

          <div className="stock-mini-chart-wrap">
            <TradingViewWidget
              scriptUrl={`${scriptUrl}mini-symbol-overview.js`}
              config={MINI_CHART_WIDGET_CONFIG(tradingViewSymbol)}
              className="mini-chart-widget widget-overlay-frame"
              height={200}
            />
          </div>

          <ResponsiveStockChart
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            defaultConfig={CANDLE_CHART_WIDGET_CONFIG(symbol)}
            detailsConfig={CANDLE_CHART_DETAILS_WIDGET_CONFIG(symbol)}
            className="custom-chart widget-overlay-frame"
            height={600}
          />
        </div>

        <div className="mx-auto grid w-full max-w-[992px] min-w-0 grid-cols-1 gap-6 min-[1025px]:max-w-none min-[1025px]:grid-cols-2 min-[1025px]:items-start">
          <div className="flex min-w-0 flex-col gap-6 min-[1025px]:order-2">
            <TradingViewWidget
              scriptUrl={`${scriptUrl}technical-analysis.js`}
              config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
              className="technical-analysis-widget widget-overlay-frame"
              height={400}
            />

            <StockNewsList symbol={upperSymbol} articles={stockNews} />
          </div>

          <div className="min-w-0 min-[1025px]:order-1">
            <TradingViewWidget
              scriptUrl={`${scriptUrl}financials.js`}
              config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
              className="financials-widget widget-overlay-frame"
              height={920}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
