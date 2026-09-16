"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Cake, Trash2 } from "lucide-react";
import { api, ApiRequestError, type CalendarEvent } from "@/lib/api";

const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric"
});

function startOfMonthGrid(reference: Date): Date {
  const firstOfMonth = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    1
  );
  const isoWeekday = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - isoWeekday);
  return gridStart;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function CalendarView(): React.JSX.Element {
  const [referenceMonth, setReferenceMonth] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newIsBirthday, setNewIsBirthday] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents(): Promise<void> {
    try {
      const result = await api.get<CalendarEvent[]>("/api/calendar");
      setEvents(result);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de charger le calendrier."
      );
    }
  }

  async function createEvent(): Promise<void> {
    if (!newTitle.trim() || !newDate) {
      return;
    }
    const title = newIsBirthday ? `Anniversaire — ${newTitle.trim()}` : newTitle.trim();
    try {
      const created = await api.post<{ id: string }>("/api/calendar", {
        title,
        startsAt: newDate
      });
      setEvents((current) => [
        ...current,
        {
          id: created.id,
          title,
          starts_at: newDate,
          ends_at: null,
          visibility: "household",
          created_at: new Date().toISOString()
        }
      ]);
      setNewTitle("");
      setNewDate("");
      setNewIsBirthday(false);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de créer l'événement."
      );
    }
  }

  async function deleteEvent(eventId: string): Promise<void> {
    setEvents((current) => current.filter((event) => event.id !== eventId));
    try {
      await api.delete(`/api/calendar/${eventId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de supprimer l'événement."
      );
      loadEvents();
    }
  }

  const gridDays = useMemo(() => {
    const start = startOfMonthGrid(referenceMonth);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [referenceMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = event.starts_at.slice(0, 10);
      const existing = map.get(key) ?? [];
      existing.push(event);
      map.set(key, existing);
    }
    return map;
  }, [events]);

  function changeMonth(offset: number): void {
    setReferenceMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1)
    );
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
            Calendrier
          </h1>
          <p className="mt-1 text-sm capitalize text-ink-soft dark:text-night-ink/60">
            {monthFormatter.format(referenceMonth)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeMonth(-1)}
            className="border border-stone p-2 hover:bg-paper-dim dark:border-night-panel dark:hover:bg-night-panel"
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="border border-stone p-2 hover:bg-paper-dim dark:border-night-panel dark:hover:bg-night-panel"
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div className="mb-6 flex flex-col gap-2 border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40 sm:flex-row sm:items-center">
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Titre de l'événement"
          className="flex-1 border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
        />
        <input
          type="date"
          value={newDate}
          onChange={(event) => setNewDate(event.target.value)}
          className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
        />
        <label className="flex items-center gap-2 text-sm text-ink-soft dark:text-night-ink/70">
          <input
            type="checkbox"
            checked={newIsBirthday}
            onChange={(event) => setNewIsBirthday(event.target.checked)}
          />
          <Cake size={15} strokeWidth={1.75} />
          Anniversaire
        </label>
        <button
          onClick={createEvent}
          className="flex items-center justify-center gap-1 bg-ink px-4 py-2 text-sm font-medium text-paper dark:bg-night-ink dark:text-night"
        >
          <Plus size={16} strokeWidth={2} />
          Ajouter
        </button>
      </div>

      {errorMessage ? (
        <p className="mb-4 text-sm text-clay">{errorMessage}</p>
      ) : null}

      <div className="grid grid-cols-7 border-l border-t border-stone dark:border-night-panel">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="border-b border-r border-stone px-2 py-1.5 text-center text-xs font-medium uppercase tracking-wide text-ink-soft dark:border-night-panel dark:text-night-ink/60"
          >
            {label}
          </div>
        ))}
        {gridDays.map((day) => {
          const key = toDateKey(day);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isCurrentMonth = day.getMonth() === referenceMonth.getMonth();
          return (
            <div
              key={key}
              className={`min-h-[92px] border-b border-r border-stone p-1.5 dark:border-night-panel ${
                isCurrentMonth ? "" : "opacity-40"
              }`}
            >
              <span className="text-xs text-ink-soft dark:text-night-ink/50">
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group flex items-center justify-between gap-1 bg-paper-dim px-1.5 py-0.5 text-xs text-ink dark:bg-night-panel dark:text-night-ink"
                  >
                    <span className="truncate">{event.title}</span>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="hidden shrink-0 group-hover:block"
                    >
                      <Trash2 size={11} strokeWidth={1.75} className="text-clay" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
