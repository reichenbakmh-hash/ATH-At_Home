import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckSquare,
  CalendarDays,
  ShoppingCart,
  UtensilsCrossed,
  Wallet,
  Split,
  Package,
  Boxes,
  StickyNote
} from "lucide-react";

interface ModuleCardProps {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

function ModuleCard({
  href,
  label,
  description,
  icon: Icon
}: ModuleCardProps): React.JSX.Element {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between border border-stone bg-paper p-5 text-left transition-colors hover:border-ink-soft dark:border-night-panel dark:bg-night-panel/40 dark:hover:border-night-ink/40"
    >
      <Icon size={20} strokeWidth={1.5} className="text-ink-soft dark:text-night-ink/70" />
      <div className="mt-6">
        <h3 className="text-sm font-medium text-ink dark:text-night-ink">
          {label}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft dark:text-night-ink/60">
          {description}
        </p>
      </div>
      <div className="mt-5 flex items-center gap-1 text-xs text-ink-soft opacity-0 transition-opacity group-hover:opacity-100 dark:text-night-ink/60">
        Ouvrir
        <ArrowRight size={13} strokeWidth={1.75} />
      </div>
    </Link>
  );
}

const modules = [
  {
    href: "/tasks",
    label: "Tâches",
    description: "Kanban, échéances, récurrences et sous-tâches du foyer.",
    icon: CheckSquare
  },
  {
    href: "/calendar",
    label: "Calendrier",
    description: "Événements, anniversaires et abonnements partagés.",
    icon: CalendarDays
  },
  {
    href: "/shopping",
    label: "Courses",
    description: "Listes par rayon, alimentées automatiquement par les repas.",
    icon: ShoppingCart
  },
  {
    href: "/meals",
    label: "Repas & Recettes",
    description: "Planificateur hebdomadaire et recettes du foyer.",
    icon: UtensilsCrossed
  },
  {
    href: "/budget",
    label: "Budget",
    description: "Comptes, dépenses, actifs et objectifs d'épargne.",
    icon: Wallet
  },
  {
    href: "/shared-expenses",
    label: "Dépenses partagées",
    description: "Répartition des coûts et simplification des dettes.",
    icon: Split
  },
  {
    href: "/pantry",
    label: "Garde-manger",
    description: "Stocks, emplacements et dates de péremption.",
    icon: Package
  },
  {
    href: "/inventory",
    label: "Inventaire",
    description: "Biens possédés, garanties et reçus.",
    icon: Boxes
  },
  {
    href: "/notes-contacts",
    label: "Notes & Contacts",
    description: "Notes Markdown et contacts synchronisés.",
    icon: StickyNote
  }
];

export default function DashboardPage(): React.JSX.Element {
  return (
    <div>
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
            key={module.href}
            href={module.href}
            label={module.label}
            description={module.description}
            icon={module.icon}
          />
        ))}
      </div>
    </div>
  );
}
