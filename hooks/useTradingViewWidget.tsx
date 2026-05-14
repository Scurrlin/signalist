'use client';
import { useEffect, useRef } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height: number | string = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (container.dataset.widgetReady !== 'true') {
            container.dataset.widgetReady = 'false';
        }

        let readyTimeout: ReturnType<typeof window.setTimeout> | undefined;
        const trackedIframes = new Set<HTMLIFrameElement>();

        const markReady = () => {
            if (readyTimeout) {
                window.clearTimeout(readyTimeout);
            }

            readyTimeout = window.setTimeout(() => {
                container.dataset.widgetReady = 'true';
            }, 150);
        };

        const trackIframe = (iframe: HTMLIFrameElement) => {
            if (trackedIframes.has(iframe)) return;

            trackedIframes.add(iframe);
            iframe.addEventListener('load', markReady, { once: true });
        };

        const trackInjectedIframes = () => {
            container.querySelectorAll('iframe').forEach((iframe) => {
                trackIframe(iframe);
            });
        };

        const observer = new MutationObserver(trackInjectedIframes);
        observer.observe(container, { childList: true, subtree: true });
        trackInjectedIframes();

        if (!container.dataset.loaded) {
            const widgetHeight = typeof height === 'number' ? `${height}px` : height;
            container.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${widgetHeight};"></div>`;

            const script = document.createElement("script");
            script.src = scriptUrl;
            script.async = true;
            script.innerHTML = JSON.stringify(config);

            container.appendChild(script);
            container.dataset.loaded = 'true';
        }

        return () => {
            observer.disconnect();

            if (readyTimeout) {
                window.clearTimeout(readyTimeout);
            }

            trackedIframes.forEach((iframe) => {
                iframe.removeEventListener('load', markReady);
            });
        };
    }, [scriptUrl, config, height])

    return containerRef;
}
export default useTradingViewWidget
