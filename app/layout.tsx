import type { Metadata } from "next";
import { AuthProvider } from "@/context/auth-context";
import ErrorBoundary from "@/components/error-boundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "Copay Super Admin Portal",
  description: "Centralized dashboard for platform administrators to manage cooperatives, monitor payments, and handle system configurations.",
  keywords: "Copay, admin, cooperative, fintech, payment management",
  authors: [{ name: "Copay Team" }],
  robots: "noindex, nofollow", // Prevent indexing of admin portal
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-gray-50"
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
