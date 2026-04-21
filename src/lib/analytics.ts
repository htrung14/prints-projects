import { track } from "@vercel/analytics";

export function trackViewItem(slug: string, title: string) {
  track("view_item", { slug, title });
}

export function trackAddToCart(slug: string, price: number) {
  track("add_to_cart", { slug, price });
}

export function trackBeginCheckout(itemCount: number, total: number) {
  track("begin_checkout", { itemCount, total });
}

export function trackSaveToWishlist(slug: string) {
  track("save_to_wishlist", { slug });
}
