import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, Search, UserCheck, UserX, Trash2, 
  Eye, Award, ShieldCheck, RefreshCw 
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Profile modal state
  const [selectedUserModal, setSelectedUserModal] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        params: { search: search || undefined }
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleToggleStatus = async (user) => {
    try {
      await api.patch(`/users/${user.id}/status`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account? All student quiz history will be erased.')) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting user');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-400" /> Student & User Control
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage registered accounts, view student histories, and toggle account activation status</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or email..."
            className="w-full bg-slate-950/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-3 text-indigo-400 font-semibold animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Loading Registered Users...</span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Users Found</h3>
          <p className="text-xs text-slate-500 mt-1">No registered student accounts match your search query.</p>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-4">User Info</th>
                  <th className="pb-3 px-4 text-center">Role</th>
                  <th className="pb-3 px-4 text-center">Quizzes Attempted</th>
                  <th className="pb-3 px-4 text-center">Average Score</th>
                  <th className="pb-3 px-4 text-center">Status</th>
                  <th className="pb-3 px-4 text-center">Joined Date</th>
                  <th className="pb-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4">
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-semibold text-slate-200">
                      {u.role === 'ADMIN' ? <span className="text-slate-500 italic">N/A (Admin)</span> : (u.total_attempts || 0)}
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-extrabold text-emerald-400">
                      {u.role === 'ADMIN' ? <span className="text-slate-500 font-normal italic">N/A</span> : `${u.avg_score || 0}%`}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {u.role === 'ADMIN' ? (
                        <span className="text-xs text-slate-500 font-semibold">Active</span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          <span>{u.status}</span>
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedUserModal(u)}
                        className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                        title="View Profile Stats"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 rounded-lg text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Student Profile Summary</h2>
              <button onClick={() => setSelectedUserModal(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-base font-extrabold text-white">{selectedUserModal.name}</p>
                <p className="text-slate-400">{selectedUserModal.email}</p>
                <p className="text-slate-500 text-[11px]">Joined: {new Date(selectedUserModal.created_at).toLocaleDateString()}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Attempts</p>
                  <p className="font-extrabold text-white text-base mt-0.5">{selectedUserModal.total_attempts}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Average Score</p>
                  <p className="font-extrabold text-emerald-400 text-base mt-0.5">{selectedUserModal.avg_score}%</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Highest Score</p>
                  <p className="font-extrabold text-amber-400 text-base mt-0.5">{selectedUserModal.highest_score}%</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUserModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
