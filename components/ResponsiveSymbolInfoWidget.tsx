'use client';

import TradingViewWidget from './TradingViewWidget';
import { cn } from '@/lib/utils';

interface ResponsiveSymbolInfoWidgetProps {
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number | string;
    className?: string;
}

export default function ResponsiveSymbolInfoWidget({
    scriptUrl,
    config,
    height = 170,
    className,
}: ResponsiveSymbolInfoWidgetProps) {
    return (
        <div className="w-full min-w-0 overflow-hidden">
            <TradingViewWidget
                scriptUrl={scriptUrl}
                config={config}
                height={height}
                className={cn('symbol-info-widget', className)}
            />
        </div>
    );
}
