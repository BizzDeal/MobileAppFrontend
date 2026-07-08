export type WalletTransactionType = 'CREDIT' | 'DEBIT' | 'SAVING';
export type WalletReferenceType = 'VOUCHER' | 'REFERRAL' | 'MANUAL';

export interface WalletDTO {
  id: string;
  user_id: string;
  balance: number;
  total_savings: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransactionDTO {
  id: string;
  wallet_id: string;
  user_id: string;
  type: WalletTransactionType;
  amount: number;
  description: string | null;
  reference_type: WalletReferenceType | null;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
}
