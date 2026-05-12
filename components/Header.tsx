import Link from "next/link";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import BrandLogo from "@/components/BrandLogo";

const Header = async ({ user, isGuest = false }: { user?: User; isGuest?: boolean }) => {
    const initialStocks = await searchStocks();

    // Create a guest user object if in guest mode
    const displayUser: User = user || {
        id: 'guest',
        name: 'Guest User',
        email: 'guest@example.com'
    };

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/">
                    <BrandLogo className="cursor-pointer" />
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} isGuest={isGuest} />
                </nav>

                <UserDropdown user={displayUser} initialStocks={initialStocks} isGuest={isGuest} />
            </div>
        </header>
    )
}
export default Header
