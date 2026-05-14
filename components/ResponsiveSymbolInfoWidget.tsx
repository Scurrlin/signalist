'use client';

import TradingViewWidget from './TradingViewWidget';

interface ResponsiveSymbolInfoWidgetProps {
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number | string;
    className?: string;
    minWidth?: number;
}

export default function ResponsiveSymbolInfoWidget({
    scriptUrl,
    config,
    height = 170,
    className,
    minWidth = 720,
}: ResponsiveSymbolInfoWidgetProps) {
    return (
        <div className="w-full min-w-0 overflow-x-auto">
            <div style={{ minWidth }}>
                <TradingViewWidget
                    scriptUrl={scriptUrl}
                    config={config}
                    height={height}
                    className={className}
                />
            </div>
        </div>
    );
}
