"use client";

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
  StickyNote,
  Settings,
  Moon,
  Sun,
  House
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ModuleId } from "@/lib/types";

const navItems: { id: ModuleId; label: string; icon: React.ElementType }[] = [
  { id: "tasks", label: "Tâches", icon: CheckSquare },
  { id: "calendar", label: "Calendrier", icon: CalendarDays },
  { id: "shopping", label: "Courses", icon: ShoppingCart },
  { id: "meals", label: "Repas & Recettes", icon: UtensilsCrossed },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "shared-expenses", label: "Dépenses partagées", icon: Split },
  { id: "pantry", label: "Garde-manger", icon: Package },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "inventory", label: "Inventaire", icon: Boxes },
  { id: "notes-contacts", label: "Notes & Contacts", icon: StickyNote }
];

interface SidebarProps {
  activeModule: ModuleId | null;
  onSelectModule: (moduleId: ModuleId) => void;
}

export default function Sidebar({
  activeModule,
  onSelectModule
}: SidebarProps): React.JSX.Element {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme(): void {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ath-theme", next ? "dark" : "light");
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-stone bg-paper dark:bg-night">
      <div className="flex items-center gap-2 px-5 py-6">
        <House size={22} strokeWidth={1.75} className="text-clay" />
        <span className="text-base font-semibold tracking-tight">
          At Home
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? "bg-paper-dim font-medium text-ink dark:bg-night-panel dark:text-night-ink"
                  : "text-ink-soft hover:bg-paper-dim dark:text-night-ink/70 dark:hover:bg-night-panel"
              }`}
            >
              <Icon size={17} strokeWidth={1.75} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-stone px-2 py-2 dark:border-night-panel">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-dim dark:text-night-ink/70 dark:hover:bg-night-panel"
        >
          {isDark ? (
            <Sun size={17} strokeWidth={1.75} />
          ) : (
            <Moon size={17} strokeWidth={1.75} />
          )}
          {isDark ? "Mode jour" : "Mode nuit"}
        </button>
        <button
          onClick={() => onSelectModule("notes-contacts")}
          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-dim dark:text-night-ink/70 dark:hover:bg-night-panel"
        >
          <Settings size={17} strokeWidth={1.75} />
          Paramètres
        </button>
      </div>
    </aside>
  );
}
