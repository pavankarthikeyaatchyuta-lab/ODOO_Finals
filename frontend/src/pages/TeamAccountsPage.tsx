import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Users,
  Shield,
  Mail,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Filter,
  AlertCircle,
  Building,
  Store,
  Heart,
  Crown,
  Key,
  Calendar,
  Lock,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAuth, AuthUser, AppRole } from '../context/AuthContext';
import { api } from '../services/api';
import { Wedding } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

export interface TeamAccountsPageProps {
  weddings: Wedding[];
  onNavigateToTab?: (tab: any) => void;
}

/**
 * TeamAccountsPage component
 *
 * Founder governance console for creating, inviting, and managing team accounts.
 */
export const TeamAccountsPage: React.FC<TeamAccountsPageProps> = ({
  weddings = []
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Invitation Form State
  const [inviteDisplayName, setInviteDisplayName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<AppRole>('PLANNER');
  const [inviteWeddingId, setInviteWeddingId] = useState<string>(weddings[0]?.id || 'wed-001');
  const [inviteVendorCategory, setInviteVendorCategory] = useState<string>('Decor & Florals');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenInviteModal = () => {
    setInviteDisplayName('');
    setInviteEmail('');
    setInviteRole('PLANNER');
    setInviteWeddingId(weddings[0]?.id || 'wed-001');
    setInviteVendorCategory('Decor & Florals');
    setFormError(null);
    setIsInviteModalOpen(true);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!inviteDisplayName.trim()) {
      setFormError('Please provide the full legal or display name.');
      return;
    }
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setFormError('Please enter a valid official email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.inviteUser({
        email: inviteEmail.trim(),
        displayName: inviteDisplayName.trim(),
        role: inviteRole,
        weddingId: inviteWeddingId,
        vendorCategory: inviteRole === 'VENDOR' ? inviteVendorCategory : undefined
      });

      setIsInviteModalOpen(false);
      setSuccessNotice(`Account successfully provisioned for ${created.displayName} (${created.email}). Invitation link created!`);
      await fetchUsers();
      setTimeout(() => setSuccessNotice(null), 8000);
    } catch (err: any) {
      setFormError(err.message || 'Unable to issue invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AuthUser) => {
    if (user.role === 'FOUNDER') {
      alert('The primary Founder account cannot be deactivated.');
      return;
    }
    const newStatus = !user.active;
    const confirmMessage = newStatus
      ? `Re-activate access for ${user.displayName}?`
      : `Deactivate account for ${user.displayName}? They will immediately be barred from signing in.`;

    if (window.confirm(confirmMessage)) {
      try {
        await api.updateUserStatus(user.id, newStatus);
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
      } catch (err) {
        alert('Failed to update account status.');
      }
    }
  };

  const handleCopyInviteLink = (user: AuthUser) => {
    const inviteToken = (user as any).invitationToken || `trk-invite-${user.role.toLowerCase()}-2026`;
    const inviteUrl = `${window.location.origin}/?view=invite&token=${inviteToken}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(user.id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (roleFilter === 'ALL') return true;
    if (roleFilter === 'STAFF') return ['FOUNDER', 'PLANNER', 'COORDINATOR', 'FINANCE'].includes(u.role);
    if (roleFilter === 'VENDOR') return u.role === 'VENDOR';
    if (roleFilter === 'CLIENT') return ['CLIENT', 'FAMILY'].includes(u.role);
    return u.role === roleFilter;
  });

  const staffCount = users.filter(u => ['FOUNDER', 'PLANNER', 'COORDINATOR', 'FINANCE'].includes(u.role)).length;
  const vendorCount = users.filter(u => u.role === 'VENDOR').length;
  const clientCount = users.filter(u => ['CLIENT', 'FAMILY'].includes(u.role)).length;

  const roleBadgeStyle = (role: AppRole) => {
    switch (role) {
      case 'FOUNDER':
        return 'bg-[#C5A059]/15 text-[#9D7C36] border-[#C5A059]/40';
      case 'PLANNER':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'COORDINATOR':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FINANCE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VENDOR':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CLIENT':
      case 'FAMILY':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Team Governance & Stakeholder Accounts
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Provision official staff credentials, invite field coordinators, grant portal access to couples and vendor partners.
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          onClick={handleOpenInviteModal}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="shadow-md shrink-0 font-bold"
        >
          Invite & Create Account
        </Button>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-sm px-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Metric Counters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Accounts</span>
          <span className="font-serif font-bold text-2xl text-[#0D1B2A] block mt-1">{users.length}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Active identities registered</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Core Staff</span>
          <span className="font-serif font-bold text-2xl text-indigo-700 block mt-1">{staffCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Planners, Coord & Finance</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Vendor Partners</span>
          <span className="font-serif font-bold text-2xl text-amber-700 block mt-1">{vendorCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Contracted extranets</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Couples & Family</span>
          <span className="font-serif font-bold text-2xl text-rose-700 block mt-1">{clientCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Couple portal suites</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <span className="text-slate-400 font-medium text-[11px] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { key: 'ALL', label: 'All Accounts' },
            { key: 'STAFF', label: 'Agency Staff' },
            { key: 'VENDOR', label: 'Vendors' },
            { key: 'CLIENT', label: 'Couples / Family' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                roleFilter === f.key
                  ? 'bg-[#0D1B2A] text-[#C5A059] shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Stakeholder Identity</th>
                <th className="py-3.5 px-4">Authorized Role</th>
                <th className="py-3.5 px-4">Operating Scope</th>
                <th className="py-3.5 px-4 text-center">Security Status</th>
                <th className="py-3.5 px-4 text-right sm:pr-6">Credentials & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Synchronizing stakeholder identities...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No matching accounts found for query "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredUsers.map(account => {
                  const isCurrent = currentUser?.id === account.id;
                  const isCopied = copiedToken === account.id;

                  return (
                    <tr key={account.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-[#1B3B6F] to-[#0D1B2A] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-[#C5A059]/40 shrink-0">
                            {account.displayName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <span className="font-bold text-[#0D1B2A] block leading-tight">
                              {account.displayName}
                              {isCurrent && (
                                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {account.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleBadgeStyle(account.role)}`}>
                          {account.role === 'FOUNDER' && <Crown className="w-3 h-3" />}
                          {account.role === 'PLANNER' && <Shield className="w-3 h-3" />}
                          {account.role === 'VENDOR' && <Store className="w-3 h-3" />}
                          {(account.role === 'CLIENT' || account.role === 'FAMILY') && <Heart className="w-3 h-3" />}
                          {account.role}
                        </span>
                        {account.vendorCategory && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {account.vendorCategory}
                          </span>
                        )}
                      </td>

                      {/* Assigned Scope */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="text-slate-700 font-medium block">
                            {account.role === 'FOUNDER'
                              ? 'All 25 Royal Estates (Enterprise)'
                              : account.assignedWeddingIds && account.assignedWeddingIds.length > 0
                              ? `Assigned: ${account.assignedWeddingIds.join(', ')}`
                              : 'General Operations'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {account.role === 'VENDOR'
                              ? 'Extranet Access'
                              : account.role === 'CLIENT'
                              ? 'Couple Suite Access'
                              : 'Agency Workspace'}
                          </span>
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(account)}
                          disabled={account.role === 'FOUNDER'}
                          title={account.role === 'FOUNDER' ? 'Founder cannot be deactivated' : 'Click to toggle status'}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            account.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          } ${account.role === 'FOUNDER' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${account.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{account.active ? 'ACTIVE' : 'DEACTIVATED'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right sm:pr-6">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyInviteLink(account)}
                            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                              isCopied
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                            }`}
                            title="Copy Invitation Link"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="text-[10px] font-medium hidden sm:inline">
                              {isCopied ? 'Copied' : 'Invite Link'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite & Create Account Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite & Create Stakeholder Account"
        maxWidth="lg"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal / Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={inviteDisplayName}
                onChange={e => setInviteDisplayName(e.target.value)}
                placeholder="e.g. Radhika Apte / Chef Ranveer"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="e.g. radhika.planner@theroyalknot.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Stakeholder Role & Permission Tier <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: 'PLANNER' as AppRole, label: 'Lead Luxury Planner', desc: 'Agreements, RFQs, Run Sheet' },
                { key: 'COORDINATOR' as AppRole, label: 'Field Coordinator', desc: 'On-site arrivals & incidents' },
                { key: 'FINANCE' as AppRole, label: 'Finance Officer', desc: 'Advances & disbursements' },
                { key: 'VENDOR' as AppRole, label: 'Vendor Partner', desc: 'Extranet schedule & invoicing' },
                { key: 'CLIENT' as AppRole, label: 'Couple / Client', desc: 'Couple Suite & agreements' },
                { key: 'FAMILY' as AppRole, label: 'Family Member', desc: 'Ceremony flow (no finances)' }
              ].map(r => (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => setInviteRole(r.key)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    inviteRole === r.key
                      ? 'border-[#C5A059] bg-[#C5A059]/10 ring-1 ring-[#C5A059]'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-xs text-[#0D1B2A] block">{r.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Fields based on Role */}
          {inviteRole === 'VENDOR' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor Trade Category
              </label>
              <select
                value={inviteVendorCategory}
                onChange={e => setInviteVendorCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none bg-white"
              >
                <option value="Catering & Hospitality">Catering & Royal Banquet</option>
                <option value="Decor & Florals">Palace Floral Architecture & Decor</option>
                <option value="Sound, Lighting & SFX">Royal Sound & Intelligent Lighting</option>
                <option value="Photography & Cinema">Cinematography & Heirloom Photography</option>
                <option value="Transportation & Logistics">Vintage Fleet & Guest Logistics</option>
                <option value="Traditional Artists">Folk Artists & Shehnai Troupe</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Assigned Wedding Locus
            </label>
            <select
              value={inviteWeddingId}
              onChange={e => setInviteWeddingId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none bg-white"
            >
              {weddings.map(w => (
                <option key={w.id} value={w.id}>
                  {w.coupleNames} — {w.location} ({w.weddingDate})
                </option>
              ))}
            </select>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#0D1B2A] block">High-Security Closed-Loop Protocol</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                New accounts are pre-authorized with role-gated access. For sandbox evaluation, the initial passphrase defaults to <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-[#0D1B2A]">royalKnot2026!</code>.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={isSubmitting}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              className="font-bold shadow-md"
            >
              Provision Account & Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
