"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { citizensApi } from "@/lib/api/citizens";
import {
  CitizenDocument,
  CreateDocumentDto,
  DocumentType,
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_TYPE_LABELS,
} from "@/types/citizen";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  Calendar,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { LoadingPage } from "@/components/common/LoadingPage";

export default function CitizenDocumentsPage() {
  const router = useRouter();
  const t = useTranslations("appeals.documents");
  const tCommon = useTranslations("common");
  const [documents, setDocuments] = useState<CitizenDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [formData, setFormData] = useState<CreateDocumentDto>({
    document_type: "national_id",
    document_number: "",
    issue_date: "",
    expiry_date: "",
    issued_by: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await citizensApi.getDocuments();
      // Backend returns array of documents directly
      setDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error(t("errorLoadingDocuments"));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.document_number.trim()) {
      newErrors.document_number = t("errorDocumentNumber");
    }

    if (!formData.issue_date) {
      newErrors.issue_date = t("errorIssueDate");
    }

    if (!formData.issued_by.trim()) {
      newErrors.issued_by = t("errorIssuedBy");
    }

    if (!selectedFile) {
      newErrors.file = t("errorFile");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("errorFormValidation"));
      return;
    }

    setUploading(true);

    try {
      await citizensApi.createDocument({
        ...formData,
        file: selectedFile!,
      });

      toast.success(t("successUpload"));
      setShowUploadForm(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error("Document upload error:", error);
      toast.error(t("errorUpload"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("confirmDelete"))) {
      return;
    }

    try {
      await citizensApi.deleteDocument(id);
      toast.success(t("successDelete"));
      fetchDocuments();
    } catch (error) {
      console.error("Document delete error:", error);
      toast.error(t("errorDelete"));
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setFormData({
      document_type: "national_id",
      document_number: "",
      issue_date: "",
      expiry_date: "",
      issued_by: "",
    });
    setSelectedFile(null);
    setErrors({});
  };

  const handleChange = (field: keyof CreateDocumentDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, file: t("errorFileSize") });
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors({
          ...errors,
          file: t("errorFileType"),
        });
        return;
      }

      setSelectedFile(file);
      setErrors({ ...errors, file: "" });
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {tCommon("back")}
      </Button>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
          <p className="text-gray-600 mt-2">
            {t("pageDescription")}
          </p>
        </div>
        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("uploadButton")}
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {t("uploadFormTitle")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("documentType")} <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) =>
                    handleChange("document_type", value as DocumentType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Document Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("documentNumber")} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.document_number}
                  onChange={(e) =>
                    handleChange("document_number", e.target.value)
                  }
                  placeholder={t("documentNumberPlaceholder")}
                  className={errors.document_number ? "border-red-500" : ""}
                />
                {errors.document_number && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.document_number}
                  </p>
                )}
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("issueDate")} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => handleChange("issue_date", e.target.value)}
                  className={errors.issue_date ? "border-red-500" : ""}
                />
                {errors.issue_date && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.issue_date}
                  </p>
                )}
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("expiryDate")}
                </label>
                <Input
                  type="date"
                  value={formData.expiry_date || ""}
                  onChange={(e) => handleChange("expiry_date", e.target.value)}
                />
              </div>
            </div>

            {/* Issued By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("issuedBy")} <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.issued_by}
                onChange={(e) => handleChange("issued_by", e.target.value)}
                placeholder={t("issuedByPlaceholder")}
                className={errors.issued_by ? "border-red-500" : ""}
              />
              {errors.issued_by && (
                <p className="text-red-500 text-sm mt-1">{errors.issued_by}</p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fileLabel")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className={`flex-1 ${errors.file ? "border-red-500" : ""}`}
                />
                {selectedFile && (
                  <span className="text-sm text-gray-600">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}{" "}
                    KB)
                  </span>
                )}
              </div>
              {errors.file && (
                <p className="text-red-500 text-sm mt-1">{errors.file}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {t("uploading")}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t("uploadSubmit")}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUploadForm(false);
                  resetForm();
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("noDocuments")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("noDocumentsDesc")}
            </p>
            <Button onClick={() => setShowUploadForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("uploadFirst")}
            </Button>
          </Card>
        ) : (
          documents.map((document) => (
            <Card key={document.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {DOCUMENT_TYPE_LABELS[document.document_type]}
                      </h3>
                      <p className="text-sm text-gray-600">
                        № {document.document_number}
                      </p>
                    </div>
                    <Badge
                      className={
                        document.is_verified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {document.is_verified ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t("verified")}
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          {t("pending")}
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">{t("issueDate")}</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(document.issue_date), "dd MMM yyyy", {
                          locale: ru,
                        })}
                      </p>
                    </div>
                    {document.expiry_date && (
                      <div>
                        <p className="text-gray-600 mb-1">{t("expiryDate")}</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(
                            new Date(document.expiry_date),
                            "dd MMM yyyy",
                            { locale: ru },
                          )}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600 mb-1">{t("issuedBy")}</p>
                      <p className="font-medium text-gray-900 truncate">
                        {document.issued_by}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">{t("uploaded")}</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(document.created_at), "dd MMM yyyy", {
                          locale: ru,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {document.file && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDownload(
                          document.file!,
                          `${DOCUMENT_TYPE_LABELS[document.document_type]}_${document.document_number}.pdf`,
                        )
                      }
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(document.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
