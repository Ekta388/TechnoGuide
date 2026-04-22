import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, 
  Package, Calendar, CheckCircle2, AlertCircle, 
  Clock, X, ChevronRight, Layers, CreditCard, 
  Target, TrendingUp, Zap, Users, History, Star, 
  Bell, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Modal from '../components/Modal';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [clients, setClients] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningPackage, setAssigningPackage] = useState(null);
  const [assignClientId, setAssignClientId] = useState('');
  const [assignStartDate, setAssignStartDate] = useState('');
  const [assignEndDate, setAssignEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: [],
    platforms: [],
    amount: '',
    duration: 3,
    durationUnit: 'months',
    deliverables: [],
    features: [],
    budget: 0,
    startDate: '',
    endDate: '',
    newDeliverable: { name: '', monthlyCount: '' }
  });

  // Delivery Update State
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [deliveryUpdates, setDeliveryUpdates] = useState({});

  const getExpiryStatus = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Urgent', color: 'bg-red-500 text-white shadow-red-500/20' };
    if (diffDays > 0 && diffDays <= 7) return { label: 'Expiring Soon', color: 'bg-amber-500 text-white shadow-amber-500/20' };
    return null;
  };

  const handleWhatsAppExpiryAlert = (assignment) => {
    const { client, package: pkg, endDate } = assignment;
    const phone = (client?.phone || '').replace(/\+/g, '').replace(/\s/g, '');

    if (!phone) {
      alert('Client phone number not available.');
      return;
    }

    const expiryDate = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const serviceTier = pkg?.name || 'Assigned Package';
    const message = `Hello *${client.name}*, this is TechnoGuide. 👋\n\nYour *${serviceTier}* package is approaching its expiry date on *${expiryDate}*. \n\nPlease let us know if you would like to proceed with a renewal.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openDeliveryModal = (assignment) => {
    setActiveAssignment(assignment);
    const initialUpdates = {};
    (assignment.deliverablesProgress || []).forEach(d => {
      initialUpdates[d.name] = d.completedCount || 0;
    });
    setDeliveryUpdates(initialUpdates);
    setShowDeliveryModal(true);
  };

  const handleDeliverySubmit = async (deliverableName) => {
    try {
      const completedCount = deliveryUpdates[deliverableName];
      const data = await api.updateAssignmentDelivery(activeAssignment._id, { deliverableName, completedCount });
      alert('Progress updated!');
      setAssignments(prev => prev.map(a => a._id === activeAssignment._id ? (data.assignment || data) : a));
      setActiveAssignment(data.assignment || data);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addDeliverable = () => {
    const { name, monthlyCount } = formData.newDeliverable;
    if (!name.trim() || !monthlyCount) return;
    const total = Number(monthlyCount) * Number(formData.duration);
    setFormData({
      ...formData,
      deliverables: [...formData.deliverables, { name: name.trim(), monthlyCount: Number(monthlyCount), total }],
      newDeliverable: { name: '', monthlyCount: '' }
    });
  };

  const removeDeliverable = (index) => {
    setFormData({ ...formData, deliverables: formData.deliverables.filter((_, i) => i !== index) });
  };

  const updateDeliverableTotals = (newDuration) => {
    setFormData({
      ...formData,
      duration: newDuration,
      deliverables: formData.deliverables.map(d => ({ ...d, total: d.monthlyCount * newDuration }))
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pkgs, clnts, assigns] = await Promise.all([
        api.getAllPackages(),
        api.getAllClients(),
        api.getAllAssignments()
      ]);
      const packagesArray = Array.isArray(pkgs) ? pkgs : (pkgs?.data || []);
      const clientsArray = Array.isArray(clnts) ? clnts : (clnts?.data || []);
      const assignmentsArray = Array.isArray(assigns) ? assigns : (assigns?.data || []);
      setPackages(packagesArray);
      setClients(clientsArray);
      setAssignments(assignmentsArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPackages([]);
      setClients([]);
      setAssignments([]);
      setLoading(false);
    }
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setFormData({
        name: pkg.name || '',
        description: pkg.description || '',
        type: Array.isArray(pkg.type) ? pkg.type : (pkg.type ? [pkg.type] : []),
        platforms: pkg.platforms || [],
        amount: pkg.amount || '',
        duration: pkg.duration || 3,
        durationUnit: pkg.durationUnit || 'months',
        deliverables: Array.isArray(pkg.deliverables)
          ? pkg.deliverables.filter(item => item !== null && item !== undefined)
          : [],
        features: pkg.features || [],
        budget: pkg.budget || 0,
        startDate: pkg.startDate ? pkg.startDate.slice(0, 10) : '',
        endDate: pkg.endDate ? pkg.endDate.slice(0, 10) : '',
        newDeliverable: { name: '', monthlyCount: '' }
      });
      setEditingId(pkg._id);
    } else {
      setFormData({
        name: '',
        description: '',
        type: [],
        platforms: [],
        amount: '',
        duration: 3,
        durationUnit: 'months',
        deliverables: [],
        features: [],
        budget: 0,
        startDate: '',
        endDate: '',
        newDeliverable: { name: '', monthlyCount: '' }
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const calculateEndDate = (startDate, durationMonths) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(durationMonths));
    return end.toISOString().slice(0, 10);
  };

  const openAssignModal = (pkg = null) => {
    const today = new Date().toISOString().slice(0, 10);
    const end = pkg ? calculateEndDate(today, pkg.duration) : '';

    setAssigningPackage(pkg);
    setAssignClientId(pkg?.client?._id || '');
    setAssignStartDate(today);
    setAssignEndDate(end);
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async () => {
    if (!assigningPackage) {
      alert('Please select a package to assign.');
      return;
    }

    if (!assignClientId) {
      alert('Please select a client to assign to.');
      return;
    }

    try {
      await api.createAssignment({
        packageId: assigningPackage._id,
        clientId: assignClientId,
        startDate: assignStartDate,
        endDate: assignEndDate
      });

      alert('Package assigned successfully');
      setShowAssignModal(false);
      fetchData();
    } catch (error) {
      alert('Error assigning package: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Front-end validations
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Price must be a positive number');
      return;
    }

    if (!Array.isArray(formData.platforms) || formData.platforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    if (!Array.isArray(formData.type) || formData.type.length === 0) {
      alert('Please select at least one service category');
      return;
    }

    const allowedDurations = [3, 6, 9, 12];
    if (!allowedDurations.includes(Number(formData.duration))) {
      alert('Duration must be one of 3, 6, 9, or 12 months');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      platforms: formData.platforms,
      amount: formData.amount,
      duration: formData.duration,
      durationUnit: 'months',
      deliverables: formData.deliverables,
      features: formData.features,
      budget: formData.budget,
      startDate: formData.startDate,
      endDate: formData.endDate
    };

    try {
      const response = editingId
        ? await api.updatePackage(editingId, payload)
        : await api.createPackage(payload);

      alert(`Package ${editingId ? 'updated' : 'created'} successfully (ID: ${response?.package?._id || 'N/A'})`);
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert('Error saving package: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await api.deletePackage(id);
        alert('Package deleted successfully');
        fetchData();
      } catch (error) {
        alert('Error deleting package: ' + error.message);
      }
    }
  };

  const filteredPackages = (Array.isArray(packages) ? packages : []).filter(pkg => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (pkg.name || '').toLowerCase().includes(q) ||
      (pkg.description || '').toLowerCase().includes(q) ||
      (pkg.amount || '').toString().includes(q);
    const matchesStatus = statusFilter === 'All' || pkg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAssignments = (Array.isArray(assignments) ? assignments : []).filter(assign => {
    const q = searchTerm.toLowerCase();
    const pkgName = (assign.package?.name || '').toLowerCase();
    const clientName = (assign.client?.name || '').toLowerCase();
    const clientEmail = (assign.client?.email || '').toLowerCase();
    const clientPhone = (assign.client?.phone || '').toLowerCase();
    return pkgName.includes(q) || clientName.includes(q) || clientEmail.includes(q) || clientPhone.includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-tg-orange-500/20 border-t-tg-orange-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={20} className="text-tg-orange-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Tactical Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-tg-orange-500 rounded-2xl shadow-lg shadow-tg-orange-500/20">
              <Package size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Service <span className="text-tg-orange-500">Inventory</span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold tracking-wide text-sm ml-14">
            Strategic asset management and operational package deployment.
          </p>
        </div>

        <div className="flex items-center gap-4 ml-14 md:ml-0">
          <button
            onClick={() => openAssignModal()}
            className="px-6 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 flex items-center gap-3"
          >
            <Users size={16} /> Assign Deployment
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary py-4 px-8 font-black uppercase tracking-widest text-[11px] flex items-center gap-3"
          >
            <Plus size={18} /> Initialize Package
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-card p-2 flex flex-col md:flex-row items-center gap-2">
        <div className="relative flex-1 group w-full">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tg-orange-500 transition-colors" />
          <input
            type="text"
            placeholder="Search tactical packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-tg-orange-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {['All', 'Active', 'On Hold', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status
                  ? 'bg-tg-orange-500 text-white shadow-lg shadow-tg-orange-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-800'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tactical Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredPackages.length > 0 ? (
            filteredPackages.map((pkg, idx) => {
              const categories = Array.isArray(pkg.type) ? pkg.type : (pkg.type ? [pkg.type] : []);
              const platforms = Array.isArray(pkg.platforms) ? pkg.platforms : (pkg.platforms ? [pkg.platforms] : []);
              const deliverables = Array.isArray(pkg.deliverables) ? pkg.deliverables.filter(item => item !== null) : [];

              return (
                <motion.div
                  key={pkg._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card group hover:border-tg-orange-500/50 transition-all duration-500 overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="relative p-6 pb-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-tg-orange-500 transition-colors duration-500">
                        <Package size={20} className="text-slate-400 group-hover:text-white transition-colors duration-500" />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${pkg.status === 'Active'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                        {pkg.status}
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-tg-orange-500 transition-colors">
                      {pkg.name}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed mt-2 line-clamp-2">
                      {pkg.description || 'Strategic deployment package for high-impact results.'}
                    </p>
                  </div>

                  {/* Core Metrics */}
                  <div className="p-6 space-y-6 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valuation</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                          ₹{pkg.amount?.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                        <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white tracking-tight text-lg">
                          <Clock size={16} className="text-tg-orange-500" />
                          {pkg.duration}M
                        </div>
                      </div>
                    </div>

                    {/* Deliverables Preview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deliverables Matrix</p>
                        <Layers size={12} className="text-slate-300" />
                      </div>
                      <div className="space-y-2">
                        {deliverables.slice(0, 3).map((item, dIdx) => {
                          const isObj = typeof item === 'object' && item !== null;
                          return (
                            <div key={dIdx} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                {isObj ? item.name : item}
                              </span>
                              <span className="text-[10px] font-black text-tg-orange-500">
                                {isObj ? `${item.monthlyCount}/mo` : 'Included'}
                              </span>
                            </div>
                          );
                        })}
                        {deliverables.length > 3 && (
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center pt-1">
                            + {deliverables.length - 3} more assets
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    {pkg.status === 'Active' && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operational Pace</span>
                          <span className="text-[10px] font-black text-tg-orange-500">{pkg.progress || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pkg.progress || 0}%` }}
                            className="h-full bg-tg-orange-500 shadow-[0_0_8px_rgba(255,107,0,0.4)]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    <button
                      onClick={() => handleOpenModal(pkg)}
                      className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[9px] hover:border-tg-orange-500/50 hover:text-tg-orange-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 size={14} /> Refactor
                    </button>
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-red-500 font-black uppercase tracking-widest text-[9px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-24 text-center glass-card border-dashed">
              <Package size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Inventory Archive Empty</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-6 text-tg-orange-500 font-black uppercase tracking-widest text-[10px] hover:underline"
              >
                Initialize Primary Package
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
      <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
            <History size={20} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Deployment <span className="text-indigo-500">Logistics</span>
          </h2>
        </div>

        {filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAssignments.map((assignment, idx) => {
              const assignedStart = assignment.startDate ? new Date(assignment.startDate).toLocaleDateString() : '—';
              const assignedEnd = assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : '—';
              const assignedAt = assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : '—';

              return (
                <motion.div
                  key={assignment._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card hover:border-indigo-500/50 transition-all duration-500 overflow-hidden"
                >
                  <div className="p-6 pb-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg leading-tight">
                          {assignment.package?.name || 'Unknown Asset'}
                        </h3>
                        {getExpiryStatus(assignment.endDate) && (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${getExpiryStatus(assignment.endDate).color}`}>
                            {getExpiryStatus(assignment.endDate).label}
                          </span>
                        )}
                      </div>
                      <div className="p-2 bg-indigo-500/10 rounded-xl">
                        <Target size={16} className="text-indigo-500" />
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      Assigned To: <span className="text-indigo-500">{assignment.client?.name || 'Unknown Entity'}</span>
                    </p>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Commencement</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Calendar size={12} className="text-indigo-500" />
                          {assignedStart}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Termination</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Clock size={12} className="text-tg-orange-500" />
                          {assignedEnd}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-3 border border-slate-100 dark:border-slate-700/50">
                      <div className="flex justify-between items-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset Duration</p>
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                          {assignment.package?.duration || 0} Months
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned On</p>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{assignedAt}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAssignModal(assignment.package)}
                          className="flex-1 px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[9px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-slate-900/10"
                        >
                          Re-Deploy
                        </button>
                        <button
                          onClick={() => openDeliveryModal(assignment)}
                          className="flex-1 px-4 py-3 rounded-xl bg-tg-orange-500 text-white font-black uppercase tracking-widest text-[9px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-tg-orange-500/20 flex items-center justify-center gap-2"
                        >
                          <TrendingUp size={14} /> Update Sync
                        </button>
                      </div>
                      <button
                        onClick={() => handleWhatsAppExpiryAlert(assignment)}
                        className="w-full px-4 py-3 rounded-xl bg-green-500 text-white font-black uppercase tracking-widest text-[9px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={14} /> Send Expiry Alert
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center glass-card border-dashed">
            <History size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Deployment Registry Empty or No Matches</p>
            <button
              onClick={() => openAssignModal()}
              className="mt-6 text-indigo-500 font-black uppercase tracking-widest text-[10px] hover:underline"
            >
              Inaugurate First Assignment
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <Modal
            title={editingId ? 'Refactor Service Protocol' : 'Initialize New Asset'}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            icon={Package}
            color="orange"
          >
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Asset Identity</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Platinum SEO Matrix"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Operational Valuation (₹)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input-field"
                    placeholder="50000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Strategic Objective</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field min-h-[80px] py-4"
                  placeholder="Detailed mission brief..."
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-tg-orange-500">Service Architecture</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Sectors</label>
                    <div className="grid grid-cols-1 gap-2">
                      {['SEO', 'Google Ads', 'Social Media', 'Content Marketing', 'Graphic Design'].map((cat) => (
                        <label key={cat} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-tg-orange-500/30 transition-all">
                          <input
                            type="checkbox"
                            checked={formData.type.includes(cat)}
                            onChange={(e) => {
                              const next = e.target.checked ? [...formData.type, cat] : formData.type.filter(t => t !== cat);
                              setFormData({ ...formData, type: next });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-tg-orange-500 focus:ring-tg-orange-500"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Operational Window</label>
                      <select
                        value={formData.duration}
                        onChange={(e) => updateDeliverableTotals(Number(e.target.value))}
                        className="input-field"
                      >
                        {[3, 6, 9, 12].map(m => <option key={m} value={m}>{m} Months Deployment</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Primary Channels</label>
                      <div className="flex flex-wrap gap-2">
                        {['WhatsApp', 'Instagram', 'YouTube', 'LinkedIn', 'Facebook'].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              const next = formData.platforms.includes(p) ? formData.platforms.filter(x => x !== p) : [...formData.platforms, p];
                              setFormData({ ...formData, platforms: next });
                            }}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.platforms.includes(p)
                                ? 'bg-tg-orange-500 text-white shadow-lg shadow-tg-orange-500/20'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'
                              }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Asset Deliverables</h4>
                  <Zap size={14} className="text-indigo-500" />
                </div>

                <div className="glass-card bg-indigo-500/5 border-indigo-500/10 p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Asset Name (e.g. Reels)"
                        value={formData.newDeliverable.name}
                        onChange={(e) => setFormData({ ...formData, newDeliverable: { ...formData.newDeliverable, name: e.target.value } })}
                        className="w-full bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-500/20 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        placeholder="Qty / Mo"
                        value={formData.newDeliverable.monthlyCount}
                        onChange={(e) => setFormData({ ...formData, newDeliverable: { ...formData.newDeliverable, monthlyCount: e.target.value } })}
                        className="w-full bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-500/20 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addDeliverable}
                      className="bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Add
                    </button>
                  </div>

                  {formData.deliverables.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {formData.deliverables.map((item, idx) => {
                        const isObj = typeof item === 'object' && item !== null;
                        return (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100/50 dark:border-indigo-500/10 shadow-sm group">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-500 border border-indigo-100 dark:border-indigo-500/20">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{isObj ? item.name : item}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  {isObj ? `${item.monthlyCount} / Month • ${item.total} Total` : 'Base Asset'}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => removeDeliverable(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssignModal && (
          <Modal
            title="Strategic Asset Assignment"
            onClose={() => setShowAssignModal(false)}
            onSubmit={handleAssignSubmit}
            icon={Target}
            color="indigo"
          >
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Asset Selection</label>
                <select
                  value={assigningPackage?._id || ''}
                  onChange={(e) => {
                    const pkg = packages.find((p) => p._id === e.target.value);
                    const today = new Date().toISOString().slice(0, 10);
                    setAssigningPackage(pkg || null);
                    setAssignClientId(pkg?.client?._id || '');
                    setAssignStartDate(today);
                    setAssignEndDate(pkg ? calculateEndDate(today, pkg.duration) : '');
                  }}
                  className="input-field"
                >
                  <option value="">Select tactical package</option>
                  {packages.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>

              {assigningPackage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-indigo-500" />
                    <span className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-tight">Deployment Window</span>
                  </div>
                  <span className="text-xs font-black text-indigo-500">{assigningPackage.duration} Months</span>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Account Target</label>
                <select
                  value={assignClientId}
                  onChange={(e) => setAssignClientId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select client entity</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Commencement</label>
                  <input type="date" value={assignStartDate} readOnly className="input-field bg-slate-50 dark:bg-slate-800 opacity-60 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Termination</label>
                  <input type="date" value={assignEndDate} readOnly className="input-field bg-slate-50 dark:bg-slate-800 opacity-60 cursor-not-allowed" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 px-8 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all">
                  Abort
                </button>
                <button
                  disabled={!assigningPackage || !assignClientId}
                  onClick={handleAssignSubmit}
                  className="flex-2 btn-primary py-4 font-black uppercase tracking-widest text-[11px]"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeliveryModal && activeAssignment && (
          <Modal
            title="Asset Delivery Synchronization"
            onClose={() => setShowDeliveryModal(false)}
            icon={TrendingUp}
            color="indigo"
            noSubmit
          >
            <div className="space-y-8">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Operation</p>
                <div className="flex justify-between items-end">
                  <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-tight">
                    {activeAssignment.package?.name}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500 tracking-wide">
                    {activeAssignment.client?.name}
                  </span>
                </div>
              </div>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {activeAssignment.deliverablesProgress?.map((d, idx) => {
                  const pending = Math.max(0, (d.total || 0) - (deliveryUpdates[d.name] || 0));
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{d.name}</label>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target: {d.total}</span>
                            <span className="text-[9px] font-black text-tg-orange-500 uppercase tracking-widest">Pending: {pending}</span>
                          </div>
                        </div>
                        <CheckCircle2 size={16} className={pending === 0 ? 'text-green-500' : 'text-slate-200'} />
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          value={deliveryUpdates[d.name] !== undefined ? deliveryUpdates[d.name] : (d.completedCount || 0)}
                          onChange={(e) => setDeliveryUpdates({ ...deliveryUpdates, [d.name]: Number(e.target.value) })}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-black focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        <button
                          onClick={() => handleDeliverySubmit(d.name)}
                          className="px-6 py-2 bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 shadow-none hover:shadow-indigo-500/20"
                        >
                          Sync
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                {(!activeAssignment.deliverablesProgress || activeAssignment.deliverablesProgress.length === 0) && (
                  <div className="text-center py-12">
                    <AlertCircle size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No Asset Protocols Defined</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button onClick={() => setShowDeliveryModal(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all">Close Pipeline</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Packages;
