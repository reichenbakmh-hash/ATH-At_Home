import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface ModuleCardProps {
  label: string;
  description: string;
  icon: LucideIcon;
  metric?: string;
  onOpen: () => void;
}

export default function ModuleCard({
  label,
  description,
  icon: Icon,
  metric,
  onOpen
}: ModuleCardProps): React.JSX.Element {
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col justify-between border border-stone bg-paper p-5 text-left transition-colors hover:border-ink-soft dark:border-night-panel dark:bg-night-panel/40 dark:hover:border-night-ink/40"
    >
      <div className="flex items-start justify-between">
        <Icon size={20} strokeWidth={1.5} className="text-ink-soft dark:text-night-ink/70" />
        {metric ? (
          <span className="text-xs text-ink-soft dark:text-night-ink/60">
            {metric}
          </span>
        ) : null}
      </div>

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
    </button>
  );
}
