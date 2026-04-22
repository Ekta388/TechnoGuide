import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Users, Building2, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Modal from '../components/Modal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: 'Marketing',
    otherIndustry: '',
    address: '',
    city: '',
    state: '',
    logo: null,
    logoPreview: null
  });

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClients = async () => {
    try {
      const data = await api.getAllClients();
      const clientsArray = Array.isArray(data) ? data : (data?.data || []);
      setClients(clientsArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
      setLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        industry: client.industry || 'Marketing',
        otherIndustry: client.otherIndustry || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        logo: null,
        logoPreview: client.logo
      });
      setEditingId(client._id);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        industry: 'Marketing',
        otherIndustry: '',
        address: '',
        city: '',
        state: '',
        logo: null,
        logoPreview: null
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          logo: file,
          logoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    try {
      const submitFormData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'logo' && formData.logo) {
          submitFormData.append('logo', formData.logo);
        } else if (key !== 'logo' && key !== 'logoPreview') {
          submitFormData.append(key, formData[key]);
        }
      });

      if (editingId) {
        await api.updateClient(editingId, submitFormData);
      } else {
        await api.addClient(submitFormData);
      }
      setShowModal(false);
      fetchClients();
    } catch (error) {
      alert('Error saving client: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this client profile? This action is irreversible.')) {
      try {
        await api.deleteClient(id);
        fetchClients();
      } catch (error) {
        alert('Error deleting client: ' + error.message);
      }
    }
  };

  const filteredClients = (Array.isArray(clients) ? clients : []).filter(client => {
    const term = searchTerm.toLowerCase();
    return (
      (client.name || '').toLowerCase().includes(term) ||
      (client.email || '').toLowerCase().includes(term) ||
      (client.company || '').toLowerCase().includes(term) ||
      (client.phone || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-tg-orange-500/20 border-t-tg-orange-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-tg-orange-500/20 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-tg-orange-500 p-2 rounded-xl text-white shadow-lg shadow-tg-orange-500/30">
              <Users size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Client Portfolio</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-12">Manage and monitor your strategic partnerships.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tg-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search Account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-12 pr-6 py-3.5 rounded-2xl w-full md:w-72 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-tg-orange-500/20 focus:border-tg-orange-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2 px-8 py-3.5"
          >
            <Plus size={20} />
            <span className="font-black uppercase tracking-widest text-[11px]">New Client</span>
          </button>
        </div>
      </div>

      {/* Styled Client Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        {filteredClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Profile</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Affiliation</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Connectivity</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Hub</th>
                  <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClients.map((client, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={client._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        {client.logo ? (
                          <img
                            src={client.logo.startsWith('http') ? client.logo : `http://localhost:5000${client.logo.startsWith('/') ? '' : '/'}${client.logo}`}
                            alt={client.company}
                            className="w-12 h-12 object-cover rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 font-black text-lg">
                            {client.name?.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 dark:text-white text-sm truncate">{client.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{client.industry === 'Other' ? client.otherIndustry : client.industry}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Building2 size={14} className="text-tg-orange-500" />
                        <span className="text-xs font-bold">{client.company || 'Private Entity'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 space-y-2">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Mail size={14} className="opacity-50" />
                        <span className="text-xs font-bold">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Phone size={14} className="opacity-50" />
                        <span className="text-xs font-bold">{client.phone}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-red-500" />
                        <span className="text-xs">{client.city || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenModal(client)}
                          className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-tg-orange-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          title="Edit Profile"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(client._id)}
                          className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          title="Archive Client"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
              <Users size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-sm mb-4">Account Portfolio Empty</p>
            <button
              onClick={() => handleOpenModal()}
              className="text-tg-orange-500 hover:text-tg-orange-600 font-black uppercase tracking-[0.2em] text-[10px] transition-colors"
            >
              Initialize First Client Identity
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <Modal
            title={editingId ? 'Refactor Client Profile' : 'Execute New Onboarding'}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            icon={Users}
            color="blue"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="relative group/logo">
                  <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-inner">
                    {formData.logoPreview ? (
                      <img src={formData.logoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={32} className="text-slate-300 dark:text-slate-600" />
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-tg-orange-500 text-white flex items-center justify-center shadow-lg pointer-events-none group-hover/logo:scale-110 transition-transform">
                    <Plus size={16} />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Corporate Branding</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload high-resolution transparent PNG or SVG for best presentation.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Account Holder</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="input-field" placeholder="Full legal name" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Entity Name</label>
                  <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="input-field" placeholder="Company registration name" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="input-field" placeholder="corporate@domain.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Communication Line</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="input-field" placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Market Sector</label>
                  <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} className="input-field">
                    {['Marketing', 'Technology', 'Healthcare', 'Finance', 'Retail', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                {formData.industry === 'Other' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Specific Industry</label>
                    <input type="text" value={formData.otherIndustry} onChange={(e) => setFormData({ ...formData, otherIndustry: e.target.value })} className="input-field" />
                  </div>
                )}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Operations Hub (Address)</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-field" placeholder="Office location" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">City Hub</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Territory State</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="input-field" />
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clients;
