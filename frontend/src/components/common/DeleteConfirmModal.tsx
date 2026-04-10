"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemCount: number;
  itemLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  itemCount,
  itemLabel,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmModalProps) {
  const t = useTranslations("common.deleteConfirm");
  const [inputValue, setInputValue] = useState("");

  if (!isOpen) return null;

  const confirmKeyword = t("confirmKeyword");
  const isConfirmed = inputValue.toUpperCase() === confirmKeyword;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setInputValue("");
    }
  };

  const handleCancel = () => {
    setInputValue("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t("title")}
              </h2>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            {t("message")}{" "}
            <span className="font-semibold">
              {itemCount === 1 ? "1" : itemCount} {itemLabel}
              {itemCount > 1 ? "й" : ""}?
            </span>
          </p>
          <p className="text-sm text-gray-600">
            {t("warning")}
          </p>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("confirmLabel")} <span className="font-bold">{t("confirmKeyword")}</span> {t("confirmInstruction")}
          </label>
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t("confirmPlaceholder")}
            disabled={isLoading}
            className="uppercase"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
            variant="destructive"
            className="flex-1"
          >
            {isLoading ? t("deletingButton") : t("deleteButton")}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            {t("cancelButton")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
