'use client'

import {NAV_ITEMS} from "@/lib/constants";
import Link from "next/link";
import { BookOpen, LayoutDashboard, Search as SearchIcon, Star } from "lucide-react";
import SearchCommand from "@/components/SearchCommand";
import {DropdownMenuItem, DropdownMenuSeparator} from "@/components/ui/dropdown-menu";

const getDropdownNavIcon = (href: string) => {
    if (href === '/') return LayoutDashboard;
    if (href === '/search') return SearchIcon;
    if (href === '/watchlist') return Star;
    return BookOpen;
};

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
                    const NavIcon = getDropdownNavIcon(href);
                    
                    if(href === '/search') return (
                        <div key="search-trigger">
                            <DropdownMenuItem 
                                onClick={onOpenSearch}
                                className="user-menu-item"
                            >
                                <NavIcon aria-hidden="true" />
                                <span className="w-full block">Search</span>
                            </DropdownMenuItem>
                            {!isLast && <DropdownMenuSeparator className="user-menu-separator"/>}
                        </div>
                    )

                    return (
                        <div key={href}>
                            <DropdownMenuItem asChild className="user-menu-item">
                                {external ? (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="w-full">
                                        <NavIcon aria-hidden="true" />
                                        <span>{label}</span>
                                    </a>
                                ) : (
                                    <Link href={href} className="w-full">
                                        <NavIcon aria-hidden="true" />
                                        <span>{label}</span>
                                    </Link>
                                )}
                            </DropdownMenuItem>
                            {!isLast && <DropdownMenuSeparator className="user-menu-separator"/>}
                        </div>
                    )
                })}
            </>
        )
    }

    const overviewItem = navItems.find(({ href }) => href === '/');
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
                {overviewItem && (
                    <Link href={overviewItem.href} className="header-nav-link">
                        {overviewItem.label}
                    </Link>
                )}
            </li>
            <li className="header-brand-spacer" aria-hidden="true" />
            <li className="header-nav-group header-nav-group-right header-side-nav-item">
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
