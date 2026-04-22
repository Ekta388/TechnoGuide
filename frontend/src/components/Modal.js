import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const Modal = ({ title, onClose, onSubmit, children, icon: Icon, color, noSubmit }) => {
  const colorClasses = {
    blue: 'bg-blue-600 shadow-blue-500/20',
    purple: 'bg-purple-600 shadow-purple-500/20',
    orange: 'bg-tg-orange-500 shadow-tg-orange-500/20',
    emerald: 'bg-emerald-600 shadow-emerald-500/20',
    red: 'bg-red-600 shadow-red-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl text-white ${colorClasses[color] || colorClasses.blue}`}>
              <Icon size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
            <Plus size={20} className="rotate-45" />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); if(onSubmit) onSubmit(e); }} className="p-8">
          <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {children}
          </div>
          
          {!noSubmit && (
            <div className="flex gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={onClose} className="px-8 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all">
                Cancel
              </button>
              <button type="submit" className="flex-1 btn-primary py-4 font-black uppercase tracking-widest text-[11px]">
                Confirm Action
              </button>
            </div>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Modal;
