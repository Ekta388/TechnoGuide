import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Users, Package, CheckSquare, Bell, LogOut, ChevronRight, } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logoutUser } = useAuth();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { label: 'Clients', path: '/clients', icon: Users },
    { label: 'Team', path: '/team', icon: Users },
    { label: 'Packages', path: '/packages', icon: Package },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Reports', path: '/reports', icon: BarChart3 }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-72 glass-sidebar transition-all duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } flex flex-col`}
      >
        <div className="p-8">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-12 h-12 bg-tg-orange-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-tg-orange-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              TG
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-800 dark:text-white tracking-tight">TechnoGuide</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">M&T InfoSoft</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className="relative group block"
              >
                <div
                  className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all duration-300 ${active
                    ? 'bg-tg-orange-600 text-white shadow-lg shadow-tg-orange-500/30'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                >
                  <Icon size={22} className={`${active ? 'text-white' : 'group-hover:text-tg-orange-500'} transition-colors duration-300`} />
                  <span className="font-bold tracking-tight">{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="active-indicator"
                      className="ml-auto"
                    >
                      <ChevronRight size={18} />
                    </motion.div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
          <button
            onClick={() => {
              logoutUser();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-300 font-black group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="uppercase tracking-widest text-xs">Sign Out</span>
          </button>

          <p className="mt-6 text-[10px] text-slate-400 text-center font-bold uppercase tracking-[0.3em] opacity-40">
            Touch the Sky with Us
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;