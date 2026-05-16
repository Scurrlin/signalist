'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
    AUTH_SUCCESS_TRANSITION_EVENT,
    AUTH_SUCCESS_TRANSITION_MEDIA_QUERY,
    AUTH_SUCCESS_TRANSITION_REVEAL_MS,
} from '@/lib/auth-transition';

const AuthSuccessTransition = () => {
    const pathname = usePathname();
    const [isActive, setIsActive] = useState(false);
    const startPathRef = useRef<string | null>(null);
    const revealTimerRef = useRef<number | null>(null);
    const fallbackTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const clearRevealTimer = () => {
            if (revealTimerRef.current) {
                window.clearTimeout(revealTimerRef.current);
                revealTimerRef.current = null;
            }
        };

        const clearFallbackTimer = () => {
            if (fallbackTimerRef.current) {
                window.clearTimeout(fallbackTimerRef.current);
                fallbackTimerRef.current = null;
            }
        };

        const handleTransitionStart = () => {
            if (!window.matchMedia(AUTH_SUCCESS_TRANSITION_MEDIA_QUERY).matches) return;

            clearRevealTimer();
            clearFallbackTimer();
            startPathRef.current = window.location.pathname;
            setIsActive(true);

            fallbackTimerRef.current = window.setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'auto' });
                startPathRef.current = null;
                setIsActive(false);
            }, AUTH_SUCCESS_TRANSITION_REVEAL_MS + 2000);
        };

        window.addEventListener(AUTH_SUCCESS_TRANSITION_EVENT, handleTransitionStart);

        return () => {
            window.removeEventListener(AUTH_SUCCESS_TRANSITION_EVENT, handleTransitionStart);
            clearRevealTimer();
            clearFallbackTimer();
        };
    }, []);

    useEffect(() => {
        if (!isActive || !startPathRef.current || pathname === startPathRef.current) return;

        if (fallbackTimerRef.current) {
            window.clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
        }

        const frame = window.requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });

            revealTimerRef.current = window.setTimeout(() => {
                startPathRef.current = null;
                setIsActive(false);
            }, AUTH_SUCCESS_TRANSITION_REVEAL_MS);
        });

        return () => window.cancelAnimationFrame(frame);
    }, [isActive, pathname]);

    return (
        <div
            aria-hidden="true"
            className={`fixed inset-0 z-[999999] bg-black transition-opacity duration-150 ${
                isActive ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
        />
    );
};

export default AuthSuccessTransition;
