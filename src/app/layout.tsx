import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "PDM Pro Moda",
  description: "Sistema de gestão de desenvolvimento de produtos têxteis",
};

import { Providers } from "@/components/providers";

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="font-sans" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
