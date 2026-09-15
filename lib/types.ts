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

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  description: string;
  enabled: boolean;
}

export interface HouseholdMember {
  id: string;
  displayName: string;
  points: number;
}

export interface ApiError {
  message: string;
  status: number;
}
