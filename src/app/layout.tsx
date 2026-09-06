import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "더파인드핫딜 | The Find HotDeal",
  description: "숨은 착한 핫딜을 찾아드립니다 - 토스·쿠팡 상품 최저가 모니터링",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
