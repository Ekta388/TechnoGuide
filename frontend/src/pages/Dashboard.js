import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Package, CheckSquare, AlertCircle, Calendar, Plus, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clients: { total: 0, active: 0 },
    team: { total: 0, active: 0 },
    packages: { total: 0, active: 0 },
    tasks: { total: 0, pending: 0, completed: 0, overdue: 0 }
  });
  const [todayStats, setTodayStats] = useState({
    total: 0, pending: 0, completed: 0, active: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentTasks, setRecentTasks] = useState([]);
  const [todayDeliveredTasks, setTodayDeliveredTasks] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: 'Marketing',
    otherIndustry: '',
    address: '',
    city: '',
    state: ''
  });
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    description: '',
    type: [],
    platforms: [],
    amount: '',
    duration: 3,
    durationUnit: 'months',
    deliverablesText: '',
    features: [],
    budget: 0,
    startDate: '',
    endDate: ''
  });
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    client: '',
    package: '',
    assignedTo: '',
    priority: 'Medium',
    type: 'Post',
    platform: 'Instagram',
    dueDate: '',
    instructions: ''
  });
  const [allClients, setAllClients] = useState([]);
  const [allTeam, setAllTeam] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [taskActiveAssignment, setTaskActiveAssignment] = useState(null);
  const [taskDeliverableImpacts, setTaskDeliverableImpacts] = useState({});
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryType, setSummaryType] = useState('');
  const [summaryList, setSummaryList] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchActive = async () => {
      if (taskFormData.client && showTaskModal) {
        try {
          const assignment = await api.getActiveAssignmentByClient(taskFormData.client);
          setTaskActiveAssignment(assignment);
          setTaskFormData(prev => ({ ...prev, package: assignment.package?._id || '' }));

          const initialImpacts = {};
          if (assignment?.deliverablesProgress) {
            assignment.deliverablesProgress.forEach(d => {
              initialImpacts[d.name] = 0;
            });
          }
          setTaskDeliverableImpacts(initialImpacts);
        } catch (error) {
          console.error('Error fetching active assignment:', error);
          setTaskActiveAssignment(null);
          setTaskDeliverableImpacts({});
        }
      } else {
        setTaskActiveAssignment(null);
        setTaskDeliverableImpacts({});
      }
    };
    fetchActive();
  }, [taskFormData.client, showTaskModal]);

  const fetchDashboardData = async () => {
    try {
      const [clientStats, teamStats, packageStats, taskStats, allTasks, allClientsData, allPackagesData, allTeamData, allAssignmentsData, allHistoryTasks] = await Promise.all([
        api.getClientStats(),
        api.getTeamStats(),
        api.getPackageStats(),
        api.getTaskStats(),
        api.getAllTasks(),
        api.getAllClients(),
        api.getAllPackages(),
        api.getAllTeam(),
        api.getAllAssignments(),
        api.getTaskHistory()
      ]);

      setStats({
        clients: {
          total: Number(clientStats?.totalClients || 0),
          active: Number(clientStats?.activeClients || 0)
        },
        team: {
          total: Number(teamStats?.totalMembers || 0),
          active: Number(teamStats?.activeMembers || 0)
        },
        packages: {
          total: Number(packageStats?.totalPackages || 0),
          active: Number(packageStats?.activePackages || 0)
        },
        tasks: {
          total: Number(taskStats?.totalTasks || 0),
          pending: Number(taskStats?.pendingTasks || 0),
          completed: Number(taskStats?.completedTasks || 0),
          overdue: Number(taskStats?.overdueTasks || 0)
        }
      });

      const tasksArray = Array.isArray(allTasks) ? allTasks : (allTasks?.data || []);
      const historyTasksArray = Array.isArray(allHistoryTasks) ? allHistoryTasks : (allHistoryTasks?.data || []);
      const clientsArray = Array.isArray(allClientsData) ? allClientsData : (allClientsData?.data || []);
      const packagesArray = Array.isArray(allPackagesData) ? allPackagesData : (allPackagesData?.data || []);
      const teamArray = Array.isArray(allTeamData) ? allTeamData : (allTeamData?.data || []);
      const assignmentsArray = Array.isArray(allAssignmentsData) ? allAssignmentsData : (allAssignmentsData?.data || []);

      // Calculate Today's Stats for Task Velocity
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const todayPendingActiveTasks = tasksArray.filter(task => {
        if (!task.dueDate) return false;
        const d = new Date(task.dueDate);
        if (isNaN(d.getTime())) return false;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dateStr === todayStr;
      });

      const todayCompletedTasks = historyTasksArray.filter(task => {
        if (!task.completedDate) return false;
        const d = new Date(task.completedDate);
        if (isNaN(d.getTime())) return false;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dateStr === todayStr;
      });

      setTodayStats({
        total: todayPendingActiveTasks.length + todayCompletedTasks.length,
        completed: todayCompletedTasks.length,
        pending: todayPendingActiveTasks.filter(t => t.status === 'Pending').length,
        active: todayPendingActiveTasks.filter(t => t.status !== 'Completed' && t.status !== 'Pending').length
      });

      setTodayDeliveredTasks(todayCompletedTasks);
      setRecentTasks(tasksArray ? tasksArray.slice(0, 5) : []);
      setRecentClients(clientsArray ? clientsArray.slice(0, 5) : []);
      setAllClients(clientsArray);
      setAllTeam(teamArray);
      setAllPackages(packagesArray);
      setAllTasks(tasksArray);
      setAssignments(assignmentsArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        clients: { total: 0, active: 0 },
        team: { total: 0, active: 0 },
        packages: { total: 0, active: 0 },
        tasks: { total: 0, pending: 0, completed: 0, overdue: 0 }
      });
      setRecentTasks([]);
      setRecentClients([]);
      setAllClients([]);
      setAllTeam([]);
      setLoading(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      await api.addClient(clientFormData);
      alert('Client added successfully');
      setShowClientModal(false);
      setClientFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        industry: 'Marketing',
        otherIndustry: '',
        address: '',
        city: '',
        state: ''
      });
      fetchDashboardData();
      navigate('/clients');
    } catch (error) {
      alert('Error adding client: ' + error.message);
    }
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!packageFormData.amount || Number(packageFormData.amount) <= 0) {
        alert('Price must be a positive number');
        return;
      }

      if (!Array.isArray(packageFormData.platforms) || packageFormData.platforms.length === 0) {
        alert('Please select at least one platform');
        return;
      }

      if (!Array.isArray(packageFormData.type) || packageFormData.type.length === 0) {
        alert('Please select at least one service category');
        return;
      }

      const payload = {
        ...packageFormData,
        amount: Number(packageFormData.amount),
        budget: Number(packageFormData.amount), // Use amount as budget if not specified
        durationUnit: 'months',
        deliverables: packageFormData.deliverablesText
          ? packageFormData.deliverablesText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
          : []
      };

      await api.createPackage(payload);
      alert('Package created successfully');
      setShowPackageModal(false);
      setPackageFormData({
        name: '',
        description: '',
        type: [],
        platforms: [],
        amount: '',
        duration: 3,
        durationUnit: 'months',
        deliverablesText: '',
        features: [],
        budget: 0,
        startDate: '',
        endDate: ''
      });
      fetchDashboardData();
      navigate('/packages');
    } catch (error) {
      alert('Error creating package: ' + error.message);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!taskFormData.client) {
        alert('Please select a client');
        return;
      }

      if (!taskFormData.package) {
        alert('Please select a package');
        return;
      }

      if (!taskFormData.assignedTo) {
        alert('Please select a team member to assign to');
        return;
      }

      if (!taskFormData.dueDate) {
        alert('Please select a due date');
        return;
      }

      const impacts = Object.entries(taskDeliverableImpacts)
        .filter(([_, count]) => count > 0)
        .map(([name, count]) => ({ name, count }));

      const payload = {
        ...taskFormData,
        package: taskFormData.package, // Ensure package is passed correctly
        impactedDeliverables: impacts
      };

      await api.createTask(payload);
      alert('Task created successfully');
      setShowTaskModal(false);
      setTaskFormData({
        title: '',
        description: '',
        client: '',
        package: '',
        assignedTo: '',
        priority: 'Medium',
        type: 'Post',
        platform: 'Instagram',
        dueDate: '',
        instructions: ''
      });
      fetchDashboardData();
      navigate('/tasks');
    } catch (error) {
      alert('Error creating task: ' + error.message);
    }
  };

  const handleCardClick = (type) => {
    let list = [];
    if (type === 'Clients') {
      list = allClients;
    } else if (type === 'Team Members') {
      list = allTeam;
    } else if (type === 'Packages') {
      list = allPackages;
    } else if (type === 'Tasks') {
      const fetchHistory = async () => {
        try {
          const hist = await api.getTaskHistory();
          const allHistoryTasks = Array.isArray(hist) ? hist : (hist?.data || []);
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

          const pendingActiveList = allTasks.filter(task => {
            if (!task.dueDate) return false;
            const d = new Date(task.dueDate);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return dateStr === todayStr;
          });

          const completedList = allHistoryTasks.filter(task => {
            if (!task.completedDate) return false;
            const d = new Date(task.completedDate);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return dateStr === todayStr;
          }).map(t => ({ ...t, status: 'Completed' }));

          setSummaryType("Today's Task Distribution");
          setSummaryList([...pendingActiveList, ...completedList]);
          setShowSummaryModal(true);
        } catch (error) {
          console.error(error);
        }
      };
      fetchHistory();
      return;
    }

    setSummaryType(type === 'Tasks' ? "Today's Task Distribution" : type);
    setSummaryList(list);
    setShowSummaryModal(true);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, onClick }) => (
    <div
      onClick={onClick}
      className={`rounded-2xl shadow-xl border border-${color}-500/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer ${color === 'orange' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30' :
        color === 'green' ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30' :
          color === 'purple' ? 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30' :
            'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30'
        }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-black mt-2 bg-gradient-to-r from-slate-200 to-slate-100 bg-clip-text text-transparent">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${color === 'orange' ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/30' :
          color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30' :
            color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30' :
              'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30'
          }`}>
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4 shadow-lg shadow-orange-500/30"></div>
          <p className="text-slate-400 font-semibold">Loading Dashboard...</p>
          <p className="text-slate-600 text-sm mt-2">Fetching your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-transparent p-6 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-slate-400 mt-2 font-medium">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
          <Calendar size={18} className="text-orange-400" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          title="Total Clients"
          value={stats.clients.total}
          subtitle={`${stats.clients.active} active`}
          color="blue"
          onClick={() => handleCardClick('Clients')}
        />
        <StatCard
          icon={Users}
          title="Team Members"
          value={stats.team.total}
          subtitle={`${stats.team.active} active`}
          color="green"
          onClick={() => handleCardClick('Team Members')}
        />
        <StatCard
          icon={Package}
          title="Packages"
          value={stats.packages.total}
          subtitle={`${stats.packages.active} active`}
          color="purple"
          onClick={() => handleCardClick('Packages')}
        />
        <StatCard
          icon={CheckSquare}
          title="Today's Tasks"
          value={todayStats.total}
          subtitle={`${todayStats.active + todayStats.pending} running • ${todayStats.completed} completed`}
          color="orange"
          onClick={() => handleCardClick('Tasks')}
        />
      </div>

      {/* Alerts and Task Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="lg:col-span-1 glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-tg-orange-100 dark:bg-tg-orange-900/30 rounded-lg">
              <AlertCircle size={20} className="text-tg-orange-600 dark:text-tg-orange-400" />
            </div>
            <h2 className="font-black text-slate-800 dark:text-white text-lg tracking-tight uppercase">System Alerts</h2>
          </div>
          <div className="space-y-4">
            {stats.tasks.overdue > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-4 group hover:border-red-500/40 transition-all"
              >
                <p className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider">{stats.tasks.overdue} Overdue Tasks</p>
                <p className="text-xs text-red-500/70 dark:text-red-400/60 mt-1 font-bold">Requires immediate intervention</p>
              </motion.div>
            )}
            {stats.tasks.pending > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-4 group hover:border-amber-500/40 transition-all"
              >
                <p className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">{stats.tasks.pending} Pending Assignments</p>
                <p className="text-xs text-amber-500/70 dark:text-amber-400/60 mt-1 font-bold">Awaiting team allocation</p>
              </motion.div>
            )}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4">
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Operational Health</p>
              <p className="text-xs text-emerald-500/70 dark:text-emerald-400/60 mt-1 font-bold">All core services are stable</p>
            </div>
          </div>
        </div>

        {/* Today's Deliveries */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col max-h-[400px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h2 className="font-black text-slate-800 dark:text-white text-lg tracking-tight uppercase">Today's Deliveries</h2>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{todayDeliveredTasks.length} Delivered</span>
            </div>
          </div>

          <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {todayDeliveredTasks.length > 0 ? todayDeliveredTasks.map((task, i) => (
              <motion.div
                key={task._id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4 flex items-center justify-between group hover:border-emerald-500/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckSquare size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-tight">{task.title}</h3>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Client: <span className="text-emerald-600 dark:text-emerald-400 font-black">{task.client?.name || 'Unknown Client'}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Time</span>
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    {new Date(task.completedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                  <Package className="text-slate-300 dark:text-slate-600" size={24} />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No deliveries captured today</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-8 border-tg-orange-500/20 bg-gradient-to-r dark:from-tg-orange-950/20 dark:via-transparent dark:to-tg-orange-950/20">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-tg-orange-500 rounded-xl shadow-lg shadow-tg-orange-500/20">
            <TrendingUp size={20} className="text-white" />
          </div>
          <h2 className="font-black text-xl text-slate-800 dark:text-white tracking-tight italic">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowClientModal(true)}
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-black uppercase tracking-widest text-[11px] shadow-sm hover:shadow-xl hover:border-tg-orange-500/50 transition-all group"
          >
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Plus size={16} />
            </div>
            Onboard New Client
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPackageModal(true)}
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-black uppercase tracking-widest text-[11px] shadow-sm hover:shadow-xl hover:border-tg-orange-500/50 transition-all group"
          >
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Plus size={16} />
            </div>
            Configure Package
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowTaskModal(true)}
            className="btn-primary flex items-center justify-center gap-3 py-4 uppercase tracking-widest text-[11px] font-black"
          >
            <Plus size={16} />
            Initialize Task
          </motion.button>
        </div>
      </div>
      {/* Recent Activity */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"> */}
      {/* Pending Tasks */}
      {/* <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl shadow-xl border border-slate-700/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-200 text-lg">Pending Tasks</h2>
            <span className="bg-yellow-500/20 text-yellow-300 text-[10px] px-2 py-0.5 rounded border border-yellow-500/20 uppercase font-black">To Do</span>
          </div>
          <div className="space-y-3">
            {recentTasks.filter(t => t.status !== 'Completed').length > 0 ? (
              recentTasks.filter(t => t.status !== 'Completed').map((task) => (
                <div key={task._id} className="flex items-start justify-between p-4 hover:bg-slate-700/30 rounded-xl transition-all border border-slate-700/30 hover:border-orange-500/30">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-200 text-sm">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{task.client?.name || 'No Client'}</span>
                      <span className="text-slate-700">•</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{task.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-lg font-bold border border-yellow-500/30 text-yellow-300 bg-yellow-500/10`}>
                    {task.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-8 text-sm italic">No pending tasks</p>
            )}
          </div>
        </div> */}

      {/* Completed Tasks */}
      {/* <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl shadow-xl border border-slate-700/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-200 text-lg">Recently Completed</h2>
            <span className="bg-green-500/20 text-green-300 text-[10px] px-2 py-0.5 rounded border border-green-500/20 uppercase font-black">Done</span>
          </div>
          <div className="space-y-3">
            {(() => {
              // We need to get completed tasks from allTasks if recentTasks (sliced) doesn't have enough
              // But for now, let's just filter what we have or handle it in fetch
              const completedTasks = recentTasks.filter(t => t.status === 'Completed');
              return completedTasks.length > 0 ? (
                completedTasks.map((task) => (
                  <div key={task._id} className="flex items-start justify-between p-4 hover:bg-green-500/5 rounded-xl transition-all border border-slate-700/30 hover:border-green-500/30">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-200 text-sm line-through decoration-slate-600">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{task.client?.name || 'No Client'}</span>
                        <span className="text-slate-700">•</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{task.assignedTo?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-lg font-bold border border-green-500/30 text-green-300 bg-green-500/10">
                      Completed
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-8 text-sm italic">No recently completed tasks</p>
              );
            })()}
          </div>
        </div> */}

      {/* Recent Clients */}
      {/* <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl shadow-xl border border-slate-700/50 p-6 backdrop-blur-sm">
          <h2 className="font-bold text-slate-200 text-lg mb-4">Recent Clients</h2>
          <div className="space-y-3">
            {recentClients.length > 0 ? (
              recentClients.map((client) => (
                <div key={client._id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 rounded-xl transition-all border border-slate-700/30 hover:border-orange-500/30">
                  <div className="flex items-center gap-3 flex-1">
                    {client.logo ? (
                      <img
                        src={client.logo.startsWith('http') ? client.logo : `http://localhost:5000${client.logo.startsWith('/') ? '' : '/'}${client.logo}`}
                        alt={client.name}
                        className="w-10 h-10 object-contain rounded-full shadow-lg bg-white"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {client.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{client.name}</p>
                      <p className="text-xs text-slate-500">{client.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-lg font-semibold ${client.status === 'Active' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    client.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      'bg-slate-600/50 text-slate-300 border border-slate-500/30'
                    }`}>
                    {client.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-8">No clients yet</p>
            )}
          </div>
        </div>
      </div> */}

      {/* Quick Actions */}
      {/* <div className="bg-gradient-to-r from-orange-600/20 via-orange-500/10 to-orange-600/20 rounded-2xl shadow-xl p-6 border border-orange-500/30 backdrop-blur-sm">
        <h2 className="font-bold text-lg text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-orange-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button onClick={() => setShowClientModal(true)} className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 hover:border-orange-500/50 rounded-xl px-4 py-3 font-semibold text-orange-300 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
            <Plus size={18} />
            Add Client
          </button>
          <button onClick={() => setShowPackageModal(true)} className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-xl px-4 py-3 font-semibold text-purple-300 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
            <Plus size={18} />
            Create Package
          </button>
          <button onClick={() => setShowTaskModal(true)} className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-xl px-4 py-3 font-semibold text-blue-300 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
            <Plus size={18} />
            Assign Task
          </button>
        </div>
      </div> */}

      {/* Monthly Delivery Progress Alerts */}
      <div className="glass-card p-4 md:p-8 border-red-500/10 bg-gradient-to-br from-red-500/[0.02] to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-red-500/10 p-3 rounded-2xl">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight"> Delivery Performance Alerts</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Clients behind monthly schedule</p>
            </div>
          </div>
          <div className="inline-flex bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl self-start">
            <span className="text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-[0.2em]">Quota Monitoring Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            const today = new Date();
            const alertClients = assignments.map(assignment => {
              const startDate = new Date(assignment.startDate);
              const endDate = assignment.endDate ? new Date(assignment.endDate) : new Date();
              const calculationDate = today > endDate ? endDate : today;

              let elapsedMonths = (calculationDate.getFullYear() - startDate.getFullYear()) * 12 + (calculationDate.getMonth() - startDate.getMonth());

              if (calculationDate.getDate() < startDate.getDate()) {
                const lastDayOfCalcMonth = new Date(calculationDate.getFullYear(), calculationDate.getMonth() + 1, 0).getDate();
                if (calculationDate.getDate() !== lastDayOfCalcMonth || startDate.getDate() <= lastDayOfCalcMonth) {
                  elapsedMonths--;
                }
              }
              const currentMonthIndex = Math.max(0, elapsedMonths);

              const pendingItems = (assignment.deliverablesProgress || []).map(d => {
                const targetToDate = Math.min(d.total, d.monthlyCount * (currentMonthIndex + 1));
                const pending = Math.max(0, targetToDate - (d.completedCount || 0));
                return { name: d.name, pending, target: targetToDate, completed: d.completedCount || 0 };
              }).filter(p => p.pending > 0);

              return { ...assignment, pendingItems, isBehind: pendingItems.length > 0 };
            });

            const laggingClients = alertClients.filter(c => c.isBehind);

            if (laggingClients.length === 0) {
              return (
                <div className="col-span-full py-16 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-full mb-4">
                    <CheckSquare size={32} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-slate-800 dark:text-slate-300 font-black text-lg">Peak Performance Confirmed</p>
                  <p className="text-slate-500 dark:text-slate-500 text-sm font-bold mt-1">All clients are currently on track.</p>
                </div>
              );
            }

            return laggingClients.map(assignment => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={assignment._id}
                className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-red-500/30 transition-all group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    {assignment.client?.logo ? (
                      <img
                        src={assignment.client.logo.startsWith('http') ? assignment.client.logo : `http://localhost:5000${assignment.client.logo.startsWith('/') ? '' : '/'}${assignment.client.logo}`}
                        alt={assignment.client.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-500/20">
                        {assignment.client?.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 animate-ping"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-900 dark:text-white font-black truncate">{assignment.client?.name}</h3>
                    <p className="text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest truncate">{assignment.package?.name}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {assignment.pendingItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-800 dark:text-slate-200 text-xs font-black uppercase tracking-tight">{item.name}</span>
                        <span className="text-red-600 dark:text-red-400 text-[10px] font-black">-{item.pending} DELIVERABLES</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.target > 0 ? (item.completed / item.target) * 100 : 0}%` }}
                            className="bg-red-500 h-full rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black w-10 text-right">
                          {item.completed}/{item.target}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </motion.div>
            ));
          })()}
        </div>
      </div>

      {/* Live Client Delivery Progress Dashboard */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200 dark:border-indigo-800/50">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Active Delivery Matrix</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Real-time portfolio analytics</p>
          </div>
        </div>

        {/* Global Stats Matrix */}
        {(() => {
          let totalReq = 0; let totalDone = 0;
          assignments.forEach(a => {
            if (a.deliverablesProgress) {
              const durationInMonths = a.package?.duration || 1;
              a.deliverablesProgress.forEach(d => {
                totalReq += ((d.monthlyCount || 0) * durationInMonths); totalDone += (d.completedCount || 0);
              });
            }
          });
          const totalPend = Math.max(0, totalReq - totalDone);
          const rate = totalReq > 0 ? ((totalDone / totalReq) * 100).toFixed(1) : 0;

          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {[
                { label: 'Total Volume', value: totalReq, color: 'slate' },
                { label: 'Fulfilled', value: totalDone, color: 'emerald' },
                { label: 'Outstanding', value: totalPend, color: 'amber' },
                { label: 'Velocity Rate', value: `${rate}%`, color: 'blue' }
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
                </div>
              ))}
            </div>
          );
        })()}

        <h3 className="text-xs font-semibold text-slate-300 mb-4 tracking-wide uppercase">Client Progress Overview</h3>

        {assignments.length > 0 ? (
          <div className="space-y-16">
            {(() => {
              const grouped = assignments.reduce((acc, assignment) => {
                const duration = assignment.package?.duration || 'Other';
                const unit = assignment.package?.durationUnit || 'Months';
                const key = `${duration} ${unit}`;
                if (!acc[key]) acc[key] = { items: [], total: 0, done: 0, pending: 0 };
                let groupTotal = 0; let groupDone = 0;
                const durationInMonths = assignment.package?.duration || 1;
                (assignment.deliverablesProgress || []).forEach(d => {
                  groupTotal += ((d.monthlyCount || 0) * durationInMonths); groupDone += (d.completedCount || 0);
                });
                acc[key].items.push(assignment);
                acc[key].total += groupTotal; acc[key].done += groupDone;
                acc[key].pending += Math.max(0, groupTotal - groupDone);
                return acc;
              }, {});

              const sortedKeys = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));

              return sortedKeys.map(groupKey => (
                <div key={groupKey} className="space-y-8">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="bg-tg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-tg-orange-500/20">
                        {groupKey} Lifecycle
                      </div>
                      <h3 className="text-slate-800 dark:text-white font-black text-lg tracking-tight">Active Accounts</h3>
                    </div>
                    <div className="flex items-center gap-8 px-6 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{grouped[groupKey].total}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Done</p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{grouped[groupKey].done}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grouped[groupKey].items.map(assignment => {
                      let cTotal = 0; let cDone = 0;
                      const durationInMonths = assignment.package?.duration || 1;
                      (assignment.deliverablesProgress || []).forEach(d => {
                        cTotal += ((d.monthlyCount || 0) * durationInMonths); cDone += (d.completedCount || 0);
                      });
                      const cPerc = cTotal > 0 ? Math.round((cDone / cTotal) * 100) : 0;

                      return (
                        <motion.div
                          whileHover={{ y: -5 }}
                          key={assignment._id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col h-full group transition-all hover:shadow-xl hover:border-tg-orange-500/30"
                        >
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                              {assignment.client?.logo ? (
                                <img
                                  src={assignment.client.logo.startsWith('http') ? assignment.client.logo : `http://localhost:5000${assignment.client.logo.startsWith('/') ? '' : '/'}${assignment.client.logo}`}
                                  alt={assignment.client.name}
                                  className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 font-black text-lg">
                                  {assignment.client?.name?.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{assignment.client?.name}</h4>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{assignment.package?.name}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mb-6">
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Overall Fulfilment</span>
                              <span className="text-xs font-black text-tg-orange-600 dark:text-tg-orange-400">{cPerc}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${cPerc}%` }}
                                className="bg-gradient-to-r from-tg-orange-500 to-tg-orange-600 h-full rounded-full"
                              />
                            </div>
                          </div>

                          <div className="mt-auto space-y-3">
                            {(assignment.deliverablesProgress || []).map((d, idx) => (
                              <div key={idx} className="flex items-center justify-between group/line">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 capitalize">{d.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="w-8 text-right text-[11px] font-black text-emerald-600 dark:text-emerald-400">{d.completedCount || 0}</span>
                                  <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
                                  <span className="w-8 text-xs font-bold text-slate-400">{(d.monthlyCount || 0) * (assignment.package?.duration || 1)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
            <Package size={40} className="text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-slate-500 dark:text-slate-500 font-bold">No active delivery configurations found.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {/* Modals */}
        {showClientModal && (
          <Modal title="Onboard New Client" onClose={() => setShowClientModal(false)} onSubmit={handleAddClient} icon={Users} color="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Account Holder Name</label>
                <input type="text" value={clientFormData.name} onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })} required className="input-field" placeholder="e.g. John Wick" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Corporate Identity</label>
                <input type="text" value={clientFormData.company} onChange={(e) => setClientFormData({ ...clientFormData, company: e.target.value })} className="input-field" placeholder="e.g. Continental Hotels" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Contact No.</label>
                <input type="tel" value={clientFormData.phone} onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })} required className="input-field" placeholder="+91..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Encrypted Email Address</label>
                <input type="email" value={clientFormData.email} onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })} required className="input-field" placeholder="john@continental.com" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Market Sector</label>
                <select value={clientFormData.industry} onChange={(e) => setClientFormData({ ...clientFormData, industry: e.target.value })} className="input-field">
                  {['Marketing', 'Technology', 'Healthcare', 'Finance', 'Retail', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              {clientFormData.industry === 'Other' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Specific Industry Type</label>
                  <input type="text" value={clientFormData.otherIndustry} onChange={(e) => setClientFormData({ ...clientFormData, otherIndustry: e.target.value })} className="input-field" />
                </div>
              )}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Primary Operations Base (Address)</label>
                <input type="text" value={clientFormData.address} onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })} className="input-field" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">City Hub</label>
                <input type="text" value={clientFormData.city} onChange={(e) => setClientFormData({ ...clientFormData, city: e.target.value })} className="input-field" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Geographic State</label>
                <input type="text" value={clientFormData.state} onChange={(e) => setClientFormData({ ...clientFormData, state: e.target.value })} className="input-field" />
              </div>
            </div>
          </Modal>
        )}

        {showPackageModal && (
          <Modal title="Configure Master Package" onClose={() => setShowPackageModal(false)} onSubmit={handleAddPackage} icon={Package} color="purple">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Strategic Package Title</label>
                <input type="text" value={packageFormData.name} onChange={(e) => setPackageFormData({ ...packageFormData, name: e.target.value })} required className="input-field" placeholder="e.g. Global Dominance Pack" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Operational Description</label>
                <textarea value={packageFormData.description} onChange={(e) => setPackageFormData({ ...packageFormData, description: e.target.value })} rows="2" className="input-field" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Deployment Sectors</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['SEO', 'Google Ads', 'Social Media Marketing', 'Facebook Ads', 'Graphic Design'].map(cat => (
                      <label key={cat} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <input type="checkbox" checked={packageFormData.type.includes(cat)} onChange={(e) => setPackageFormData(prev => ({ ...prev, type: e.target.checked ? [...prev.type, cat] : prev.type.filter(t => t !== cat) }))} className="w-4 h-4 rounded border-slate-300 text-tg-orange-500 focus:ring-tg-orange-500" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Service Value (₹)</label>
                  <input type="number" value={packageFormData.amount} onChange={(e) => setPackageFormData({ ...packageFormData, amount: e.target.value })} required className="input-field mb-6" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Mission Duration</label>
                  <select value={packageFormData.duration} onChange={(e) => setPackageFormData({ ...packageFormData, duration: parseInt(e.target.value) })} className="input-field">
                    {[3, 6, 9, 12].map(m => <option key={m} value={m}>{m} Months Schedule</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Deliverable Schema (One per line)</label>
                <textarea value={packageFormData.deliverablesText} onChange={(e) => setPackageFormData({ ...packageFormData, deliverablesText: e.target.value })} placeholder="e.g. 10 Instagram Posts&#10;5 Facebook Ads" rows="3" className="input-field" />
              </div>
            </div>
          </Modal>
        )}

        {showTaskModal && (
          <Modal title="Initialize Dynamic Task" onClose={() => setShowTaskModal(false)} onSubmit={handleAddTask} icon={CheckSquare} color="orange">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Mission Objective (Title)</label>
                <input type="text" value={taskFormData.title} onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })} required className="input-field" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Target Account (Client)</label>
                  <select value={taskFormData.client} onChange={(e) => setTaskFormData({ ...taskFormData, client: e.target.value })} required className="input-field">
                    <option value="">Select Target...</option>
                    {allClients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Operative (Team Member)</label>
                  <select value={taskFormData.assignedTo} onChange={(e) => setTaskFormData({ ...taskFormData, assignedTo: e.target.value })} required className="input-field">
                    <option value="">Select Operative...</option>
                    {allTeam.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Priority Level</label>
                  <select value={taskFormData.priority} onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })} className="input-field">
                    {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p} Priority</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Deadline Date</label>
                  <input type="date" value={taskFormData.dueDate} onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })} required className="input-field" />
                </div>
              </div>

              {taskActiveAssignment && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-tg-orange-500">Link to Deliverables</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                      Active: {taskActiveAssignment.package?.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {taskActiveAssignment.deliverablesProgress?.map((d, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group/item hover:border-tg-orange-500/30 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{d.name}</span>
                          <span className="text-[10px] font-bold text-emerald-500">{d.completedCount} / {d.total} Done</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            value={taskDeliverableImpacts[d.name] || 0}
                            onChange={(e) => setTaskDeliverableImpacts({ ...taskDeliverableImpacts, [d.name]: parseInt(e.target.value) || 0 })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-black focus:ring-2 focus:ring-tg-orange-500/20 outline-none transition-all"
                            placeholder="Units..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Operational Instructions</label>
                <textarea value={taskFormData.instructions} onChange={(e) => setTaskFormData({ ...taskFormData, instructions: e.target.value })} rows="3" className="input-field" />
              </div>
            </div>
          </Modal>
        )}

        {showSummaryModal && (
          <Modal
            title={summaryType}
            onClose={() => setShowSummaryModal(false)}
            icon={summaryType === 'Clients' ? Users : summaryType === 'Team Members' ? Users : summaryType === 'Packages' ? Package : CheckSquare}
            color={summaryType === 'Clients' ? 'blue' : summaryType === 'Team Members' ? 'green' : summaryType === 'Packages' ? 'purple' : 'orange'}
            noSubmit
          >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {summaryList.length > 0 ? (
                summaryList.map((item, idx) => (
                  <motion.div
                    key={item._id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-card p-5 border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-tg-orange-500/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* Logo or Initial */}
                      {(item.logo || item.image) ? (
                        <img
                          src={(item.logo || item.image).startsWith('http') ? (item.logo || item.image) : `http://localhost:5000${(item.logo || item.image).startsWith('/') ? '' : '/'}${item.logo || item.image}`}
                          alt={item.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${summaryType === 'Clients' ? 'bg-blue-50 text-blue-500' :
                          summaryType === 'Team Members' ? 'bg-green-50 text-green-500' :
                            summaryType === 'Packages' ? 'bg-purple-50 text-purple-500' : 'bg-orange-50 text-orange-500'
                          }`}>
                          {(item.name || item.title)?.charAt(0) || 'D'}
                        </div>
                      )}

                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">{item.name || item.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          {item.email && (
                            <a href={`mailto:${item.email}`} className="text-[10px] font-bold text-slate-500 hover:text-tg-orange-500 transition-colors flex items-center gap-1">
                              {item.email}
                            </a>
                          )}
                          {item.phone && (
                            <a href={`tel:${item.phone}`} className="text-[10px] font-bold text-slate-500 hover:text-tg-orange-500 transition-colors flex items-center gap-1">
                              {item.phone}
                            </a>
                          )}
                          {item.amount && <span className="text-[10px] font-bold text-emerald-500">₹{item.amount}</span>}
                          {item.client?.name && <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Client: {item.client.name}</span>}
                          {item.assignedTo?.name && <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">By: {item.assignedTo.name}</span>}
                        </div>
                      </div>
                    </div>
                    {item.status && (
                      <span className={`px-3 py-1 rounded-lg font-black uppercase tracking-widest text-[8px] ${item.status === 'Active' || item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                        {item.status}
                      </span>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No records found for this category</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
