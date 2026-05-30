import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";

export const metadata: Metadata = {
  title: "WordMaster - 背单词平台",
  description: "智能背单词，高效记单词",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex">
          <Sidebar />
          <main className="ml-56 flex-1 min-h-screen p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
