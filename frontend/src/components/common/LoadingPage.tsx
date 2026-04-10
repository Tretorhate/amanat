import { LoadingSpinner } from './LoadingSpinner';

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = 'Загрузка...' }: LoadingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
