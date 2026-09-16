"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { api, ApiRequestError, type HouseholdMember, type SharedExpense } from "@/lib/api";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR"
});

function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

interface Settlement {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

function simplifyDebts(
  balances: Map<string, number>
): Settlement[] {
  const debtors = [...balances.entries()]
    .filter(([, amount]) => amount < 0)
    .map(([memberId, amount]) => ({ memberId, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = [...balances.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([memberId, amount]) => ({ memberId, amount }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > 0) {
      settlements.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amount: settledAmount
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount === 0) debtorIndex += 1;
    if (creditor.amount === 0) creditorIndex += 1;
  }

  return settlements;
}

export default function SharedExpenses(): React.JSX.Element {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [newMemberName, setNewMemberName] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newPaidBy, setNewPaidBy] = useState("");
  const [newParticipantIds, setNewParticipantIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(): Promise<void> {
    try {
      const [memberResult, expenseResult] = await Promise.all([
        api.get<HouseholdMember[]>("/api/members"),
        api.get<SharedExpense[]>("/api/shared-expenses")
      ]);
      setMembers(memberResult);
      setExpenses(expenseResult);
      if (memberResult.length > 0 && !newPaidBy) {
        setNewPaidBy(memberResult[0].id);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de charger les dépenses partagées."
      );
    }
  }

  async function addMember(): Promise<void> {
    if (!newMemberName.trim()) {
      return;
    }
    try {
      const created = await api.post<{ id: string }>("/api/members", {
        displayName: newMemberName.trim()
      });
      setMembers((current) => [
        ...current,
        { id: created.id, display_name: newMemberName.trim(), points: 0 }
      ]);
      setNewMemberName("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible d'ajouter le membre."
      );
    }
  }

  function toggleParticipant(memberId: string): void {
    setNewParticipantIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  }

  async function createExpense(): Promise<void> {
    const amountCents = Math.round(parseFloat(newAmount) * 100);
    if (
      !newLabel.trim() ||
      !newPaidBy ||
      Number.isNaN(amountCents) ||
      newParticipantIds.length === 0
    ) {
      return;
    }
    try {
      const created = await api.post<{ id: string }>("/api/shared-expenses", {
        label: newLabel.trim(),
        amount: amountCents,
        paidByMemberId: newPaidBy,
        participantIds: newParticipantIds
      });
      setExpenses((current) => [
        {
          id: created.id,
          label: newLabel.trim(),
          amount: amountCents,
          paid_by_member_id: newPaidBy,
          participant_ids: newParticipantIds,
          created_at: new Date().toISOString()
        },
        ...current
      ]);
      setNewLabel("");
      setNewAmount("");
      setNewParticipantIds([]);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de créer la dépense."
      );
    }
  }

  async function deleteExpense(expenseId: string): Promise<void> {
    setExpenses((current) => current.filter((expense) => expense.id !== expenseId));
    try {
      await api.delete(`/api/shared-expenses/${expenseId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de supprimer la dépense."
      );
      loadData();
    }
  }

  function memberName(memberId: string): string {
    return (
      members.find((member) => member.id === memberId)?.display_name ?? "—"
    );
  }

  const settlements = useMemo(() => {
    const balances = new Map<string, number>();
    for (const member of members) {
      balances.set(member.id, 0);
    }
    for (const expense of expenses) {
      const shareCount = expense.participant_ids.length || 1;
      const shareAmount = Math.round(expense.amount / shareCount);

      balances.set(
        expense.paid_by_member_id,
        (balances.get(expense.paid_by_member_id) ?? 0) + expense.amount
      );
      for (const participantId of expense.participant_ids) {
        balances.set(
          participantId,
          (balances.get(participantId) ?? 0) - shareAmount
        );
      }
    }
    return simplifyDebts(balances);
  }, [members, expenses]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Dépenses partagées
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-night-ink/60">
          Répartition entre membres du foyer, dettes simplifiées automatiquement.
        </p>
      </header>

      {errorMessage ? (
        <p className="mb-4 text-sm text-clay">{errorMessage}</p>
      ) : null}

      <section className="mb-6">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
          Membres du foyer
        </h2>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {members.map((member) => (
            <span
              key={member.id}
              className="border border-stone px-2.5 py-1 text-xs text-ink dark:border-night-panel dark:text-night-ink"
            >
              {member.display_name}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newMemberName}
            onChange={(event) => setNewMemberName(event.target.value)}
            placeholder="Nom du membre"
            className="flex-1 border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
          />
          <button
            onClick={addMember}
            className="flex items-center gap-1 border border-stone px-3 py-2 text-sm dark:border-night-panel"
          >
            <Plus size={15} strokeWidth={2} />
            Membre
          </button>
        </div>
      </section>

      <section className="mb-6 border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
          Nouvelle dépense
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="Libellé"
            className="flex-1 border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
          />
          <input
            value={newAmount}
            onChange={(event) => setNewAmount(event.target.value)}
            placeholder="Montant"
            inputMode="decimal"
            className="w-28 border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
          />
          <select
            value={newPaidBy}
            onChange={(event) => setNewPaidBy(event.target.value)}
            className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                Payé par {member.display_name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => toggleParticipant(member.id)}
              className={`border px-2.5 py-1 text-xs ${
                newParticipantIds.includes(member.id)
                  ? "border-moss bg-moss text-paper"
                  : "border-stone text-ink-soft dark:border-night-panel dark:text-night-ink/60"
              }`}
            >
              {member.display_name}
            </button>
          ))}
        </div>
        <button
          onClick={createExpense}
          className="mt-3 flex items-center justify-center gap-1 bg-ink px-4 py-2 text-sm font-medium text-paper dark:bg-night-ink dark:text-night"
        >
          <Plus size={16} strokeWidth={2} />
          Ajouter la dépense
        </button>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
          Historique
        </h2>
        <div className="divide-y divide-stone border border-stone dark:divide-night-panel dark:border-night-panel">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="group flex items-center gap-3 bg-paper px-3 py-2 text-sm dark:bg-night-panel/20"
            >
              <span className="flex-1 text-ink dark:text-night-ink">
                {expense.label}
              </span>
              <span className="text-ink-soft dark:text-night-ink/50">
                {memberName(expense.paid_by_member_id)}
              </span>
              <span className="text-ink dark:text-night-ink">
                {formatCents(expense.amount)}
              </span>
              <button
                onClick={() => deleteExpense(expense.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 size={14} strokeWidth={1.75} className="text-ink-soft hover:text-clay" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
          Règlements simplifiés
        </h2>
        {settlements.length === 0 ? (
          <p className="text-sm text-ink-soft dark:text-night-ink/60">
            Aucun règlement en attente.
          </p>
        ) : (
          <div className="space-y-1.5">
            {settlements.map((settlement, index) => (
              <div
                key={index}
                className="flex items-center gap-2 border border-stone bg-paper px-3 py-2 text-sm dark:border-night-panel dark:bg-night-panel/40"
              >
                <span className="text-ink dark:text-night-ink">
                  {memberName(settlement.fromMemberId)}
                </span>
                <ArrowRight size={14} strokeWidth={1.75} className="text-ink-soft" />
                <span className="text-ink dark:text-night-ink">
                  {memberName(settlement.toMemberId)}
                </span>
                <span className="ml-auto font-medium text-clay">
                  {formatCents(settlement.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
