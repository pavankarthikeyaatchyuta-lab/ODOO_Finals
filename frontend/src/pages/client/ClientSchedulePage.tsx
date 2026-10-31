import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Clock,
  MapPin,
  Sparkles,
  Shirt,
  ChevronDown
} from 'lucide-react';

interface CeremonyEvent {
  id: string;
  day: string;
  name: string;
  timeRange: string;
  venueArea: string;
  dressCode: string;
  description: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  isLiveUpdated?: boolean;
  liveNote?: string;
}

/**
 * ClientSchedulePage component
 *
 * Client-facing ceremony schedule and timeline.
 */
export const ClientSchedulePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<'ALL' | 'DAY_1' | 'DAY_2'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>('c-03');
  const shouldReduceMotion = useReducedMotion();

  const events: CeremonyEvent[] = [
    {
      id: 'c-01',
      day: 'Day 1 · Friday',
      name: 'Mehendi & Welcome Brunch',
      timeRange: '13:00 - 17:00 IST',
      venueArea: 'Mewar Terrace & Courtyard, Taj Lake Palace',
      dressCode: 'Sunlit Pastels, Floral Georgettes & Kurtas',
      description: 'Artisanal organic henna application, live Rajasthani folk music, and chilled prosecco by the lake.',
      status: 'COMPLETED'
    },
    {
      id: 'c-02',
      day: 'Day 1 · Friday',
      name: 'The Royal Sangeet & Cocktail Soirée',
      timeRange: '19:30 - 01:00 IST',
      venueArea: 'Zenana Mahal Historic Ballroom',
      dressCode: 'Royal Velvet, Emerald Greens, Tuxedos & Heavy Lehengas',
      description: 'Family dance performances, celebrity DJ sets, multi-tier artisanal cocktail bars, and midnight feast.',
      status: 'COMPLETED'
    },
    {
      id: 'c-03',
      day: 'Day 2 · Saturday',
      name: 'Royal Safa Bandhai & Baraat Procession',
      timeRange: '16:00 - 17:30 IST',
      venueArea: 'Palace Royal Promenade & Boat Jetty',
      dressCode: 'Regal Bandhgalas & Pure Silk Sarees',
      description: 'Traditional turban tie-up ceremony followed by royal boat procession across Lake Pichola accompanied by Dhol players.',
      status: 'UPCOMING'
    },
    {
      id: 'c-04',
      day: 'Day 2 · Saturday',
      name: 'Vedic Pheras & Sunset Garland Exchange',
      timeRange: '17:30 - 20:00 IST',
      venueArea: 'Jagmandir Island Courtyard (Sunset Mandap)',
      dressCode: 'Traditional Indian Heritage Splendor',
      description: 'Sacred Sanskrit mantras chanted during sunset over Lake Pichola with customized lotus floral mandap.',
      status: 'UPCOMING'
    },
    {
      id: 'c-05',
      day: 'Day 2 · Saturday',
      name: 'Grand Royal Reception & Gala Dinner',
      timeRange: '20:30 - 01:00 IST (Adjusted by +30m)',
      venueArea: 'Lakefront Royal Pavilion',
      dressCode: 'Black Tie, Formal Suits & Glamour Gowns',
      description: 'Multi-course royal Awadhi and European banquet curated by Master Chef Vikramaditya, followed by cake cutting and live orchestra.',
      status: 'UPCOMING',
      isLiveUpdated: true,
      liveNote: 'Timetable smoothly shifted by 30 mins to allow relaxed portrait photography during golden hour.'
    }
  ];

  const filteredEvents = events.filter(e => {
    if (selectedDay === 'DAY_1') return e.day.includes('Day 1');
    if (selectedDay === 'DAY_2') return e.day.includes('Day 2');
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Ceremony Itinerary & Dress Code Guide
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live-synchronized run sheet curated by The Royal Knot lead planning architects.
          </p>
        </div>

        {/* Day Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedDay === 'ALL'
                ? 'bg-white text-[#0D1B2A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Itinerary
          </button>
          <button
            onClick={() => setSelectedDay('DAY_1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedDay === 'DAY_1'
                ? 'bg-white text-[#0D1B2A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Day 1 (Mehendi & Sangeet)
          </button>
          <button
            onClick={() => setSelectedDay('DAY_2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedDay === 'DAY_2'
                ? 'bg-white text-[#0D1B2A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Day 2 (Pheras & Reception)
          </button>
        </div>
      </div>

      {/* Events Timeline List */}
      <div className="space-y-4">
        {filteredEvents.map(event => {
          const isExpanded = expandedId === event.id;

          return (
            <div
              key={event.id}
              className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all duration-200 ${
                event.isLiveUpdated ? 'border-[#C5A059] ring-1 ring-[#C5A059]/30' : 'border-slate-200/80'
              }`}
            >
              {/* Clickable Header Card */}
              <div
                onClick={() => toggleExpand(event.id)}
                className="p-6 cursor-pointer hover:bg-slate-50/50 transition-colors flex items-start justify-between gap-4 select-none"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                      {event.day}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-semibold text-slate-500">{event.timeRange}</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#0D1B2A] mt-1">
                    {event.name}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge
                    label={event.status}
                    variant={
                      event.status === 'COMPLETED'
                        ? 'success'
                        : event.status === 'IN_PROGRESS'
                        ? 'warning'
                        : 'info'
                    }
                    size="sm"
                  />
                  <motion.div
                    animate={shouldReduceMotion ? undefined : { rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </motion.div>
                </div>
              </div>

              {/* Accordion Expandable Body with Spring Reveal */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4">
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {event.description}
                      </p>

                      {/* Details Pills: Location & Dress Code */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                        <div className="flex items-start gap-2.5 text-xs text-slate-600">
                          <MapPin className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-800">Venue Location:</strong>
                            <div className="text-slate-600">{event.venueArea}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-xs text-slate-600">
                          <Shirt className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-800">Dress Code:</strong>
                            <div className="text-slate-600">{event.dressCode}</div>
                          </div>
                        </div>
                      </div>

                      {/* Reassuring Live Update Banner */}
                      {event.isLiveUpdated && (
                        <div className="p-3 rounded-xl bg-[#F5F1E8]/80 border border-[#C5A059]/40 flex items-start gap-2.5 text-xs">
                          <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-[#0D1B2A]">Planner Note:</strong>{' '}
                            <span className="text-slate-700">{event.liveNote}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
