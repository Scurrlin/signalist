import TradingViewWidget from "@/components/TradingViewWidget";
import Watchlist from "@/components/Watchlist";
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    MARKET_OVERVIEW_WIDGET_CONFIG,
    TOP_STORIES_WIDGET_CONFIG
} from "@/lib/constants";
import { auth } from "@/lib/better-auth/auth";
import { headers, cookies } from "next/headers";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";

const Home = async () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    // Get user session
    const session = await auth.api.getSession({ headers: await headers() });
    const cookieStore = await cookies();
    const guestMode = cookieStore.get('guest_mode');
    const isGuest = !session?.user && !!guestMode;

    // Get watchlist data for authenticated users
    let watchlistStocks: StockWithData[] = [];
    let userId: string | undefined;

    if (session?.user?.email) {
        userId = session.user.id;
        watchlistStocks = await getWatchlistWithData(session.user.email);
    }

    return (
        <div className="flex min-h-screen home-wrapper flex-col gap-8">
            {/* Watchlist Section - Show for authenticated users */}
            {!isGuest && (
                <section className="w-full">
                    <Watchlist 
                        initialStocks={watchlistStocks}
                        userId={userId!}
                        maxItems={3}
                    />
                </section>
            )}

            <section className="grid w-full gap-8 home-section">
                <div className="lg:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                      title="Market Overview"
                      scriptUrl={`${scriptUrl}market-overview.js`}
                      config={MARKET_OVERVIEW_WIDGET_CONFIG}
                      className="custom-chart widget-overlay-frame"
                      height={600}
                    />
                </div>
                <div className="md-col-span xl:col-span-2">
                    <TradingViewWidget
                        title="Stock Heatmap"
                        scriptUrl={`${scriptUrl}stock-heatmap.js`}
                        config={HEATMAP_WIDGET_CONFIG}
                        className="widget-overlay-frame"
                        height={600}
                    />
                </div>
            </section>
            <section className="grid w-full gap-8 home-section">
                <div className="h-full lg:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}timeline.js`}
                        config={TOP_STORIES_WIDGET_CONFIG}
                        className="widget-overlay-frame"
                        height={730}
                    />
                </div>
                <div className="h-full lg:col-span-1 xl:col-span-2">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}market-quotes.js`}
                        config={MARKET_DATA_WIDGET_CONFIG}
                        className="widget-overlay-frame"
                        height={730}
                    />
                </div>
            </section>
        </div>
    )
}

export default Home;
