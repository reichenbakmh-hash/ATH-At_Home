export default function SettingsPanel(): React.JSX.Element {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-night-ink/60">
          Préférences du foyer et contact.
        </p>
      </header>

      <section className="border border-stone bg-paper p-5 dark:border-night-panel dark:bg-night-panel/40">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
          Nous contacter
        </h2>
        <a
          href="https://wa.me/261378903367"
          target="_blank"
          rel="noreferrer"
          className="flex w-fit items-center gap-2.5 border border-stone px-4 py-2.5 text-sm text-ink transition-colors hover:border-moss dark:border-night-panel dark:text-night-ink"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="shrink-0 text-moss"
            aria-hidden="true"
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.26-4.36c0-4.53 3.69-8.21 8.24-8.21 2.2 0 4.27.86 5.83 2.42a8.16 8.16 0 0 1 2.41 5.8c0 4.53-3.69 8.21-8.23 8.21Zm4.51-6.15c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.96-.15.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.47-.01a.9.9 0 0 0-.65.3c-.22.24-.85.84-.85 2.04s.87 2.37.99 2.53c.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.08.15-1.18-.07-.11-.23-.17-.48-.29Z" />
          </svg>
          +261 37 89 033 67
        </a>
      </section>
    </div>
  );
}
