"use client";

import { useEffect, useState } from "react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { analyticsApi } from "@/lib/api/analytics";
import api from "@/lib/api/axios";
import { PaginatedResponse } from "@/types/common";

interface User {
  id: string;
  username: string;
  user_type: "citizen" | "deputy" | "admin";
  role?: "citizen" | "deputy" | "admin";
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalAppeals: 0,
    pendingAppeals: 0,
    resolvedAppeals: 0,
    totalUsers: 0,
    totalCitizens: 0,
    totalDeputies: 0,
    averageResponseTime: 0,
    satisfactionAverage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch analytics stats from /api/analytics/appeal-statistics/
      const analyticsResponse = await analyticsApi.getStats();
      const analyticsData = analyticsResponse.data;

      // Fetch users count
      const usersResponse = await api.get<PaginatedResponse<User>>("/accounts/admin/users/");
      const users = usersResponse.data.results;

      const citizens = Array.isArray(users)
        ? users.filter(
            (u: User) => u.role === "citizen" || u.user_type === "citizen",
          )
        : [];
      const deputies = Array.isArray(users)
        ? users.filter(
            (u: User) => u.role === "deputy" || u.user_type === "deputy",
          )
        : [];

      setStats({
        totalAppeals: analyticsData.total_appeals || 0,
        pendingAppeals: analyticsData.pending_appeals || 0,
        resolvedAppeals: analyticsData.resolved_appeals || 0,
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalCitizens: citizens.length,
        totalDeputies: deputies.length,
        averageResponseTime: analyticsData.average_response_time || 0,
        satisfactionAverage: analyticsData.satisfaction_average || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <AdminDashboard stats={stats} />;
}
