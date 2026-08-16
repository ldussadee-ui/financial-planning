"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useSetting } from "./useSetting";
import type { Goal, InvestmentAsset, LiquidAsset } from "@/lib/types";

// The goal used for the "days faster" spend comparison. Defaults to the
// first เกษียณ (retirement) goal, falling back to the first goal of any
// type — but a user-picked override (stored in settings) always wins.
// Also resolves `linked`: the liquid + investment assets already tied to
// that goal, needed to know how much of it is still unfunded.
export function usePrimaryGoal(): {
  goal: Goal | null;
  goals: Goal[];
  linked: number;
  primaryGoalId: string | null;
  setPrimaryGoalId: (id: string | null) => void;
} {
  const goals = useLiveQuery(() => db.goals.toArray(), [], [] as Goal[]);
  const liquid = useLiveQuery(() => db.liquidAssets.toArray(), [], [] as LiquidAsset[]);
  const investment = useLiveQuery(() => db.investmentAssets.toArray(), [], [] as InvestmentAsset[]);
  const [primaryGoalId, setPrimaryGoalId] = useSetting<string | null>("primaryGoalId", null);
  const list = goals || [];
  const chosen = primaryGoalId ? list.find((g) => g.id === primaryGoalId) : undefined;
  const fallback = list.find((g) => g.type === "เกษียณ") || list[0];
  const goal = chosen || fallback || null;
  const linked = goal
    ? liquid.filter((a) => a.goal_id === goal.id).reduce((s, a) => s + Number(a.current_value || 0), 0) +
      investment.filter((a) => a.goal_id === goal.id).reduce((s, a) => s + Number(a.current_value || 0), 0)
    : 0;
  return { goal, goals: list, linked, primaryGoalId, setPrimaryGoalId };
}
