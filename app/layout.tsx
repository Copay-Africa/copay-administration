import type { Metadata } from "next";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";
import ErrorBoundary from "@/components/error-boundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "Copay Super Admin Portal",
  description: "Centralized dashboard for platform administrators to manage cooperatives, monitor payments, and handle system configurations.",
  keywords: "Copay, admin, cooperative, fintech, payment management",
  authors: [{ name: "Copay Team" }],
  robots: "noindex, nofollow", // Prevent indexing of admin portal
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#027e6f" },
    { media: "(prefers-color-scheme: dark)", color: "#1E2329" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#027e6f" />
      </head>
      <body
        className="font-sans antialiased theme-transition"
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
