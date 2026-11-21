import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogOut, LayoutDashboard, Inbox, Briefcase, MessageCircle, User as UserIcon, Wrench, Settings, Bell, BellOff, Zap, BarChart3 } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Badge } from '@/components/UI';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { useI18n } from '@/i18n';
import { useSocketEvent } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { workerApi } from '@/api/endpoints';
import toast from 'react-hot-toast';

export function WorkerHeader() {
  const { user, profile, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const statusMut = useMutation({
    mutationFn: (online: boolean) => workerApi.setStatus(online, online),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(t('common.save') + ' ✓');
    },
  });

  useSocketEvent('request_received', () => {
    queryClient.invalidateQueries({ queryKey: ['request-feed'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  });
  useSocketEvent('quote_accepted', () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  });
  useSocketEvent('quote_rejected', () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  });
  useSocketEvent('booking_status_changed', () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  });

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/requests', label: t('nav.requests'), icon: Inbox },
    { to: '/jobs', label: t('nav.jobs'), icon: Briefcase },
    { to: '/messages', label: t('nav.messages'), icon: MessageCircle },
  ];

  const isOnline = profile?.isOnline ?? false;
  const isAccepting = profile?.isAcceptingJobs ?? false;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <Wrench size={18} />
            </div>
            <div>
              <div className="font-bold text-gray-900 leading-tight truncate hidden min-[420px]:block">Worker Pro</div>
              <div className="text-[10px] text-gray-500 leading-tight hidden md:block">{t('nav.dashboard')}</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  clsx('px-3 py-2 text-sm font-medium rounded-lg transition',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-100')
                }
              >
                {it.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LocaleSwitcher />
            <button
              onClick={() => statusMut.mutate(!isOnline)}
              className={clsx(
                'inline-flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-full text-sm font-medium transition',
                isOnline && isAccepting ? 'bg-brand-100 text-brand-800 hover:bg-brand-200'
                  : isOnline ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
              title={isOnline ? 'Click to go offline' : 'Click to go online'}
              aria-label={isOnline ? 'Go offline' : 'Go online'}
            >
              {isOnline ? <Bell size={14} /> : <BellOff size={14} />}
              <span className="hidden sm:inline">{isOnline && isAccepting ? t('status.acceptingJobs') : isOnline ? t('status.online') + ' (' + t('home.searchPlaceholder') + ')' : t('status.offline')}</span>
            </button>

            <Link to="/notifications" className="text-gray-500 hover:text-gray-900 relative">
              <Bell size={20} />
            </Link>

            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 pr-3"
              >
                <Avatar src={user?.avatarUrl} name={user?.fullName ?? ''} size={32} />
                <span className="hidden sm:inline text-sm font-medium text-gray-700">{user?.fullName.split(' ')[0]}</span>
              </button>
                {open && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><UserIcon size={16} />{t('nav.profile')}</Link>
                    <Link to="/services" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><Wrench size={16} />{t('nav.services')}</Link>
                    <Link to="/availability" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><Settings size={16} />{t('nav.availability')}</Link>
                    <Link to="/boost" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><Zap size={16} className="text-amber-500" />{t('nav.boost')}</Link>
                    <Link to="/analytics" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><BarChart3 size={16} />{t('nav.analytics')}</Link>
                    <Link to="/earnings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">{t('nav.earnings')}</Link>
                    <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">{t('nav.settings')}</Link>
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-red-600"><LogOut size={16} />{t('nav.logout')}</button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-1">
        {navItems.map((it) => (
          <NavLink key={it.to} to={it.to} className={({ isActive }) => clsx('flex flex-1 min-w-0 flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-xs', isActive ? 'text-brand-700' : 'text-gray-500')}>
            <it.icon size={20} />
            <span className="max-w-full truncate">{it.label}</span>
          </NavLink>
        ))}
        <NavLink to="/profile" className={({ isActive }) => clsx('flex flex-1 min-w-0 flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-xs', isActive ? 'text-brand-700' : 'text-gray-500')}>
          <UserIcon size={20} />
          <span className="max-w-full truncate">{t('nav.profile')}</span>
        </NavLink>
      </nav>
    </header>
  );
}