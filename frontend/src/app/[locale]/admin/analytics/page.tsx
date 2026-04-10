"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  analyticsApi,
  AnalyticsStats,
  CategoryDistribution,
} from "@/lib/api/analytics";
import { StatsCard } from "@/components/analytics/StatsCard";
import { CategoryChart } from "@/components/analytics/CategoryChart";
import { ResponseTimeChart } from "@/components/analytics/ResponseTimeChart";
import { Button } from "@/components/ui/button";
import {
  Download,
  BarChart3,
  Clock,
  Zap,
  CheckCircle,
  Timer,
} from "lucide-react";

interface ResponseTimeData {
  date: string;
  average_time: number;
}

export default function AdminAnalyticsPage() {
  const t = useTranslations("admin.analytics");
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryDistribution[]>([]);
  const [responseTimeData, setResponseTimeData] = useState<ResponseTimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [statsRes, trendsRes] = await Promise.all([
        analyticsApi.getStats(),
        analyticsApi.getCategoryDistribution(), // Returns appeal-trends data
      ]);

      setStats(statsRes.data);

      // Extract category_distribution from appeal-trends response
      setCategoryData(trendsRes.data.category_distribution || []);

      // Response time data - create mock data from average response time
      // TODO: Backend should provide historical response time data
      const avgResponseTime = statsRes.data.average_response_time || 0;
      const mockTimeData: ResponseTimeData[] = avgResponseTime > 0
        ? [
            { date: new Date().toISOString(), average_time: avgResponseTime },
          ]
        : [];
      setResponseTimeData(mockTimeData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
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

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("title")}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          {t("exportButton")}
        </Button>
      </div>

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title={t("statsLabels.totalAppeals")}
            value={stats.total_appeals}
            icon={BarChart3}
            color="blue"
          />
          <StatsCard
            title={t("statsLabels.pendingAppeals")}
            value={stats.pending_appeals}
            icon={Clock}
            color="yellow"
          />
          <StatsCard
            title={t("statsLabels.inProgressAppeals")}
            value={stats.in_progress_appeals}
            icon={Zap}
            color="purple"
          />
          <StatsCard
            title={t("statsLabels.resolvedAppeals")}
            value={stats.resolved_appeals}
            icon={CheckCircle}
            color="green"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categoryData.length > 0 && <CategoryChart data={categoryData} />}
      </div>

      {/* Response Time Chart */}
      {responseTimeData.length > 0 && <ResponseTimeChart data={responseTimeData} />}

      {/* Performance Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <StatsCard
            title={t("statsLabels.averageResolutionTime")}
            value={`${stats.average_response_time?.toFixed(1) || 0}ч`}
            icon={Timer}
            color="blue"
          />
        </div>
      )}
    </div>
  );
}
