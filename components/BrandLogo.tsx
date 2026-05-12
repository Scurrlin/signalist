import { cn } from "@/lib/utils";

interface BrandLogoProps {
    className?: string;
}

const BrandLogo = ({ className }: BrandLogoProps) => {
    return (
        <span className={cn("inline-flex items-center gap-3", className)}>
            <span className="brand-logo-text">$ignalist</span>
        </span>
    );
};

export default BrandLogo;
