"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { api, ApiRequestError, type InventoryItem } from "@/lib/api";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR"
});

export default function InventoryList(): React.JSX.Element {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newWarranty, setNewWarranty] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems(): Promise<void> {
    try {
      const result = await api.get<InventoryItem[]>("/api/inventory");
      setItems(result);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de charger l'inventaire."
      );
    }
  }

  async function addItem(): Promise<void> {
    if (!newLabel.trim()) {
      return;
    }
    const priceCents = newPrice
      ? Math.round(parseFloat(newPrice) * 100)
      : undefined;
    try {
      const created = await api.post<{ id: string }>("/api/inventory", {
        label: newLabel.trim(),
        purchasePrice: priceCents,
        purchasedAt: new Date().toISOString().slice(0, 10),
        warrantyUntil: newWarranty || undefined
      });
      setItems((current) => [
        {
          id: created.id,
          label: newLabel.trim(),
          purchase_price: priceCents ?? null,
          purchased_at: new Date().toISOString().slice(0, 10),
          warranty_until: newWarranty || null,
          receipt_document_id: null,
          created_at: new Date().toISOString()
        },
        ...current
      ]);
      setNewLabel("");
      setNewPrice("");
      setNewWarranty("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible d'ajouter le bien."
      );
    }
  }

  async function deleteItem(itemId: string): Promise<void> {
    setItems((current) => current.filter((item) => item.id !== itemId));
    try {
      await api.delete(`/api/inventory/${itemId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de supprimer le bien."
      );
      loadItems();
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Inventaire
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-night-ink/60">
          Biens du foyer, prix d'achat et garanties.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-2 border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40 sm:flex-row sm:items-center">
        <input
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          placeholder="Bien"
          className="flex-1 border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
        />
        <input
          value={newPrice}
          onChange={(event) => setNewPrice(event.target.value)}
          placeholder="Prix d'achat"
          inputMode="decimal"
          className="w-32 border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
        />
        <input
          type="date"
          value={newWarranty}
          onChange={(event) => setNewWarranty(event.target.value)}
          className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
        />
        <button
          onClick={addItem}
          className="flex items-center justify-center gap-1 bg-ink px-4 py-2 text-sm font-medium text-paper dark:bg-night-ink dark:text-night"
        >
          <Plus size={16} strokeWidth={2} />
          Ajouter
        </button>
      </div>

      {errorMessage ? (
        <p className="mb-4 text-sm text-clay">{errorMessage}</p>
      ) : null}

      <div className="divide-y divide-stone border border-stone dark:divide-night-panel dark:border-night-panel">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-3 bg-paper px-3 py-2 text-sm dark:bg-night-panel/20"
          >
            <span className="flex-1 text-ink dark:text-night-ink">
              {item.label}
            </span>
            {item.purchase_price !== null ? (
              <span className="text-ink-soft dark:text-night-ink/50">
                {currencyFormatter.format(item.purchase_price / 100)}
              </span>
            ) : null}
            {item.warranty_until ? (
              <span className="flex items-center gap-1 text-ink-soft dark:text-night-ink/50">
                <ShieldCheck size={13} strokeWidth={1.75} />
                {item.warranty_until}
              </span>
            ) : null}
            <button
              onClick={() => deleteItem(item.id)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 size={14} strokeWidth={1.75} className="text-ink-soft hover:text-clay" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
