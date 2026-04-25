import type { Metadata } from "./index";

export type FonepayQrCustomer = {
  name: string;
  email: string;
  phone?: string;
  address?: {
    line1: string;
    city: string;
    line2?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};

export type CreateFonepayQrParams = {
  amount: number;          // paisa (NPR × 100)
  currency?: "NPR";
  customer: FonepayQrCustomer;
  metadata?: Metadata;
};

export type FonepayQrSession = {
  id: string;
  amount: number;
  currency: string;
  provider: "fonepay";
  status: "initiated";
  qr_message: string;       // raw EMV QR payload — render with any QR library
  qr_image: string;         // base64 PNG data URL, 320x320
  events_url: string;       // SSE endpoint for qr.scanned / qr.paid / qr.expired
  expires_at: string;       // 3 minutes from creation
};
