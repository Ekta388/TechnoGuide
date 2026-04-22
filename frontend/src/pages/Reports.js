import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Calendar, Clock, CheckCircle, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

function Reports() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [history, setHistory] = useState([]);
  const [packageDetails, setPackageDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientReport(selectedClient);
      fetchClientPackage(selectedClient);
    } else {
      setHistory([]);
      setPackageDetails(null);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const res = await api.getAllClients();
      setClients(res.data || res);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const fetchClientReport = async (clientId) => {
    setLoading(true);
    try {
      const res = await api.getClientReport(clientId);
      setHistory(res.data || res);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientPackage = async (clientId) => {
    try {
      const res = await api.getActiveAssignmentByClient(clientId);
      if (res && res.package) {
        setPackageDetails(res);
      } else {
        setPackageDetails(null);
      }
    } catch (error) {
      console.error('Failed to load package data:', error);
      setPackageDetails(null);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          /* Force naturally flowing document, override React app wrapper dimensions */
          html, body, #root, .h-screen, main, [class*="overflow-"] {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            overflow-y: visible !important;
            overflow-x: visible !important;
            position: static !important;
            display: block !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide UI Chrome completely */
          aside, nav {
            display: none !important;
          }

          /* Hide Report utility components */
          .print-hide {
            display: none !important;
          }

          /* Show Print Area gracefully inline */
          .print-area {
            display: block !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            color: black !important;
          }

          /* Reverse Dark Mode classes for physical paper */
          .print-area * {
             backdrop-filter: none !important;
          }
          .print-area .text-white, .print-area .dark\\:text-white { color: black !important; }
          .print-area .text-slate-400, .print-area .text-slate-500, .print-area .text-slate-600 { color: #333 !important; }
          .print-area .dark\\:text-slate-400, .print-area .dark\\:text-slate-200 { color: black !important; }
          
          .print-area .glass-card, .print-area .dark\\:bg-slate-900, .print-area .dark\\:bg-slate-900\\/50, .print-area .dark\\:bg-slate-800 { 
            background: white !important; 
            border: 1px solid #ddd !important; 
            box-shadow: none !important; 
          }
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print-hide">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Delivery Reports</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Client Fulfillment History</p>
        </div>
        {selectedClient && history.length > 0 && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl font-bold tracking-widest uppercase text-xs hover:scale-105 transition-transform shadow-xl"
          >
            <Printer size={16} /> Print Report
          </button>
        )}
      </div>

      <div className="glass-card p-6 print-hide">
        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">
          Select Client Account
        </label>
        <select
          className="input-field max-w-md"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
        >
          <option value="">-- Choose a Client --</option>
          {Array.isArray(clients) && clients.map(client => (
            <option key={client._id} value={client._id}>{client.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-tg-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : selectedClient && history.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <Package className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
          <p className="text-slate-500 font-bold uppercase tracking-widest">No historical deliveries found</p>
        </div>
      ) : selectedClient && history.length > 0 ? (
        <div className="space-y-6 print-area bg-white dark:bg-slate-950 p-8 rounded-2xl">
          {/* Print Only Header */}
          <div className="hidden print:block text-center mb-8 border-b-2 border-slate-200 pb-6">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">TechnoGuide</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">M&T InfoSoft</p>
            <h2 className="text-xl font-bold text-slate-800 mt-4">Official Delivery Report</h2>
            {clients.find(c => c._id === selectedClient) && (
              <p className="text-lg text-slate-600 mt-2 font-black uppercase">Client: {clients.find(c => c._id === selectedClient).name}</p>
            )}
          </div>

          {/* Client Package Overview Card */}
          {packageDetails && packageDetails.package && (
            <div className="glass-card p-6 border-tg-orange-500/20 bg-gradient-to-r from-tg-orange-500/5 to-transparent">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-tg-orange-500/20 text-tg-orange-600 rounded-xl">
                  <Package size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{packageDetails.package.name}</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{packageDetails.package.duration} {packageDetails.package.durationUnit || 'Months'} Subscription</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {(packageDetails.deliverablesProgress || []).map((del, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{del.name}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{del.completedCount || 0}</span>
                      <span className="text-xs font-bold text-slate-500 leading-tight">/ {del.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          <div className="glass-card overflow-hidden print:overflow-visible">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Timeline Log</h3>
            </div>
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion Date</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assets Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {history.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Calendar size={14} className="text-emerald-500" />
                          <span className="text-xs font-bold">{new Date(item.completedDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {item.impactedDeliverables && item.impactedDeliverables.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {item.impactedDeliverables.map((del, dIdx) => (
                              <span key={dIdx} className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {del.count} {del.name}{dIdx < item.impactedDeliverables.length - 1 ? ',' : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            {item.title}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Reports;
