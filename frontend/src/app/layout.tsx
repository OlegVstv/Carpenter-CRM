import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Carpenter CRM - Внутренний портал",
  description: "Внутренняя система управления столярным производством",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <main className="flex-grow ml-64 p-8 min-h-screen overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
