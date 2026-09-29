'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Shield,
  User,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';

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

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
      showToast('error', 'Network error while creating user.');
    }
    setCreating(false);
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !current }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, is_active: !current } : u))
        );
        showToast('success', `User account ${!current ? 'activated' : 'deactivated'}.`);
      } else {
        showToast('error', 'Failed to update user status.');
      }
    } catch {
      showToast('error', 'Network error.');
    }
  }

  async function changeRole(id: string, newRole: UserRole) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
        );
        showToast('success', `Role updated to ${ROLE_LABELS[newRole]}.`);
      } else {
        showToast('error', 'Failed to update role.');
      }
    } catch {
      showToast('error', 'Network error.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border ${
            toast.type === 'success'
              ? 'bg-[#EDF9F1] border-[#BBE8CB] text-[#0A783C]'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3064] font-display tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0B3064] bg-[#EAF1FB] p-1 rounded-lg box-content border border-[#BACEEB]" />
            Official User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-sans mt-0.5">
            Create, activate, and manage government personnel and kiosk roles.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          id="create-user-btn"
          className="inline-flex items-center gap-2 bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Official</span>
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#0B3064] font-display">Create Official Account</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'e.g. Dr. Ramesh Kumar' },
                { label: 'Official Email', key: 'email', type: 'email', placeholder: 'officer@tn.gov.in' },
                { label: 'Initial Password', key: 'password', type: 'password', placeholder: '••••••••••••' },
                { label: 'District Scope', key: 'district', type: 'text', placeholder: 'Tirunelveli (optional)' },
                { label: 'Gram Panchayat', key: 'panchayat', type: 'text', placeholder: 'Kovilpatti GP (kiosk only)' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    required={f.key === 'full_name' || f.key === 'email' || f.key === 'password'}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064]/15 focus:border-[#0B3064] focus:bg-white transition"
                  />
                </div>
              ))}

              {/* Role select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Designated Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B3064]/15 focus:border-[#0B3064]"
                >
                  <option value="district_officer">District Welfare Officer</option>
                  <option value="panchayat_kiosk">Gram Panchayat Kiosk Operator</option>
                  <option value="admin">Central Administrator</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 bg-[#0B3064] hover:bg-[#144282] disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer mt-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating Official Account…' : 'Save & Provision Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Users table (Universal Gov-Tech Light Theme) */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#0B3064] animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No users found. Click &quot;Add New Official&quot; above to create one.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Jurisdiction</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#0B3064] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
                        {u.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{u.full_name}</p>
                        <p className="text-xs text-slate-500 font-sans mt-0.5">
                          {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ROLE_COLORS[u.role]} bg-white cursor-pointer focus:outline-none shadow-2xs`}
                    >
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      {(u.district || u.panchayat) ? (
                        <>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{u.panchayat || u.district}</span>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border shadow-2xs ${
                        u.is_active
                          ? 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {u.is_active ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => toggleActive(u.id, u.is_active)}
                      title={u.is_active ? 'Deactivate user' : 'Activate user'}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        u.is_active
                          ? 'border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200'
                          : 'border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                      }`}
                    >
                      {u.is_active ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Legend (Clean light theme) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {([
          { role: 'admin' as UserRole, icon: Shield, desc: 'Central governance, user management, and scheme microdata exports.' },
          { role: 'district_officer' as UserRole, icon: User, desc: 'Citizen case review, approvals, and district planning intelligence.' },
          { role: 'panchayat_kiosk' as UserRole, icon: MapPin, desc: 'Village kiosk touch terminal: rapid citizen voice intake.' },
        ] as const).map(({ role, icon: Icon, desc }) => (
          <div key={role} className={`p-4 rounded-2xl border ${ROLE_COLORS[role]} bg-white shadow-2xs`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-4 h-4" />
              <span className="font-bold text-xs">{ROLE_LABELS[role]}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
