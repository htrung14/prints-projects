import type { BatchRowItem } from "@/components/dispatch/BatchTrackingTable";
import type { Address } from "@/lib/types";

export type DemoOrder = {
  orderId: string;
  shortId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: Address;
  items: BatchRowItem[];
  initialCarrier: string | null;
  initialTrackingNumber: string | null;
  reprintLabel: string | null;
  totalCents: number;
  currency: string;
  status: string;
  createdAt: string;
};

export const DEMO_ORDERS: DemoOrder[] = [
  {
    orderId: "demo-a3f1b2c4-0001",
    shortId: "A3F1B2C4",
    customerName: "Leila Nasser",
    customerEmail: "l.nasser@example.com",
    shippingAddress: {
      name: "Leila Nasser",
      line1: "14 Rue de Rivoli",
      line2: "Apt 3B",
      city: "Paris",
      state: "",
      postalCode: "75004",
      country: "France",
    },
    items: [
      {
        id: "item-a3f1-001",
        title: "Bekaa Valley, 2021",
        sizeLabel: '18×24"',
        editionNumber: 3,
        editionTotal: 10,
      },
    ],
    initialCarrier: null,
    initialTrackingNumber: null,
    reprintLabel: null,
    totalCents: 42000,
    currency: "usd",
    status: "queued_for_print",
    createdAt: "2026-05-08T14:22:00Z",
  },
  {
    orderId: "demo-d9e8f7a2-0002",
    shortId: "D9E8F7A2",
    customerName: "Marcus Webb",
    customerEmail: "m.webb@example.com",
    shippingAddress: {
      name: "Marcus Webb",
      line1: "428 West 24th Street",
      line2: null,
      city: "New York",
      state: "NY",
      postalCode: "10011",
      country: "US",
    },
    items: [
      {
        id: "item-d9e8-001",
        title: "Road to Chtaura, 2022",
        sizeLabel: '11×14"',
        editionNumber: 7,
        editionTotal: 10,
      },
    ],
    initialCarrier: null,
    initialTrackingNumber: null,
    reprintLabel: "REPRINT — Order #A1B2C3D4",
    totalCents: 28000,
    currency: "usd",
    status: "queued_for_print",
    createdAt: "2026-05-09T09:05:00Z",
  },
  {
    orderId: "demo-c2d4e6f8-0003",
    shortId: "C2D4E6F8",
    customerName: "Yuki Tanaka",
    customerEmail: "y.tanaka@example.com",
    shippingAddress: {
      name: "Yuki Tanaka",
      line1: "2-15-3 Minami Aoyama",
      line2: null,
      city: "Tokyo",
      state: "Minato-ku",
      postalCode: "107-0062",
      country: "Japan",
    },
    items: [
      {
        id: "item-c2d4-001",
        title: "Sunset over Tyre, 2020",
        sizeLabel: '24×36"',
        editionNumber: 1,
        editionTotal: 10,
      },
      {
        id: "item-c2d4-002",
        title: "Sidon Harbour, 2019",
        sizeLabel: '16×20"',
        editionNumber: 5,
        editionTotal: 10,
      },
    ],
    initialCarrier: null,
    initialTrackingNumber: null,
    reprintLabel: null,
    totalCents: 88000,
    currency: "usd",
    status: "queued_for_print",
    createdAt: "2026-05-10T18:47:00Z",
  },
];

export const DEMO_SINGLE_ORDER = DEMO_ORDERS[0];

export const DEMO_ADMIN_METRICS = {
  paidNotBatched: 2,
  reprintsWaiting: 1,
  inPrint: 3,
  shippedNotDelivered: 1,
  deliveredLast30: 8,
  refundedLast30: 0,
};

export const DEMO_STUCK_ORDERS = [{ id: "demo-b5c6d7e8-0000", shortId: "B5C6D7E8", daysStuck: 9 }];

export const DEMO_AUDIT_LOG = [
  {
    id: "audit-001",
    createdAt: "2026-05-11T08:14:00Z",
    actor: "system",
    action: "order.paid",
    meta: '{"orderId":"demo-c2d4e6f8-0003","total":88000}',
  },
  {
    id: "audit-002",
    createdAt: "2026-05-11T08:14:02Z",
    actor: "system",
    action: "email.confirmation_sent",
    meta: '{"to":"y.tanaka@example.com"}',
  },
  {
    id: "audit-003",
    createdAt: "2026-05-10T14:30:00Z",
    actor: "system",
    action: "dispatch.batch_sent",
    meta: '{"orderCount":3,"printCount":4}',
  },
  {
    id: "audit-004",
    createdAt: "2026-05-09T09:06:00Z",
    actor: "system",
    action: "order.reprint_created",
    meta: '{"parentOrderId":"demo-a1b2c3d4","reason":"damage"}',
  },
  {
    id: "audit-005",
    createdAt: "2026-05-08T22:00:00Z",
    actor: "system",
    action: "cron.watchdog_ok",
    meta: '{"checked":12,"stuck":1}',
  },
];
