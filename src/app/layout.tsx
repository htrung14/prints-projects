import type { Metadata } from "next";
import { Noto_Naskh_Arabic } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Toast from "@/components/Toast";
import ImageProtect from "@/components/ImageProtect";
import { Analytics } from "@vercel/analytics/react";
import { CartProvider } from "@/lib/cart";

const favorit = localFont({
  src: [
    { path: "../../public/fonts/FavoritLightC.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/FavoritLightC-Italic.woff2", weight: "300", style: "italic" },
    { path: "../../public/fonts/FavoritBookC.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/FavoritBookC-Italic.woff2", weight: "400", style: "italic" },
    { path: "../../public/fonts/FavoritC.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/FavoritC-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-favorit",
  display: "swap",
});

// Suisse Intl — locked as the secondary/serif font (2026-04-20).
const suisseIntl = localFont({
  src: [
    { path: "../../public/fonts/SuisseIntl-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/SuisseIntl-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/SuisseIntl-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/SuisseIntl-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-suisse-intl",
  display: "swap",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "At-Tamassok - Thalia Bassim",
  description: "Archival pigment prints. Limited editions of 10.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${favorit.variable} ${suisseIntl.variable} ${notoNaskhArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <CartProvider>
          <div className="app-shell flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <CartDrawer />
          <Toast />
          <ImageProtect />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
