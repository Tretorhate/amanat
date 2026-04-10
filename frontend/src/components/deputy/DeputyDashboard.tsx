"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Appeal, AppealCategory } from "@/types/appeal";
import { useAuthStore } from "@/lib/hooks/useAuthStore";
import { StatsCard } from "@/components/analytics/StatsCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  AlertCircle,
  Clock,
  MessageSquare,
  User,
  MapPin,
  Zap,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface DeputyDashboardProps {
  appeals: Appeal[];
}

type TabFilter =
  | "all"
  | "pending"
  | "in_progress"
  | "resolved"
  | "rejected"
  | "urgent"
  | "unanswered";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  rejected: "bg-red-100 text-red-800",
};

export function DeputyDashboard({ appeals }: DeputyDashboardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const t = useTranslations("dashboard.deputy");
  const tStatus = useTranslations("appeals.status");
  const tCategory = useTranslations("appeals.category");
  const tPriority = useTranslations("appeals.priority");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AppealCategory | "all">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = appeals.filter((a) => {
      const created = new Date(a.created_at);
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length;

    const avgSatisfaction =
      appeals
        .filter((a) => a.satisfaction_rating)
        .reduce((sum, a) => sum + (a.satisfaction_rating || 0), 0) /
        appeals.filter((a) => a.satisfaction_rating).length || 0;

    return {
      total: appeals.length,
      pending: appeals.filter((a) => a.status === "pending").length,
      inProgress: appeals.filter((a) => a.status === "in_progress").length,
      resolved: appeals.filter((a) => a.status === "resolved").length,
      rejected: appeals.filter((a) => a.status === "rejected").length,
      urgent: appeals.filter((a) => a.priority === "urgent").length,
      unanswered: appeals.filter((a) => !a.responded_at).length,
      thisMonth,
      avgSatisfaction: Number(avgSatisfaction.toFixed(1)),
    };
  }, [appeals]);

  // Filter appeals based on active tab and search
  const filteredAppeals = useMemo(() => {
    return appeals.filter((appeal) => {
      // Tab filter
      if (activeTab === "urgent" && appeal.priority !== "urgent") return false;
      if (activeTab === "unanswered" && appeal.responded_at) return false;
      if (
        activeTab !== "all" &&
        activeTab !== "urgent" &&
        activeTab !== "unanswered" &&
        appeal.status !== activeTab
      )
        return false;

      // Category filter
      if (categoryFilter !== "all" && appeal.category !== categoryFilter)
        return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = appeal.title?.toLowerCase().includes(query);
        const descMatch = appeal.description.toLowerCase().includes(query);
        const citizenMatch = appeal.citizen?.user?.full_name
          ?.toLowerCase()
          .includes(query);
        if (!titleMatch && !descMatch && !citizenMatch) return false;
      }

      return true;
    });
  }, [appeals, activeTab, categoryFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAppeals.length / itemsPerPage);
  const paginatedAppeals = filteredAppeals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, categoryFilter, searchQuery]);

  const tabs = [
    { key: "all" as TabFilter, label: t("tabs.all"), count: stats.total },
    { key: "pending" as TabFilter, label: t("tabs.pending"), count: stats.pending },
    {
      key: "in_progress" as TabFilter,
      label: t("tabs.inProgress"),
      count: stats.inProgress,
    },
    { key: "resolved" as TabFilter, label: t("tabs.resolved"), count: stats.resolved },
    { key: "rejected" as TabFilter, label: t("tabs.rejected"), count: stats.rejected },
    { key: "urgent" as TabFilter, label: t("tabs.urgent"), count: stats.urgent },
    {
      key: "unanswered" as TabFilter,
      label: t("tabs.unanswered"),
      count: stats.unanswered,
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-4 sm:p-8 text-white shadow-lg flex items-center gap-3 sm:gap-4">
        <Zap className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 truncate">
            {t("welcome", { name: user?.full_name || user?.username || "Депутат" })}
          </h1>
          <p className="text-indigo-100 text-sm sm:text-lg">
            {t("welcomeSubtitle")}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatsCard
          title={t("statsLabels.totalAppeals")}
          value={stats.total}
          icon={BarChart3}
          color="blue"
          change={`${stats.thisMonth} ${t("thisMonth")}`}
        />
        <StatsCard
          title={t("statsLabels.pendingResponse")}
          value={stats.pending}
          icon={AlertCircle}
          color="yellow"
          change={t("requireAttention")}
        />
        <StatsCard
          title={t("statsLabels.inProgress")}
          value={stats.inProgress}
          icon={Zap}
          color="purple"
          change={t("activeTasks")}
        />
        <StatsCard
          title={t("statsLabels.resolved")}
          value={stats.resolved}
          icon={CheckCircle}
          color="green"
          change={
            stats.avgSatisfaction > 0
              ? `${stats.avgSatisfaction}/5 ${t("averageRating")}`
              : t("ready")
          }
        />
      </div>

      {/* Appeals Section */}
      <Card>
        <div className="p-4 sm:p-6 border-b border-gray-200 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              {t("citizenAppeals")}
            </h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              {filteredAppeals.length}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onValueChange={(value) =>
                setCategoryFilter(value as AppealCategory | "all")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCategories")}</SelectItem>
                <SelectItem value="infrastructure">{tCategory("infrastructure")}</SelectItem>
                <SelectItem value="safety">{tCategory("safety")}</SelectItem>
                <SelectItem value="healthcare">{tCategory("healthcare")}</SelectItem>
                <SelectItem value="education">{tCategory("education")}</SelectItem>
                <SelectItem value="environment">{tCategory("environment")}</SelectItem>
                <SelectItem value="transport">{tCategory("transport")}</SelectItem>
                <SelectItem value="housing">{tCategory("housing")}</SelectItem>
                <SelectItem value="utilities">{tCategory("utilities")}</SelectItem>
                <SelectItem value="social_services">{tCategory("social_services")}</SelectItem>
                <SelectItem value="other">{tCategory("other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 sm:gap-2 px-4 sm:px-6 pt-3 sm:pt-4 border-b-2 border-gray-100 overflow-x-auto pb-px -mx-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 font-medium transition-all relative whitespace-nowrap text-sm ${
                activeTab === tab.key
                  ? 'text-indigo-600 after:content-[""] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600'
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}{" "}
              <span
                className={`${
                  activeTab === tab.key ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        {/* Appeals List */}
        {paginatedAppeals.length === 0 ? (
          <div className="text-center py-20 bg-gray-50">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {appeals.length === 0
                ? t("noAppealsYet")
                : t("notFoundTitle")}
            </h3>
            <p className="text-gray-500">
              {appeals.length === 0
                ? t("noAppealsDescription")
                : t("notFoundDescription")}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {paginatedAppeals.map((appeal) => {
                const isUrgent = appeal.priority === "urgent";
                const isUnanswered = !appeal.responded_at;

                return (
                  <div
                    key={appeal.id}
                    className={`p-4 sm:p-6 hover:bg-gray-50 transition cursor-pointer ${
                      isUrgent ? "bg-red-50 border-l-4 border-red-500" : ""
                    }`}
                    onClick={() => router.push(`/deputy/appeals/${appeal.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {appeal.priority && (
                            <span className="text-lg">
                              {tPriority(appeal.priority)}
                            </span>
                          )}
                          <h4 className="font-semibold text-gray-900">
                            {appeal.title ||
                              appeal.description.substring(0, 60) + "..."}
                          </h4>
                          {isUnanswered && (
                            <Badge className="bg-orange-100 text-orange-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {t("unanswered")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {appeal.description.substring(0, 150)}
                          {appeal.description.length > 150 && "..."}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            {tCategory(appeal.category)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {appeal.citizen?.user?.full_name || tCommon("citizen")}
                          </span>
                          {appeal.citizen?.district && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {appeal.citizen.district}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(appeal.created_at), {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <Badge className={statusColors[appeal.status]}>
                          {tStatus(appeal.status)}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MessageSquare className="w-3 h-3" />
                          {appeal.message_count || 0}/{appeal.message_limit || 10}
                        </div>
                        {appeal.responded_at && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {tCommon("responded")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {t("page", { current: currentPage, total: totalPages })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    {t("previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    {t("forward")}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
