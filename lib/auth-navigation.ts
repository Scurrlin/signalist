type AuthRouter = {
  push: (href: string, options?: { scroll?: boolean }) => void;
};

export const enterAppFromAuth = (router: AuthRouter) => {
  if (typeof window === 'undefined') {
    router.push('/', { scroll: true });
    return;
  }

  let previousScrollRestoration: History['scrollRestoration'] | undefined;

  try {
    previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
  } catch {
    previousScrollRestoration = undefined;
  }

  try {
    router.push('/', { scroll: true });
  } catch (error) {
    if (previousScrollRestoration) {
      window.history.scrollRestoration = previousScrollRestoration;
    }

    throw error;
  }

  if (previousScrollRestoration) {
    window.setTimeout(() => {
      window.history.scrollRestoration = previousScrollRestoration;
    }, 1000);
  }
};
