"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, StickyNote, Users, RefreshCw } from "lucide-react";
import { api, ApiRequestError, type Contact, type Note } from "@/lib/api";

export default function NotesContacts(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<"notes" | "contacts">("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(): Promise<void> {
    try {
      const [noteResult, contactResult] = await Promise.all([
        api.get<Note[]>("/api/notes"),
        api.get<Contact[]>("/api/contacts")
      ]);
      setNotes(noteResult);
      setContacts(contactResult);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de charger les notes et contacts."
      );
    }
  }

  async function createNote(): Promise<void> {
    if (!newNoteTitle.trim()) {
      return;
    }
    try {
      const created = await api.post<{ id: string }>("/api/notes", {
        title: newNoteTitle.trim(),
        contentMarkdown: newNoteContent
      });
      setNotes((current) => [
        {
          id: created.id,
          title: newNoteTitle.trim(),
          content_markdown: newNoteContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        ...current
      ]);
      setNewNoteTitle("");
      setNewNoteContent("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de créer la note."
      );
    }
  }

  async function deleteNote(noteId: string): Promise<void> {
    setNotes((current) => current.filter((note) => note.id !== noteId));
    try {
      await api.delete(`/api/notes/${noteId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de supprimer la note."
      );
      loadData();
    }
  }

  async function createContact(): Promise<void> {
    if (!newContactName.trim()) {
      return;
    }
    try {
      const created = await api.post<{ id: string }>("/api/contacts", {
        displayName: newContactName.trim(),
        phone: newContactPhone || undefined,
        email: newContactEmail || undefined
      });
      setContacts((current) => [
        ...current,
        {
          id: created.id,
          display_name: newContactName.trim(),
          phone: newContactPhone || null,
          email: newContactEmail || null,
          notes: null,
          created_at: new Date().toISOString()
        }
      ]);
      setNewContactName("");
      setNewContactPhone("");
      setNewContactEmail("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible d'ajouter le contact."
      );
    }
  }

  async function deleteContact(contactId: string): Promise<void> {
    setContacts((current) =>
      current.filter((contact) => contact.id !== contactId)
    );
    try {
      await api.delete(`/api/contacts/${contactId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de supprimer le contact."
      );
      loadData();
    }
  }

  async function syncCardDav(): Promise<void> {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const result = await api.post<{ syncedCount: number }>(
        "/api/contacts/sync-carddav",
        {}
      );
      setSyncMessage(`${result.syncedCount} contact(s) synchronisé(s).`);
      loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Synchronisation CardDAV impossible."
      );
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Notes & Contacts
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-night-ink/60">
          Notes Markdown et contacts du foyer.
        </p>
      </header>

      <div className="mb-6 flex gap-1 border-b border-stone dark:border-night-panel">
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm ${
            activeTab === "notes"
              ? "border-b-2 border-clay text-ink dark:text-night-ink"
              : "text-ink-soft dark:text-night-ink/60"
          }`}
        >
          <StickyNote size={15} strokeWidth={1.75} />
          Notes
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm ${
            activeTab === "contacts"
              ? "border-b-2 border-clay text-ink dark:text-night-ink"
              : "text-ink-soft dark:text-night-ink/60"
          }`}
        >
          <Users size={15} strokeWidth={1.75} />
          Contacts
        </button>
      </div>

      {errorMessage ? (
        <p className="mb-4 text-sm text-clay">{errorMessage}</p>
      ) : null}

      {activeTab === "contacts" ? (
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={syncCardDav}
            disabled={isSyncing}
            className="flex items-center gap-1.5 border border-stone px-3 py-1.5 text-xs text-ink-soft disabled:opacity-50 dark:border-night-panel dark:text-night-ink/70"
          >
            <RefreshCw size={13} strokeWidth={1.75} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Synchronisation…" : "Synchroniser CardDAV"}
          </button>
          {syncMessage ? (
            <span className="text-xs text-moss">{syncMessage}</span>
          ) : null}
        </div>
      ) : null}

      {activeTab === "notes" ? (
        <div>
          <div className="mb-4 space-y-2 border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40">
            <input
              value={newNoteTitle}
              onChange={(event) => setNewNoteTitle(event.target.value)}
              placeholder="Titre de la note"
              className="w-full border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
            />
            <textarea
              value={newNoteContent}
              onChange={(event) => setNewNoteContent(event.target.value)}
              placeholder="Contenu en Markdown"
              rows={3}
              className="w-full border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
            />
            <button
              onClick={createNote}
              className="flex items-center justify-center gap-1 bg-ink px-4 py-2 text-sm font-medium text-paper dark:bg-night-ink dark:text-night"
            >
              <Plus size={16} strokeWidth={2} />
              Créer la note
            </button>
          </div>

          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40"
              >
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-ink dark:text-night-ink">
                    {note.title}
                  </h3>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 size={14} strokeWidth={1.75} className="text-ink-soft hover:text-clay" />
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink-soft dark:text-night-ink/60">
                  {note.content_markdown}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex flex-col gap-2 border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40 sm:flex-row sm:items-center">
            <input
              value={newContactName}
              onChange={(event) => setNewContactName(event.target.value)}
              placeholder="Nom"
              className="flex-1 border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
            />
            <input
              value={newContactPhone}
              onChange={(event) => setNewContactPhone(event.target.value)}
              placeholder="Téléphone"
              className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
            />
            <input
              value={newContactEmail}
              onChange={(event) => setNewContactEmail(event.target.value)}
              placeholder="Email"
              className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
            />
            <button
              onClick={createContact}
              className="flex items-center justify-center gap-1 bg-ink px-4 py-2 text-sm font-medium text-paper dark:bg-night-ink dark:text-night"
            >
              <Plus size={16} strokeWidth={2} />
              Ajouter
            </button>
          </div>

          <div className="divide-y divide-stone border border-stone dark:divide-night-panel dark:border-night-panel">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="group flex items-center gap-3 bg-paper px-3 py-2 text-sm dark:bg-night-panel/20"
              >
                <span className="flex-1 text-ink dark:text-night-ink">
                  {contact.display_name}
                </span>
                {contact.phone ? (
                  <span className="text-ink-soft dark:text-night-ink/50">
                    {contact.phone}
                  </span>
                ) : null}
                {contact.email ? (
                  <span className="text-ink-soft dark:text-night-ink/50">
                    {contact.email}
                  </span>
                ) : null}
                <button
                  onClick={() => deleteContact(contact.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 size={14} strokeWidth={1.75} className="text-ink-soft hover:text-clay" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
