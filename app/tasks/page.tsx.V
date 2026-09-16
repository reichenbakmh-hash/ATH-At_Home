"use client";

import { useEffect, useState } from "react";
import { Plus, Repeat, GripVertical, Trash2 } from "lucide-react";
import { api, ApiRequestError, type Task, type TaskStatus, type TaskPriority } from "@/lib/api";

const columns: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "À faire" },
  { status: "doing", label: "En cours" },
  { status: "done", label: "Terminé" }
];

const priorityLabel: Record<TaskPriority, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute"
};

const priorityAccent: Record<TaskPriority, string> = {
  low: "text-ink-soft dark:text-night-ink/50",
  normal: "text-ink-soft dark:text-night-ink/70",
  high: "text-clay"
};

export default function TaskBoard(): React.JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("normal");
  const [newDueAt, setNewDueAt] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks(): Promise<void> {
    try {
      setIsLoading(true);
      const result = await api.get<Task[]>("/api/tasks");
      setTasks(result.filter((task) => !task.parent_task_id));
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de charger les tâches."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function createTask(): Promise<void> {
    if (!newTitle.trim()) {
      return;
    }
    try {
      const created = await api.post<{ id: string }>("/api/tasks", {
        title: newTitle.trim(),
        priority: newPriority,
        dueAt: newDueAt || undefined
      });
      setTasks((current) => [
        {
          id: created.id,
          title: newTitle.trim(),
          status: "todo",
          priority: newPriority,
          due_at: newDueAt || null,
          assigned_member_id: null,
          parent_task_id: null,
          recurrence_rule: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        ...current
      ]);
      setNewTitle("");
      setNewDueAt("");
      setNewPriority("normal");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de créer la tâche."
      );
    }
  }

  async function moveTask(taskId: string, status: TaskStatus): Promise<void> {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status } : task
      )
    );
    try {
      await api.patch(`/api/tasks/${taskId}`, { status });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de déplacer la tâche."
      );
      loadTasks();
    }
  }

  async function deleteTask(taskId: string): Promise<void> {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    try {
      await api.delete(`/api/tasks/${taskId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de supprimer la tâche."
      );
      loadTasks();
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Tâches
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-night-ink/60">
          Kanban du foyer, glissez une tâche pour changer son statut.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-2 border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40 sm:flex-row sm:items-center">
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && createTask()}
          placeholder="Nouvelle tâche"
          className="flex-1 border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
        />
        <select
          value={newPriority}
          onChange={(event) =>
            setNewPriority(event.target.value as TaskPriority)
          }
          className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
        >
          <option value="low">Priorité basse</option>
          <option value="normal">Priorité normale</option>
          <option value="high">Priorité haute</option>
        </select>
        <input
          type="date"
          value={newDueAt}
          onChange={(event) => setNewDueAt(event.target.value)}
          className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
        />
        <button
          onClick={createTask}
          className="flex items-center justify-center gap-1 bg-ink px-4 py-2 text-sm font-medium text-paper dark:bg-night-ink dark:text-night"
        >
          <Plus size={16} strokeWidth={2} />
          Ajouter
        </button>
      </div>

      {errorMessage ? (
        <p className="mb-4 text-sm text-clay">{errorMessage}</p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-ink-soft dark:text-night-ink/60">
          Chargement…
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {columns.map((column) => (
            <div
              key={column.status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => draggedTaskId && moveTask(draggedTaskId, column.status)}
              className="min-h-[240px] border border-stone bg-paper-dim/40 p-3 dark:border-night-panel dark:bg-night-panel/20"
            >
              <h2 className="mb-3 px-1 text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
                {column.label}
              </h2>
              <div className="space-y-2">
                {tasks
                  .filter((task) => task.status === column.status)
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTaskId(task.id)}
                      className="group flex items-start gap-2 border border-stone bg-paper p-3 text-sm dark:border-night-panel dark:bg-night"
                    >
                      <GripVertical
                        size={15}
                        strokeWidth={1.5}
                        className="mt-0.5 shrink-0 cursor-grab text-ink-soft/50"
                      />
                      <div className="flex-1">
                        <p className="text-ink dark:text-night-ink">
                          {task.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className={priorityAccent[task.priority]}>
                            {priorityLabel[task.priority]}
                          </span>
                          {task.due_at ? (
                            <span className="text-ink-soft dark:text-night-ink/50">
                              {task.due_at}
                            </span>
                          ) : null}
                          {task.recurrence_rule ? (
                            <Repeat
                              size={12}
                              strokeWidth={1.75}
                              className="text-ink-soft dark:text-night-ink/50"
                            />
                          ) : null}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
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
      )}
    </div>
  );
                        }

