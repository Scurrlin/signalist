export const AUTH_SUCCESS_TRANSITION_EVENT = 'signalist:auth-success-transition';
export const AUTH_SUCCESS_TRANSITION_MEDIA_QUERY = '(max-width: 1023px)';
export const AUTH_SUCCESS_TRANSITION_NAV_DELAY_MS = 100;
export const AUTH_SUCCESS_TRANSITION_REVEAL_MS = 650;

type AuthTransitionRouter = {
    push: (href: string, options?: { scroll?: boolean }) => void;
};

export const shouldUseAuthSuccessTransition = () => {
    return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia(AUTH_SUCCESS_TRANSITION_MEDIA_QUERY).matches
    );
};

export const pushWithAuthSuccessTransition = (router: AuthTransitionRouter, href = '/') => {
    if (!shouldUseAuthSuccessTransition()) {
        router.push(href);
        return;
    }

    window.dispatchEvent(new Event(AUTH_SUCCESS_TRANSITION_EVENT));

    window.setTimeout(() => {
        router.push(href, { scroll: false });
    }, AUTH_SUCCESS_TRANSITION_NAV_DELAY_MS);
};
