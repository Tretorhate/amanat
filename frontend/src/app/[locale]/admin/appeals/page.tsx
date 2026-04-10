'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { appealsApi } from '@/lib/api/appeals';
import { Appeal, AppealStatus, AppealCategory } from '@/types/appeal';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};


const priorityIcons = {
  low: { icon: CheckCircle, color: 'text-green-600' },
  normal: { icon: AlertCircle, color: 'text-yellow-600' },
  high: { icon: AlertTriangle, color: 'text-orange-600' },
  urgent: { icon: XCircle, color: 'text-red-600' },
};

export default function AdminAppealsPage() {
  const router = useRouter();
  const t = useTranslations('admin.appeals');
  const tAdmin = useTranslations('admin');
  const tStatus = useTranslations('appeals.status');
  const tCategory = useTranslations('appeals.category');
  const tPriority = useTranslations('appeals.priority');
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppealStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<AppealCategory | 'all'>(
    'all'
  );
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedAppeals, setSelectedAppeals] = useState<Set<string>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    appealId: '',
    isBulk: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 15;

  const fetchAppeals = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const response = await appealsApi.getAll(params);
      setAppeals(response.data.results);
    } catch (error) {
      console.error('Error fetching appeals:', error);
      toast.error(t('toasts.loadError'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, t]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const filteredAppeals = useMemo(() => {
    return appeals.filter((appeal) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        appeal.title?.toLowerCase().includes(searchLower) ||
        appeal.description.toLowerCase().includes(searchLower) ||
        appeal.citizen?.user?.full_name?.toLowerCase().includes(searchLower) ||
        appeal.deputy?.user?.full_name?.toLowerCase().includes(searchLower)
      );
    });
  }, [appeals, search]);

  const stats = useMemo(() => {
    return {
      total: filteredAppeals.length,
      pending: filteredAppeals.filter((a) => a.status === 'pending').length,
      inProgress: filteredAppeals.filter((a) => a.status === 'in_progress')
        .length,
      resolved: filteredAppeals.filter((a) => a.status === 'resolved').length,
      selected: selectedAppeals.size,
    };
  }, [filteredAppeals, selectedAppeals]);

  // Pagination
  const totalPages = Math.ceil(filteredAppeals.length / itemsPerPage);
  const paginatedAppeals = filteredAppeals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, priorityFilter, search]);

  const toggleSelectAll = () => {
    if (selectedAppeals.size === paginatedAppeals.length) {
      setSelectedAppeals(new Set());
    } else {
      setSelectedAppeals(new Set(paginatedAppeals.map((a) => a.id)));
    }
  };

  const toggleSelectAppeal = (id: string) => {
    const newSelected = new Set(selectedAppeals);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAppeals(newSelected);
  };

  const handleBulkExport = () => {
    if (selectedAppeals.size === 0) {
      toast.error(t('selectForExport'));
      return;
    }
    toast.success(t('toasts.exportStart', { count: selectedAppeals.size }));
    // TODO: Implement export functionality
  };


  const handleBulkStatusChange = (newStatus: AppealStatus) => {
    if (selectedAppeals.size === 0) {
      toast.error(t('selectNone'));
      return;
    }
    toast.success(
      t('toasts.statusUpdateSuccess', { count: selectedAppeals.size, status: tStatus(newStatus) })
    );
    setSelectedAppeals(new Set());
    // TODO: Implement bulk status change
  };

  const handleDeleteClick = (id: string) => {
    setDeleteModal({
      isOpen: true,
      appealId: id,
      isBulk: false,
    });
  };

  const handleBulkDeleteClick = () => {
    if (selectedAppeals.size === 0) {
      toast.error(t('selectForDelete'));
      return;
    }
    setDeleteModal({
      isOpen: true,
      appealId: '',
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);

      if (deleteModal.isBulk) {
        // Bulk delete
        const deletePromises = Array.from(selectedAppeals).map((id) =>
          appealsApi.delete(id)
        );
        await Promise.all(deletePromises);
        toast.success(t('toasts.deleteSuccess', { count: selectedAppeals.size }));
        setSelectedAppeals(new Set());
      } else {
        // Single delete
        await appealsApi.delete(deleteModal.appealId);
        toast.success(t('toasts.deleteSuccess', { count: 1 }));
      }

      setDeleteModal({ isOpen: false, appealId: '', isBulk: false });
      fetchAppeals();
    } catch (error) {
      console.error('Error deleting appeal:', error);
      toast.error(t('toasts.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, appealId: '', isBulk: false });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('foundCount')}: {filteredAppeals.length} | {t('selectedCount')}: {selectedAppeals.size}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAppeals}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('refresh')}
          </Button>
          <Button variant="outline" onClick={handleBulkExport}>
            <Download className="w-4 h-4 mr-2" />
            {t('export')} {selectedAppeals.size > 0 && `(${selectedAppeals.size})`}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">{tStatus('all')}</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{tStatus('pending')}</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pending}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{tStatus('in_progress')}</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.inProgress}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{tStatus('resolved')}</div>
          <div className="text-2xl font-bold text-green-600">
            {stats.resolved}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('filters.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as AppealStatus | 'all')
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
              <SelectItem value="pending">{tStatus('pending')}</SelectItem>
              <SelectItem value="in_progress">{tStatus('in_progress')}</SelectItem>
              <SelectItem value="resolved">{tStatus('resolved')}</SelectItem>
              <SelectItem value="rejected">{tStatus('rejected')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onValueChange={(value) =>
              setCategoryFilter(value as AppealCategory | 'all')
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
              <SelectItem value="infrastructure">{tCategory('infrastructure')}</SelectItem>
              <SelectItem value="safety">{tCategory('safety')}</SelectItem>
              <SelectItem value="healthcare">{tCategory('healthcare')}</SelectItem>
              <SelectItem value="education">{tCategory('education')}</SelectItem>
              <SelectItem value="environment">{tCategory('environment')}</SelectItem>
              <SelectItem value="transport">{tCategory('transport')}</SelectItem>
              <SelectItem value="housing">{tCategory('housing')}</SelectItem>
              <SelectItem value="utilities">{tCategory('utilities')}</SelectItem>
              <SelectItem value="social_services">{tCategory('social_services')}</SelectItem>
              <SelectItem value="other">{tCategory('other')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allPriorities')}</SelectItem>
              <SelectItem value="low">{tPriority('low')}</SelectItem>
              <SelectItem value="normal">{tPriority('normal')}</SelectItem>
              <SelectItem value="high">{tPriority('high')}</SelectItem>
              <SelectItem value="urgent">{tPriority('urgent')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedAppeals.size > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              {t('bulkActions.selected', { count: selectedAppeals.size })}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('bulkActions.changeStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">→ {tStatus('pending')}</SelectItem>
                  <SelectItem value="in_progress">→ {tStatus('in_progress')}</SelectItem>
                  <SelectItem value="resolved">→ {tStatus('resolved')}</SelectItem>
                  <SelectItem value="rejected">→ {tStatus('rejected')}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
                <Download className="w-4 h-4 mr-2" />
                {t('export')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDeleteClick}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('bulkActions.delete')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Appeals Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-3 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {selectedAppeals.size === paginatedAppeals.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {t('table.headers.title')}
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {t('table.headers.citizen')}
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {t('table.headers.deputy')}
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {t('table.headers.category')}
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {t('table.headers.status')}
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {t('table.headers.priority')}
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {t('table.headers.created')}
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {t('table.headers.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAppeals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-12 text-center">
                    <p className="text-gray-600">{t('emptyState')}</p>
                  </td>
                </tr>
              ) : (
                paginatedAppeals.map((appeal) => (
                  <tr
                    key={appeal.id}
                    className={`hover:bg-gray-50 transition ${
                      selectedAppeals.has(appeal.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-2 py-3">
                      <button
                        onClick={() => toggleSelectAppeal(appeal.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {selectedAppeals.has(appeal.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-2 py-3">
                      <div className="max-w-[120px]">
                        <div className="font-medium text-gray-900 truncate text-xs">
                          {appeal.title ||
                            appeal.description.substring(0, 20) + '...'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900 truncate max-w-[100px]">
                        {appeal.citizen?.user?.full_name || t('notSpecified')}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900 truncate max-w-[100px]">
                        {appeal.deputy?.user?.full_name || tAdmin('notAssigned')}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-700 whitespace-nowrap">
                        {tCategory(appeal.category as "infrastructure" | "safety" | "healthcare" | "education" | "environment" | "transport" | "housing" | "utilities" | "social_services" | "other")?.substring(0, 6)}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <Badge className={`${statusColors[appeal.status]} text-xs`}>
                        {tStatus(appeal.status as "pending" | "in_progress" | "resolved" | "closed" | "rejected")}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                        {appeal.priority && priorityIcons[appeal.priority] ? (
                          <>
                            {(() => {
                              const { icon: Icon, color } = priorityIcons[appeal.priority];
                              return <Icon className={`w-4 h-4 ${color}`} />;
                            })()}
                            <span>{tPriority(appeal.priority as "low" | "normal" | "high" | "urgent")?.substring(0, 6)}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span>{tPriority("normal")?.substring(0, 3)}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900 whitespace-nowrap">
                        {format(new Date(appeal.created_at), 'dd.MM', {
                          locale: ru,
                        })}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            router.push(`/admin/appeals/${appeal.id}`)
                          }
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(appeal.id)}
                        >
                          <Trash2 className="w-3 h-3" />
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
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {t('pagination.showing', {
                showing: `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredAppeals.length)} / ${filteredAppeals.length}`,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                {t('pagination.previous')}
              </Button>
              <span className="px-4 py-2 text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                {t('pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        itemCount={deleteModal.isBulk ? selectedAppeals.size : 1}
        itemLabel={deleteModal.isBulk ? t('deleteItemLabelPlural') : t('deleteItemLabel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
