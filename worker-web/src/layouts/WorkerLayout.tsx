import { Outlet } from 'react-router-dom';
import { WorkerHeader } from '@/components/WorkerHeader';

export function WorkerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WorkerHeader />
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}