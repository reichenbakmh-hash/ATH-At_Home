"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { api, ApiRequestError, type Meal, type MealSlot, type Recipe, type RecipeIngredient } from "@/lib/api";

const slotLabel: Record<MealSlot, string> = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  dinner: "Dîner"
};
const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];
const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function startOfWeek(reference: Date): Date {
  const isoWeekday = (reference.getDay() + 6) % 7;
  const start = new Date(reference);
  start.setDate(reference.getDate() - isoWeekday);
  return start;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function MealPlanner(): React.JSX.Element {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newRecipeTitle, setNewRecipeTitle] = useState("");
  const [newIngredientsRaw, setNewIngredientsRaw] = useState("");
  const [draggedRecipeId, setDraggedRecipeId] = useState<string | null>(null);
  const [exportedMealIds, setExportedMealIds] = useState<Set<string>>(
    new Set()
  );

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(): Promise<void> {
    try {
      const [recipeResult, mealResult] = await Promise.all([
        api.get<Recipe[]>("/api/recipes"),
        api.get<Meal[]>("/api/meals")
      ]);
      setRecipes(recipeResult);
      setMeals(mealResult);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de charger le planificateur de repas."
      );
    }
  }

  function parseIngredients(raw: string): RecipeIngredient[] {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, aisle] = line.split("|").map((part) => part.trim());
        return { label: label ?? line, aisle: aisle ?? "Autre" };
      });
  }

  async function createRecipe(): Promise<void> {
    if (!newRecipeTitle.trim()) {
      return;
    }
    try {
      const created = await api.post<{ id: string }>("/api/recipes", {
        title: newRecipeTitle.trim(),
        ingredients: parseIngredients(newIngredientsRaw)
      });
      setRecipes((current) => [
        {
          id: created.id,
          title: newRecipeTitle.trim(),
          ingredients_json: JSON.stringify(parseIngredients(newIngredientsRaw)),
          instructions: null,
          created_at: new Date().toISOString()
        },
        ...current
      ]);
      setNewRecipeTitle("");
      setNewIngredientsRaw("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de créer la recette."
      );
    }
  }

  async function planMeal(
    recipeId: string,
    plannedDate: string,
    slot: MealSlot
  ): Promise<void> {
    try {
      const created = await api.post<{ id: string }>("/api/meals", {
        recipeId,
        plannedDate,
        slot
      });
      setMeals((current) => [
        ...current,
        { id: created.id, recipe_id: recipeId, planned_date: plannedDate, slot, created_at: new Date().toISOString() }
      ]);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de planifier ce repas."
      );
    }
  }

  async function removeMeal(mealId: string): Promise<void> {
    setMeals((current) => current.filter((meal) => meal.id !== mealId));
    try {
      await api.delete(`/api/meals/${mealId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible de retirer ce repas."
      );
      loadData();
    }
  }

  async function exportToShopping(mealId: string): Promise<void> {
    try {
      await api.post(`/api/meals/${mealId}/export`, {});
      setExportedMealIds((current) => new Set(current).add(mealId));
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Impossible d'exporter vers les courses."
      );
    }
  }

  function recipeTitle(recipeId: string): string {
    return recipes.find((recipe) => recipe.id === recipeId)?.title ?? "—";
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Repas & Recettes
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-night-ink/60">
          Glissez une recette sur un jour, exportez ses ingrédients vers les courses.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        <div className="border border-stone bg-paper p-4 dark:border-night-panel dark:bg-night-panel/40">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
            Recettes
          </h2>
          <div className="mb-4 space-y-2">
            <input
              value={newRecipeTitle}
              onChange={(event) => setNewRecipeTitle(event.target.value)}
              placeholder="Nom de la recette"
              className="w-full border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
            />
            <textarea
              value={newIngredientsRaw}
              onChange={(event) => setNewIngredientsRaw(event.target.value)}
              placeholder={"Un ingrédient par ligne : label | rayon"}
              rows={3}
              className="w-full border border-stone bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-clay dark:border-night-panel"
            />
            <button
              onClick={createRecipe}
              className="flex w-full items-center justify-center gap-1 bg-ink px-4 py-2 text-sm font-medium text-paper dark:bg-night-ink dark:text-night"
            >
              <Plus size={16} strokeWidth={2} />
              Créer la recette
            </button>
          </div>

          <div className="space-y-1.5">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                draggable
                onDragStart={() => setDraggedRecipeId(recipe.id)}
                className="cursor-grab border border-stone bg-paper px-2.5 py-1.5 text-sm text-ink dark:border-night-panel dark:bg-night dark:text-night-ink"
              >
                {recipe.title}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dateKey = toDateKey(day);
              return (
                <div key={dateKey} className="flex flex-col gap-2">
                  <div className="text-center text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-night-ink/60">
                    {weekdayLabels[(day.getDay() + 6) % 7]} {day.getDate()}
                  </div>
                  {slots.map((slot) => {
                    const slotMeals = meals.filter(
                      (meal) =>
                        meal.planned_date === dateKey && meal.slot === slot
                    );
                    return (
                      <div
                        key={slot}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() =>
                          draggedRecipeId &&
                          planMeal(draggedRecipeId, dateKey, slot)
                        }
                        className="min-h-[64px] border border-stone bg-paper-dim/40 p-1.5 dark:border-night-panel dark:bg-night-panel/20"
                      >
                        <p className="mb-1 text-[10px] uppercase tracking-wide text-ink-soft/70 dark:text-night-ink/40">
                          {slotLabel[slot]}
                        </p>
                        {slotMeals.map((meal) => (
                          <div
                            key={meal.id}
                            className="mb-1 flex items-center justify-between gap-1 bg-paper px-1.5 py-1 text-xs dark:bg-night"
                          >
                            <span className="truncate text-ink dark:text-night-ink">
                              {recipeTitle(meal.recipe_id)}
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                onClick={() => exportToShopping(meal.id)}
                                title="Exporter vers les courses"
                              >
                                <ShoppingCart
                                  size={12}
                                  strokeWidth={1.75}
                                  className={
                                    exportedMealIds.has(meal.id)
                                      ? "text-moss"
                                      : "text-ink-soft hover:text-clay dark:text-night-ink/50"
                                  }
                                />
                              </button>
                              <button onClick={() => removeMeal(meal.id)}>
                                <Trash2
                                  size={12}
                                  strokeWidth={1.75}
                                  className="text-ink-soft hover:text-clay dark:text-night-ink/50"
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-clay">{errorMessage}</p> : null}
    </div>
  );
}
