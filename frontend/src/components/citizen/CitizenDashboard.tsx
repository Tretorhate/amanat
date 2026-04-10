"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Appeal, AppealStatus, AppealCategory } from "@/types/appeal";
import { useAuthStore } from "@/lib/hooks/useAuthStore";
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
  FileText,
  Plus,
  Clock,
  CheckCircle,
  MessageSquare,
  Search,
  Filter,
  AlertCircle,
  UserCircle,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface CitizenDashboardProps {
  appeals: Appeal[];
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  rejected: "bg-red-100 text-red-800",
};

const priorityLabels = {
  low: "Низкий",
  normal: "Нормальный",
  high: "Высокий",
  urgent: "Срочный",
};

export function CitizenDashboard({ appeals }: CitizenDashboardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const t = useTranslations("dashboard.citizen");
  const tStatus = useTranslations("appeals.status");
  const tCategory = useTranslations("appeals.category");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppealStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<AppealCategory | "all">(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: appeals.length,
      pending: appeals.filter((a) => a.status === "pending").length,
      inProgress: appeals.filter((a) => a.status === "in_progress").length,
      resolved: appeals.filter((a) => a.status === "resolved").length,
    };
  }, [appeals]);

  // Filter and search appeals
  const filteredAppeals = useMemo(() => {
    return appeals.filter((appeal) => {
      // Status filter
      if (statusFilter !== "all" && appeal.status !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && appeal.category !== categoryFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = appeal.title?.toLowerCase().includes(query);
        const descMatch = appeal.description.toLowerCase().includes(query);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }, [appeals, statusFilter, categoryFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAppeals.length / itemsPerPage);
  const paginatedAppeals = filteredAppeals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 sm:p-6 text-white">
        <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">
          {t("welcome", { name: user?.first_name || user?.username || "User" })}
        </h2>
        <p className="text-blue-100 mb-3 sm:mb-4 text-sm sm:text-base">
          Здесь вы можете подавать обращения и отслеживать их статус
        </p>
        <Button
          onClick={() => router.push("/citizen/appeals/new")}
          className="bg-white text-blue-700 hover:bg-blue-50 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          {t("createAppeal")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs sm:text-sm text-gray-600">{t("stats.totalAppeals")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">{t("stats.pending")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.inProgress}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">{t("stats.inProgress")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.resolved}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">{t("stats.resolved")}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Access Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        <Card
          className="p-4 sm:p-6 hover:shadow-lg transition cursor-pointer group"
          onClick={() => router.push("/profile")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                <UserCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {t("profile")}
                </h3>
                <p className="text-sm text-gray-600">{t("profileDesc")}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
          </div>
        </Card>

      </div>

      {/* Appeals List */}
      <Card>
        <div className="p-4 sm:p-6 border-b border-gray-200 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {t("recentAppeals")}
            </h3>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              {filteredAppeals.length}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as AppealStatus | "all")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tStatus("all")}</SelectItem>
                <SelectItem value="pending">{tStatus("pending")}</SelectItem>
                <SelectItem value="in_progress">
                  {tStatus("in_progress")}
                </SelectItem>
                <SelectItem value="resolved">{tStatus("resolved")}</SelectItem>
                <SelectItem value="rejected">{tStatus("rejected")}</SelectItem>
              </SelectContent>
            </Select>

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
                <SelectItem value="all">{tCategory("all")}</SelectItem>
                <SelectItem value="infrastructure">
                  {tCategory("infrastructure")}
                </SelectItem>
                <SelectItem value="safety">{tCategory("safety")}</SelectItem>
                <SelectItem value="healthcare">
                  {tCategory("healthcare")}
                </SelectItem>
                <SelectItem value="education">
                  {tCategory("education")}
                </SelectItem>
                <SelectItem value="environment">
                  {tCategory("environment")}
                </SelectItem>
                <SelectItem value="transport">
                  {tCategory("transport")}
                </SelectItem>
                <SelectItem value="housing">{tCategory("housing")}</SelectItem>
                <SelectItem value="utilities">
                  {tCategory("utilities")}
                </SelectItem>
                <SelectItem value="social_services">
                  {tCategory("social_services")}
                </SelectItem>
                <SelectItem value="other">{tCategory("other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {paginatedAppeals.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {appeals.length === 0 ? t("noAppeals") : t("notFound")}
            </p>
            {appeals.length === 0 && (
              <Button onClick={() => router.push("/citizen/appeals/new")}>
                {t("createFirst")}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {paginatedAppeals.map((appeal) => (
                <div
                  key={appeal.id}
                  className="p-4 sm:p-6 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => router.push(`/citizen/appeals/${appeal.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {appeal.title ||
                            appeal.description.substring(0, 60) + "..."}
                        </h4>
                        {appeal.priority && appeal.priority !== "normal" && (
                          <span className="text-xs">
                            {priorityLabels[appeal.priority].split(" ")[0]}
                          </span>
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
                        <span>
                          {appeal.created_at &&
                            formatDistanceToNow(new Date(appeal.created_at), {
                              addSuffix: true,
                              locale: ru,
                            })}
                        </span>
                        {appeal.deputy?.user?.full_name && (
                          <>
                            <span>•</span>
                            <span>
                              {t("deputy")}: {appeal.deputy?.user?.full_name}
                            </span>
                          </>
                        )}
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
                    </div>
                  </div>
                </div>
              ))}
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
                    {t("next")}
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
