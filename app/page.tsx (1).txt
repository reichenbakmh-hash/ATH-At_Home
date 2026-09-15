"use client";

import { useState } from "react";
import {
  CheckSquare,
  CalendarDays,
  ShoppingCart,
  UtensilsCrossed,
  Wallet,
  Split,
  Package,
  FileText,
  Boxes,
  StickyNote
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ModuleCard from "@/components/ModuleCard";
import type { ModuleId } from "@/lib/types";

const modules: {
  id: ModuleId;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "tasks",
    label: "Tâches",
    description: "Kanban, échéances, récurrences et sous-tâches du foyer.",
    icon: CheckSquare
  },
  {
    id: "calendar",
    label: "Calendrier",
    description: "Événements, anniversaires et abonnements partagés.",
    icon: CalendarDays
  },
  {
    id: "shopping",
    label: "Courses",
    description: "Listes par rayon, alimentées automatiquement par les repas.",
    icon: ShoppingCart
  },
  {
    id: "meals",
    label: "Repas & Recettes",
    description: "Planificateur hebdomadaire et recettes du foyer.",
    icon: UtensilsCrossed
  },
  {
    id: "budget",
    label: "Budget",
    description: "Comptes, dépenses, actifs et objectifs d'épargne.",
    icon: Wallet
  },
  {
    id: "shared-expenses",
    label: "Dépenses partagées",
    description: "Répartition des coûts et simplification des dettes.",
    icon: Split
  },
  {
    id: "pantry",
    label: "Garde-manger",
    description: "Stocks, emplacements et dates de péremption.",
    icon: Package
  },
  {
    id: "documents",
    label: "Documents",
    description: "Fichiers familiaux tagués et recherchables.",
    icon: FileText
  },
  {
    id: "inventory",
    label: "Inventaire",
    description: "Biens possédés, garanties et reçus.",
    icon: Boxes
  },
  {
    id: "notes-contacts",
    label: "Notes & Contacts",
    description: "Notes Markdown et contacts synchronisés.",
    icon: StickyNote
  }
];

export default function DashboardPage(): React.JSX.Element {
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);

  return (
    <div className="flex h-screen">
      <Sidebar activeModule={activeModule} onSelectModule={setActiveModule} />

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
        <header className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
            Aujourd'hui
          </h1>
          <p className="mt-1 text-sm text-ink-soft dark:text-night-ink/60">
            Vue d'ensemble du foyer.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              label={module.label}
              description={module.description}
              icon={module.icon}
              onOpen={() => setActiveModule(module.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
