'use client'

import {NAV_ITEMS} from "@/lib/constants";
import Link from "next/link";
import SearchCommand from "@/components/SearchCommand";
import {DropdownMenuItem, DropdownMenuSeparator} from "@/components/ui/dropdown-menu";

type NavItemsProps = {
    initialStocks: StockWithWatchlistStatus[];
    isGuest?: boolean;
    inDropdown?: boolean;
    onOpenSearch?: () => void;
    userId?: string;
    watchlistSymbols?: string[];
};

const NavItems = ({
    initialStocks,
    isGuest = false,
    inDropdown = false,
    onOpenSearch,
    userId,
    watchlistSymbols = [],
}: NavItemsProps) => {
    const navItems = NAV_ITEMS.filter(item => !isGuest || !item.authOnly);

    if (inDropdown) {
        return (
            <>
                {navItems.map(({ href, label, external }, index) => {
                    const isLast = index === navItems.length - 1;
                    
                    if(href === '/search') return (
                        <div key="search-trigger">
                            <DropdownMenuItem 
                                onClick={onOpenSearch}
                                className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-blue-600 transition-colors cursor-pointer"
                            >
                                <span className="w-full block">Search</span>
                            </DropdownMenuItem>
                            {!isLast && <DropdownMenuSeparator className="bg-gray-600"/>}
                        </div>
                    )

                    return (
                        <div key={href}>
                            <DropdownMenuItem asChild className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-blue-600 transition-colors cursor-pointer">
                                {external ? (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="w-full">
                                        {label}
                                    </a>
                                ) : (
                                    <Link href={href} className="w-full">
                                        {label}
                                    </Link>
                                )}
                            </DropdownMenuItem>
                            {!isLast && <DropdownMenuSeparator className="bg-gray-600"/>}
                        </div>
                    )
                })}
            </>
        )
    }

    const homeItem = navItems.find(({ href }) => href === '/');
    const searchItem = navItems.find(({ href }) => href === '/search');
    const watchlistItem = navItems.find(({ href }) => href === '/watchlist');
    const docsItem = navItems.find(({ label }) => label === 'Docs');

    return (
        <ul className="header-nav-list">
            <li className="header-nav-group header-nav-group-left header-side-nav-item">
                {docsItem && (
                    <a
                        href={docsItem.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="header-nav-link"
                        onClick={(event) => event.currentTarget.blur()}
                    >
                        {docsItem.label}
                    </a>
                )}
                {searchItem && (
                    <SearchCommand
                        renderAs="text"
                        label={searchItem.label}
                        initialStocks={initialStocks}
                        userId={userId}
                        isGuest={isGuest}
                        watchlistSymbols={watchlistSymbols}
                    />
                )}
            </li>
            <li className="header-brand-spacer" aria-hidden="true" />
            <li className="header-nav-group header-nav-group-right header-side-nav-item">
                {homeItem && (
                    <Link href={homeItem.href} className="header-nav-link">
                        {homeItem.label}
                    </Link>
                )}
                {watchlistItem && (
                    <Link href={watchlistItem.href} className="header-nav-link">
                        {watchlistItem.label}
                    </Link>
                )}
            </li>
        </ul>
    )
}
export default NavItems
