import Image from "next/image";
import Link from "next/link";

const TradingViewAttribution = () => {
    return (
        <div className="tradingview-attribution">
            <Image
                src="/assets/icons/TradingView_Logo_Full.svg"
                alt="TradingView"
                width={420}
                height={72}
                className="h-auto w-80"
            />
            <Link href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="auth-attribution-cta">
                Get started
            </Link>
        </div>
    );
};

export default TradingViewAttribution;
