import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Clock, X, Users, CheckSquare, Calendar, FileText, ChevronRight, MessageSquare, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Modal from '../components/Modal';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    assignedTo: '',
    dueDate: getTodayDate(),
    dueTime: '09:00',
    instructions: '',
    taskDetails: ['', '', ''],
    newReferenceFiles: [], // For new file uploads
    referenceFiles: [] // For existing files when editing
  });
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [deliverableImpacts, setDeliverableImpacts] = useState({});
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryType, setSummaryType] = useState('');
  const [summaryList, setSummaryList] = useState([]);

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.client && !editingId) {
      fetchActiveAssignment(formData.client);
    } else {
      setActiveAssignment(null);
      setDeliverableImpacts({});
    }
  }, [formData.client, editingId]);

  const fetchActiveAssignment = async (clientId) => {
    try {
      const assignment = await api.getActiveAssignmentByClient(clientId);
      setActiveAssignment(assignment);
      // Initialize impacts
      const initialImpacts = {};
      if (assignment?.deliverablesProgress) {
        assignment.deliverablesProgress.forEach(d => {
          initialImpacts[d.name] = 0;
        });
      }
      setDeliverableImpacts(initialImpacts);
    } catch (error) {
      console.error('Error fetching active assignment:', error);
      setActiveAssignment(null);
      setDeliverableImpacts({});
    }
  };

  const fetchData = async () => {
    try {
      const [tsk, clnts, , tm, hist] = await Promise.all([
        api.getAllTasks(),
        api.getAllClients(),
        api.getAllPackages(),
        api.getAllTeam(),
        api.getTaskHistory()
      ]);
      setTasks(Array.isArray(tsk) ? tsk : (tsk?.data || []));
      setHistoryTasks(Array.isArray(hist) ? hist : (hist?.data || []));
      setClients(Array.isArray(clnts) ? clnts : (clnts?.data || []));
      setTeam(Array.isArray(tm) ? tm : (tm?.data || []));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setTasks([]);
      setClients([]);
      setTeam([]);
      setLoading(false);
    }
  };

  const handleOpenModal = (task = null) => {
    if (task) {
      setFormData({
        ...task,
        client: task.client?._id || task.client || '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : getTodayDate(),
        dueTime: task.dueDate ? new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '09:00',
        newReferenceFiles: [],
        referenceFiles: task.referenceFiles || []
      });
      setEditingId(task._id);
    } else {
      setFormData({
        title: '',
        client: '',
        assignedTo: '',
        dueDate: getTodayDate(),
        dueTime: '09:00',
        instructions: '',
        taskDetails: ['', '', ''],
        newReferenceFiles: [],
        referenceFiles: []
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e, addAnother = false) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('client', typeof formData.client === 'object' ? formData.client._id : formData.client);
      submitData.append('assignedTo', typeof formData.assignedTo === 'object' ? formData.assignedTo._id : formData.assignedTo);

      // Send date and time separately as well, while keeping combined ISO for legacy if needed
      const combinedDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
      submitData.append('dueDate', combinedDateTime.toISOString());
      submitData.append('dueTime', formData.dueTime);

      submitData.append('instructions', formData.instructions);

      // taskDetails might have empty strings, we filter them out in the backend usually, but let's stringify
      submitData.append('taskDetails', JSON.stringify(formData.taskDetails));

      // Append new files
      if (formData.newReferenceFiles && formData.newReferenceFiles.length > 0) {
        const descriptions = [];
        formData.newReferenceFiles.forEach(ref => {
          submitData.append('referenceFiles', ref.file);
          descriptions.push(ref.description || '');
        });
        submitData.append('fileDescriptions', JSON.stringify(descriptions));
      }

      // Append existing files if editing
      if (editingId) {
        submitData.append('existingReferenceFiles', JSON.stringify(formData.referenceFiles || []));
      }

      // Add deliverable impacts
      const impacts = Object.entries(deliverableImpacts)
        .filter(([_, count]) => count > 0)
        .map(([name, count]) => ({ name, count }));
      submitData.append('impactedDeliverables', JSON.stringify(impacts));

      if (editingId) {
        await api.updateTask(editingId, submitData);
        alert('Task updated successfully');
      } else {
        await api.createTask(submitData);
        alert('Task created successfully');
      }

      if (addAnother) {
        // Keep context, reset task-specific fields
        setFormData({
          ...formData,
          title: '',
          instructions: '',
          taskDetails: ['', '', ''],
          newReferenceFiles: [],
          referenceFiles: []
        });
        setEditingId(null);
      } else {
        setShowModal(false);
      }
      fetchData();
    } catch (error) {
      alert('Error saving task: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.deleteTask(id);
        alert('Task deleted successfully');
        fetchData();
      } catch (error) {
        alert('Error deleting task: ' + error.message);
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      fetchData();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleSendNotification = async (taskId) => {
    try {
      const response = await api.sendManualNotification(taskId);
      if (response.success) {
        alert('Email sent Successfully!');
        fetchData(); // Refresh to see updated notification status
      } else {
        alert('Failed to send Email notification: ' + response.message);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification: ' + error.message);
    }
  };

  const handleSendWhatsappTest = async (task) => {
    try {
      if (!task.assignedTo || !task.assignedTo.phone) {
        alert('Assigned team member does not have a phone number');
        return;
      }
      const dueDateFormatted = new Date(task.dueDate).toLocaleDateString();
      const dueTimeFormatted = new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let cleanPhone = task.assignedTo.phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

      // Use string literal runtime calculation to prevent file-encoding corruption 
      const eRocket = String.fromCodePoint(0x1F680);
      const ePin = String.fromCodePoint(0x1F4CC);
      const eMemo = String.fromCodePoint(0x1F4DD);
      const eTarget = String.fromCodePoint(0x1F3AF);
      const eFile = String.fromCodePoint(0x1F4C1);

      let message = `*${eRocket} New Task Assigned: ${task.title}*\n\n`;
      message += `Hello *${task.assignedTo.name}*,\n`;
      message += `A new task has been assigned to you. Here are the details:\n\n`;

      message += `*${ePin} Core Details*\n`;
      message += `--------------------------\n`;
      message += `*Title:* ${task.title}\n`;
      message += `*Client:* ${task.client?.name || 'N/A'}\n`;
      message += `*Due Date:* ${dueDateFormatted}\n`;
      message += `*Due Time:* ${dueTimeFormatted}\n`;
      message += `*Priority:* ${task.priority || 'Normal'}\n\n`;

      if (task.instructions) {
        message += `*${eMemo} Instructions*\n`;
        message += `${task.instructions}\n\n`;
      }

      if (task.taskDetails && task.taskDetails.length > 0) {
        message += `*${eTarget} Milestones*\n`;
        task.taskDetails.forEach(m => {
          message += `- ${m}\n`;
        });
        message += `\n`;
      }

      if (task.referenceFiles && task.referenceFiles.length > 0) {
        message += `*${eFile} Reference Files*\n`;
        task.referenceFiles.forEach(f => {
          let url = f.url.startsWith('http') ? f.url : `http://localhost:5000${f.url.startsWith('/') ? '' : '/'}${f.url}`;
          message += `- ${f.originalName}: ${url}\n`;
        });
        message += `\n`;
      }

      message += `Please log in to your dashboard to manage this task.\n\n`;
      message += `*Regards,*\n*TechnoGuide Team*`;

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

    } catch (error) {
      console.error('Error opening whatsapp:', error);
      alert('Error opening WhatsApp: ' + error.message);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      file,
      description: ''
    }));
    setFormData(prev => ({
      ...prev,
      newReferenceFiles: [...prev.newReferenceFiles, ...newFiles]
    }));
  };

  const removeNewFile = (index) => {
    const newFiles = [...formData.newReferenceFiles];
    newFiles.splice(index, 1);
    setFormData({ ...formData, newReferenceFiles: newFiles });
  };

  const removeExistingFile = (index) => {
    const existingFiles = [...formData.referenceFiles];
    existingFiles.splice(index, 1);
    setFormData({ ...formData, referenceFiles: existingFiles });
  };

  const todayStr = getTodayDate();

  const getTaskDateStr = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const operationalTasks = (Array.isArray(tasks) ? tasks : []).filter(task => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (task.title || '').toLowerCase().includes(q) ||
      (task.client?.name || '').toLowerCase().includes(q) ||
      (task.client?.email || '').toLowerCase().includes(q) ||
      (task.client?.phone || '').toLowerCase().includes(q) ||
      (task.assignedTo?.name || '').toLowerCase().includes(q);
    return matchesSearch;
  });

  const archiveTasks = (Array.isArray(historyTasks) ? historyTasks : []).filter(task => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (task.title || '').toLowerCase().includes(q) ||
      (task.client?.name || '').toLowerCase().includes(q) ||
      (task.client?.email || '').toLowerCase().includes(q) ||
      (task.client?.phone || '').toLowerCase().includes(q) ||
      (task.assignedTo?.name || '').toLowerCase().includes(q);
    return matchesSearch;
  });

  const renderSummaryCards = () => {
    // Total Clients
    const totalClientsCount = clients.length;

    // Clients with at least one active task
    const activeClientIds = new Set(tasks.map(t => (t.client?._id || t.client).toString()));
    const assignedClientsCount = activeClientIds.size;

    // Clients with NO tasks assigned (Pending Assignment)
    const pendingClientsCount = Math.max(0, totalClientsCount - assignedClientsCount);

    const handleSummaryCardClick = (type) => {
      let list = [];
      const activeClientIdsSet = new Set(tasks.map(t => (t.client?._id || t.client).toString()));

      if (type === 'Total Clients') {
        list = clients;
      } else if (type === 'Assigned Clients') {
        list = clients.filter(c => activeClientIdsSet.has(c._id.toString()));
      } else if (type === 'Pending Assignment') {
        list = clients.filter(c => !activeClientIdsSet.has(c._id.toString()));
      }

      setSummaryType(type);
      setSummaryList(list);
      setShowSummaryModal(true);
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total Clients', display: 'TOTAL CLIENTS', value: totalClientsCount, icon: Users, color: 'blue', suffix: '' },
          { label: 'Assigned Clients', display: 'ASSIGNED CLIENTS', value: assignedClientsCount, icon: CheckSquare, color: 'emerald', suffix: ' Clients' },
          { label: 'Pending Assignment', display: 'PENDING ASSIGNMENT', value: pendingClientsCount, icon: Clock, color: 'orange', suffix: ' Clients' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleSummaryCardClick(stat.label)}
            className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="text-left flex-1 break-words">
              <p className={`text-[10px] sm:text-xs font-black uppercase tracking-widest mb-3 ${stat.color === 'blue' ? 'text-blue-500' :
                  stat.color === 'emerald' ? 'text-emerald-500' :
                    'text-amber-500'
                }`}>{stat.display}</p>
              <div className="flex items-baseline">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stat.value}</span>
                {stat.suffix && <span className="ml-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none whitespace-nowrap">{stat.suffix}</span>}
              </div>
            </div>
            <div className={`p-4 sm:p-5 rounded-2xl md:rounded-3xl ml-4 shrink-0 shadow-inner ${stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' :
                stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                  'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
              } group-hover:scale-110 group-hover:-rotate-3 transition-transform`}>
              <stat.icon size={28} strokeWidth={2.5} />
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Sort tasks by date for history
  const getTasksByDate = (tasksList) => {
    const sorted = [...tasksList].sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
    const grouped = {};
    sorted.forEach(task => {
      const dateKey = new Date(task.dueDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });
    return grouped;
  };

  return (
    <div className="space-y-10">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-tg-orange-500 p-2 rounded-xl text-white shadow-lg shadow-tg-orange-500/30">
              <CheckSquare size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mission Control</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-12">Orchestrate and monitor high-priority deliverables.</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2 px-8 py-3.5"
        >
          <Plus size={20} />
          <span className="font-black uppercase tracking-widest text-[11px]">Deploy New Task</span>
        </button>
      </div>

      {/* Daily Summary Section */}
      {renderSummaryCards()}

      {/* Navigation & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {['list', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap ${activeTab === tab
                ? 'bg-white dark:bg-slate-700 text-tg-orange-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              {tab === 'list' ? 'Operational Tasks' : 'Strategic Archive'}
            </button>
          ))}
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tg-orange-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Query Deployments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-12 pr-6 py-3.5 rounded-2xl w-full text-sm font-bold focus:outline-none focus:ring-2 focus:ring-tg-orange-500/20 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Tasks Table or History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="overflow-x-auto"
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operator</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deadline</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {operationalTasks.map((task, idx) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={task._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group"
                    >
                      <td className="px-8 py-6">
                        <div className="min-w-[200px]">
                          <p className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">{task.title}</p>
                          {task.impactedDeliverables && task.impactedDeliverables.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {task.impactedDeliverables.map((del, dIdx) => (
                                <span key={dIdx} className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/50">
                                  {del.count} {del.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {task.referenceFiles?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {task.referenceFiles.map((file, i) => (
                                <a
                                  key={i}
                                  href={file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url.startsWith('/') ? '' : '/'}${file.url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-[9px] font-black uppercase tracking-tighter hover:scale-105 transition-transform"
                                >
                                  <FileText size={10} />
                                  <span className="max-w-[80px] truncate">{file.originalName}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-[10px]">
                        {task.client?.name || clients.find(c => c._id === task.client)?.name || 'N/A'}
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-tg-orange-500 border border-slate-200 dark:border-slate-700">
                            {task.assignedTo?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="font-bold">{task.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-wider">{new Date(task.createdAt).toLocaleDateString()}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase">{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-wider">{new Date(task.dueDate).toLocaleDateString()}</p>
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-tg-orange-500 uppercase">
                            <Clock size={10} />
                            {task.dueTime || new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                            task.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                              task.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                                'bg-slate-100 text-slate-600'
                          }`}>
                          {task.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleSendNotification(task._id)}
                            title="Send Manual Email Notification"
                            className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            onClick={() => handleSendWhatsappTest(task)}
                            title="Send Manual WhatsApp Test"
                            className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          >
                            <Smartphone size={14} />
                          </button>
                          <button onClick={() => handleOpenModal(task)} className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-tg-orange-500 hover:text-white transition-all flex items-center justify-center shadow-sm">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(task._id)} className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {operationalTasks.length === 0 && (
                <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                    <CheckSquare size={32} className="text-slate-200 dark:text-slate-700" />
                  </div>
                  <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-xs">No active deployments found</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-12"
            >
              {Object.entries(getTasksByDate(archiveTasks)).map(([date, tasksOnDate], gIdx) => (
                <div key={date} className="space-y-6 relative pl-10 border-l border-slate-100 dark:border-slate-800">
                  <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-4 border-tg-orange-500" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase">{date}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{tasksOnDate.length} Strategic Operations Logged</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {tasksOnDate.map((task, tIdx) => (
                      <div key={task._id} className="glass-card p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 group">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black shadow-inner transition-transform group-hover:scale-110`}>
                            {task.title?.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">{task.title}</h4>
                            {task.impactedDeliverables && task.impactedDeliverables.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {task.impactedDeliverables.map((del, dIdx) => (
                                  <span key={dIdx} className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/50">
                                    {del.count} {del.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <Users size={10} />
                                {task.client?.name || 'External'}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Assigned</span>
                                <span className="text-[9px] font-black text-slate-900 dark:text-white">
                                  {new Date(task.assignedDate || task.createdAt || Date.now()).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-tg-orange-500 uppercase">Due Date</span>
                                <span className="text-[9px] font-black text-slate-900 dark:text-white">
                                  {new Date(task.dueDate).toLocaleDateString()} @ {task.dueTime || '09:00'}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-emerald-500 uppercase">Completed</span>
                                <span className="text-[9px] font-black text-slate-900 dark:text-white">
                                  {new Date(task.completedDate || task.updatedAt || Date.now()).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="px-4 py-1.5 rounded-xl font-black uppercase tracking-[0.2em] text-[8px] bg-emerald-500 text-white">
                            Archived
                          </span>
                          <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(getTasksByDate(archiveTasks)).length === 0 && (
                <div className="py-24 text-center">
                  <Clock size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">The strategic archive is empty</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <Modal
            title={editingId ? 'Refactor Tactical Deployment' : 'Initiate New Operation'}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            icon={CheckSquare}
            color="orange"
            noSubmit
          >
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Mission Objective</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="input-field"
                  placeholder="Operational title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Account Target</label>
                  <select value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} required className="input-field">
                    <option value="">Select client entity</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Mission Specialist</label>
                  <select value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} required className="input-field">
                    <option value="">Select operative</option>
                    {team.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Target Date</label>
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required className="input-field pl-12" />
                  <Calendar size={14} className="absolute left-4 top-[42px] text-slate-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Execution Window</label>
                  <input type="time" value={formData.dueTime} onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })} required className="input-field" />
                </div>
              </div>

              {activeAssignment && (
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-tg-orange-500">Link to Deliverables</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                      Active: {activeAssignment.package?.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeAssignment.deliverablesProgress?.map((d, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group/item hover:border-tg-orange-500/30 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{d.name}</span>
                          <span className="text-[10px] font-bold text-emerald-500">{d.completedCount} / {d.total} Done</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            value={deliverableImpacts[d.name] || 0}
                            onChange={(e) => setDeliverableImpacts({ ...deliverableImpacts, [d.name]: parseInt(e.target.value) || 0 })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-black focus:ring-2 focus:ring-tg-orange-500/20 outline-none transition-all"
                            placeholder="Units..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-tg-orange-500">Logistics & Strategy</h3>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="input-field min-h-[100px] py-4"
                    placeholder="Detailed operational protocols..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tactical Milestones</label>
                  {formData.taskDetails?.map((detail, index) => (
                    <div key={index} className="flex gap-4 group/step">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-400 shrink-0 border border-slate-100 dark:border-slate-700 group-focus-within/step:bg-tg-orange-500 group-focus-within/step:text-white transition-colors">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        placeholder={`Milestone phase ${index + 1}`}
                        value={detail}
                        onChange={(e) => {
                          const nd = [...formData.taskDetails];
                          nd[index] = e.target.value;
                          setFormData({ ...formData, taskDetails: nd });
                        }}
                        className="input-field"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => setFormData({ ...formData, taskDetails: [...(formData.taskDetails || []), ''] })} className="text-[10px] font-black uppercase tracking-[0.2em] text-tg-orange-500 hover:text-tg-orange-600 transition-colors ml-14">+ Add Milestone</button>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Asset Management</h3>
                  <label className="cursor-pointer px-4 py-2 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
                    Inject Assets
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* Existing Assets */}
                  {formData.referenceFiles?.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{file.originalName}</span>
                      </div>
                      <button type="button" onClick={() => removeExistingFile(idx)} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {/* New Technical Assets */}
                  {formData.newReferenceFiles?.map((item, idx) => (
                    <div key={idx} className="space-y-2 p-4 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-indigo-500" />
                          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 truncate max-w-[200px]">{item.file.name}</span>
                        </div>
                        <button type="button" onClick={() => removeNewFile(idx)} className="text-red-500 hover:scale-110 transition-transform"><X size={16} /></button>
                      </div>
                      <input
                        type="text"
                        placeholder="Operational notes for this asset..."
                        value={item.description}
                        onChange={(e) => {
                          const nf = [...formData.newReferenceFiles];
                          nf[idx].description = e.target.value;
                          setFormData({ ...formData, newReferenceFiles: nf });
                        }}
                        className="w-full text-[10px] bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-500/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all">
                  Abort
                </button>
                <div className="flex-1 flex gap-3 min-w-[300px]">
                  {!editingId && (
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, true)}
                      className="flex-1 px-6 py-4 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest text-[11px] hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Assign & Re-Deploy
                    </button>
                  )}
                  <button
                    onClick={(e) => handleSubmit(e)}
                    className="flex-1 btn-primary py-4 font-black uppercase tracking-widest text-[11px]"
                  >
                    {editingId ? 'Update Command' : 'Initialize Mission'}
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSummaryModal && (
          <Modal
            title={`${summaryType} Matrix`}
            onClose={() => setShowSummaryModal(false)}
            icon={Users}
            color="blue"
            noSubmit
          >
            <div className="p-2 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {summaryList.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item._id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group border border-slate-100 dark:border-slate-700 hover:border-tg-orange-500/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-tg-orange-500 border border-slate-100 dark:border-slate-700">
                      {item.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">{item.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.company || 'Private Entity'}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-tg-orange-500 transition-colors" />
                </motion.div>
              ))}
              {summaryList.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-[10px]">Matrix Empty</p>
                </div>
              )}
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setShowSummaryModal(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all">Close</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;