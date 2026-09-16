export type ModuleId =
  | "tasks"
  | "calendar"
  | "shopping"
  | "meals"
  | "budget"
  | "shared-expenses"
  | "pantry"
  | "documents"
  | "inventory"
  | "notes-contacts";

export interface HouseholdMember {
  id: string;
  display_name: string;
  points: number;
}

export interface ApiError {
  message: string;
  status: number;
}

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "normal" | "high";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  assigned_member_id: string | null;
  parent_task_id: string | null;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
}

export type CalendarVisibility = "household" | "private";

export interface CalendarEvent {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  visibility: CalendarVisibility;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  label: string;
  aisle: string | null;
  is_checked: number;
  source_meal_id: string | null;
  created_at: string;
}

export interface RecipeIngredient {
  label: string;
  aisle: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients_json: string;
  instructions: string | null;
  created_at: string;
}

export type MealSlot = "breakfast" | "lunch" | "dinner";

export interface Meal {
  id: string;
  recipe_id: string;
  planned_date: string;
  slot: MealSlot;
  created_at: string;
}

export interface PantryItem {
  id: string;
  label: string;
  quantity: number;
  location: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedExpense {
  id: string;
  label: string;
  amount: number;
  paid_by_member_id: string;
  participant_ids: string[];
  created_at: string;
}

export interface HouseholdDocument {
  id: string;
  name: string;
  tags_json: string;
  r2_key: string;
  size_bytes: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  label: string;
  purchase_price: number | null;
  purchased_at: string | null;
  warranty_until: string | null;
  receipt_document_id: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content_markdown: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  carddav_uid: string | null;
  created_at: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  created_at: string;
}

export type TransactionKind = "income" | "expense";

export interface Transaction {
  id: string;
  account_id: string;
  label: string;
  amount: number;
  kind: TransactionKind;
  occurred_at: string;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  label: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiRequestError extends Error {
  status: number;

  constructor(error: ApiError) {
    super(error.message);
    this.status = error.status;
    this.name = "ApiRequestError";
  }
}

async function request<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiRequestError({
      message: body?.message ?? "La requête a échoué.",
      status: response.status
    });
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export const api = {
  get: <TResponse>(path: string): Promise<TResponse> =>
    request<TResponse>(path, { method: "GET" }),
  post: <TResponse>(path: string, body: unknown): Promise<TResponse> =>
    request<TResponse>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <TResponse>(path: string, body: unknown): Promise<TResponse> =>
    request<TResponse>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <TResponse>(path: string): Promise<TResponse> =>
    request<TResponse>(path, { method: "DELETE" }),
  uploadFile: async <TResponse>(
    path: string,
    formData: FormData
  ): Promise<TResponse> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new ApiRequestError({
        message: body?.message ?? "L'envoi a échoué.",
        status: response.status
      });
    }
    return (await response.json()) as TResponse;
  }
};
