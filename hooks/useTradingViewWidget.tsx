'use client';
import { useEffect, useRef }     from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height: number | string = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (container.dataset.loaded) return;

        const widgetHeight = typeof height === 'number' ? `${height}px` : height;
        container.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${widgetHeight};"></div>`;

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.innerHTML = JSON.stringify(config);

        container.appendChild(script);
        container.dataset.loaded = 'true';
    }, [scriptUrl, config, height])

    return containerRef;
}
export default useTradingViewWidget
