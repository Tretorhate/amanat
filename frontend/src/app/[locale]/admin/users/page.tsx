"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import api from "@/lib/api/axios";
import { User } from "@/types/user";
import { PaginatedResponse } from "@/types/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  UserFormModal,
  type UserFormData,
} from "@/components/admin/UserFormModal";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { UserBulkImport } from "@/components/admin/UserBulkImport";
import {
  Search,
  UserPlus,
  Shield,
  User as UserIcon,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function AdminUsersPage() {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("common");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: "",
    isBulk: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<PaginatedResponse<User>>("/accounts/admin/users/");
      setUsers(response.data.results);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(t("toasts.loadError"));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (userId: string) => {
    try {
      setTogglingId(userId);
      const response = await api.post(
        `/accounts/admin/toggle-active/${userId}/`,
      );
      const updatedUser = response.data;
      setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
      toast.success(
        updatedUser.is_active
          ? t("toasts.activated")
          : t("toasts.deactivated"),
      );
    } catch (error) {
      console.error("Error toggling user status:", error);
      if (axios.isAxiosError(error) && error.response?.data) {
        toast.error(
          error.response.data.detail ||
            t("toasts.toggleError"),
        );
      } else {
        toast.error(t("toasts.toggleError"));
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteClick = (userId: string) => {
    setDeleteModal({
      isOpen: true,
      userId: userId,
      isBulk: false,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);

      if (deleteModal.isBulk) {
        // Bulk delete logic could be added here if needed
        toast.success("Массовое удаление пользователей");
      } else {
        // Single delete
        await api.delete(`/accounts/admin/users/${deleteModal.userId}/`);
        setUsers(users.filter((u) => u.id !== deleteModal.userId));
        toast.success("Пользователь удален");
      }

      setDeleteModal({ isOpen: false, userId: "", isBulk: false });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Ошибка при удалении пользователя");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, userId: "", isBulk: false });
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (formData: UserFormData) => {
    setSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user
        const response = await api.put(
          `/accounts/admin/users/${editingUser.id}/`,
          formData,
        );
        const updatedUser = response.data;
        setUsers(users.map((u) => (u.id === editingUser.id ? updatedUser : u)));
        toast.success(t("toasts.updateSuccess"));
      } else {
        // Create new user
        const response = await api.post("/accounts/admin/users/", formData);
        const newUser = response.data;
        setUsers([newUser, ...users]);
        toast.success(t("toasts.createSuccess"));
      }
    } catch (error) {
      console.error("Error submitting user form:", error);
      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data as Record<string, unknown>;
        if (typeof errorData.detail === "string") {
          toast.error(errorData.detail);
        } else {
          // Show field-level errors (e.g. phone uniqueness)
          const fieldErrors = Object.entries(errorData)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
            .join("; ");
          toast.error(fieldErrors || t("toasts.saveError"));
        }
      } else {
        toast.error(t("toasts.saveError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (
      roleFilter !== "all" &&
      user.role !== roleFilter &&
      user.user_type !== roleFilter
    ) {
      return false;
    }
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleColor = (user: User) => {
    if (user.role === "admin" || user.is_staff)
      return "bg-purple-100 text-purple-800";
    if (user.role === "deputy" || user.user_type === "deputy")
      return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  const getRoleLabel = (user: User) => {
    if (user.role === "admin" || user.is_staff) return tCommon("roles.administrator");
    if (user.role === "deputy" || user.user_type === "deputy") return tCommon("roles.deputy");
    return tCommon("roles.citizen");
  };

  const getRoleIcon = (user: User) => {
    if (user.role === "admin" || user.is_staff)
      return <Shield className="w-4 h-4" />;
    return <UserIcon className="w-4 h-4" />;
  };

  const getConstituencyLabel = (user: User) => {
    if (user.role === "admin" || user.is_staff) return "—";
    return user.constituency_name || "—";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statsCounts = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin" || u.is_staff).length,
    deputies: users.filter(
      (u) => u.role === "deputy" || u.user_type === "deputy",
    ).length,
    citizens: users.filter(
      (u) =>
        !(u.role === "admin" || u.is_staff) &&
        !(u.role === "deputy" || u.user_type === "deputy"),
    ).length,
    active: users.filter((u) => u.is_active).length,
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      {/* Form Modal */}
      <UserFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialUser={editingUser}
        isLoading={submitting}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("title")}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("totalUsers")}: {filteredUsers.length}
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          <UserPlus className="w-4 h-4 mr-2" />
          {t("addUserButton")}
        </Button>
      </div>

      {/* Bulk Import Section */}
      <div className="mb-8">
        <UserBulkImport onImportComplete={fetchUsers} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t("stats.total")}</div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {statsCounts.total}
          </p>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t("stats.admins")}</div>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {statsCounts.admins}
          </p>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t("stats.deputies")}</div>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {statsCounts.deputies}
          </p>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t("stats.citizens")}</div>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {statsCounts.citizens}
          </p>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t("stats.active")}</div>
          <p className="text-2xl font-bold text-orange-900 mt-1">
            {statsCounts.active}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t("roleFilter.allRoles")}</option>
              <option value="admin">{t("roleFilter.admins")}</option>
              <option value="deputy">{t("roleFilter.deputies")}</option>
              <option value="citizen">{t("roleFilter.citizens")}</option>
            </select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={fetchUsers}
            disabled={loading}
            className="w-full md:w-auto"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {tCommon("refresh")}
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  {t("table.headers.user")}
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Телефон
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Telegram ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  {t("table.headers.role")}
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Округ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  {t("table.headers.status")}
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  {t("table.headers.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-600"
                  >
                    {t("notFound")}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.full_name?.charAt(0) ||
                              user.username.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.full_name || user.username}
                          </p>
                          <p className="text-sm text-gray-600">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                      {user.phone || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getRoleColor(user)}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(user)}
                          {getRoleLabel(user)}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {getConstituencyLabel(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit cursor-pointer ${
                          user.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                        onClick={() => handleToggleActive(user.id)}
                      >
                        {user.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            {t("status.active")}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            {t("status.inactive")}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          disabled={togglingId === user.id}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(user.id)}
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
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        itemCount={
          deleteModal.isBulk
            ? users.filter((u) => u.id !== deleteModal.userId).length
            : 1
        }
        itemLabel={deleteModal.isBulk ? t("deleteItemLabelPlural") : t("deleteItemLabel")}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
