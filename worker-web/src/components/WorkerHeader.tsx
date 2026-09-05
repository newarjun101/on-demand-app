import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogOut, LayoutDashboard, Inbox, Briefcase, MessageCircle, User as UserIcon, Wrench, Settings, Bell, BellOff } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Badge } from '@/components/UI';
import { useSocketEvent } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { workerApi } from '@/api/endpoints';
import toast from 'react-hot-toast';

export function WorkerHeader() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const statusMut = useMutation({
    mutationFn: (online: boolean) => workerApi.setStatus(online, online),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Status updated');
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
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/requests', label: 'Requests', icon: Inbox },
    { to: '/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/messages', label: 'Messages', icon: MessageCircle },
  ];

  const isOnline = profile?.isOnline ?? false;
  const isAccepting = profile?.isAcceptingJobs ?? false;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <Wrench size={18} />
            </div>
            <div>
              <div className="font-bold text-gray-900 leading-tight">Worker Pro</div>
              <div className="text-[10px] text-gray-500 leading-tight">Manage your jobs</div>
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => statusMut.mutate(!isOnline)}
              className={clsx(
                'hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition',
                isOnline && isAccepting ? 'bg-brand-100 text-brand-800 hover:bg-brand-200'
                  : isOnline ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
              title={isOnline ? 'Click to go offline' : 'Click to go online'}
            >
              {isOnline ? <Bell size={14} /> : <BellOff size={14} />}
              {isOnline && isAccepting ? 'Accepting jobs' : isOnline ? 'Online (paused)' : 'Offline'}
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
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><UserIcon size={16} />Profile</Link>
                  <Link to="/services" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><Wrench size={16} />My services</Link>
                  <Link to="/availability" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><Settings size={16} />Availability</Link>
                  <Link to="/earnings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">Earnings</Link>
                  <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">Settings</Link>
                  <hr className="my-1" />
                  <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-red-600"><LogOut size={16} />Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-1">
        {navItems.map((it) => (
          <NavLink key={it.to} to={it.to} className={({ isActive }) => clsx('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs', isActive ? 'text-brand-700' : 'text-gray-500')}>
            <it.icon size={20} />
            {it.label}
          </NavLink>
        ))}
        <NavLink to="/profile" className={({ isActive }) => clsx('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs', isActive ? 'text-brand-700' : 'text-gray-500')}>
          <UserIcon size={20} />
          Profile
        </NavLink>
      </nav>
    </header>
  );
}