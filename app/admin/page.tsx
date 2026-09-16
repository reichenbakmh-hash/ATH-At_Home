"use client";

import { useState } from "react";
import { Lock, LayoutGrid } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const statLabels: Record<string, string> = {
  tasks: "Tâches",
  calendar_events: "Événements",
  shopping_items: "Articles de courses",
  pantry_items: "Articles au garde-manger",
  recipes: "Recettes",
  accounts: "Comptes bancaires",
  shared_expenses: "Dépenses partagées",
  documents: "Documents",
  inventory_items: "Biens inventoriés",
  notes: "Notes",
  contacts: "Contacts",
  members: "Membres du foyer"
};

export default function AdminPanel(): React.JSX.Element {
  const [code, setCode] = useState("");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function unlock(): Promise<void> {
    setIsChecking(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { "X-Admin-Code": code }
      });
      if (!response.ok) {
        throw new Error("Code invalide");
      }
      setStats(await response.json());
    } catch {
      setErrorMessage("Code invalide.");
    } finally {
      setIsChecking(false);
    }
  }

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-xs border border-stone bg-paper p-6 dark:border-night-panel dark:bg-night-panel/40">
          <div className="mb-4 flex items-center gap-2">
            <Lock size={18} strokeWidth={1.75} className="text-clay" />
            <h1 className="text-sm font-medium text-ink dark:text-night-ink">
              Accès administrateur
            </h1>
          </div>
          <input
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && unlock()}
            placeholder="Code admin"
            className="mb-3 w-full border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
          />
          {errorMessage ? (
            <p className="mb-3 text-sm text-clay">{errorMessage}</p>
          ) : null}
          <button
            onClick={unlock}
            disabled={isChecking}
            className="w-full bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50 dark:bg-night-ink dark:text-night"
          >
            {isChecking ? "Vérification…" : "Déverrouiller"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6 flex items-center gap-2">
        <LayoutGrid size={20} strokeWidth={1.5} className="text-ink-soft" />
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Tableau administrateur
        </h1>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(stats).map(([key, value]) => (
          <div
            key={key}
            className="border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40"
          >
            <p className="text-xs text-ink-soft dark:text-night-ink/60">
              {statLabels[key] ?? key}
            </p>
            <p className="mt-1 text-xl font-medium text-ink dark:text-night-ink">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
