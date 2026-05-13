import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: {
    canonical: `${SITE_URL}/sign-up`,
  },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
