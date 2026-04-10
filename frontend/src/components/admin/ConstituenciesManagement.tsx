"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Constituency, CreateConstituencyData } from "@/types/deputy";
import { deputiesApi } from "@/lib/api/deputies";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConstituencyFormModal } from "@/components/deputy/ConstituencyFormModal";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import {
  MapPin,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface ConstituenciesManagementProps {
  initialConstituencies: Constituency[];
}

const ITEMS_PER_PAGE = 10;

export function ConstituenciesManagement({
  initialConstituencies,
}: ConstituenciesManagementProps) {
  const t = useTranslations("deputy.constituencies");
  const [constituencies, setConstituencies] = useState<Constituency[]>(
    Array.isArray(initialConstituencies) ? initialConstituencies : [],
  );
  const [loading, setLoading] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingConstituency, setEditingConstituency] =
    useState<Constituency | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    constituencyId: "",
    constituencyName: "",
    isBulk: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchConstituencies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await deputiesApi.getConstituencies();
      setConstituencies(response.data.results);
      setCurrentPage(1);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error fetching constituencies:", error);
      toast.error(t("errorLoadingConstituencies"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchConstituencies();
  }, [fetchConstituencies]);

  const handleCreate = () => {
    setEditingConstituency(null);
    setFormModalOpen(true);
  };

  const handleEdit = (constituency: Constituency) => {
    setEditingConstituency(constituency);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (formData: CreateConstituencyData) => {
    setSubmitting(true);

    try {
      const apiData = {
        name: formData.name,
        region: formData.region,
        district: formData.district,
        description: formData.description || "",
      };

      if (editingConstituency) {
        const response = await deputiesApi.updateConstituency(
          editingConstituency.id,
          apiData as Partial<Omit<Constituency, "id" | "created_at">>,
        );
        setConstituencies(
          constituencies.map((c) =>
            c.id === editingConstituency.id ? response.data : c,
          ),
        );
        toast.success(t("updated"));
      } else {
        const response = await deputiesApi.createConstituency(
          apiData as Omit<Constituency, "id" | "created_at">,
        );
        setConstituencies([response.data, ...constituencies]);
        toast.success(t("created"));
      }
      setFormModalOpen(false);
      await fetchConstituencies();
    } catch (error) {
      console.error("Error submitting constituency form:", error);
      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data as Record<string, unknown>;
        const errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : t("errorSaving");
        toast.error(errorMessage);
      } else {
        toast.error(t("errorSaving"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      constituencyId: id,
      constituencyName: name,
      isBulk: false,
    });
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDeleteModal({
      isOpen: true,
      constituencyId: "",
      constituencyName: "",
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);

      if (deleteModal.isBulk) {
        const deletePromises = Array.from(selectedIds).map((id) =>
          deputiesApi.deleteConstituency(id),
        );
        await Promise.all(deletePromises);
        setConstituencies(constituencies.filter((c) => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
        toast.success(t("deletedBulk", { count: selectedIds.size }));
      } else {
        await deputiesApi.deleteConstituency(deleteModal.constituencyId);
        setConstituencies(
          constituencies.filter((c) => c.id !== deleteModal.constituencyId),
        );
        setSelectedIds(
          (prev) =>
            new Set(
              Array.from(prev).filter(
                (id) => id !== deleteModal.constituencyId,
              ),
            ),
        );
        toast.success(t("deleted"));
      }

      setDeleteModal({
        isOpen: false,
        constituencyId: "",
        constituencyName: "",
        isBulk: false,
      });
    } catch (error) {
      console.error("Error deleting constituency:", error);
      toast.error(t("errorDeleting"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({
      isOpen: false,
      constituencyId: "",
      constituencyName: "",
      isBulk: false,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const paginatedIds = new Set(
        filteredPaginatedConstituencies.map((c) => c.id),
      );
      setSelectedIds(paginatedIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Filter constituencies
  const filteredConstituencies = constituencies.filter((constituency) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      constituency.name.toLowerCase().includes(searchLower) ||
      constituency.region.toLowerCase().includes(searchLower) ||
      constituency.district.toLowerCase().includes(searchLower) ||
      (constituency.description || "").toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredConstituencies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const filteredPaginatedConstituencies = filteredConstituencies.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const isAllPaginatedSelected =
    filteredPaginatedConstituencies.length > 0 &&
    filteredPaginatedConstituencies.every((c) => selectedIds.has(c.id));

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        endPage = maxVisible - 1;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - maxVisible + 2;
      }

      if (startPage > 2) {
        pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      {/* Form Modal */}
      <ConstituencyFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialConstituency={editingConstituency}
        isLoading={submitting}
        isAdmin={true}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        itemCount={deleteModal.isBulk ? selectedIds.size : 1}
        itemLabel={deleteModal.isBulk ? "округов" : "округа"}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Избирательные округа
          </h1>
          <p className="text-gray-600 mt-1">
            Всего округов: {filteredConstituencies.length}
            {selectedIds.size > 0 && (
              <span className="ml-2 text-blue-600">
                (Выбрано: {selectedIds.size})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              onClick={handleBulkDeleteClick}
              variant="destructive"
              disabled={loading || isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить ({selectedIds.size})
            </Button>
          )}
          <Button onClick={handleCreate} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить округ
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="p-4">
        <div className="text-sm text-gray-600">Всего округов</div>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {constituencies.length}
        </p>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск по названию, региону, району..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={fetchConstituencies}
            disabled={loading}
            className="w-full md:w-auto"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Обновить
          </Button>
        </div>
      </Card>

      {/* Table Section */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-12">
                  <input
                    type="checkbox"
                    checked={isAllPaginatedSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Название
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Регион
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Район
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Описание
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Статус
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Дата создания
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredConstituencies.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-600"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <MapPin className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          Избирательные округа не найдены
                        </p>
                        <p className="text-sm mt-1">
                          Попробуйте изменить фильтры или добавить новый округ
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPaginatedConstituencies.map((constituency) => (
                  <tr
                    key={constituency.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(constituency.id)}
                        onChange={(e) =>
                          handleSelectOne(constituency.id, e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {constituency.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {constituency.region}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {constituency.district}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {constituency.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        constituency.is_active !== false
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {constituency.is_active !== false ? "Активен" : "Неактивен"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(constituency.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(constituency)}
                          disabled={isDeleting}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteClick(
                              constituency.id,
                              constituency.name,
                            )
                          }
                          disabled={isDeleting}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 hover:text-red-700" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {generatePageNumbers().map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === "number" && setCurrentPage(page)}
                disabled={typeof page === "string"}
                className={`h-8 min-w-8 px-2 rounded text-sm font-medium transition ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : typeof page === "number"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-50 text-gray-400 cursor-default"
                }`}
              >
                {page}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
