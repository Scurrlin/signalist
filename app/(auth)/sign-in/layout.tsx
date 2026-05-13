import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: {
    canonical: `${SITE_URL}/sign-in`,
  },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
