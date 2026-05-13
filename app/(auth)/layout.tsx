import Image from "next/image";
import {auth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const session = await auth.api.getSession({ headers: await headers() })

    if(session?.user) redirect('/')

    return (
        <main className="auth-layout">
            <section className="auth-left-section scrollbar-hide-default">
                <div className="auth-form-panel">{children}</div>
            </section>

            <section className="auth-right-section">
                <Image
                    src="/assets/images/dashboard.jpg"
                    alt="Signalist dashboard preview"
                    fill
                    priority
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="auth-dashboard-preview"
                />
                <div className="auth-hero-scrim" />

                <div className="auth-hero-content">
                    <h2 className="auth-hero-title">Look first / Then leap.</h2>
                    <p className="auth-hero-subtitle">The best trades require research, then commitment.</p>
                    <p className="auth-hero-note">$0 forever, no credit card needed.</p>
                </div>
            </section>
        </main>
    )
}
export default Layout
