"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCreateAppeal } from "@/lib/hooks/useAppeals";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export default function NewAppealPage() {
  const router = useRouter();
  const t = useTranslations("appeals.create");
  const tCommon = useTranslations("common");
  const createAppeal = useCreateAppeal();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error(t("subjectPlaceholder"));
      return;
    }

    if (!formData.description.trim()) {
      toast.error(t("descriptionPlaceholder"));
      return;
    }

    try {
      await createAppeal.mutateAsync(formData);
      toast.success(t("success"));
      router.push("/citizen/dashboard");
    } catch (error) {
      console.error("Error creating appeal:", error);
      const errorMessage = error instanceof Error ? error.message : t("error");
      toast.error(errorMessage);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {tCommon("back")}
      </Button>

      {/* Form Card */}
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("title")}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("subject")} <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder={t("subjectPlaceholder")}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length} / 200
            </p>
          </div>

          {/* Description Field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("description")} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t("descriptionPlaceholder")}
              className="w-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length} / 2000
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              {t("infoBoxTitle")}
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {t("infoAutomatic")}</li>
              <li>• {t("infoCategory")}</li>
              <li>• {t("infoMessages")}</li>
              <li>• {t("infoNotification")}</li>
              <li>• {t("infoTimeframe")}</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={
                createAppeal.isPending ||
                !formData.title.trim() ||
                !formData.description.trim()
              }
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
            >
              {createAppeal.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("submit")}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {t("submit")}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createAppeal.isPending}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
