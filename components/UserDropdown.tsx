'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogIn, LogOut, Trash2, UserPlus } from "lucide-react";
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
import {deleteAccount, signOut} from "@/lib/actions/auth.actions";
import Link from "next/link";
import SearchCommand from "@/components/SearchCommand";
import { toast } from "sonner";

const SEARCH_DIALOG_SM_BREAKPOINT = 640;
const DEFAULT_MENU_GAP = 10;
const USER_MENU_WIDTH = 256;

type UserMenuPlacement = {
    alignOffset: number;
    sideOffset: number;
};

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
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [menuPlacement, setMenuPlacement] = useState<UserMenuPlacement>({
        alignOffset: 0,
        sideOffset: DEFAULT_MENU_GAP,
    });

    const updateMenuPlacement = useCallback(() => {
        const trigger = triggerRef.current;

        if (!trigger) return;

        const triggerRect = trigger.getBoundingClientRect();
        const searchDialogTopRatio = window.innerWidth < SEARCH_DIALOG_SM_BREAKPOINT ? 0.15 : 0.20;
        const searchDialogTop = window.innerHeight * searchDialogTopRatio;
        const menuTop = Math.max(searchDialogTop, triggerRect.bottom + DEFAULT_MENU_GAP);

        setMenuPlacement({
            alignOffset: (window.innerWidth - USER_MENU_WIDTH) / 2 - triggerRect.left,
            sideOffset: menuTop - triggerRect.bottom,
        });
    }, []);

    const handleSignOut = async () => {
        await signOut();
        router.push("/sign-in");
    }

    const handleDeleteAccount = async () => {
        setIsDeletingAccount(true);

        try {
            const result = await deleteAccount();

            if (!result.success) {
                toast.error(result.error || "Failed to delete account");
                return;
            }

            setDeleteConfirmationOpen(false);
            setDropdownOpen(false);
            toast.success("Your account has been deleted");
            router.replace("/sign-in");
        } catch {
            toast.error("Failed to delete account");
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleOpenSearch = () => {
        setDropdownOpen(false);
        setSearchOpen(true);
    };

    const handleDropdownOpenChange = (open: boolean) => {
        if (!open && isDeletingAccount) return;

        if (open) {
            updateMenuPlacement();
        }

        setDropdownOpen(open);

        if (!open) {
            setDeleteConfirmationOpen(false);
            requestAnimationFrame(() => {
                triggerRef.current?.blur();
            });
        }
    };

    useEffect(() => {
        if (!dropdownOpen) return;

        const handleViewportChange = () => updateMenuPlacement();

        window.addEventListener("resize", handleViewportChange);
        window.addEventListener("orientationchange", handleViewportChange);

        return () => {
            window.removeEventListener("resize", handleViewportChange);
            window.removeEventListener("orientationchange", handleViewportChange);
        };
    }, [dropdownOpen, updateMenuPlacement]);

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
                    <Avatar className="h-8 w-8 ring-1 ring-white/10">
                        <AvatarFallback className="bg-blue-600 text-gray-100 text-sm font-bold">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                        <span className="text-base font-medium text-gray-400 transition-colors group-hover:text-blue-600">
                            {user.name}
                        </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                alignOffset={menuPlacement.alignOffset}
                sideOffset={menuPlacement.sideOffset}
                collisionPadding={16}
                sticky="always"
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
                            <DropdownMenuSeparator className="user-menu-separator"/>
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
                            <DropdownMenuSeparator className="user-menu-separator"/>
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
                )}
                {!isGuest && (
                    <>
                        <DropdownMenuSeparator className="user-menu-separator lg:hidden" />
                        <DropdownMenuItem onClick={handleSignOut} className="user-menu-item">
                            <LogOut aria-hidden="true" />
                            <span>Log Out</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="user-menu-separator" />
                        {deleteConfirmationOpen ? (
                            <div className="flex h-10 items-center gap-1.5 px-1">
                                <span
                                    role="heading"
                                    aria-level={2}
                                    className="flex h-10 min-w-0 flex-1 items-center px-2 text-left text-sm font-medium text-gray-100"
                                >
                                    Are You Sure?
                                </span>
                                <DropdownMenuItem
                                    className="h-10 w-12 shrink-0 cursor-pointer justify-center rounded-lg bg-blue-600 px-2 text-sm font-medium text-gray-100 focus:bg-blue-600 focus:text-gray-100"
                                    disabled={isDeletingAccount}
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        setDeleteConfirmationOpen(false);
                                    }}
                                >
                                    No
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    aria-label={isDeletingAccount ? "Deleting account" : "Yes, delete my account"}
                                    className="h-10 w-12 shrink-0 cursor-pointer justify-center rounded-lg bg-red-500 px-2 text-sm font-medium text-gray-100 focus:bg-red-500 focus:text-gray-100 data-[disabled]:opacity-60"
                                    disabled={isDeletingAccount}
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        void handleDeleteAccount();
                                    }}
                                >
                                    {isDeletingAccount ? "..." : "Yes"}
                                </DropdownMenuItem>
                            </div>
                        ) : (
                            <DropdownMenuItem
                                className="user-menu-item user-menu-item-danger"
                                onSelect={(event) => {
                                    event.preventDefault();
                                    setDeleteConfirmationOpen(true);
                                }}
                            >
                                <Trash2 aria-hidden="true" />
                                <span>Delete Account</span>
                            </DropdownMenuItem>
                        )}
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
