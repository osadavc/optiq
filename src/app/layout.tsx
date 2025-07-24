import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { getLessons } from "@/lib/actions/lessons";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Optiq",
  description: "Learning management system",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lessons = await getLessons();

  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased font-geist-sans h-full`}
      >
        <div className="flex h-full">
          <SidebarProvider>
            <AppSidebar lessons={lessons} />
            <SidebarInset className="flex-1 min-w-0">{children}</SidebarInset>
          </SidebarProvider>
          <RightSidebar />
        </div>
      </body>
    </html>
  );
}
