import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WishlistProvider } from "@/components/wishlist-provider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "PizzaHub | Fresh Pizza, Fast Delivery",
  description: "Order your favourite handcrafted pizza from PizzaHub.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen antialiased">
        <WishlistProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <Toaster theme="dark" position="top-right" richColors />
        </WishlistProvider>
      </body>
    </html>
  );
}
