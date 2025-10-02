// Payment types from Prisma schema
export type Payment = {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  gatewayResponse: any | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED' | 'FAILED';

export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET' | 'CASH';

export type Refund = {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RefundStatus = 'PENDING' | 'PROCESSED' | 'FAILED';
