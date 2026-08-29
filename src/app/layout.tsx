import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "핫딜 리딩방 | 핫딜 모니터",
  description: "전 상품 핫딜 모니터링 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white">
        {children}
      </body>
    </html>
  );
}
