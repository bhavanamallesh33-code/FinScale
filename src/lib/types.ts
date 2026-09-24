export type Account = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type TransactionType = "deposit" | "withdrawal" | "adjustment";
export type TransactionStatus = "pending" | "completed" | "failed";

export type Transaction = {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string | null;
  balance_after: number | null;
  created_at: string;
};
