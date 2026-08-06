import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";

/**
 * Memoized per-request so multiple calls during the same server render
 * (layout + page + server actions) only hit the database once.
 */
export const getServerSession = cache(async () => {
    return auth.api.getSession({ headers: await headers() });
});
