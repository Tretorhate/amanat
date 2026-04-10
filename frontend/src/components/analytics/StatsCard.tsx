import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'yellow' | 'green' | 'purple' | 'red';
  change?: string;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
};

export function StatsCard({ title, value, icon: Icon, color = 'blue', change }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={cn('p-3 rounded-lg', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{title}</p>
          {change && (
            <p className="text-xs text-gray-500 mt-1">{change}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
