'use client';

import { useEffect, useState } from 'react';
import TradingViewWidget from './TradingViewWidget';

interface ResponsiveStockChartProps {
    scriptUrl: string;
    defaultConfig: Record<string, unknown>;
    detailsConfig: Record<string, unknown>;
    height?: number | string;
    className?: string;
}

export default function ResponsiveStockChart({
    scriptUrl,
    defaultConfig,
    detailsConfig,
    height = 600,
    className,
}: ResponsiveStockChartProps) {
    const [isLargeScreen, setIsLargeScreen] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const syncScreenSize = () => setIsLargeScreen(mediaQuery.matches);

        syncScreenSize();
        mediaQuery.addEventListener('change', syncScreenSize);

        return () => {
            mediaQuery.removeEventListener('change', syncScreenSize);
        };
    }, []);

    const config = isLargeScreen ? detailsConfig : defaultConfig;

    return (
        <TradingViewWidget
            key={isLargeScreen ? 'details-chart' : 'standard-chart'}
            scriptUrl={scriptUrl}
            config={config}
            className={className}
            height={height}
        />
    );
}
