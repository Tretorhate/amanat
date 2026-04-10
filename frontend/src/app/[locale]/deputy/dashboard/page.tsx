'use client';

import { useEffect, useState } from 'react';
import { DeputyDashboard } from '@/components/deputy/DeputyDashboard';
import { appealsApi } from '@/lib/api/appeals';
import { Appeal } from '@/types/appeal';

export default function DeputyDashboardPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      const response = await appealsApi.getAll();
      setAppeals(response.data.results);
    } catch (error) {
      console.error('Error fetching appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <DeputyDashboard appeals={appeals} />;
}
