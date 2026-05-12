import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
    className?: string;
}

const BrandLogo = ({ className }: BrandLogoProps) => {
    return (
        <span className={cn("inline-flex items-center gap-3", className)}>
            <Image
                src="/assets/icons/TradingView_Logo.svg"
                alt=""
                width={36}
                height={28}
                aria-hidden="true"
                className="brand-logo-icon"
            />
            <span className="brand-logo-text">$ignalist</span>
        </span>
    );
};

export default BrandLogo;
