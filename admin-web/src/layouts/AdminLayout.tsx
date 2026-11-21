import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Briefcase, FileCheck, CalendarCheck, AlertCircle, FolderTree, Zap, CreditCard, BarChart3, Bell, Settings, ShieldCheck, ScrollText, LogOut, Menu, X,
} from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '@/i18n';
import { useAdminAuth } from '@/contexts/AuthContext';
import { LocaleSwitcher, Avatar, Badge } from '@/components/UI';

export function AdminLayout() {
  const { t } = useI18n();
  const { user, hasPermission, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = !sidebarOpen;

  if (!user) return <Outlet />;

  const sections: { title: string; items: { to: string; label: string; icon: any; perm?: string }[] }[] = [
    { title: 'Overview', items: [{ to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard }] },
    { title: 'People', items: [
      { to: '/users', label: t('nav.users'), icon: Users, perm: 'users:view' },
      { to: '/workers', label: t('nav.workers'), icon: Briefcase, perm: 'workers:view' },
      { to: '/kyc', label: t('nav.kyc'), icon: FileCheck, perm: 'kyc:view' },
    ] },
    { title: 'Operations', items: [
      { to: '/bookings', label: t('nav.bookings'), icon: CalendarCheck, perm: 'bookings:view' },
      { to: '/disputes', label: t('nav.disputes'), icon: AlertCircle, perm: 'disputes:view' },
    ] },
    { title: 'Catalog', items: [
      { to: '/categories', label: t('nav.categories'), icon: FolderTree, perm: 'categories:view' },
      { to: '/boost-tiers', label: t('nav.boostTiers'), icon: Zap },
      { to: '/payments', label: t('nav.payments'), icon: CreditCard, perm: 'payments:view' },
    ] },
    { title: 'Insights', items: [
      { to: '/analytics', label: t('nav.analytics'), icon: BarChart3, perm: 'analytics:view' },
      { to: '/broadcast', label: t('nav.broadcast'), icon: Bell, perm: 'notifications:broadcast' },
      { to: '/notifications', label: t('nav.notifications'), icon: Bell, perm: 'notifications:view' },
    ] },
    { title: 'System', items: [
      { to: '/roles', label: t('nav.roles'), icon: ShieldCheck, perm: 'roles:view' },
      { to: '/config', label: t('nav.config'), icon: Settings, perm: 'config:view' },
      { to: '/audit', label: t('nav.audit'), icon: ScrollText, perm: 'audit:view' },
    ] },
  ];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // Below lg the sidebar is an off-canvas drawer; from lg up it is static and collapsible.
  return (
    <div className="min-h-screen flex bg-gray-50">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <aside className={clsx('bg-gray-900 text-gray-200 flex-shrink-0 flex flex-col transition-all duration-200 fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] lg:static lg:z-auto lg:max-w-none lg:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full', collapsed && 'lg:w-16')}>
        <div className="h-16 flex items-center px-4 border-b border-gray-800">
          <ShieldCheck size={20} className="text-indigo-400 flex-shrink-0" />
          <span className={clsx('ml-2 font-bold text-white truncate', collapsed && 'lg:hidden')}>{t('common.appName')}</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => {
            const visible = section.items.filter((it) => !it.perm || hasPermission(it.perm));
            if (!visible.length) return null;
            return (
              <div key={section.title} className="mb-3">
                <div className={clsx('px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500', collapsed && 'lg:hidden')}>{section.title}</div>
                {visible.map((it) => (
                  <NavLink key={it.to} to={it.to} onClick={() => setMobileOpen(false)} className={({ isActive }) =>
                    clsx('flex items-center gap-3 px-4 py-2 text-sm transition border-l-4', isActive ? 'bg-gray-800 text-white border-indigo-400' : 'text-gray-300 hover:bg-gray-800 hover:text-white border-transparent')
                  }>
                    <it.icon size={16} className="flex-shrink-0" />
                    <span className={clsx('truncate', collapsed && 'lg:hidden')}>{it.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-gray-800 p-3 flex items-center gap-3">
          <Avatar src={user.avatarUrl} name={user.fullName} size={28} />
          <div className={clsx('flex-1 min-w-0', collapsed && 'lg:hidden')}>
            <div className="text-sm font-medium text-white truncate">{user.fullName}</div>
            <div className="flex gap-1 flex-wrap mt-0.5">{(user.roles || []).slice(0, 2).map((r) => <Badge key={r.id} color="indigo">{r.name}</Badge>)}</div>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded hover:bg-gray-100 text-gray-600" aria-label="Toggle menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:inline-flex p-1.5 rounded hover:bg-gray-100 text-gray-600" aria-label="Toggle sidebar">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <button onClick={handleLogout} aria-label={t('nav.logout')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
              <LogOut size={14} /> <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
