import type { Account, Transaction } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

type BackendAccount = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

type BackendTransaction = {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  balanceAfter: number | null;
  createdAt: string;
};

type BackendTransactionResult = {
  transaction: BackendTransaction;
  newBalance: number;
};

type BackendErrorResponse = {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
};

function mapAccount(b: BackendAccount): Account {
  return {
    id: b.id,
    name: b.name,
    balance: Number(b.balance),
    currency: b.currency,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
  };
}

function mapTransaction(b: BackendTransaction): Transaction {
  return {
    id: b.id,
    account_id: b.accountId,
    type: b.type as Transaction["type"],
    amount: Number(b.amount),
    status: b.status as Transaction["status"],
    description: b.description,
    balance_after: b.balanceAfter !== null ? Number(b.balanceAfter) : null,
    created_at: b.createdAt,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errorBody = (await response.json()) as BackendErrorResponse;
      if (errorBody?.message) message = errorBody.message;
    } catch {
      // response body wasn't JSON, use generic message
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function fetchAccounts(): Promise<Account[]> {
  const response = await fetch(`${API_BASE}/api/accounts`);
  const data = await handleResponse<BackendAccount[]>(response);
  return data.map(mapAccount);
}

export async function fetchAccount(accountId: string): Promise<Account | null> {
  const response = await fetch(`${API_BASE}/api/accounts/${accountId}`);
  if (response.status === 404) return null;
  const data = await handleResponse<BackendAccount>(response);
  return mapAccount(data);
}

export async function fetchTransactions(accountId: string): Promise<Transaction[]> {
  const response = await fetch(`${API_BASE}/api/accounts/${accountId}/transactions`);
  const data = await handleResponse<BackendTransaction[]>(response);
  return data.map(mapTransaction);
}

export type WithdrawResult = {
  transaction: Transaction;
  newBalance: number;
};

export async function withdraw(
  accountId: string,
  amount: number,
  description?: string,
): Promise<WithdrawResult> {
  const response = await fetch(`${API_BASE}/api/accounts/${accountId}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, description: description ?? "Withdrawal" }),
  });
  const data = await handleResponse<BackendTransactionResult>(response);
  return {
    transaction: mapTransaction(data.transaction),
    newBalance: Number(data.newBalance),
  };
}

export type DepositResult = {
  transaction: Transaction;
  newBalance: number;
};

export async function deposit(
  accountId: string,
  amount: number,
  description?: string,
): Promise<DepositResult> {
  const response = await fetch(`${API_BASE}/api/accounts/${accountId}/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, description: description ?? "Deposit" }),
  });
  const data = await handleResponse<BackendTransactionResult>(response);
  return {
    transaction: mapTransaction(data.transaction),
    newBalance: Number(data.newBalance),
  };
}

export async function createAccount(
  name: string,
  initialBalance: number = 0,
  currency: string = "USD",
): Promise<Account> {
  const response = await fetch(`${API_BASE}/api/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, initialBalance, currency }),
  });
  const data = await handleResponse<BackendAccount>(response);
  return mapAccount(data);
}
