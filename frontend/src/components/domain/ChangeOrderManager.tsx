import React from 'react';
import { ChangeOrder } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { StatusBadge } from '../common/StatusBadge';
import { FileText, CheckCircle2, ShieldAlert, PlusCircle, UserCheck } from 'lucide-react';

interface ChangeOrderManagerProps {
  changeOrders: ChangeOrder[];
  onApproveOrder?: (id: string) => void;
}

export const ChangeOrderManager: React.FC<ChangeOrderManagerProps> = ({
  changeOrders,
  onApproveOrder
}) => {
  const totalApprovedExtras = changeOrders
    .filter(c => c.status === 'APPROVED')
    .reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#C5A059]" />
            Change Orders & Additional Event Costs
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time scope additions recorded during the event (+60 banquet guests, extended DJ hours) with client authorization.
          </p>
        </div>

        <div className="bg-[#F5F1E8] px-3.5 py-1.5 rounded-xl border border-[#C5A059]/30 text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Approved Client Additions
          </span>
          <CurrencyDisplay amount={totalApprovedExtras} className="text-base text-[#1B3B6F]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {changeOrders.map(order => {
          const isApproved = order.status === 'APPROVED';

          return (
            <div
              key={order.id}
              className={`p-4 rounded-xl border transition-all ${
                isApproved
                  ? 'bg-white border-slate-200 shadow-2xs'
                  : 'bg-amber-50/30 border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{order.code}</span>
                    <StatusBadge
                      label={order.status}
                      variant={isApproved ? 'success' : 'warning'}
                      size="sm"
                    />
                  </div>
                  <h4 className="font-bold text-sm text-[#0D1B2A] mt-1">{order.description}</h4>
                  <p className="text-xs text-slate-500">{order.vendorName} ({order.category})</p>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="mt-3 bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Unit Rate: </span>
                  <span className="font-mono font-semibold">₹{order.unitPrice.toLocaleString('en-IN')} × {order.quantity}</span>
                </div>
                <div>
                  <span className="text-slate-500 mr-1">Total:</span>
                  <CurrencyDisplay amount={order.totalAmount} className="text-sm text-[#1B3B6F]" />
                </div>
              </div>

              {/* Authorization */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-800">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {order.authorizedBy}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {order.createdAt}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
