export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'failed';

export interface Payment {
  id: number;
  group_id: number;
  subscription_id: number;
  external_id: string;
  amount: number;
  status: PaymentStatus;
  pix_br_code: string;
  pix_br_code_base64: string;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewPayment {
  group_id: number;
  subscription_id: number;
  external_id: string;
  amount: number;
  status: PaymentStatus;
  pix_br_code: string;
  pix_br_code_base64: string;
  expires_at: string;
}
