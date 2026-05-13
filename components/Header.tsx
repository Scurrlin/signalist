import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import BrandLogo from "@/components/BrandLogo";
import { getCurrentWatchlistSymbols } from "@/lib/actions/watchlist.actions";

const Header = async ({ user, isGuest = false }: { user?: User; isGuest?: boolean }) => {
    const [initialStocks, watchlistSymbols] = await Promise.all([
        searchStocks(),
        user && !isGuest ? getCurrentWatchlistSymbols() : Promise.resolve([]),
    ]);

    // Create a guest user object if in guest mode
    const displayUser: User = user || {
        id: 'guest',
        name: 'Guest User',
        email: 'guest@example.com'
    };

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/" className="header-tv-link" aria-label="$ignalist dashboard">
                    <Image
                        src="/assets/icons/TradingView_Logo.svg"
                        alt=""
                        width={36}
                        height={28}
                        aria-hidden="true"
                        className="brand-logo-icon"
                    />
                </Link>
                <nav className="header-center-nav" aria-label="Primary navigation">
                    <NavItems
                        initialStocks={initialStocks}
                        isGuest={isGuest}
                        userId={user?.id}
                        watchlistSymbols={watchlistSymbols}
                    />
                </nav>
                <Link href="/" className="header-brand-center" aria-label="$ignalist dashboard">
                    <BrandLogo className="cursor-pointer" />
                </Link>
                <div className="header-actions">
                    <UserDropdown
                        user={displayUser}
                        initialStocks={initialStocks}
                        isGuest={isGuest}
                        watchlistSymbols={watchlistSymbols}
                    />
                </div>
            </div>
        </header>
    )
}
export default Header
