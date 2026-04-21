export type AlertSeverity = "critical" | "warning" | "info";

export type AlertType =
  | "payment_failed"
  | "webhook_retry"
  | "edition_sold_out"
  | "edition_low_stock"
  | "order_completed"
  | "batch_ready"
  | "system_error";

export type Alert = {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  whatHappened: string;
  autoHandled: string;
  actionRequired: boolean;
  actionInstructions: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
};

export type AlertChannel = {
  name: string;
  send(alert: Alert): Promise<void>;
};
