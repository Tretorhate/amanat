"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { appealsApi } from "@/lib/api/appeals";
import { Appeal, AppealStatus } from "@/types/appeal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  MapPin,
  Briefcase,
  Flag,
  MessageSquare,
  Star,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { LoadingPage } from "@/components/common/LoadingPage";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminAppealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appealId = params.id as string;
  const t = useTranslations("admin.appeals");
  const tStatus = useTranslations("appeals.status");
  const tCategory = useTranslations("appeals.category");
  const tPriority = useTranslations("appeals.priority");
  const tCommon = useTranslations("common");

  const [appeal, setAppeal] = useState<Appeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    status: "" as AppealStatus,
    category: "",
    priority: "",
  });

  const fetchAppeal = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appealsApi.getById(appealId);
      setAppeal(response.data);
      setFormData({
        status: response.data.status,
        category: response.data.category,
        priority: response.data.priority,
      });
    } catch (error) {
      console.error("Error fetching appeal:", error);
      toast.error(t("toasts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [appealId, t]);

  useEffect(() => {
    fetchAppeal();
  }, [appealId, fetchAppeal]);

  const handleUpdateStatus = async () => {
    if (!appeal) return;

    try {
      setUpdating(true);
      await appealsApi.updateStatus(appealId, {
        status: formData.status,
      });
      toast.success(t("toasts.statusUpdateSuccess", { count: 1, status: tStatus(formData.status) }));
      setIsEditing(false);
      fetchAppeal();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(t("toasts.statusUpdateError"));
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (appeal) {
      setFormData({
        status: appeal.status,
        category: appeal.category,
        priority: appeal.priority,
      });
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!appeal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">{t("emptyState")}</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{appeal.title}</h1>
          <p className="text-gray-600 mt-1">ID: {appeal.id}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              {tCommon("edit")}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="flex items-center gap-2"
              >
                {updating ? tCommon("loading") : tCommon("save")}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={updating}
              >
                {tCommon("cancel")}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("details.description")}
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {appeal.description}
            </p>
          </Card>

          {/* Appeal Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("details.appealDetails")}
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("details.status")}
                </label>
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as AppealStatus,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">{tStatus("pending")}</option>
                    <option value="in_progress">{tStatus("in_progress")}</option>
                    <option value="resolved">{tStatus("resolved")}</option>
                    <option value="rejected">{tStatus("rejected")}</option>
                  </select>
                ) : (
                  <Badge
                    className={`${statusColors[appeal.status as AppealStatus]}`}
                  >
                    {tStatus(appeal.status as "pending" | "in_progress" | "resolved" | "closed" | "rejected")}
                  </Badge>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("details.category")}
                </label>
                <Badge variant="outline">
                  {tCategory(appeal.category as "infrastructure" | "safety" | "healthcare" | "education" | "environment" | "transport" | "housing" | "utilities" | "social_services" | "other")}
                </Badge>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("details.priority")}
                </label>
                <Badge variant="outline">
                  {tPriority(appeal.priority as "low" | "normal" | "high" | "urgent")}
                </Badge>
              </div>

              {/* Messages Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("details.messagesCount")}
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <MessageSquare className="w-4 h-4 text-gray-600" />
                  <span>{appeal.message_count} / 10</span>
                </div>
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("table.headers.created")}
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span>
                    {format(new Date(appeal.created_at), "dd MMMM yyyy", {
                      locale: ru,
                    })}
                  </span>
                </div>
              </div>

              {/* Responded Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("details.respondedDate")}
                </label>
                {appeal.responded_at ? (
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span>
                      {format(new Date(appeal.responded_at), "dd MMMM yyyy", {
                        locale: ru,
                      })}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">{t("emptyState")}</span>
                )}
              </div>

              {/* Satisfaction Rating */}
              {appeal.satisfaction_rating && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("details.satisfactionRating")}
                  </label>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                    <span className="text-gray-900">
                      {appeal.satisfaction_rating} / 5
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Citizen Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("table.headers.citizen")}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("table.headers.user")}</p>
                  <p className="font-medium text-gray-900">
                    {appeal.citizen.user.full_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("table.headers.phone")}</p>
                  <p className="font-medium text-gray-900">
                    {appeal.citizen.user.phone || t("notSpecified")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("table.headers.district")}</p>
                  <p className="font-medium text-gray-900">
                    {appeal.citizen.district}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Deputy Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("table.headers.deputy")}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("table.headers.user")}</p>
                  <p className="font-medium text-gray-900">
                    {appeal.deputy.user.full_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("table.headers.district")}</p>
                  <p className="font-medium text-gray-900">
                    {appeal.deputy.district}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Quick Stats */}
        <div className="space-y-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">{t("details.status")}</h3>
            </div>
            <Badge className={statusColors[appeal.status as AppealStatus]}>
              {tStatus(appeal.status as "pending" | "in_progress" | "resolved" | "closed" | "rejected")}
            </Badge>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">{t("details.priority")}</h3>
              <Flag className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-900">
              {tPriority(appeal.priority as "low" | "normal" | "high" | "urgent")}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">{t("details.messagesCount")}</h3>
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">
              {appeal.message_count} / 10
            </p>
          </Card>

          {appeal.satisfaction_rating && (
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">{t("details.rating")}</h3>
                <Star className="w-5 h-5 text-orange-600 fill-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {appeal.satisfaction_rating} / 5
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
