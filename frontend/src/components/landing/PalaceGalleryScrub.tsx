import React, { useState } from 'react';
import { MapPin, Users, Building, ShieldCheck } from 'lucide-react';

interface PalaceEstate {
  id: string;
  name: string;
  city: string;
  region: string;
  heritage: string;
  capacity: string;
  suites: string;
  tagline: string;
  image: string;
  highlights: string[];
}

const PALACE_ESTATES: PalaceEstate[] = [
  {
    id: 'taj-lake-palace',
    name: 'Taj Lake Palace',
    city: 'Udaipur',
    region: 'Rajasthan',
    heritage: '1746 Imperial Island Palace',
    capacity: '250 Guests (Exclusive)',
    suites: '65 Palace Suites',
    tagline: 'Floating marble masterpiece on Lake Pichola with private royal barge transit.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    highlights: ['Jagmandir Island Vows', 'Private Boat Arrival Protocol', 'Full Lake Isolation']
  },
  {
    id: 'rambagh-palace',
    name: 'Rambagh Palace',
    city: 'Jaipur',
    region: 'Rajasthan',
    heritage: '1835 Former Maharaja Residence',
    capacity: '800 Guests (Grand Lawn)',
    suites: '78 Royal Rooms',
    tagline: '47 acres of manicured gardens, peacock walks, and authentic Rajput court ballrooms.',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
    highlights: ['Kesar Bagh Sangeet Lawns', 'Vintage Rolls Royce Escort', 'Polo Lounge Afterparties']
  },
  {
    id: 'umaid-bhawan-palace',
    name: 'Umaid Bhawan Palace',
    city: 'Jodhpur',
    region: 'Rajasthan',
    heritage: '1943 Art Deco Sandstone Citadel',
    capacity: '1,200 Guests (Palace Forecourt)',
    suites: '70 Art Deco Suites',
    tagline: 'One of the world’s largest private residences perched on Chittar Hill.',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    highlights: ['Baradari Grand Mandap', 'Museum Courtyard Dinners', 'Private Jet Helipad']
  }
];

export const PalaceGalleryScrub: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('taj-lake-palace');

  const selectedEstate = PALACE_ESTATES.find(p => p.id === selectedId) || PALACE_ESTATES[0];

  return (
    <section id="destinations" className="py-20 lg:py-28 bg-[#0D1B2A] text-white relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#1B3B6F]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B3B6F]/40 border border-[#C5A059]/30 text-[#DFCA9B] text-xs font-bold tracking-wider uppercase mb-4">
            <Building className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Verified Sovereign Venues</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#FDFBF7]">
            Iconic Palace Estates Under Unified Protocol
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed">
            The Royal Knot coordinates directly with the heritage hospitality directorates of India’s most revered forts and palaces, ensuring zero logistical friction across high-security historical properties.
          </p>
        </div>

        {/* Selected Estate Spotlight Banner */}
        <div className="mb-10 rounded-3xl bg-slate-900/80 border border-[#C5A059]/30 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Visual Estate Image */}
            <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto min-h-[340px] overflow-hidden">
              <img
                src={selectedEstate.image}
                alt={selectedEstate.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-block px-3 py-1 rounded-lg bg-[#0D1B2A]/90 border border-[#C5A059]/40 text-[#DFCA9B] text-xs font-semibold uppercase tracking-wider mb-2">
                  {selectedEstate.heritage}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
                  {selectedEstate.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-200 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{selectedEstate.city}, {selectedEstate.region}</span>
                </div>
              </div>
            </div>

            {/* Estate Intelligence Panel */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">
                  Architectural Dossier
                </span>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  {selectedEstate.tagline}
                </p>

                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[11px] uppercase font-bold text-slate-400 block">Ceremony Capacity</span>
                    <span className="text-sm font-semibold text-[#DFCA9B] mt-0.5 block flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                      {selectedEstate.capacity}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[11px] uppercase font-bold text-slate-400 block">Inventory</span>
                    <span className="text-sm font-semibold text-[#DFCA9B] mt-0.5 block flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#C5A059]" />
                      {selectedEstate.suites}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                    Verified Protocols
                  </span>
                  <div className="space-y-2">
                    {selectedEstate.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400">Pre-inspected 3D spatial scans ready</span>
                <a
                  href="#interactive-demo"
                  className="text-xs font-bold text-[#C5A059] hover:underline flex items-center gap-1"
                >
                  Explore in Sandbox &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Estate Selector Thumbnails */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PALACE_ESTATES.map(estate => {
            const isSelected = estate.id === selectedId;
            return (
              <div
                key={estate.id}
                onClick={() => setSelectedId(estate.id)}
                className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'bg-linear-to-b from-[#1B3B6F]/50 to-[#0D1B2A] border-[#C5A059] shadow-lg shadow-[#C5A059]/10'
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#C5A059]">{estate.city}</span>
                  {isSelected && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C5A059] text-[#0D1B2A]">
                      Viewing
                    </span>
                  )}
                </div>
                <h4 className="font-serif font-bold text-base text-white">{estate.name}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{estate.heritage}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
