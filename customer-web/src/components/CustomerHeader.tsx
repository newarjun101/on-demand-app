import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Avatar } from '@/components/UI';
import { Home, Search, CalendarDays, MessageCircle, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

export function CustomerHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/services', label: 'Search', icon: Search },
    { to: '/bookings', label: 'Bookings', icon: CalendarDays },
    { to: '/messages', label: 'Messages', icon: MessageCircle },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12h 3v 9h 6v-6h 2v6h 6v-9h3z" /></svg>
            </div>
            <div>
              <div className="font-bold text-gray-900 leading-tight">Local Services</div>
              <div className="text-[10px] text-gray-500 leading-tight">Find trusted workers</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'px-3 py-2 text-sm font-medium rounded-lg transition',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-100',
                  )
                }
              >
                {it.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 pr-3"
                >
                  <Avatar src={user.avatarUrl} name={user.fullName} size={32} />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">{user.fullName.split(' ')[0]}</span>
                </button>
                {open && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><User size={16}/>Profile</Link>
                    <Link to="/favorites" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">Favorites</Link>
                    <Link to="/notifications" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">Notifications</Link>
                    <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">Settings</Link>
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-red-600"><LogOut size={16}/>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"><Button variant="ghost">Login</Button></Link>
                <Link to="/register"><Button>Sign up</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-1">
        {navItems.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs',
                isActive ? 'text-brand-700' : 'text-gray-500',
              )
            }
          >
            <it.icon size={20} />
            {it.label}
          </NavLink>
        ))}
        <NavLink to="/profile" className={({ isActive }) => clsx('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs', isActive ? 'text-brand-700' : 'text-gray-500')}>
          <User size={20} />
          Profile
        </NavLink>
      </nav>
    </header>
  );
}