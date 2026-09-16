"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, ApiRequestError, type Account, type SavingsGoal, type Transaction, type TransactionKind } from "@/lib/api";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR"
});

function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export default function BudgetOverview(): React.JSX.Element {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [newAccountName, setNewAccountName] = useState("");
  const [newTxLabel, setNewTxLabel] = useState("");
  const [newTxAmount, setNewTxAmount] = useState("");
  const [newTxKind, setNewTxKind] = useState<TransactionKind>("expense");
  const [newTxAccountId, setNewTxAccountId] = useState("");
  const [newGoalLabel, setNewGoalLabel] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(): Promise<void> {
    try {
      const [accountResult, transactionResult, goalResult] =
        await Promise.all([
          api.get<Account[]>("/api/budget/accounts"),
          api.get<Transaction[]>("/api/budget/transactions"),
          api.get<SavingsGoal[]>("/api/budget/goals")
        ]);
      setAccounts(accountResult);
      setTransactions(transactionResult);
      setGoals(goalResult);
      if (accountResult.length > 0 && !newTxAccountId) {
        setNewTxAccountId(accountResult[0].id);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de charger le budget."
      );
    }
  }

  async function createAccount(): Promise<void> {
    if (!newAccountName.trim()) {
      return;
    }
    try {
      const created = await api.post<{ id: string }>("/api/budget/accounts", {
        name: newAccountName.trim()
      });
      setAccounts((current) => [
        ...current,
        {
          id: created.id,
          name: newAccountName.trim(),
          balance: 0,
          created_at: new Date().toISOString()
        }
      ]);
      setNewAccountName("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de créer le compte."
      );
    }
  }

  async function createTransaction(): Promise<void> {
    const amountCents = Math.round(parseFloat(newTxAmount) * 100);
    if (!newTxLabel.trim() || !newTxAccountId || Number.isNaN(amountCents)) {
      return;
    }
    const occurredAt = new Date().toISOString().slice(0, 10);
    try {
      const created = await api.post<{ id: string }>(
        "/api/budget/transactions",
        {
          accountId: newTxAccountId,
          label: newTxLabel.trim(),
          amount: amountCents,
          kind: newTxKind,
          occurredAt
        }
      );
      setTransactions((current) => [
        {
          id: created.id,
          account_id: newTxAccountId,
          label: newTxLabel.trim(),
          amount: amountCents,
          kind: newTxKind,
          occurred_at: occurredAt,
          created_at: new Date().toISOString()
        },
        ...current
      ]);
      setAccounts((current) =>
        current.map((account) =>
          account.id === newTxAccountId
            ? {
                ...account,
                balance:
                  account.balance +
                  (newTxKind === "expense" ? -amountCents : amountCents)
              }
            : account
        )
      );
      setNewTxLabel("");
      setNewTxAmount("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible d'ajouter la transaction."
      );
    }
  }

  async function createGoal(): Promise<void> {
    const targetCents = Math.round(parseFloat(newGoalTarget) * 100);
    if (!newGoalLabel.trim() || Number.isNaN(targetCents)) {
      return;
    }
    try {
      const created = await api.post<{ id: string }>("/api/budget/goals", {
        label: newGoalLabel.trim(),
        targetAmount: targetCents
      });
      setGoals((current) => [
        ...current,
        {
          id: created.id,
          label: newGoalLabel.trim(),
          target_amount: targetCents,
          current_amount: 0,
          created_at: new Date().toISOString()
        }
      ]);
      setNewGoalLabel("");
      setNewGoalTarget("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de créer l'objectif."
      );
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Budget
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-night-ink/60">
          Comptes, dépenses et objectifs d'épargne du foyer.
        </p>
      </header>

      {errorMessage ? (
        <p className="mb-4 text-sm text-clay">{errorMessage}</p>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
          Comptes
        </h2>
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40"
            >
              <p className="text-sm text-ink-soft dark:text-night-ink/60">
                {account.name}
              </p>
              <p className="mt-1 text-lg font-medium text-ink dark:text-night-ink">
                {formatCents(account.balance)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newAccountName}
            onChange={(event) => setNewAccountName(event.target.value)}
            placeholder="Nouveau compte"
            className="flex-1 border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
          />
          <button
            onClick={createAccount}
            className="flex items-center gap-1 border border-stone px-3 py-2 text-sm dark:border-night-panel"
          >
            <Plus size={15} strokeWidth={2} />
            Compte
          </button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
          Transactions
        </h2>
        <div className="mb-3 flex flex-col gap-2 border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40 sm:flex-row sm:items-center">
          <input
            value={newTxLabel}
            onChange={(event) => setNewTxLabel(event.target.value)}
            placeholder="Libellé"
            className="flex-1 border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
          />
          <input
            value={newTxAmount}
            onChange={(event) => setNewTxAmount(event.target.value)}
            placeholder="Montant"
            inputMode="decimal"
            className="w-28 border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
          />
          <select
            value={newTxKind}
            onChange={(event) =>
              setNewTxKind(event.target.value as TransactionKind)
            }
            className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
          >
            <option value="expense">Dépense</option>
            <option value="income">Revenu</option>
          </select>
          <select
            value={newTxAccountId}
            onChange={(event) => setNewTxAccountId(event.target.value)}
            className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <button
            onClick={createTransaction}
            className="flex items-center justify-center gap-1 bg-ink px-4 py-2 text-sm font-medium text-paper dark:bg-night-ink dark:text-night"
          >
            <Plus size={16} strokeWidth={2} />
            Ajouter
          </button>
        </div>
        <div className="divide-y divide-stone border border-stone dark:divide-night-panel dark:border-night-panel">
          {transactions.slice(0, 12).map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-3 bg-paper px-3 py-2 text-sm dark:bg-night-panel/20"
            >
              <span className="flex-1 text-ink dark:text-night-ink">
                {transaction.label}
              </span>
              <span className="text-ink-soft dark:text-night-ink/50">
                {transaction.occurred_at}
              </span>
              <span
                className={
                  transaction.kind === "expense"
                    ? "text-clay"
                    : "text-moss"
                }
              >
                {transaction.kind === "expense" ? "-" : "+"}
                {formatCents(Math.abs(transaction.amount))}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
          Objectifs d'épargne
        </h2>
        <div className="mb-3 space-y-2">
          {goals.map((goal) => {
            const progress = Math.min(
              100,
              (goal.current_amount / goal.target_amount) * 100
            );
            return (
              <div
                key={goal.id}
                className="border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40"
              >
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-ink dark:text-night-ink">
                    {goal.label}
                  </span>
                  <span className="text-ink-soft dark:text-night-ink/60">
                    {formatCents(goal.current_amount)} / {formatCents(goal.target_amount)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-paper-dim dark:bg-night-panel">
                  <div
                    className="h-1.5 bg-moss"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            value={newGoalLabel}
            onChange={(event) => setNewGoalLabel(event.target.value)}
            placeholder="Nom de l'objectif"
            className="flex-1 border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
          />
          <input
            value={newGoalTarget}
            onChange={(event) => setNewGoalTarget(event.target.value)}
            placeholder="Montant cible"
            inputMode="decimal"
            className="w-32 border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
          />
          <button
            onClick={createGoal}
            className="flex items-center gap-1 border border-stone px-3 py-2 text-sm dark:border-night-panel"
          >
            <Plus size={15} strokeWidth={2} />
            Objectif
          </button>
        </div>
      </section>
    </div>
  );
}
