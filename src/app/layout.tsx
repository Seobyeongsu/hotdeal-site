import type { Metadata } from "next";
import { cookies } from "next/headers";
import { isGuestToken, GUEST_COOKIE } from "@/lib/gate";
import GuestGate from "@/components/GuestGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "더파인드핫딜 | The Find HotDeal",
  description: "숨은 착한 핫딜을 찾아드립니다 - 토스·쿠팡 상품 최저가 모니터링",
  robots: { index: false, follow: false },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "더파인드핫딜 | The Find HotDeal",
    description: "숨은 착한 핫딜을 찾아드립니다 - 토스·쿠팡 상품 최저가 모니터링",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "더파인드핫딜 | The Find HotDeal",
    description: "숨은 착한 핫딜을 찾아드립니다 - 토스·쿠팡 상품 최저가 모니터링",
    images: ["/logo.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const allowed = await isGuestToken(jar.get(GUEST_COOKIE)?.value);

  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#eef0f4] text-gray-900" suppressHydrationWarning>
        {allowed ? children : <GuestGate />}
      </body>
    </html>
  );
}
