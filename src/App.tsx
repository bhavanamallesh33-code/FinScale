import { useCallback, useEffect, useState } from "react";
import type { Account, Transaction } from "./lib/types";
import {
  createAccount,
  deposit,
  fetchAccounts,
  fetchTransactions,
  withdraw,
} from "./lib/api";

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // form state
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAccounts();
      setAccounts(data);
      if (data.length > 0 && !selectedAccount) {
        setSelectedAccount(data[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (!selectedAccount) {
      setTransactions([]);
      return;
    }
    setTxnLoading(true);
    fetchTransactions(selectedAccount.id)
      .then((data) => setTransactions(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load transactions."))
      .finally(() => setTxnLoading(false));
  }, [selectedAccount]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  async function handleWithdraw() {
    if (!selectedAccount) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setSubmitting(true);
    clearMessages();
    try {
      const result = await withdraw(selectedAccount.id, amt, description || undefined);
      setSuccess(`Withdrawal of ${formatCurrency(amt, selectedAccount.currency)} completed.`);
      setAmount("");
      setDescription("");
      await loadAccounts();
      const updated = accounts.map((a) =>
        a.id === selectedAccount.id ? { ...a, balance: result.newBalance } : a,
      );
      setAccounts(updated);
      setSelectedAccount({ ...selectedAccount, balance: result.newBalance });
      setTransactions((prev) => [result.transaction, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Withdrawal failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeposit() {
    if (!selectedAccount) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setSubmitting(true);
    clearMessages();
    try {
      const result = await deposit(selectedAccount.id, amt, description || undefined);
      setSuccess(`Deposit of ${formatCurrency(amt, selectedAccount.currency)} completed.`);
      setAmount("");
      setDescription("");
      await loadAccounts();
      const updated = accounts.map((a) =>
        a.id === selectedAccount.id ? { ...a, balance: result.newBalance } : a,
      );
      setAccounts(updated);
      setSelectedAccount({ ...selectedAccount, balance: result.newBalance });
      setTransactions((prev) => [result.transaction, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deposit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateAccount() {
    if (!newAccountName.trim()) {
      setError("Account name is required.");
      return;
    }
    const initialBal = parseFloat(newAccountBalance) || 0;
    setSubmitting(true);
    clearMessages();
    try {
      const acc = await createAccount(newAccountName.trim(), initialBal);
      setSuccess(`Account "${acc.name}" created successfully.`);
      setNewAccountName("");
      setNewAccountBalance("");
      setShowNewAccount(false);
      await loadAccounts();
      setSelectedAccount(acc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalDeposits = transactions
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalWithdrawals = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">F</div>
          <div>
            <div className="header-title">FinScale</div>
            <div className="header-subtitle">DevOps Autoscaling Financial Server</div>
          </div>
        </div>
        <div className="header-status">
          <span className="status-dot" />
          System Online
        </div>
      </header>

      <main className="main">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            Loading accounts...
          </div>
        ) : (
          <>
            {/* ── Account Cards ──────────────────────────── */}
            <div className="section-heading">Accounts</div>
            <div className="balance-section">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`balance-card ${selectedAccount?.id === acc.id ? "active" : ""}`}
                  onClick={() => { setSelectedAccount(acc); clearMessages(); }}
                >
                  <div className="balance-label">Available Balance</div>
                  <div className="balance-name">{acc.name}</div>
                  <div className="balance-amount">
                    {formatCurrency(Number(acc.balance), acc.currency)}
                  </div>
                  <div className="balance-meta">
                    <span>{acc.currency}</span>
                    <span>Updated {formatDate(acc.updated_at)}</span>
                  </div>
                </div>
              ))}
              <div
                className="balance-card"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: "180px" }}
                onClick={() => setShowNewAccount(true)}
              >
                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "28px", fontWeight: 700 }}>+</div>
                  <div style={{ fontSize: "14px", fontWeight: 500 }}>New Account</div>
                </div>
              </div>
            </div>

            {/* ── Stats ──────────────────────────────────── */}
            {selectedAccount && (
              <div className="stats-row" style={{ marginTop: "24px" }}>
                <div className="stat-card">
                  <div className="stat-label">Current Balance</div>
                  <div className="stat-value primary">
                    {formatCurrency(Number(selectedAccount.balance), selectedAccount.currency)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Deposits</div>
                  <div className="stat-value success">{formatCurrency(totalDeposits, selectedAccount.currency)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Withdrawals</div>
                  <div className="stat-value error">{formatCurrency(totalWithdrawals, selectedAccount.currency)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Transactions</div>
                  <div className="stat-value">{transactions.length}</div>
                </div>
              </div>
            )}

            {/* ── Main Layout ────────────────────────────── */}
            <div className="layout">
              {/* Transaction Form */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Transaction</div>
                    <div className="card-subtitle">
                      {selectedAccount ? `Operating on: ${selectedAccount.name}` : "Select an account"}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!selectedAccount || submitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Server scaling payment"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!selectedAccount || submitting}
                  />
                </div>

                <div className="action-buttons">
                  <button
                    className="btn btn-danger"
                    onClick={handleWithdraw}
                    disabled={!selectedAccount || submitting}
                  >
                    Withdraw
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleDeposit}
                    disabled={!selectedAccount || submitting}
                  >
                    Deposit
                  </button>
                </div>

                {!selectedAccount && (
                  <div style={{ marginTop: "16px", fontSize: "14px", color: "var(--text-muted)" }}>
                    Select or create an account to start transacting.
                  </div>
                )}
              </div>

              {/* Transaction History */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Withdrawal & Transaction History</div>
                    <div className="card-subtitle">
                      {selectedAccount ? selectedAccount.name : "No account selected"}
                    </div>
                  </div>
                </div>

                <div className="scroll-area">
                  {txnLoading ? (
                    <div className="loading">
                      <div className="spinner" />
                      Loading...
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="txn-empty">
                      <div className="txn-empty-icon">&#8212;</div>
                      No transactions yet. Make your first withdrawal or deposit.
                    </div>
                  ) : (
                    <table className="txn-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Balance After</th>
                          <th>Description</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn) => (
                          <tr key={txn.id}>
                            <td>
                              <span className={`txn-type txn-type-${txn.type}`}>
                                {txn.type}
                              </span>
                            </td>
                            <td className={txn.type === "deposit" ? "txn-amount-positive" : "txn-amount-negative"}>
                              {txn.type === "deposit" ? "+" : "-"}
                              {formatCurrency(Number(txn.amount), selectedAccount?.currency)}
                            </td>
                            <td className="txn-amount">
                              {txn.balance_after !== null
                                ? formatCurrency(Number(txn.balance_after), selectedAccount?.currency)
                                : "--"}
                            </td>
                            <td className="txn-description">
                              {txn.description || "--"}
                            </td>
                            <td className="txn-date">{formatDate(txn.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* New Account Modal */}
      {showNewAccount && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "16px",
          }}
          onClick={() => !submitting && setShowNewAccount(false)}
        >
          <div
            className="card"
            style={{ maxWidth: "420px", width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div className="card-title">Create New Account</div>
            </div>
            <div className="form-group">
              <label className="form-label">Account Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Operations Server Fund"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Balance</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="action-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setShowNewAccount(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateAccount}
                disabled={submitting}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
