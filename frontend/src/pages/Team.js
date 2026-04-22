import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Filter, 
  Users, UserPlus, Briefcase, Mail, Phone, 
  MapPin, Award, Shield, User, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Modal from '../components/Modal';

const Team = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Designer',
    experience: 0,
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: ''
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const data = await api.getAllTeam();
      const teamArray = Array.isArray(data) ? data : (data?.data || []);
      setTeam(teamArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team:', error);
      setTeam([]);
      setLoading(false);
    }
  };

  const handleOpenModal = (member = null) => {
    if (member) {
      setFormData(member);
      setEditingId(member._id);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Designer',
        experience: 0,
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: ''
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateTeamMember(editingId, formData);
        alert('Team member updated successfully');
      } else {
        await api.addTeamMember(formData);
        alert('Team member added successfully');
      }
      setShowModal(false);
      fetchTeam();
    } catch (error) {
      alert('Error saving team member: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      try {
        await api.deleteTeamMember(id);
        alert('Team member deleted successfully');
        fetchTeam();
      } catch (error) {
        alert('Error deleting team member: ' + error.message);
      }
    }
  };

  const filteredTeam = (Array.isArray(team) ? team : []).filter(member => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (member.name || '').toLowerCase().includes(q) ||
      (member.email || '').toLowerCase().includes(q) ||
      (member.phone || '').toLowerCase().includes(q) ||
      (member.role || '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'All' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Tactical Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-tg-orange-500 rounded-2xl shadow-lg shadow-tg-orange-500/20">
              <Users size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Personnel <span className="text-tg-orange-500">Registry</span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase text-[10px] pl-1">
            Strategic asset management & deployment hierarchy
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleOpenModal()}
          className="btn-primary group flex items-center gap-3 px-8 py-4"
        >
          <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="font-black uppercase tracking-widest text-xs">Enlist Personnel</span>
        </motion.button>
      </div>

      {/* Control Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="flex-1 w-full relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tg-orange-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Identify personnel via name or secure email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-tg-orange-500/20 focus:border-tg-orange-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
             <Filter size={18} className="text-slate-400" />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-tg-orange-500/20 focus:border-tg-orange-500 transition-all min-w-[200px]"
          >
            <option value="All">All Classifications</option>
            <option value="Manager">Mission Manager</option>
            <option value="Designer">Visual Strategist</option>
            <option value="Videographer">Motion Asset Producer</option>
            <option value="Content Writer">Communication Tactical</option>
            <option value="Social Media Executive">Network Operator</option>
            <option value="Developer">Systems Architect</option>
          </select>
        </div>
      </motion.div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredTeam.length > 0 ? (
            filteredTeam.map((member, idx) => (
              <motion.div
                key={member._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card group hover:border-tg-orange-500/50 transition-all duration-500 overflow-hidden flex flex-col"
              >
                {/* Card Header & Avatar */}
                <div className="relative p-6 pb-0 flex items-center justify-between">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 font-black text-2xl border-2 border-white dark:border-slate-800 shadow-xl group-hover:border-tg-orange-500 transition-all duration-500">
                      {member.name?.charAt(0) || <User size={24} />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-tg-orange-500 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-md">
                       <Award size={10} className="text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 group-hover:bg-tg-orange-500/10 group-hover:text-tg-orange-500 group-hover:border-tg-orange-500/20 transition-all">
                      Exp: {member.experience || 0}Y
                    </div>
                    <div className="mt-2 flex gap-1">
                       {[1,2,3,4,5].map(s => (
                         <Star key={s} size={8} className={s <= (member.experience > 5 ? 5 : member.experience) ? "text-tg-orange-500 fill-tg-orange-500" : "text-slate-200 dark:text-slate-800"} />
                       ))}
                    </div>
                  </div>
                </div>

                {/* Identity */}
                <div className="p-6 space-y-4 flex-1">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-tg-orange-500 transition-colors">
                      {member.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                       <Shield size={12} className="text-tg-orange-500" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{member.role}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 group/info">
                       <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 group-hover/info:bg-tg-orange-500/10 transition-colors">
                         <Mail size={12} className="text-slate-400 group-hover/info:text-tg-orange-500" />
                       </div>
                       <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-3 group/info">
                       <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 group-hover/info:bg-tg-orange-500/10 transition-colors">
                         <Phone size={12} className="text-slate-400 group-hover/info:text-tg-orange-500" />
                       </div>
                       <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{member.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button
                    onClick={() => handleOpenModal(member)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[9px] hover:border-tg-orange-500/50 hover:text-tg-orange-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 size={14} /> Profile Sync
                  </button>
                  <button
                    onClick={() => handleDelete(member._id)}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center glass-card border-dashed">
              <Users size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Personnel Registry Inactive</p>
              <button 
                onClick={() => handleOpenModal()} 
                className="mt-6 text-tg-orange-500 font-black uppercase tracking-widest text-[10px] hover:underline"
              >
                Initiate Personnel Enlistment
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <Modal
            title={editingId ? 'Personnel Profile Calibration' : 'Strategic Asset Enlistment'}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            icon={UserPlus}
            color="orange"
          >
            <div className="space-y-8">
              {/* Primary Identity Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Legal Designation</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tg-orange-500 transition-colors" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. Victor Rana"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="input-field pl-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Communication Vector</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tg-orange-500 transition-colors" size={16} />
                    <input
                      type="email"
                      placeholder="secure@technoguide.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="input-field pl-12"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tactical Classification</label>
                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tg-orange-500 transition-colors" size={16} />
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="input-field pl-12 appearance-none"
                    >
                      <option value="Manager">Mission Manager</option>
                      <option value="Designer">Visual Strategist</option>
                      <option value="Videographer">Motion Asset Producer</option>
                      <option value="Content Writer">Communication Tactical</option>
                      <option value="Social Media Executive">Network Operator</option>
                      <option value="Developer">Systems Architect</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Field Experience (Cycles)</label>
                  <div className="relative group">
                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tg-orange-500 transition-colors" size={16} />
                    <input
                      type="number"
                      placeholder="5"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                      className="input-field pl-12"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Frequency</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tg-orange-500 transition-colors" size={16} />
                  <input
                    type="tel"
                    placeholder="+91-00000-00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="input-field pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Operational Base</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-4 text-slate-400 group-focus-within:text-tg-orange-500 transition-colors" size={16} />
                  <textarea
                    placeholder="Sector / Zone / Quadrant..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field pl-12 min-h-[100px] py-4"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  Terminate
                </button>
                <button
                  type="submit"
                  className="flex-2 btn-primary py-4 font-black uppercase tracking-widest text-[11px]"
                >
                  {editingId ? 'Synchronize Avatar' : 'Authorize Enlistment'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Team;
