'use client';

import { useState } from "react";
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

const UserDropdown = ({ user, initialStocks, isGuest = false }: {user: User, initialStocks: StockWithWatchlistStatus[], isGuest?: boolean}) => {
    const router = useRouter();
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

    return (
        <>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 text-gray-4 hover:text-blue-600">
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
                    <div className="flex relative items-center gap-3 py-2">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-600 text-gray-100 text-sm font-bold">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className='text-base font-medium text-gray-400'>
                                {user.name}
                            </span>
                            {!isGuest && <span className="text-sm text-gray-500">{user.email}</span>}
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-600"/>
                
                {/* Guest users see Sign Up and Sign In options */}
                {isGuest ? (
                    <>
                        {/* Desktop: Show Sign Up and Sign In */}
                        <div className="hidden sm:block">
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
                        
                        {/* Mobile: Show Sign Up, Sign In, Dashboard, and Search */}
                        <div className="sm:hidden">
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
                                <NavItems initialStocks={initialStocks} isGuest={true} inDropdown={true} onOpenSearch={handleOpenSearch} />
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
                        <DropdownMenuSeparator className="sm:hidden bg-gray-600"/>
                        <nav className="sm:hidden">
                            <NavItems initialStocks={initialStocks} isGuest={false} inDropdown={true} onOpenSearch={handleOpenSearch} />
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
        />
    </>
    )
}
export default UserDropdown
