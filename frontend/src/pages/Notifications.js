import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  FiBell,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSearch,
  FiCalendar,
  FiUser,
  FiMessageSquare,
  FiPhone,
  FiRepeat,
  FiAlertCircle
} from 'react-icons/fi';
import { format } from 'date-fns';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0, last24h: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState({ type: '', status: '', date: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      setRefreshing(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        params: filter
      });
      setNotifications(response.data);

      const statsResponse = await axios.get('http://localhost:5000/api/notifications/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRetry = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/notifications/${id}/retry`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error retrying notification:', error);
      alert('Failed to retry notification');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Sent': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'Failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'Pending': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Task Assignment': return <FiUser className="text-blue-500" />;
      case 'Task Reminder': return <FiClock className="text-orange-500" />;
      case 'Daily Summary': return <FiCalendar className="text-purple-500" />;
      case 'Package Alert': return <FiMessageSquare className="text-pink-500" />;
      case 'Overdue Alert': return <FiXCircle className="text-red-500" />;
      case 'Unassigned Alert': return <FiAlertCircle className="text-tg-orange-500" />;
      default: return <FiBell className="text-slate-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n =>
    n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.recipientPhone.includes(searchTerm) ||
    (n.recipient?.name && n.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-tg-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiBell className="text-tg-orange-500" />
            Notification & Alert Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor real-time WhatsApp alerts and automated messages.</p>
        </div>
        <button
          onClick={fetchNotifications}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-tg-orange-500 dark:hover:border-tg-orange-500 transition-all font-medium disabled:opacity-50"
        >
          <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Alerts', value: stats.total, icon: <FiBell />, color: 'blue' },
          { label: 'Sent Successfully', value: stats.sent, icon: <FiCheckCircle />, color: 'green' },
          { label: 'Failed Messages', value: stats.failed, icon: <FiXCircle />, color: 'red' },
          { label: 'Pending Queue', value: stats.pending, icon: <FiClock />, color: 'yellow' },
          { label: 'Past 24 Hours', value: stats.last24h, icon: <FiCalendar />, color: 'purple' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl bg-${card.color}-50 dark:bg-${card.color}-900/20 flex items-center justify-center text-${card.color}-600 mb-3`}>
              {card.icon}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by message, phone or recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-tg-orange-500/20 focus:border-tg-orange-500 text-sm transition-all text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-tg-orange-500/20 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Types</option>
              <option value="Task Assignment">Task Assignment</option>
              <option value="Task Reminder">Task Reminder</option>
              <option value="Daily Summary">Daily Summary</option>
              <option value="Package Alert">Package Alert</option>
              <option value="Overdue Alert">Overdue Alert</option>
            </select>

            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-tg-orange-500/20 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Status</option>
              <option value="Sent">Sent</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type & Recipient</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/3">Message</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((n) => (
                  <tr key={n._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                          {getTypeIcon(n.type)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{n.type}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{n.recipient?.name || 'Manager'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2" title={n.message}>
                        {n.message}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium font-mono">
                        <FiPhone className="text-xs" />
                        {n.recipientPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${getStatusColor(n.status)}`}>
                        {n.status === 'Sent' && <FiCheckCircle />}
                        {n.status === 'Failed' && <FiXCircle />}
                        {n.status === 'Pending' && <FiClock />}
                        {n.status}
                      </span>
                      {n.error && (
                        <p className="text-[10px] text-red-500 mt-1 max-w-[120px] truncate" title={n.error}>{n.error}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-slate-900 dark:text-white font-medium">{format(new Date(n.createdAt), 'dd MMM yyyy')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(n.createdAt), 'hh:mm a')}</p>
                    </td>
                    <td className="px-6 py-4">
                      {n.status === 'Failed' ? (
                        <button
                          onClick={() => handleRetry(n._id)}
                          className="flex items-center gap-1 text-xs font-bold text-tg-orange-500 hover:text-tg-orange-600 uppercase tracking-wider"
                        >
                          <FiRepeat />
                          Retry
                        </button>
                      ) : n.type === 'Unassigned Alert' || (n.recipientPhone && (!n.status || n.status === 'Sent')) ? (
                        <button
                          onClick={async () => {
                            const cleanPhone = (n.recipientPhone || '').replace(/\D/g, '');
                            if (!cleanPhone) return alert('No phone number found');
                            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(n.message)}`;
                            window.open(whatsappUrl, '_blank');

                            // Update status to 'Sent' on the backend
                            try {
                              const token = sessionStorage.getItem('token');
                              await axios.patch(`http://localhost:5000/api/notifications/${n._id}/status`,
                                { status: 'Sent' },
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              fetchNotifications(); // Refresh the list to show green 'Sent'
                            } catch (error) {
                              console.error('Error updating notification status:', error);
                            }
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-700 uppercase tracking-wider"
                        >
                          <FiPhone />
                          WhatsApp
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">---</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <FiBell className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No results found matching your criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
