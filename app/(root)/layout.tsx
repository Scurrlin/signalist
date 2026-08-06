import Header from "@/components/Header";
import {getServerSession} from "@/lib/better-auth/session";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const session = await getServerSession();
    const cookieStore = await cookies();
    const guestMode = cookieStore.get('guest_mode');

    // If no session and no guest mode, redirect to sign-in
    if(!session?.user && !guestMode) {
        redirect('/sign-in');
    }

    // Create user object - will be undefined for guests
    const user = session?.user ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
    } : undefined;

    return (
        <main className="min-h-screen text-gray-400">
            <Header user={user} isGuest={!session?.user && !!guestMode} />

            <div className="container py-10">
                {children}
            </div>
        </main>
    )
}
export default Layout
