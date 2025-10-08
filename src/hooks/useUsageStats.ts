import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface UsageData {
  interviews: {
    used: number;
    limit: number;
    percentage: number;
  };
  resumes: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export const useUsageStats = () => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  const fetchUsage = async () => {
    if (!token || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/user/usage", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch usage statistics");
      }

      const data = await response.json();
      setUsage(data.usage);
      setError(null);
    } catch (err) {
      console.error("Error fetching usage:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [token, isAuthenticated]);

  return { usage, loading, error, refetch: fetchUsage };
};
