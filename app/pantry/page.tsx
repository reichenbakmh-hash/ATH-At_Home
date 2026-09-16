"use client";

import { useEffect, useMemo, useState } from "react";
import { Upload, Trash2, FileText, Search, Download } from "lucide-react";
import { api, ApiRequestError, type HouseholdDocument } from "@/lib/api";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function DocumentsList(): React.JSX.Element {
  const [documents, setDocuments] = useState<HouseholdDocument[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingTags, setPendingTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments(): Promise<void> {
    try {
      const result = await api.get<HouseholdDocument[]>("/api/documents");
      setDocuments(result);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de charger les documents."
      );
    }
  }

  async function uploadDocument(): Promise<void> {
    if (!pendingFile) {
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("tags", pendingTags);
      const created = await api.uploadFile<{
        id: string;
        name: string;
        tagsJson: string;
        r2Key: string;
        sizeBytes: number;
      }>("/api/documents/upload", formData);
      setDocuments((current) => [
        {
          id: created.id,
          name: created.name,
          tags_json: created.tagsJson,
          r2_key: created.r2Key,
          size_bytes: created.sizeBytes,
          created_at: new Date().toISOString()
        },
        ...current
      ]);
      setPendingFile(null);
      setPendingTags("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible d'envoyer le document."
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteDocument(documentId: string): Promise<void> {
    setDocuments((current) =>
      current.filter((document) => document.id !== documentId)
    );
    try {
      await api.delete(`/api/documents/${documentId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de supprimer le document."
      );
      loadDocuments();
    }
  }

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return documents;
    }
    return documents.filter((document) => {
      const tags = JSON.parse(document.tags_json) as string[];
      return (
        document.name.toLowerCase().includes(query) ||
        tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [documents, searchQuery]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Documents
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-night-ink/60">
          Fichiers du foyer, tagués et recherchables.
        </p>
      </header>

      <div className="mb-4 flex items-center gap-2 border border-stone bg-paper px-3 py-2 dark:border-night-panel dark:bg-night-panel/40">
        <Search size={15} strokeWidth={1.75} className="text-ink-soft" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Rechercher par nom ou tag"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mb-6 flex flex-col gap-2 border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40 sm:flex-row sm:items-center">
        <input
          type="file"
          onChange={(event) =>
            setPendingFile(event.target.files?.[0] ?? null)
          }
          className="flex-1 text-sm text-ink-soft file:mr-3 file:border-0 file:bg-paper-dim file:px-3 file:py-1.5 file:text-sm dark:text-night-ink/70 dark:file:bg-night-panel"
        />
        <input
          value={pendingTags}
          onChange={(event) => setPendingTags(event.target.value)}
          placeholder="Tags séparés par une virgule"
          className="border border-stone bg-transparent px-3 py-2 text-sm outline-none dark:border-night-panel"
        />
        <button
          onClick={uploadDocument}
          disabled={!pendingFile || isUploading}
          className="flex items-center justify-center gap-1 bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50 dark:bg-night-ink dark:text-night"
        >
          <Upload size={16} strokeWidth={2} />
          {isUploading ? "Envoi…" : "Envoyer"}
        </button>
      </div>

      {errorMessage ? (
        <p className="mb-4 text-sm text-clay">{errorMessage}</p>
      ) : null}

      <div className="divide-y divide-stone border border-stone dark:divide-night-panel dark:border-night-panel">
        {filteredDocuments.map((document) => {
          const tags = JSON.parse(document.tags_json) as string[];
          return (
            <div
              key={document.id}
              className="group flex items-center gap-3 bg-paper px-3 py-2 text-sm dark:bg-night-panel/20"
            >
              <FileText size={16} strokeWidth={1.5} className="shrink-0 text-ink-soft" />
              <span className="flex-1 truncate text-ink dark:text-night-ink">
                {document.name}
              </span>
              <div className="hidden gap-1 sm:flex">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-stone px-1.5 py-0.5 text-xs text-ink-soft dark:border-night-panel dark:text-night-ink/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-xs text-ink-soft dark:text-night-ink/50">
                {formatSize(document.size_bytes)}
              </span>
              <a
                href={`${API_BASE_URL}/api/documents/${document.id}/file`}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={14} strokeWidth={1.75} className="text-ink-soft hover:text-ink" />
              </a>
              <button
                onClick={() => deleteDocument(document.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 size={14} strokeWidth={1.75} className="text-ink-soft hover:text-clay" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

