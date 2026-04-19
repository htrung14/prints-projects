import type { Metadata } from "next";
import { EB_Garamond, Geist_Mono, Noto_Naskh_Arabic } from "next/font/google";
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

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "At-Tamassok - Thalia Bassim",
  description: "Twenty-five archival pigment prints. Limited editions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${favorit.variable} ${ebGaramond.variable} ${geistMono.variable} ${notoNaskhArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <CartProvider>
          {/* DemoBanner now lives only on the checkout page so the rest of
              the site (landing, product detail, essay) can be reviewed as it
              will be seen in production, without the preview nag. */}
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
