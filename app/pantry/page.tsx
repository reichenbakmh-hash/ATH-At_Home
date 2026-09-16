"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Minus, TriangleAlert } from "lucide-react";
import { api, ApiRequestError, type PantryItem } from "@/lib/api";

function isSoonExpired(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return false;
  }
  const days =
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days <= 3;
}

export default function PantryList(): React.JSX.Element {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems(): Promise<void> {
    try {
      const result = await api.get<PantryItem[]>("/api/pantry");
      setItems(result);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de charger le garde-manger."
      );
    }
  }

  async function addItem(): Promise<void> {
    if (!newLabel.trim()) {
      return;
    }
    try {
      const created = await api.post<{ id: string }>("/api/pantry", {
        label: newLabel.trim(),
        location: newLocation || undefined,
        expiresAt: newExpiresAt || undefined
      });
      setItems((current) => [
        ...current,
        {
          id: created.id,
          label: newLabel.trim(),
          quantity: 1,
          location: newLocation || null,
          expires_at: newExpiresAt || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      setNewLabel("");
      setNewLocation("");
      setNewExpiresAt("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible d'ajouter l'article."
      );
    }
  }

  async function adjustQuantity(item: PantryItem, delta: number): Promise<void> {
    const nextQuantity = Math.max(0, item.quantity + delta);
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, quantity: nextQuantity } : entry
      )
    );
    try {
      await api.patch(`/api/pantry/${item.id}`, { quantity: nextQuantity });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de mettre à jour la quantité."
      );
      loadItems();
    }
  }

  async function deleteItem(itemId: string): Promise<void> {
    setItems((current) => current.filter((item) => item.id !== itemId));
    try {
      await api.delete(`/api/pantry/${itemId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de supprimer l'article."
      );
      loadItems();
    }
  }

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (!a.expires_at) return 1;
        if (!b.expires_at) return -1;
        return a.expires_at.localeCompare(b.expires_at);
      }),
    [items]
  );

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Garde-manger
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-night-ink/60">
          Réapprovisionné automatiquement quand un article est coché dans les courses.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-2 border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40 sm:flex-row sm:items-center">
        <input
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          placeholder="Article"
          className="flex-1 border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
        />
        <input
          value={newLocation}
          onChange={(event) => setNewLocation(event.target.value)}
          placeholder="Emplacement"
          className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
        />
        <input
          type="date"
          value={newExpiresAt}
          onChange={(event) => setNewExpiresAt(event.target.value)}
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
        {sortedItems.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-3 bg-paper px-3 py-2 dark:bg-night-panel/20"
          >
            {isSoonExpired(item.expires_at) ? (
              <TriangleAlert size={14} strokeWidth={1.75} className="shrink-0 text-clay" />
            ) : (
              <span className="w-3.5 shrink-0" />
            )}
            <span className="flex-1 text-sm text-ink dark:text-night-ink">
              {item.label}
            </span>
            {item.location ? (
              <span className="text-xs text-ink-soft dark:text-night-ink/50">
                {item.location}
              </span>
            ) : null}
            {item.expires_at ? (
              <span className="text-xs text-ink-soft dark:text-night-ink/50">
                {item.expires_at}
              </span>
            ) : null}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => adjustQuantity(item, -1)}
                className="border border-stone p-0.5 dark:border-night-panel"
              >
                <Minus size={12} strokeWidth={1.75} />
              </button>
              <span className="w-4 text-center text-sm text-ink dark:text-night-ink">
                {item.quantity}
              </span>
              <button
                onClick={() => adjustQuantity(item, 1)}
                className="border border-stone p-0.5 dark:border-night-panel"
              >
                <Plus size={12} strokeWidth={1.75} />
              </button>
            </div>
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
