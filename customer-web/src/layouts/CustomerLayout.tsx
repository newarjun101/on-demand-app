import { Outlet } from 'react-router-dom';
import { CustomerHeader } from '@/components/CustomerHeader';

export function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <CustomerHeader />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <footer className="hidden md:block bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-900 mb-2">Local Services Marketplace</div>
            Connecting customers with trusted local workers across Myanmar.
          </div>
          <div className="text-right">
            <div>© {new Date().getFullYear()} Local Services</div>
            <div>Currency: MMK</div>
          </div>
        </div>
      </footer>
    </div>
  );
}