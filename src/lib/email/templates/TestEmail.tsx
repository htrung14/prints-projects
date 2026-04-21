/**
 * Printer address verification email.
 *
 * Sent from /admin/settings via the "Send test email" button so Thalia can
 * confirm the printer email is configured correctly BEFORE dispatching a
 * real batch. Short, no action required.
 */

import * as React from "react";
import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { baseTextStyle, colors, fontFamily, serifFamily } from "./_shared";

export type TestEmailProps = {
  timestamp: string;
};

export function TestEmail({ timestamp }: TestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Test email from At-Tamassok — no action needed</Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          color: colors.ink,
          fontFamily,
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            margin: "0 auto",
            background: colors.white,
            border: `1px solid ${colors.rule}`,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <Section style={{ background: colors.blue, height: 4 }} />

          <div style={{ padding: "36px 32px 32px" }}>
            <Text
              style={{
                fontFamily: serifFamily,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 22,
                lineHeight: 1.2,
                color: colors.ink,
                margin: "0 0 16px",
              }}
            >
              Printer address verified
            </Text>
            <Text style={{ ...baseTextStyle, color: colors.inkSoft, margin: "0 0 16px" }}>
              This is a test email confirming the printer address is configured correctly. No action
              is needed.
            </Text>
            <Text
              style={{
                ...baseTextStyle,
                fontSize: 12,
                color: colors.inkFaint,
                margin: 0,
              }}
            >
              Sent {timestamp}
            </Text>
          </div>
        </Container>

        <Text
          style={{
            ...baseTextStyle,
            fontFamily: serifFamily,
            fontStyle: "italic",
            textAlign: "center",
            color: colors.inkFaint,
            fontSize: 11,
            marginTop: 20,
          }}
        >
          Thalia Bassim
        </Text>
      </Body>
    </Html>
  );
}

export default TestEmail;
