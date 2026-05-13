import TradingViewWidget from "@/components/TradingViewWidget";
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    MARKET_OVERVIEW_WIDGET_CONFIG,
    TOP_STORIES_WIDGET_CONFIG
} from "@/lib/constants";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
    alternates: {
        canonical: SITE_URL,
    },
};

const Home = () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    return (
        <div className="flex min-h-screen home-wrapper flex-col gap-8">
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
                <div className="xl:col-span-2">
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
