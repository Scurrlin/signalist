import Watchlist from "@/components/Watchlist";
import { auth } from "@/lib/better-auth/auth";
import { headers, cookies } from "next/headers";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function WatchlistPage() {
  // Get user session
  const session = await auth.api.getSession({ headers: await headers() });
  const cookieStore = await cookies();
  const guestMode = cookieStore.get('guest_mode');
  const isGuest = !session?.user && !!guestMode;

  // Redirect guests to sign up
  if (isGuest) {
    redirect('/sign-up');
  }

  // Get watchlist data
  let watchlistStocks: StockWithData[] = [];
  let userId: string | undefined;

  if (session?.user?.email) {
    userId = session.user.id;
    watchlistStocks = await getWatchlistWithData(session.user.email);
  }

  if (watchlistStocks.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Your watchlist is empty
          </h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Start building your watchlist by searching for stocks and adding them to track their performance
          </p>
          <Link
            href="/"
            className="inline-block accent-btn px-6 py-3"
          >
            Explore Stocks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Watchlist
        initialStocks={watchlistStocks}
        userId={userId!}
      />
    </div>
  );
}
