import { betterAuth } from "better-auth";
import { mongodbAdapter} from "better-auth/adapters/mongodb";
import { connectToDatabase} from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { nextCookies} from "better-auth/next-js";
import type { Db } from "mongodb";

const createAuth = (db: Db) =>
    betterAuth({
        database: mongodbAdapter(db),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        session: {
            expiresIn: 60 * 60 * 12, // 12 hours
            updateAge: 60 * 60, // refresh once a session is >1h old, so active users roll forward
        },
        user: {
            deleteUser: {
                enabled: true,
                afterDelete: async (user) => {
                    await Watchlist.deleteMany({ userId: user.id });
                },
            },
        },
        rateLimit: {
            window: 60,
            max: 100,
            customRules: {
                '/sign-in/email': { window: 60, max: 5 },
                '/sign-up/email': { window: 300, max: 3 },
            },
        },
        plugins: [nextCookies()],
    });

// Module-level await: this file runs once per server process, so auth is created once.
const { connection } = await connectToDatabase();

if(!connection.db) throw new Error('MongoDB connection not found');

export const auth = createAuth(connection.db as Db);
