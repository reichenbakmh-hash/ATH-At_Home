"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  CalendarDays,
  ShoppingCart,
  UtensilsCrossed,
  Wallet,
  Split,
  Package,
  Boxes,
  StickyNote,
  Settings,
  Moon,
  Sun,
  House,
  Menu,
  X
} from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/tasks", label: "Tâches", icon: CheckSquare },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/shopping", label: "Courses", icon: ShoppingCart },
  { href: "/meals", label: "Repas & Recettes", icon: UtensilsCrossed },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/shared-expenses", label: "Dépenses partagées", icon: Split },
  { href: "/pantry", label: "Garde-manger", icon: Package },
  { href: "/inventory", label: "Inventaire", icon: Boxes },
  { href: "/notes-contacts", label: "Notes & Contacts", icon: StickyNote }
];

export default function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  function toggleTheme(): void {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ath-theme", next ? "dark" : "light");
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-3 top-3 z-30 flex items-center justify-center border border-stone bg-paper p-2 dark:border-night-panel dark:bg-night md:hidden"
      >
        <Menu size={18} strokeWidth={1.75} />
      </button>

      {isOpen ? (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col border-r border-stone bg-paper transition-transform duration-200 dark:bg-night md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <Link href="/" className="flex items-center gap-2">
            <House size={22} strokeWidth={1.75} className="text-clay" />
            <span className="text-base font-semibold tracking-tight">
              At Home
            </span>
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden">
            <X size={18} strokeWidth={1.75} className="text-ink-soft" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-paper-dim font-medium text-ink dark:bg-night-panel dark:text-night-ink"
                    : "text-ink-soft hover:bg-paper-dim dark:text-night-ink/70 dark:hover:bg-night-panel"
                }`}
              >
                <Icon size={17} strokeWidth={1.75} />
                {item.label}
              </Link>
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
          <Link
            href="/settings"
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-dim dark:text-night-ink/70 dark:hover:bg-night-panel"
          >
            <Settings size={17} strokeWidth={1.75} />
            Paramètres
          </Link>
        </div>
      </aside>
    </>
  );
}
