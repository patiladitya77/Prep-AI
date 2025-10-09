import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: "interview" | "learning" | "practice" | "resume";
  targetDate: string;
  completed: boolean;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  const fetchGoals = async () => {
    if (!token || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/goals", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // User session expired, redirect to login
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch goals");
      }

      const data = await response.json();

      // Transform the data to match the frontend format
      const transformedGoals = data.goals.map((goal: any) => ({
        ...goal,
        category: goal.category.toLowerCase(),
        targetDate: goal.targetDate.split("T")[0], // Convert to YYYY-MM-DD format
        createdAt: goal.createdAt.split("T")[0],
      }));

      setGoals(transformedGoals);
      setError(null);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (
    goalData: Omit<
      Goal,
      "id" | "completed" | "progress" | "createdAt" | "updatedAt"
    >
  ) => {
    if (!token) throw new Error("No authentication token");

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create goal");
      }

      const data = await response.json();
      const transformedGoal = {
        ...data.goal,
        category: data.goal.category.toLowerCase(),
        targetDate: data.goal.targetDate.split("T")[0],
        createdAt: data.goal.createdAt.split("T")[0],
      };

      setGoals((prev) => [transformedGoal, ...prev]);
      return transformedGoal;
    } catch (err) {
      console.error("Error creating goal:", err);
      throw err;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!token) throw new Error("No authentication token");

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update goal");
      }

      const data = await response.json();
      const transformedGoal = {
        ...data.goal,
        category: data.goal.category.toLowerCase(),
        targetDate: data.goal.targetDate.split("T")[0],
        createdAt: data.goal.createdAt.split("T")[0],
      };

      setGoals((prev) =>
        prev.map((goal) => (goal.id === goalId ? transformedGoal : goal))
      );
      return transformedGoal;
    } catch (err) {
      console.error("Error updating goal:", err);
      throw err;
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!token) throw new Error("No authentication token");

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete goal");
      }

      setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    } catch (err) {
      console.error("Error deleting goal:", err);
      throw err;
    }
  };

  const toggleGoalCompleted = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const completed = !goal.completed;
    const progress = completed ? 100 : 0;

    return updateGoal(goalId, { completed, progress });
  };

  useEffect(() => {
    fetchGoals();
  }, [token, isAuthenticated]);

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleGoalCompleted,
    refetch: fetchGoals,
  };
};
