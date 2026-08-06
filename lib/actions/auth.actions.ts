'use server';

import {auth} from "@/lib/better-auth/auth";
import {headers, cookies} from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const signUpWithEmail = async ({ email, password, fullName }: SignUpFormData) => {
    const ip = await getClientIp();
    if (!checkRateLimit(`signup:${ip}`, 3, 5 * 60_000)) {
        return { success: false, error: 'Too many sign-up attempts. Please wait a few minutes and try again.' };
    }

    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        return { success: true, data: response }
    } catch (e: unknown) {
        console.log('Sign up failed', e)
        
        // Extract the specific error message from Better Auth
        const error = e as { message?: string; body?: { message?: string } };
        const errorMessage = error?.message || error?.body?.message || 'Failed to create account';
        
        // Check for common error scenarios
        if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('exists')) {
            return { success: false, error: 'An account with this email already exists' }
        }
        
        return { success: false, error: errorMessage }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    const ip = await getClientIp();
    if (!checkRateLimit(`signin:${ip}`, 5, 60_000)) {
        return { success: false, error: 'Too many sign-in attempts. Please wait a minute and try again.' };
    }

    try {
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e: unknown) {
        console.log('Sign in failed', e)
        
        // Extract the specific error message from Better Auth
        const error = e as { message?: string; body?: { message?: string } };
        const errorMessage = error?.message || error?.body?.message || 'Invalid email or password';
        
        return { success: false, error: errorMessage }
    }
}

export const signOut = async () => {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('guest_mode');
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}

export const deleteAccount = async () => {
    try {
        await auth.api.deleteUser({
            body: {},
            headers: await headers(),
        });

        const cookieStore = await cookies();
        cookieStore.delete('guest_mode');

        return { success: true };
    } catch (e: unknown) {
        console.log('Delete account failed', e);

        const error = e as { message?: string; body?: { message?: string } };
        const errorMessage = error?.body?.message || error?.message || 'Failed to delete account';

        return { success: false, error: errorMessage };
    }
}

export async function setGuestMode() {
    try {
        const cookieStore = await cookies();
        // Set a guest cookie that expires in 1 hour
        cookieStore.set('guest_mode', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600,
            path: '/',
        });
        
        return { success: true };
    } catch (error: unknown) {
        console.error('Guest mode error:', error);
        const err = error as { message?: string };
        return { success: false, error: err.message || 'Failed to set guest mode' };
    }
}
