"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { appealsApi } from "@/lib/api/appeals";
import { useAddMessage } from "@/lib/hooks/useAppeals";
import { Appeal } from "@/types/appeal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppealChatBox } from "@/components/messages/AppealChatBox";
import { MessageInput } from "@/components/messages/MessageInput";
import {
  ArrowLeft,
  User,
  Calendar,
  Tag,
  Star,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

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

const priorityColors = {
  low: "bg-green-100 text-green-800",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const priorityIcons = {
  low: { icon: CheckCircle, color: "text-green-600" },
  normal: { icon: AlertCircle, color: "text-yellow-600" },
  high: { icon: AlertTriangle, color: "text-orange-600" },
  urgent: { icon: XCircle, color: "text-red-600" },
};

export default function AppealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appealId = params.id as string;

  const t = useTranslations("appeals.details");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("appeals.status");
  const tCategory = useTranslations("appeals.category");

  const [appeal, setAppeal] = useState<Appeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number | null>(null);

  const addMessage = useAddMessage();

  const fetchAppeal = async () => {
    try {
      const response = await appealsApi.getById(appealId);
      setAppeal(response.data);
      setRating(response.data.satisfaction_rating);
    } catch (error) {
      console.error("Error fetching appeal:", error);
      toast.error("Не удалось загрузить обращение");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appealId]);

  const handleSendMessage = async (content: string) => {
    try {
      await addMessage.mutateAsync({ id: appealId, content });
      // Refetch appeal to get updated messages
      await fetchAppeal();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleRating = async (value: number) => {
    try {
      await appealsApi.rate(appealId, value);
      setRating(value);
      toast.success("Спасибо за вашу оценку!");
      await fetchAppeal();
    } catch (error) {
      console.error("Error rating appeal:", error);
      toast.error("Не удалось сохранить оценку");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!appeal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t("notFound")}</p>
        <Button onClick={() => router.back()} className="mt-4">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const canRate =
    appeal.status === "resolved" && !appeal.satisfaction_rating;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {tCommon("back")}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appeal Info */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {appeal.title || "Обращение #" + appeal.id.substring(0, 8)}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColors[appeal.status]}>
                    {tStatus(appeal.status)}
                  </Badge>
                  {appeal.priority && priorityIcons[appeal.priority] && (
                    <Badge
                      className={`${priorityColors[appeal.priority]} flex items-center gap-1`}
                    >
                      {(() => {
                        const { icon: Icon } = priorityIcons[appeal.priority];
                        return <Icon className="w-3 h-3" />;
                      })()}
                      <span>{priorityLabels[appeal.priority]}</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-6 whitespace-pre-wrap">
              {appeal.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <div>
                  <span className="font-medium">{t("createdLabel")}</span>{" "}
                  {format(new Date(appeal.created_at), "dd MMMM yyyy, HH:mm", {
                    locale: ru,
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="w-4 h-4" />
                <div>
                  <span className="font-medium">{t("categoryLabel")}</span>{" "}
                  {tCategory(appeal.category)}
                </div>
              </div>
              {appeal.responded_at && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <div>
                    <span className="font-medium">
                      {t("firstResponseLabel")}
                    </span>{" "}
                    {format(
                      new Date(appeal.responded_at),
                      "dd MMMM yyyy, HH:mm",
                      {
                        locale: ru,
                      },
                    )}
                  </div>
                </div>
              )}
              {appeal.closed_at && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <div>
                    <span className="font-medium">{t("closedLabel")}</span>{" "}
                    {format(new Date(appeal.closed_at), "dd MMMM yyyy, HH:mm", {
                      locale: ru,
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Messages */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("messages")}
            </h2>

            <AppealChatBox
              messages={appeal.dialogue_messages || []}
              currentUserType="citizen"
              citizenName={appeal.citizen?.user?.full_name}
              deputyName={appeal.deputy?.user?.full_name}
            />

            {appeal.status !== 'resolved' && appeal.status !== 'rejected' && (
              <div className="mt-4">
                <MessageInput
                  onSend={handleSendMessage}
                  disabled={addMessage.isPending}
                  maxMessages={10}
                  currentMessageCount={appeal.message_count || 0}
                />
              </div>
            )}
          </Card>

          {/* Rating */}
          {canRate && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {t("rateQuality")}
              </h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRating(value)}
                    className="p-2 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        rating && rating >= value
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </Card>
          )}

          {appeal.satisfaction_rating && (
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">
                  {t("yourRating", { rating: appeal.satisfaction_rating })}
                </span>
              </div>
            </Card>
          )}

          {/* Activity Log */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t("history")}
            </h3>
            <div className="space-y-3">
              {/* Created */}
              <div className="flex gap-3 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {t("appealCreated")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(
                      new Date(appeal.created_at),
                      "dd MMMM yyyy, HH:mm",
                      {
                        locale: ru,
                      },
                    )}
                  </p>
                </div>
              </div>

              {/* First Response */}
              {appeal.responded_at && (
                <div className="flex gap-3 pb-3 border-b border-gray-200">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {t("deputyResponded")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(
                        new Date(appeal.responded_at),
                        "dd MMMM yyyy, HH:mm",
                        {
                          locale: ru,
                        },
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Status changes */}
              {appeal.status !== "pending" && (
                <div className="flex gap-3 pb-3 border-b border-gray-200">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {t("statusChanged")} &quot;{tStatus(appeal.status)}
                      &quot;
                    </p>
                    <p className="text-xs text-gray-500">
                      {appeal.responded_at
                        ? format(
                            new Date(appeal.responded_at),
                            "dd MMMM yyyy, HH:mm",
                            {
                              locale: ru,
                            },
                          )
                        : t("recently")}
                    </p>
                  </div>
                </div>
              )}

              {/* Closed */}
              {appeal.closed_at && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {t("appealClosed")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(
                        new Date(appeal.closed_at),
                        "dd MMMM yyyy, HH:mm",
                        {
                          locale: ru,
                        },
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Rating submitted */}
              {appeal.satisfaction_rating && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {t("qualityRating", { rating: appeal.satisfaction_rating })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appeal.closed_at
                        ? format(
                            new Date(appeal.closed_at),
                            "dd MMMM yyyy, HH:mm",
                            {
                              locale: ru,
                            },
                          )
                        : t("recently")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deputy Info */}
          {appeal.deputy?.user?.full_name && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                {t("yourDeputy")}
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">
                  {appeal.deputy?.user?.full_name}
                </p>
                {appeal.deputy?.district && (
                  <p className="text-gray-600">
                    {t("district")} {appeal.deputy.district}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Statistics */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t("information")}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("messageCount")}</span>
                <span className="font-medium">
                  {appeal.message_count || 0} / 10
                </span>
              </div>
              {appeal.responded_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("firstResponseLabel")}</span>
                  <span className="font-medium">
                    {format(new Date(appeal.responded_at), "dd.MM.yyyy", {
                      locale: ru,
                    })}
                  </span>
                </div>
              )}
              {appeal.closed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("closedLabel")}</span>
                  <span className="font-medium">
                    {format(new Date(appeal.closed_at), "dd.MM.yyyy", {
                      locale: ru,
                    })}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
