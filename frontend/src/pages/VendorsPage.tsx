import React, { useState } from 'react';
import { Store, Phone, Star, ShieldCheck, Award, Sparkles, Filter } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';

export const VendorsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const vendorList = [
    { id: 'v-01', name: 'SpiceHeaven Royal Caterers', category: 'CATERING', location: 'Jaipur & Udaipur', rating: 4.9, punctuality: '98%', status: 'CONTRACTED', contact: 'Chef Raghvendra Singh (+91 98290 55443)' },
    { id: 'v-02', name: 'Mewar Gourmet Kitchen', category: 'CATERING', location: 'Udaipur', rating: 4.6, punctuality: '92%', status: 'STANDBY', contact: 'Kailash Meena (+91 98291 22334)' },
    { id: 'v-03', name: 'Jaipur Floral Arts & Decor', category: 'DECOR', location: 'Jaipur', rating: 4.8, punctuality: '95%', status: 'CONTRACTED', contact: 'Harsh Vardhan (+91 94140 12345)' },
    { id: 'v-04', name: 'DJ Shadow & Sound Rig', category: 'SOUND', location: 'Mumbai & Udaipur', rating: 4.5, punctuality: '88%', status: 'ACTIVE_LATE', contact: 'Sunny K (+91 98200 99881)' },
    { id: 'v-05', name: 'Stories by Joseph Radhik', category: 'PHOTOGRAPHY', location: 'Pan-India', rating: 5.0, punctuality: '100%', status: 'CONTRACTED', contact: 'Mohit Rao (+91 98199 00112)' },
    { id: 'v-06', name: 'Royal Nagada Drummers & Shehnai', category: 'FOLK_MUSIC', location: 'Udaipur', rating: 4.9, punctuality: '96%', status: 'CONTRACTED', contact: 'Ustad Banne Khan (+91 94141 88990)' }
  ];

  const categories = ['ALL', 'CATERING', 'DECOR', 'SOUND', 'PHOTOGRAPHY', 'FOLK_MUSIC'];

  const filtered = selectedCategory === 'ALL' ? vendorList : vendorList.filter(v => v.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Vendor Directory & Reliability Scorecards
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 1.2: The Royal Knot maintains ~18 different vendor categories (caterers, decorators, drummers, sound, pyrotechnics) with verified on-time ratings.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Category:</span>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
              selectedCategory === c
                ? 'bg-[#1B3B6F] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(vendor => (
          <div key={vendor.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#C5A059] uppercase">{vendor.category}</span>
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">{vendor.name}</h3>
                <p className="text-xs text-slate-500">{vendor.location}</p>
              </div>
              <StatusBadge
                label={vendor.status}
                variant={vendor.status === 'ACTIVE_LATE' ? 'danger' : 'success'}
                size="sm"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 font-bold text-slate-800">
                <Star className="w-3.5 h-3.5 fill-[#C5A059] text-[#C5A059]" />
                <span>{vendor.rating} / 5.0</span>
              </div>
              <div className="text-slate-600">
                Punctuality: <span className="font-bold text-emerald-700">{vendor.punctuality}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{vendor.contact}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
