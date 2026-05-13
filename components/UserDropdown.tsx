'use client';

import { useRef, useState } from "react";
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
import {LogOut} from "lucide-react";
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
        <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    ref={triggerRef}
                    variant="ghost"
                    className="flex items-center gap-3 text-gray-400 hover:text-blue-600 focus:!ring-0 focus-visible:!border-transparent focus-visible:!ring-0 data-[state=open]:bg-transparent"
                >
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-600 text-gray-100 text-sm font-bold">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                        <span className='text-base font-medium text-gray-400'>
                            {user.name}
                        </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="text-gray-400">
                <DropdownMenuLabel>
                    <div className="flex items-center gap-3 py-2">
                        <Avatar className="h-10 w-10 shrink-0">
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
                <DropdownMenuSeparator className="bg-gray-600"/>
                
                {/* Guest users see Sign Up and Sign In options */}
                {isGuest ? (
                    <>
                        {/* Wide screens: Show only Sign Up and Sign In */}
                        <div className="hidden lg:block">
                            <DropdownMenuItem asChild className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-blue-600 transition-colors cursor-pointer">
                                <Link href="/sign-up" className="w-full">
                                    Sign Up
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-600"/>
                            <DropdownMenuItem asChild className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-blue-600 transition-colors cursor-pointer">
                                <Link href="/sign-in" className="w-full">
                                    Sign In
                                </Link>
                            </DropdownMenuItem>
                        </div>
                        
                        {/* Compact header: Show auth actions plus collapsed nav links */}
                        <div className="lg:hidden">
                            <DropdownMenuItem asChild className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-blue-600 transition-colors cursor-pointer">
                                <Link href="/sign-up" className="w-full">
                                    Sign Up
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-600"/>
                            <DropdownMenuItem asChild className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-blue-600 transition-colors cursor-pointer">
                                <Link href="/sign-in" className="w-full">
                                    Sign In
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-600"/>
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
                        {/* Authenticated users see Logout */}
                        <DropdownMenuItem onClick={handleSignOut} className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-blue-600 transition-colors cursor-pointer">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="lg:hidden bg-gray-600"/>
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
