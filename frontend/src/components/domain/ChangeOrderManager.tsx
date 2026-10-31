import React, { useState } from 'react';
import { ChangeOrder, ExpenseCategory } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { StatusBadge } from '../common/StatusBadge';
import {
  FileText,
  CheckCircle2,
  PlusCircle,
  UserCheck,
  Zap,
  Users,
  Music,
  UtensilsCrossed,
  Layers,
  Clock,
  X,
  Filter
} from 'lucide-react';

interface ChangeOrderManagerProps {
  weddingId: string;
  changeOrders: ChangeOrder[];
  onApproveOrder?: (id: string) => Promise<void> | void;
  onCreateOrder?: (orderData: Omit<ChangeOrder, 'id' | 'code' | 'createdAt' | 'status' | 'billingStatus' | 'clientApproved'>) => Promise<void> | void;
}

/**
 * ChangeOrderManager component
 *
 * Captures, filters, and approves on-the-day change orders and extra plates.
 */
export const ChangeOrderManager: React.FC<ChangeOrderManagerProps> = ({
  weddingId,
  changeOrders,
  onApproveOrder,
  onCreateOrder
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // New Change Order Form State
  const [expenseType, setExpenseType] = useState<ExpenseCategory>('EXTRA_PLATES');
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('SpiceHeaven Royal Caterers');
  const [vendorId, setVendorId] = useState('vendor-c1');
  const [category, setCategory] = useState('Catering & Banquets');
  const [quantity, setQuantity] = useState<number>(60);
  const [unitPrice, setUnitPrice] = useState<number>(2500);
  const [authorizedBy, setAuthorizedBy] = useState('Mr. Vikram Singh (Father of Bride)');

  const handlePresetSelect = (type: ExpenseCategory) => {
    setExpenseType(type);
    switch (type) {
      case 'EXTRA_PLATES':
        setDescription('Additional Dinner Banquet Plates for Unscheduled Family Guests');
        setVendorName('SpiceHeaven Royal Caterers');
        setVendorId('vendor-c1');
        setCategory('Catering & Banquets');
        setQuantity(60);
        setUnitPrice(2500);
        break;
      case 'EXTRA_DJ_HOURS':
        setDescription('Extended DJ Performance Past Midnight Curfew');
        setVendorName('DJ Shadow & Sound Rig');
        setVendorId('vendor-dj');
        setCategory('Music & Sound');
        setQuantity(1);
        setUnitPrice(15000);
        break;
      case 'GENERATOR':
        setDescription('Emergency 65kVA Silent Generator Hire for Island Lighting');
        setVendorName('Royal Sound & Light Systems');
        setVendorId('vendor-sound');
        setCategory('Technical & Power');
        setQuantity(1);
        setUnitPrice(25000);
        break;
      case 'EXTRA_GUESTS':
        setDescription('Extra Cocktail Canapes & Hospitality Staff for Sangeet');
        setVendorName('SpiceHeaven Royal Caterers');
        setVendorId('vendor-c1');
        setCategory('Catering & Banquets');
        setQuantity(50);
        setUnitPrice(1800);
        break;
      default:
        setDescription('');
        setQuantity(1);
        setUnitPrice(10000);
        break;
    }
  };

  const handleOpenModal = () => {
    handlePresetSelect('EXTRA_PLATES');
    setModalOpen(true);
  };

  const handleSubmitNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateOrder) return;

    await onCreateOrder({
      weddingId,
      description,
      expenseType,
      vendorId,
      vendorName,
      category,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
      authorizedBy
    });

    setModalOpen(false);
  };

  const handleApprove = async (id: string) => {
    if (!onApproveOrder) return;
    setApprovingId(id);
    try {
      await onApproveOrder(id);
    } finally {
      setApprovingId(null);
    }
  };

  const filteredOrders = changeOrders.filter(order => {
    if (filterType === 'ALL') return true;
    if (filterType === 'APPROVED') return order.status === 'APPROVED';
    if (filterType === 'PENDING') return order.status === 'PENDING';
    return order.expenseType === filterType;
  });

  const totalApprovedExtras = changeOrders
    .filter(c => c.status === 'APPROVED')
    .reduce((sum, c) => sum + c.totalAmount, 0);

  const getExpenseIcon = (type?: ExpenseCategory) => {
    switch (type) {
      case 'EXTRA_PLATES':
      case 'EXTRA_GUESTS':
        return <UtensilsCrossed className="w-4 h-4 text-[#C5A059]" />;
      case 'EXTRA_DJ_HOURS':
        return <Music className="w-4 h-4 text-purple-600" />;
      case 'GENERATOR':
        return <Zap className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C5A059]" />
            <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
              Additional Expenses & Change Orders Engine
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logs unexpected wedding-day requirements (+60 guest plates, extra DJ hours, emergency generator). Upon approval, amounts automatically cascade into vendor settlement and client final billing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-100 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Total Approved Extras
            </span>
            <CurrencyDisplay amount={totalApprovedExtras} className="text-base text-emerald-900 font-bold" />
          </div>

          <button
            onClick={handleOpenModal}
            className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#DFCA9B]" />
            <span>Add Additional Expense</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-100 pb-3">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        {[
          { key: 'ALL', label: 'All Extras' },
          { key: 'PENDING', label: 'Pending Approval' },
          { key: 'APPROVED', label: 'Approved & Billed' },
          { key: 'EXTRA_PLATES', label: 'Extra Plates' },
          { key: 'EXTRA_DJ_HOURS', label: 'DJ Hours' },
          { key: 'GENERATOR', label: 'Generators' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              filterType === tab.key
                ? 'bg-[#0D1B2A] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrders.map(order => {
          const isApproved = order.status === 'APPROVED';

          return (
            <div
              key={order.id}
              className={`p-4 rounded-xl border transition-all ${
                isApproved
                  ? 'bg-white border-slate-200 shadow-2xs hover:border-[#C5A059]'
                  : 'bg-amber-50/40 border-amber-200 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {order.code}
                    </span>
                    <StatusBadge
                      label={order.status}
                      variant={isApproved ? 'success' : 'warning'}
                      size="sm"
                    />
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {order.billingStatus === 'BILLED_TO_CLIENT' ? '• Billed to Client' : '• Pending Invoice'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {getExpenseIcon(order.expenseType)}
                    <h4 className="font-bold text-sm text-[#0D1B2A]">{order.description}</h4>
                  </div>

                  <p className="text-xs text-slate-500">
                    Vendor: <strong className="text-slate-700">{order.vendorName}</strong> ({order.category})
                  </p>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Scope & Unit Rate</span>
                  <span className="font-mono font-semibold text-slate-800 text-sm">
                    ₹{order.unitPrice.toLocaleString('en-IN')} × {order.quantity} units
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Cost</span>
                  <CurrencyDisplay amount={order.totalAmount} className="text-sm font-bold text-[#1B3B6F]" />
                </div>
              </div>

              {/* Authorization & Actions */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Auth: <strong className="text-slate-800">{order.authorizedBy}</strong></span>
                </div>

                {isApproved ? (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approved & Reconciled</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleApprove(order.id)}
                    disabled={approvingId === order.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{approvingId === order.id ? 'Approving...' : 'Sign & Approve'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Additional Expense */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D1B2A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                  Log Additional Expense / Change Order
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record on-the-day scope modifications requiring client authorization.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Quick Scope Presets:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetSelect('EXTRA_PLATES')}
                  className={`text-xs p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    expenseType === 'EXTRA_PLATES'
                      ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A]'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4 mx-auto mb-1 text-[#C5A059]" />
                  <span>+60 Plates</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('EXTRA_DJ_HOURS')}
                  className={`text-xs p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    expenseType === 'EXTRA_DJ_HOURS'
                      ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A]'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Music className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                  <span>+1 Hr DJ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('GENERATOR')}
                  className={`text-xs p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    expenseType === 'GENERATOR'
                      ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A]'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Zap className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                  <span>65kVA Genset</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitNewOrder} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vendor Partner <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={vendorId}
                    onChange={e => {
                      const id = e.target.value;
                      setVendorId(id);
                      if (id === 'vendor-c1') {
                        setVendorName('SpiceHeaven Royal Caterers');
                        setCategory('Catering & Banquets');
                      } else if (id === 'vendor-dj') {
                        setVendorName('DJ Shadow & Sound Rig');
                        setCategory('Music & Sound');
                      } else {
                        setVendorName('Royal Sound & Light Systems');
                        setCategory('Technical & Power');
                      }
                    }}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  >
                    <option value="vendor-c1">SpiceHeaven Royal Caterers</option>
                    <option value="vendor-dj">DJ Shadow & Sound Rig</option>
                    <option value="vendor-sound">Royal Sound & Light Systems</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Authorizer <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={authorizedBy}
                    onChange={e => setAuthorizedBy(e.target.value)}
                    placeholder="e.g. Mr. Vikram Singh"
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity / Hours / Units <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Price (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={unitPrice}
                    onChange={e => setUnitPrice(Number(e.target.value))}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              {/* Total Calculation Banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500">Calculated Additional Amount:</span>
                <CurrencyDisplay amount={quantity * unitPrice} className="text-base font-bold text-[#1B3B6F]" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-[#DFCA9B]" />
                  <span>Create Change Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
