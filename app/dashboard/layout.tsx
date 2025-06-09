import "../globals.css";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientToaster } from "@/components/ui/client-toaster";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { AuthInitializer } from "@/components/auth/AuthInitializer"; // Import

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Bhavya Entrprises - Maintenance Lead Tracker",
  description: "Banking and NBFC repair and maintenance lead tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          " bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthInitializer>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 p-4 md:p-6 h-[calc(100vh-5rem)] overflow-y-auto">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </AuthInitializer>
        </ThemeProvider>
      </body>
    </html>
  );
}
