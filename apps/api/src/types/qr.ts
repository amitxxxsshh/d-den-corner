import type { QRTokenRow } from "./database";

export type QRToken = QRTokenRow;

export type CreateQRTokenInput = {
  tableId: string;
};

export type QRValidationResult = {
  tableId: string;
  qrTokenId: string;
  valid: boolean;
};