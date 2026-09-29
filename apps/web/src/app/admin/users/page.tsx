'use client';
import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Shield, User, MapPin, ToggleLeft, ToggleRight, Loader2, CheckCircle2, X, AlertCircle } from 'lucide-react';

type UserRole = 'admin' | 'district_officer' | 'panchayat_kiosk';

interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  district?: string;
  panchayat?: string;
  is_active: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'System Admin',
  district_officer: 'District Officer',
  panchayat_kiosk: 'Panchayat Kiosk',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
  district_officer: 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]',
  panchayat_kiosk: 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'district_officer' as UserRole,
    district: '',
    panchayat: '',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', `User "${form.full_name}" created successfully.`);
        setShowCreate(false);
        setForm({ email: '', password: '', full_name: '', role: 'district_officer', district: '', panchayat: '' });
        loadUsers();
      } else {
        showToast('error', data.error || 'Failed to create user.');
      }
    } catch {
      showToast('error', 'Network error.');
    }
    setCreating(false);
  }

  async function toggleActive(userId: string, current: boolean) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, is_active: !current }),
    });
    if (res.ok) {
      showToast('success', `User ${current ? 'deactivated' : 'activated'}.`);
      loadUsers();
    }
  }

  async function changeRole(userId: string, role: UserRole) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) {
      showToast('success', 'Role updated.');
      loadUsers();
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB]' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
          <button onClick={() => setToast(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0B3064] bg-[#EAF1FB] p-1 rounded-lg box-content" />
            User Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">Create and manage user accounts with role-based access control.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          id="create-user-btn"
          className="flex items-center gap-2 bg-[#0B3064] hover:bg-[#144282] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create New User</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Dr. Ramesh Kumar' },
                { label: 'Official Email', key: 'email', type: 'email', placeholder: 'officer@tn.gov.in' },
                { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
                { label: 'District', key: 'district', type: 'text', placeholder: 'Tirunelveli (optional)' },
                { label: 'Panchayat / GP', key: 'panchayat', type: 'text', placeholder: 'Kovilpatti GP (kiosk only)' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.key === 'full_name' || f.key === 'email' || f.key === 'password'}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0B3064] transition"
                  />
                </div>
              ))}

              {/* Role select */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3064]"
                >
                  <option value="district_officer">District Officer</option>
                  <option value="panchayat_kiosk">Panchayat Kiosk Operator</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 bg-[#0B3064] hover:bg-[#144282] disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-colors"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating…' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No users yet. Create the first user above.</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Location</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={`border-b border-slate-700/50 transition-colors hover:bg-slate-700/30 ${i % 2 === 0 ? '' : 'bg-slate-800/50'}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0B3064] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{u.full_name}</p>
                        <p className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ROLE_COLORS[u.role]} bg-transparent cursor-pointer focus:outline-none`}
                    >
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      {(u.district || u.panchayat) ? (
                        <>
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{u.panchayat || u.district}</span>
                        </>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                      u.is_active ? 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]' : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}>
                      {u.is_active ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => toggleActive(u.id, u.is_active)}
                      title={u.is_active ? 'Deactivate user' : 'Activate user'}
                      className={`p-2 rounded-lg transition-colors ${
                        u.is_active ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-green-400 hover:bg-green-900/20'
                      }`}
                    >
                      {u.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role legend */}
      <div className="grid grid-cols-3 gap-4">
        {([
          { role: 'admin' as UserRole, icon: Shield, desc: 'Full system access, user management, config' },
          { role: 'district_officer' as UserRole, icon: User, desc: 'Case review, approvals, planning dashboards' },
          { role: 'panchayat_kiosk' as UserRole, icon: MapPin, desc: 'Beneficiary intake only — kiosk mode' },
        ] as const).map(({ role, icon: Icon, desc }) => (
          <div key={role} className={`p-4 rounded-xl border ${ROLE_COLORS[role]} bg-opacity-10`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4" />
              <span className="font-bold text-xs">{ROLE_LABELS[role]}</span>
            </div>
            <p className="text-xs opacity-75 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
