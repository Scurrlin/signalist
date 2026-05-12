import Image from "next/image";
import Link from "next/link";

const TradingViewAttribution = () => {
    return (
        <div className="tradingview-attribution">
            <Link
                href="https://www.tradingview.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open TradingView"
                className="tradingview-attribution-link"
            >
                <Image
                    src="/assets/icons/TradingView_Logo_Full.svg"
                    alt="TradingView"
                    width={420}
                    height={72}
                    className="tradingview-attribution-logo"
                />
            </Link>
        </div>
    );
};

export default TradingViewAttribution;
