import TradingViewWidget from "@/components/TradingViewWidget";
import ResponsiveStockChart from "@/components/ResponsiveStockChart";
import StockDetailsClient from "@/components/StockDetailsClient";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  CANDLE_CHART_DETAILS_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { cookies } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getCurrentWatchlistSymbols } from "@/lib/actions/watchlist.actions";
import { getStockProfile } from "@/lib/actions/finnhub.actions";

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
  
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

  const profile = await getStockProfile(upperSymbol);
  const company = profile?.name || upperSymbol;

  return (
    <div className="flex min-h-screen px-2 py-4 md:px-3 md:py-5 lg:px-4 lg:py-6">
      <section className="flex w-full flex-col gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
            height={170}
          />

          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <ResponsiveStockChart
              scriptUrl={`${scriptUrl}advanced-chart.js`}
              defaultConfig={CANDLE_CHART_WIDGET_CONFIG(symbol)}
              detailsConfig={CANDLE_CHART_DETAILS_WIDGET_CONFIG(symbol)}
              className="custom-chart widget-overlay-frame"
              height={600}
            />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[880px] min-w-0 flex-col gap-6">
          <StockDetailsClient
            symbol={upperSymbol}
            company={company}
            isInWatchlist={isInWatchlist}
            isGuest={isGuest}
            userId={userId}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
            className="technical-analysis-widget"
            height={400}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}company-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
            height={440}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
            className="financials-widget"
            height={920}
          />
        </div>
      </section>
    </div>
  );
}
