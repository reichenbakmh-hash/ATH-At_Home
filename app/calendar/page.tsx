"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { api, ApiRequestError, type ShoppingItem } from "@/lib/api";

const aisleOrder = [
  "Fruits & légumes",
  "Boulangerie",
  "Épicerie",
  "Produits laitiers",
  "Viandes & poissons",
  "Surgelés",
  "Entretien",
  "Autre"
];

export default function ShoppingList(): React.JSX.Element {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newAisle, setNewAisle] = useState(aisleOrder[0]);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems(): Promise<void> {
    try {
      const result = await api.get<ShoppingItem[]>("/api/shopping");
      setItems(result);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de charger la liste de courses."
      );
    }
  }

  async function addItem(): Promise<void> {
    if (!newLabel.trim()) {
      return;
    }
    try {
      const created = await api.post<{ id: string }>("/api/shopping", {
        label: newLabel.trim(),
        aisle: newAisle
      });
      setItems((current) => [
        ...current,
        {
          id: created.id,
          label: newLabel.trim(),
          aisle: newAisle,
          is_checked: 0,
          source_meal_id: null,
          created_at: new Date().toISOString()
        }
      ]);
      setNewLabel("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible d'ajouter l'article."
      );
    }
  }

  async function toggleItem(item: ShoppingItem): Promise<void> {
    const nextChecked = item.is_checked ? 0 : 1;
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, is_checked: nextChecked } : entry
      )
    );
    try {
      await api.patch(`/api/shopping/${item.id}`, {
        isChecked: Boolean(nextChecked)
      });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de mettre à jour l'article."
      );
      loadItems();
    }
  }

  async function deleteItem(itemId: string): Promise<void> {
    setItems((current) => current.filter((item) => item.id !== itemId));
    try {
      await api.delete(`/api/shopping/${itemId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de supprimer l'article."
      );
      loadItems();
    }
  }

  const groupedItems = useMemo(() => {
    const groups = new Map<string, ShoppingItem[]>();
    for (const item of items) {
      const aisle = item.aisle ?? "Autre";
      const existing = groups.get(aisle) ?? [];
      existing.push(item);
      groups.set(aisle, existing);
    }
    return aisleOrder
      .map((aisle) => ({ aisle, items: groups.get(aisle) ?? [] }))
      .filter((group) => group.items.length > 0);
  }, [items]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Courses
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-night-ink/60">
          Liste partagée du foyer, groupée par rayon.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-2 border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40 sm:flex-row sm:items-center">
        <input
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && addItem()}
          placeholder="Nouvel article"
          className="flex-1 border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
        />
        <select
          value={newAisle}
          onChange={(event) => setNewAisle(event.target.value)}
          className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
        >
          {aisleOrder.map((aisle) => (
            <option key={aisle} value={aisle}>
              {aisle}
            </option>
          ))}
        </select>
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

      <div className="space-y-6">
        {groupedItems.map((group) => (
          <div key={group.aisle}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
              {group.aisle}
            </h2>
            <div className="divide-y divide-stone border border-stone dark:divide-night-panel dark:border-night-panel">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 bg-paper px-3 py-2 dark:bg-night-panel/20"
                >
                  <button
                    onClick={() => toggleItem(item)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                      item.is_checked
                        ? "border-moss bg-moss text-paper"
                        : "border-stone dark:border-night-panel"
                    }`}
                  >
                    {item.is_checked ? (
                      <Check size={11} strokeWidth={2.5} />
                    ) : null}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      item.is_checked
                        ? "text-ink-soft line-through dark:text-night-ink/40"
                        : "text-ink dark:text-night-ink"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.source_meal_id ? (
                    <span className="text-xs text-ink-soft dark:text-night-ink/50">
                      via repas
                    </span>
                  ) : null}
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2
                      size={14}
                      strokeWidth={1.75}
                      className="text-ink-soft hover:text-clay"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

