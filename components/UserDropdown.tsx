'use client';

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, LogIn, LogOut, UserPlus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import NavItems from "@/components/NavItems";
import {signOut} from "@/lib/actions/auth.actions";
import Link from "next/link";
import SearchCommand from "@/components/SearchCommand";

const UserDropdown = ({
    user,
    initialStocks,
    isGuest = false,
    watchlistSymbols = [],
}: {
    user: User;
    initialStocks: StockWithWatchlistStatus[];
    isGuest?: boolean;
    watchlistSymbols?: string[];
}) => {
    const router = useRouter();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.push("/sign-in");
    }

    const handleOpenSearch = () => {
        setDropdownOpen(false);
        setSearchOpen(true);
    };

    const handleDropdownOpenChange = (open: boolean) => {
        setDropdownOpen(open);

        if (!open) {
            requestAnimationFrame(() => {
                triggerRef.current?.blur();
            });
        }
    };

    return (
        <>
        {dropdownOpen && createPortal(
            <div className="user-menu-overlay" aria-hidden="true" />,
            document.body
        )}
        <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    ref={triggerRef}
                    variant="ghost"
                    className="group flex cursor-pointer items-center gap-3 text-gray-400 hover:bg-transparent! dark:hover:bg-transparent! focus:!ring-0 focus-visible:!border-transparent focus-visible:!ring-0 data-[state=open]:bg-transparent!"
                >
                    <Avatar className="h-8 w-8 ring-1 ring-white/10 transition-shadow group-hover:ring-blue-600/60">
                        <AvatarFallback className="bg-blue-600 text-gray-100 text-sm font-bold">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                        <span className="text-base font-medium text-gray-400 transition-colors group-hover:text-blue-600">
                            {user.name}
                        </span>
                    </div>
                    <ChevronDown
                        aria-hidden="true"
                        className={`hidden h-4 w-4 transition-transform duration-200 md:block ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="user-menu-content"
            >
                <DropdownMenuLabel className="user-menu-label">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 shrink-0 ring-1 ring-white/10">
                            <AvatarFallback className="bg-blue-600 text-gray-100 text-sm font-bold">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <span className="block whitespace-normal break-words text-base font-medium leading-snug text-gray-100">
                                {user.name}
                            </span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="user-menu-separator"/>
                
                {/* Guest users see Sign Up and Sign In options */}
                {isGuest ? (
                    <>
                        {/* Wide screens: Show only Sign Up and Sign In */}
                        <div className="hidden space-y-1 lg:block">
                            <DropdownMenuItem asChild className="user-menu-item">
                                <Link href="/sign-up" className="w-full">
                                    <UserPlus aria-hidden="true" />
                                    Sign Up
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="user-menu-item">
                                <Link href="/sign-in" className="w-full">
                                    <LogIn aria-hidden="true" />
                                    Sign In
                                </Link>
                            </DropdownMenuItem>
                        </div>
                        
                        {/* Compact header: Show auth actions plus collapsed nav links */}
                        <div className="lg:hidden">
                            <DropdownMenuItem asChild className="user-menu-item">
                                <Link href="/sign-up" className="w-full">
                                    <UserPlus aria-hidden="true" />
                                    Sign Up
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="user-menu-item">
                                <Link href="/sign-in" className="w-full">
                                    <LogIn aria-hidden="true" />
                                    Sign In
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="user-menu-separator"/>
                            <nav>
                                <NavItems
                                    initialStocks={initialStocks}
                                    isGuest={true}
                                    inDropdown={true}
                                    onOpenSearch={handleOpenSearch}
                                    watchlistSymbols={watchlistSymbols}
                                />
                            </nav>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Authenticated users see Log Out */}
                        <DropdownMenuItem onClick={handleSignOut} className="user-menu-item user-menu-item-danger">
                            <LogOut aria-hidden="true" />
                            <span>Log Out</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="user-menu-separator lg:hidden"/>
                        <nav className="lg:hidden">
                            <NavItems
                                initialStocks={initialStocks}
                                isGuest={false}
                                inDropdown={true}
                                onOpenSearch={handleOpenSearch}
                                userId={user.id}
                                watchlistSymbols={watchlistSymbols}
                            />
                        </nav>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
        
        <SearchCommand 
            renderAs="hidden"
            initialStocks={initialStocks}
            externalOpen={searchOpen}
            onExternalOpenChange={setSearchOpen}
            userId={isGuest ? undefined : user.id}
            isGuest={isGuest}
            watchlistSymbols={watchlistSymbols}
        />
    </>
    )
}
export default UserDropdown
