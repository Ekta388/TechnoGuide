import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const Navbar = ({ setSidebarOpen }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const isAdmin = user?.role !== 'Team Member';

  useEffect(() => {
    if (isAdmin) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const fetchNotifications = async () => {
    try {
      const data = await api.getAllNotifications();
      const notificationsArray = Array.isArray(data) ? data : (data?.data || []);
      const pending = notificationsArray.filter(n => n.status === 'Pending');
      setNotifications(pending.slice(0, 5));
      setNotificationCount(pending.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setNotificationCount(0);
    }
  };

  return (
    <nav className="glass-navbar px-4 md:px-8 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 relative group overflow-hidden"
            title="Toggle theme"
          >
            <motion.div
              initial={false}
              animate={{ y: theme === 'dark' ? 0 : 40, opacity: theme === 'dark' ? 1 : 0 }}
              className="text-tg-orange-400"
            >
              <Moon size={20} />
            </motion.div>
            <motion.div
              initial={false}
              animate={{ y: theme === 'light' ? -20 : 20, opacity: theme === 'light' ? 1 : 0 }}
              className="absolute inset-0 flex items-center justify-center text-tg-orange-500"
            >
              <Sun size={20} />
            </motion.div>
          </button>

          {/* Notifications */}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
              >
                <Bell size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-tg-orange-500 transition-colors" />
                {notificationCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-tg-orange-500 rounded-full ring-2 ring-white dark:ring-slate-950"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
                      <span className="text-xs font-medium px-2 py-0.5 bg-tg-orange-100 dark:bg-tg-orange-900/30 text-tg-orange-600 dark:text-tg-orange-400 rounded-full">
                        {notificationCount} New
                      </span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif._id} className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                            <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 group-hover:text-tg-orange-600 dark:group-hover:text-tg-orange-400 transition-colors">{notif.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-bold">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-400">
                          <p className="text-sm font-medium">All caught up!</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">{user?.role || 'Administrator'}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-tr from-tg-orange-500 to-amber-400 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-tg-orange-500/20 transform hover:rotate-6 transition-transform cursor-pointer">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
