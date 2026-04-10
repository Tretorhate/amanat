"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Constituency, CreateConstituencyData } from "@/types/deputy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ConstituencyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateConstituencyData) => Promise<void>;
  initialConstituency?: Constituency | null;
  isLoading?: boolean;
  isAdmin?: boolean;
}

interface ConstituencyFormData {
  name: string;
  region: string;
  district: string;
  description: string;
}

export function ConstituencyFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialConstituency,
  isLoading = false,
}: ConstituencyFormModalProps) {
  const t = useTranslations("deputy.constituencyForm");

  const [formData, setFormData] = useState<ConstituencyFormData>({
    name: "",
    region: "",
    district: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialConstituency) {
      setFormData({
        name: initialConstituency.name,
        region: initialConstituency.region,
        district: initialConstituency.district,
        description: initialConstituency.description || "",
      });
    } else {
      setFormData({
        name: "",
        region: "",
        district: "",
        description: "",
      });
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConstituency, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("errors.nameRequired");
    } else if (formData.name.trim().length > 200) {
      newErrors.name = t("errors.nameMaxLength");
    }

    if (!formData.region.trim()) {
      newErrors.region = t("errors.regionRequired");
    } else if (formData.region.trim().length > 100) {
      newErrors.region = t("errors.regionMaxLength");
    }

    if (!formData.district.trim()) {
      newErrors.district = t("errors.districtRequired");
    } else if (formData.district.trim().length > 100) {
      newErrors.district = t("errors.districtMaxLength");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const submitData: CreateConstituencyData = {
        name: formData.name.trim(),
        region: formData.region.trim(),
        district: formData.district.trim(),
        description: formData.description.trim() || undefined,
      };

      await onSubmit(submitData);
      setFormData({
        name: "",
        region: "",
        district: "",
        description: "",
      });
      onClose();
    } catch {
      // Error handling is done in parent component
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialConstituency
              ? t("editTitle")
              : t("createTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t("namePlaceholder")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Region */}
          <div>
            <Label htmlFor="region">{t("regionLabel")}</Label>
            <Input
              id="region"
              value={formData.region}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
              placeholder={t("regionPlaceholder")}
              className={errors.region ? "border-red-500" : ""}
            />
            {errors.region && (
              <p className="text-red-500 text-sm mt-1">{errors.region}</p>
            )}
          </div>

          {/* District */}
          <div>
            <Label htmlFor="district">{t("districtLabel")}</Label>
            <Input
              id="district"
              value={formData.district}
              onChange={(e) =>
                setFormData({ ...formData, district: e.target.value })
              }
              placeholder={t("districtPlaceholder")}
              className={errors.district ? "border-red-500" : ""}
            />
            {errors.district && (
              <p className="text-red-500 text-sm mt-1">{errors.district}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">{t("descriptionLabel") || "Описание"}</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t("descriptionPlaceholder") || "Описание округа (необязательно)"}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("cancelButton")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("savingButton")}
              </>
            ) : (
              t("saveButton")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
