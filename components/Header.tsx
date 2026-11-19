import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import BrandLogo from "@/components/BrandLogo";

const Header = ({ user, isGuest = false }: { user?: User; isGuest?: boolean }) => {
    // Create a guest user object if in guest mode
    const displayUser: User = user || {
        id: 'guest',
        name: 'Guest User',
        email: 'guest@example.com'
    };

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <div className="header-tv-logo" aria-hidden="true">
                    <Image
                        src="/assets/icons/TradingView_Logo.svg"
                        alt=""
                        width={36}
                        height={28}
                        aria-hidden="true"
                        className="brand-logo-icon"
                    />
                </div>
                <nav className="header-center-nav" aria-label="Primary navigation">
                    <NavItems
                        isGuest={isGuest}
                        userId={user?.id}
                    />
                </nav>
                <Link href="/" className="header-brand-center" aria-label="$ignalist dashboard">
                    <BrandLogo className="cursor-pointer" />
                </Link>
                <div className="header-actions">
                    <UserDropdown
                        user={displayUser}
                        isGuest={isGuest}
                    />
                </div>
            </div>
        </header>
    )
}
export default Header
