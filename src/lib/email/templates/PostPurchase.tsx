/**
 * Post-purchase 7-touch sequence - variant switched by `touchNumber`.
 *
 * Touches (derived from the Notion research report §4, reproduced in
 * docs-ai/backend-plan.md "Locked decisions"):
 *   1. Day 0 - confirmation follow-up / care-before-dispatch note
 *   2. Dispatch - "your print is on its way" (used if we want a warmer dup
 *                 of the Shipped notification; separate from tracking email)
 *   3. Delivery - "has it arrived? how to care for it"
 *   4. Day 7 - care note, mount/framing options
 *   5. Day 14 - referral "give $20, get $20"
 *   6. Day 30 - check-in, request feedback
 *   7. Day 60 - next drop / future work
 *
 * Copy is intentionally restrained: one CTA per touch, no hard-sell. The
 * Notion research report §3 flagged "gold foil, flourish fonts, hard-sell
 * upsell" as anti-patterns - we skip all of those.
 */

import * as React from "react";
import { Body, Container, Head, Html, Link, Preview, Text } from "@react-email/components";
import type { Order } from "@/lib/types";
import { baseTextStyle, colors, fontFamily, formatOrderReference } from "./_shared";

export type PostPurchaseTouchNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PostPurchaseProps = {
  order: Order;
  touchNumber: PostPurchaseTouchNumber;
  referralCode?: string;
};

type TouchContent = {
  preview: string;
  subject: string;
  body: string;
  cta?: { label: string; href: string };
};

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://thaliabassim.com";
}

function contentForTouch(
  order: Order,
  touchNumber: PostPurchaseTouchNumber,
  referralCode?: string
): TouchContent {
  const base = appUrl();
  const ref = formatOrderReference(order);

  switch (touchNumber) {
    case 1:
      return {
        preview: `A short note on your order ${ref}.`,
        subject: `A short note on your order ${ref}`,
        body: "A quick note while your print is being made. Each one is produced by hand on archival pigment paper. Please allow up to 7 business days before dispatch. We'll write again when tracking is attached.",
      };
    case 2:
      return {
        preview: `Your print from ${ref} is on its way.`,
        subject: `Your print is on its way`,
        body: "Your print left the lab today. Tracking has been sent in a separate note. It ships flat or rolled depending on size; please open it flat and let it acclimatize for a few hours before framing.",
      };
    case 3:
      return {
        preview: `Has ${ref} arrived safely?`,
        subject: `Has your print arrived?`,
        body: "Checking in to make sure your print landed safely. If anything looks off - a nick, a mark, a scuff in transit - reply within fourteen days of delivery and we will replace it. Otherwise, enjoy living with it.",
      };
    case 4:
      return {
        preview: `Caring for your archival print.`,
        subject: `Caring for your print`,
        body: "A few notes on care. Keep the print out of direct sunlight. Frame behind UV glass or acrylic when possible. Handle by the edges; cotton gloves are ideal but clean hands are fine. Avoid mounting with adhesive - use archival photo corners or a reversible hinge.",
      };
    case 5:
      return {
        preview: `A small thank-you, if you care to share.`,
        subject: `A small thank-you`,
        body: `If you know someone who might appreciate the work, feel free to share the catalogue. Word of mouth means more than anything.`,
        cta: { label: "View the catalogue", href: `${base}/` },
      };
    case 6:
      return {
        preview: `Living with your print.`,
        subject: `How's the print?`,
        body: "A month in - how is the print sitting on the wall? If you have a moment, a line back is always welcome. If you framed it, I would love to see it; feel free to reply with a photo. No obligation.",
      };
    case 7:
      return {
        preview: `New work from Thalia.`,
        subject: `New work from Thalia`,
        body: "It has been two months since your print shipped. New work is starting to come out of the lab; if you would like to see it first before it goes public, reply and I will put you on the shortlist. Otherwise, thank you for the early support.",
        cta: { label: "See the current drop", href: `${base}/` },
      };
  }
}

export function PostPurchase({ order, touchNumber, referralCode }: PostPurchaseProps) {
  const content = contentForTouch(order, touchNumber, referralCode);

  return (
    <Html>
      <Head />
      <Preview>{content.preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          color: colors.ink,
          fontFamily,
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "40px 24px",
          }}
        >
          <Text style={{ ...baseTextStyle, marginBottom: 24 }}>Thalia Bassim</Text>
          <Text style={{ ...baseTextStyle, marginBottom: 24 }}>{content.body}</Text>

          {content.cta ? (
            <Text style={baseTextStyle}>
              <Link
                href={content.cta.href}
                style={{ ...baseTextStyle, textDecoration: "underline" }}
              >
                {content.cta.label}
              </Link>
            </Text>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}

/**
 * Exported so the sender can set the email subject per touch without
 * re-deriving it from the template.
 */
export function subjectForTouch(
  order: Order,
  touchNumber: PostPurchaseTouchNumber,
  referralCode?: string
): string {
  return contentForTouch(order, touchNumber, referralCode).subject;
}

export default PostPurchase;
