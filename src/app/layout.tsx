import type { Metadata } from "next";
import { Geist, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Toast from "@/components/Toast";
import { Analytics } from "@vercel/analytics/react";
import { CartProvider } from "@/lib/cart";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Prints — demo",
  description: "A Brooklyn, NY photographer's print shop. Demo build.",
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${notoNaskhArabic.variable} h-full antialiased`}
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
          {modal}
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
