/**
 * =============================================================================
 * File: ClientOverviewPage.tsx
 * Module: Client / Couple Portal View
 * =============================================================================
 * Delivers bespoke luxury couple interface for ClientOverviewPage, displaying itineraries, digital signatures, invoices, and event updates.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import { Button } from '../../components/common/Button';
import { ClientTabKey } from '../../components/client/ClientPortalLayout';
import { MotionCard } from '../../components/common/MotionCard';
import {
  Heart,
  Clock,
  Sparkles,
  Phone,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users
} from 'lucide-react';

interface ClientOverviewPageProps {
  onNavigateTab: (tab: ClientTabKey) => void;
}

/**
 * ClientOverviewPage component
 *
 * Bridal couple dashboard overview of upcoming milestones and venue dates.
 */
export const ClientOverviewPage: React.FC<ClientOverviewPageProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const weddingCtx = useWedding();
  const isFamily = user?.role === 'FAMILY' || user?.isFamilyMember;

  const activeWed = weddingCtx?.activeWedding;
  const coupleTitle = activeWed?.coupleNames ? `${activeWed.coupleNames}'s Royal Celebration` : (user?.displayName || "{coupleTitle}");
  const venueLocation = activeWed?.location || 'Taj Lake Palace, Udaipur';
  const guestCount = activeWed?.guestCount ? `${activeWed.guestCount}+` : '400+';

  const daysToGo = activeWed?.weddingDate
    ? Math.max(0, Math.ceil((new Date(activeWed.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 84;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Luxury Bridal Hero Banner with Ambient Gold Elevation */}
      <div className="bg-gradient-to-r from-[#0D1B2A] via-[#1a2d42] to-[#0D1B2A] text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-xl border border-[#C5A059]/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C5A059]/20 text-[#DFCA9B] border border-[#C5A059]/30 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>The Royal Wedding Countdown</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F1E8]">
            Rahul & Ananya's Royal Celebration
          </h1>

          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Welcome to your dedicated wedding portal. Our luxury planning team has curated every detail of your celebrations at {venueLocation}.
          </p>

          {/* Countdown & Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#C5A059]">{daysToGo}</div>
              <div className="text-[11px] text-slate-300 uppercase font-semibold tracking-wider mt-1">Days To Go</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-white">{guestCount}</div>
              <div className="text-[11px] text-slate-300 uppercase font-semibold tracking-wider mt-1">Honoured Guests</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-white">4</div>
              <div className="text-[11px] text-slate-300 uppercase font-semibold tracking-wider mt-1">Royal Ceremonies</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-400">100%</div>
              <div className="text-[11px] text-slate-300 uppercase font-semibold tracking-wider mt-1">Agreements Signed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Ceremonies Schedule & Lead Concierge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ceremonies Itinerary */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-serif font-bold text-base text-[#0D1B2A]">
                Ceremony Highlights & Flow
              </h2>
              <p className="text-xs text-slate-500">Curated sequence of events for family and guests</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab('schedule')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Full Schedule
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <MotionCard className="p-4 rounded-xl border border-[#C5A059]/30 bg-[#F5F1E8]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">Day 1 · Afternoon</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">Mehendi & Welcome Lunch</h4>
              <p className="text-xs text-slate-600">Mewar Terrace · Pastel Florals</p>
              <div className="text-xs font-semibold text-slate-700">13:00 - 17:00 IST</div>
            </MotionCard>

            <MotionCard className="p-4 rounded-xl border border-[#C5A059]/30 bg-[#F5F1E8]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">Day 1 · Evening</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">Sangeet & Cocktail Night</h4>
              <p className="text-xs text-slate-600">Zenana Mahal · Royal Velvet & Cocktail</p>
              <div className="text-xs font-semibold text-slate-700">19:30 - Late IST</div>
            </MotionCard>

            <MotionCard className="p-4 rounded-xl border border-[#C5A059]/30 bg-[#F5F1E8]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">Day 2 · Sunset</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">The Royal Vedic Pheras</h4>
              <p className="text-xs text-slate-600">Jagmandir Courtyard · Royal Heritage</p>
              <div className="text-xs font-semibold text-slate-700">17:00 - 20:00 IST</div>
            </MotionCard>

            <MotionCard className="p-4 rounded-xl border border-[#C5A059]/30 bg-[#F5F1E8]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">Day 2 · Night</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">Grand Royal Reception</h4>
              <p className="text-xs text-slate-600">Lakefront Pavilion · Black Tie Elegance</p>
              <div className="text-xs font-semibold text-slate-700">20:30 - 01:00 IST</div>
            </MotionCard>
          </div>
        </div>

        {/* Right: Personal Lead Planner Concierge */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F5F1E8] border border-[#C5A059]/40 flex items-center justify-center font-serif font-bold text-base text-[#C5A059]">
                PM
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-[#0D1B2A]">Priya Mehra</h3>
                <p className="text-xs text-slate-500">Lead Luxury Wedding Director</p>
                <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>On-site in Udaipur</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              "We are honored to design your celebration. Our entire ground coordination team is stationed at Taj Lake Palace ensuring seamless execution."
            </p>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <a
                href="tel:+919829011223"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#0D1B2A] text-white text-xs font-bold hover:bg-[#1B3B6F] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Call Wedding Desk: +91 98290 11223</span>
              </a>

              <a
                href="https://wa.me/919829011223"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>VIP WhatsApp Concierge Channel</span>
              </a>
            </div>
          </div>

          {/* Privacy & Family Protection Notice */}
          {isFamily && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Honoured Family Guest Access:</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Financial statements and commercial vendor invoices are shielded for family member logins.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
