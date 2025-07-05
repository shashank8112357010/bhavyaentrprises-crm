import "../globals.css";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientToaster } from "@/components/ui/client-toaster";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { AuthInitializer } from "@/components/auth/AuthInitializer"; // Import
import { StoreHydrator } from "@/components/hydration/StoreHydrator";
import { preloadCommonData, serializePreloadedData } from "@/lib/server/preload-data";
import Script from "next/script";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Bhavya Entrprises - Maintenance Lead Tracker",
  description: "Banking and NBFC repair and maintenance lead tracker",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side data preloading
  const preloadedData = await preloadCommonData();
  const serializedData = serializePreloadedData(preloadedData);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          " bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        {/* Embed preloaded data for client-side hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__PRELOADED_DATA__ = ${serializedData};`,
          }}
        />
        
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthInitializer>
            <StoreHydrator>
              <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex flex-1">
                  <Sidebar />
                  <main className="flex-1 p-4 md:p-6 h-[calc(100vh-5rem)] overflow-y-auto">
                    {children}
                  </main>
                </div>
              </div>
              <ClientToaster />
            </StoreHydrator>
          </AuthInitializer>
        </ThemeProvider>
      </body>
    </html>
  );
}
