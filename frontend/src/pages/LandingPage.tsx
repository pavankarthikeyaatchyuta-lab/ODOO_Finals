/**
 * =============================================================================
 * File: LandingPage.tsx
 * Module: Agency Operations Page
 * =============================================================================
 * Delivers full-scale wedding planning and coordination workspace for LandingPage, supporting real-time data inspection, filtering, and reporting.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_PROFILES, AppRole, PortalType } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import {
  Crown,
  Heart,
  Sparkles,
  ShieldCheck,
  Clock,
  Building,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Users,
  Calendar,
  CreditCard,
  FileCheck2,
  Phone,
  MessageSquare,
  Lock,
  Compass,
  Star,
  Award,
  ArrowUpRight,
  Eye,
  Sliders,
  DollarSign
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { StaticHeroCrest } from '../components/landing/StaticHeroCrest';
import { RoyalLogo } from '../components/common/RoyalLogo';
const HeroScene3D = React.lazy(() => import('../components/landing/HeroScene3D'));

import { PalaceGalleryScrub } from '../components/landing/PalaceGalleryScrub';

interface LandingPageProps {
  onEnterPortal: (role?: AppRole, portal?: PortalType) => void;
  onNavigateToLogin: () => void;
}

/**
 * LandingPage component
 *
 * Public landing showcase highlighting royal destination wedding management capabilities.
 */
export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPortal,
  onNavigateToLogin
}) => {
  const { login } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [shouldMount3D, setShouldMount3D] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
      if (!gl) return;
    } catch {
      return;
    }

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => setShouldMount3D(true), { timeout: 1500 });
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(() => setShouldMount3D(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionRef, setSubmissionRef] = useState('');

  // Form State for Royal Intake
  const [coupleName, setCoupleName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [destination, setDestination] = useState('Taj Lake Palace, Udaipur');
  const [targetDate, setTargetDate] = useState('2027-02-14');
  const [guestCount, setGuestCount] = useState('450');
  const [budget, setBudget] = useState('40000000');
  const [packageType, setPackageType] = useState<'full_service' | 'day_of'>('full_service');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickDemoLaunch = async (role: AppRole, portal: PortalType) => {
    const profile = DEMO_PROFILES[role];
    if (profile) {
      await login(profile.email, 'royalKnot2026!', portal);
      onEnterPortal(role, portal);
    }
  };

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleName || !phone) return;
    setIsSubmitting(true);
    try {
      const created = await api.createEnquiry({
        coupleName,
        phone,
        email: email || `${coupleName.toLowerCase().replace(/\s+/g, '.')}@wedding.in`,
        targetDate,
        guestCount: parseInt(guestCount) || 450,
        theme: `Heritage Destination at ${destination}`,
        budgetMax: parseFloat(budget) || 40000000,
        packageType,
        source: 'INSTAGRAM',
        status: 'NEW',
        assignedPlanner: 'Priya Mehra (Lead Luxury Director)',
        notes: notes || `Direct luxury intake submission for ${destination}.`,
        agreementSigned: false
      });
      setSubmissionRef(`TRK-REQ-${created.id.substring(0, 8).toUpperCase()}`);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting enquiry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0D1B2A] font-sans selection:bg-[#C5A059]/20 selection:text-[#0D1B2A]">
      {/* 1. Royal Top Announcement Bar */}
      <div className="bg-[#0D1B2A] text-white border-b border-[#C5A059]/20 px-4 py-2 text-center text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 font-medium">
          <span className="inline-flex items-center gap-1.5 text-[#C5A059]">
            <Crown className="w-3.5 h-3.5" />
            <strong className="tracking-wide uppercase text-[10px] font-bold">The Royal Knot OS 2.0</strong>
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-300">
            Now live for 2026–2027 Royal Palace destination weddings across Rajasthan & International Estates.
          </span>
          <button
            onClick={() => setIsConsultationModalOpen(true)}
            className="text-[#C5A059] underline underline-offset-4 hover:text-white transition-colors text-xs font-semibold"
          >
            Request Private Consultation &rarr;
          </button>
        </div>
      </div>

      {/* 2. Primary Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <RoyalLogo size="sm" />
            <div>
              <span className="font-serif font-bold text-lg tracking-wider text-[#0D1B2A] block leading-none">
                THE ROYAL KNOT
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] block mt-1">
                Luxury Wedding Architects
              </span>
            </div>
          </div>

          {/* Desktop Center Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-700">
            <a href="#ecosystem" className="hover:text-[#C5A059] transition-colors">
              Platform Architecture
            </a>
            <a href="#portals" className="hover:text-[#C5A059] transition-colors">
              Stakeholder Portals
            </a>
            <a href="#differentiators" className="hover:text-[#C5A059] transition-colors">
              Operational Standards
            </a>
            <a href="#destinations" className="hover:text-[#C5A059] transition-colors">
              Palace Estates
            </a>
            <a href="#interactive-demo" className="text-[#C5A059] hover:underline font-bold">
              Live Demo Sandbox
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToLogin}
              className="text-xs font-semibold"
            >
              Sign In
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={() => setIsConsultationModalOpen(true)}
              className="text-xs font-bold shadow-sm"
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Book Consultation
            </Button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Soft Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-10 right-10 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-4xl mx-auto space-y-6"
          >

            {/* Stage 1 Centerpiece: Static Royal Seal Crest with Deferred 3D Progressive Upgrade */}
            <div className="flex justify-center pb-2">
              {shouldMount3D ? (
                <React.Suspense fallback={<StaticHeroCrest />}>
                  <HeroScene3D />
                </React.Suspense>
              ) : (
                <StaticHeroCrest />
              )}
            </div>

            {/* Main Title */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0D1B2A] leading-[1.12]">
              Where Ancient Regal Heritage Meets{' '}
              <span className="italic font-normal text-[#C5A059] underline decoration-[#C5A059]/40 underline-offset-8">
                Flawless Execution
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              The Royal Knot bridges bridal couples, luxury destination architects, and hundreds of verified hospitality artisans into a single synchronized ecosystem. No scattered WhatsApp chats. No rogue expenses. Zero delayed ceremonies.
            </p>

            {/* Hero CTAs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#interactive-demo"
                className="px-6 py-3.5 rounded-xl bg-[#0D1B2A] text-[#C5A059] border border-[#C5A059]/40 font-bold text-sm hover:bg-slate-900 transition-all shadow-md flex items-center gap-2.5 group"
              >
                <span>Launch Interactive Demo Sandbox</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <Button
                variant="gold"
                size="lg"
                onClick={() => setIsConsultationModalOpen(true)}
                className="shadow-md text-sm font-bold"
                leftIcon={<Crown className="w-4 h-4" />}
              >
                Reserve Your Wedding Date
              </Button>
            </div>

            {/* Real-Time Live Telemetry Bar */}
            <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0D1B2A]">₹180 Cr+</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                  Budget Managed
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#C5A059]">100%</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                  Closed-Loop Protocol
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
                <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-600">25+</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                  Palaces & Forts Live
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
                <div className="text-2xl sm:text-3xl font-serif font-bold text-blue-600">0s</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                  Delayed Ceremony Vows
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. Interactive Demo Role Sandbox */}
      <section id="interactive-demo" className="py-16 bg-[#F5F1E8]/60 border-y border-[#C5A059]/25 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">
              Hands-On Evaluation
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D1B2A]">
              Explore The Platform Through Any Lens
            </h2>
            <p className="text-sm text-slate-600">
              Select any stakeholder role below to launch the live platform instantly with pre-configured destination data (Wedding of Rahul & Ananya at Taj Lake Palace, Udaipur).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Founder Card */}
            <div
              onClick={() => handleQuickDemoLaunch('FOUNDER', 'AGENCY')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#C5A059] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#0D1B2A] text-[#C5A059] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Crown className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C5A059] bg-[#F5F1E8] px-2.5 py-0.5 rounded-full border border-[#C5A059]/30">
                  Executive Suite
                </span>
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A] mt-2">
                  Founder & CEO
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Full agency oversight, season profitability analytics, and complete master governance.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0D1B2A] group-hover:text-[#C5A059]">
                <span>Launch Founder OS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Lead Planner Card */}
            <div
              onClick={() => handleQuickDemoLaunch('PLANNER', 'AGENCY')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#C5A059] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#F5F1E8] text-[#C5A059] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#C5A059]/30">
                  <Sliders className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Lead Director
                </span>
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A] mt-2">
                  Lead Wedding Planner
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  3-Caterer RFQ matrix, client intake pipeline, digital agreements, and 25+ automated tasks.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0D1B2A] group-hover:text-[#C5A059]">
                <span>Launch Planner View</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* On-Site Coordinator Card */}
            <div
              onClick={() => handleQuickDemoLaunch('COORDINATOR', 'AGENCY')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#C5A059] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-amber-200">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Live Operations
                </span>
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A] mt-2">
                  Ground Coordinator
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Live Command Centre, late arrival tracking radar, delay broadcasting & incident resolution.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0D1B2A] group-hover:text-[#C5A059]">
                <span>Launch Command Centre</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Finance Director Card */}
            <div
              onClick={() => handleQuickDemoLaunch('FINANCE', 'AGENCY')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#C5A059] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-emerald-200">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Escrow & Audit
                </span>
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A] mt-2">
                  Finance Manager
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  5-Way vendor reconciliation, anti-duplicate payout shield, and +60 guest change orders.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0D1B2A] group-hover:text-[#C5A059]">
                <span>Launch Finance View</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Caterer & Vendor Partner Card */}
            <div
              onClick={() => handleQuickDemoLaunch('VENDOR', 'VENDOR')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#C5A059] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-orange-200">
                  <Building className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full">
                  Partner Extranet
                </span>
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A] mt-2">
                  Vendor Partner (All Categories)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Dedicated vendor portal: Call-time schedule, 1-click delay acknowledgment, and invoice status.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0D1B2A] group-hover:text-[#C5A059]">
                <span>Launch Vendor Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* The Couple Suite Card */}
            <div
              onClick={() => handleQuickDemoLaunch('CLIENT', 'CLIENT')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#C5A059] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-rose-200">
                  <Heart className="w-6 h-6 fill-rose-100" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  Couple Suite
                </span>
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A] mt-2">
                  Rahul & Ananya
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Luxury bridal countdown, ceremony dress codes, verified agreements, and payment schedule.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0D1B2A] group-hover:text-[#C5A059]">
                <span>Launch Couple Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Family Coordinator Card */}
            <div
              onClick={() => handleQuickDemoLaunch('FAMILY', 'CLIENT')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#C5A059] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-blue-200">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  Family Access
                </span>
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A] mt-2">
                  Father of the Bride
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Restricted family mode: Ceremony schedule and logistics with billing & contracts strictly hidden.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0D1B2A] group-hover:text-[#C5A059]">
                <span>Launch Family Mode</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Custom Log In Card */}
            <div
              onClick={onNavigateToLogin}
              className="bg-[#0D1B2A] text-white p-6 rounded-2xl border border-[#C5A059]/40 hover:border-[#C5A059] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/10 text-[#C5A059] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#C5A059]/30">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-0.5 rounded-full border border-[#C5A059]/30">
                  Secure Auth
                </span>
                <h3 className="font-serif font-bold text-lg text-[#F5F1E8] mt-2">
                  Custom Credentials
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Sign in with your enterprise credentials, invite token, or reset forgotten password.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#C5A059]">
                <span>Go to Login Screen</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Core Operational Standards (Differentiators) */}
      <section id="differentiators" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">
              Built for Scale & Zero Tolerances
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D1B2A]">
              Three Pillars of Flawless Execution
            </h2>
            <p className="text-sm text-slate-600">
              Unlike generic CRM tools or messaging groups, The Royal Knot enforces strict architectural guardrails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-8 rounded-3xl bg-[#FDFBF7] border border-slate-200/90 space-y-4 hover:border-[#C5A059] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#0D1B2A] text-[#C5A059] flex items-center justify-center font-bold text-lg shadow-sm">
                01
              </div>
              <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
                Closed-Loop Delay Dispatch
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When a royal elephant procession shifts by 25 minutes, our closed-loop engine pushes revised times to affected caterers and decorators. Directives remain in an active alert state until explicitly acknowledged.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#C5A059]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero unconfirmed schedule changes</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-3xl bg-[#FDFBF7] border border-slate-200/90 space-y-4 hover:border-[#C5A059] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#0D1B2A] text-[#C5A059] flex items-center justify-center font-bold text-lg shadow-sm">
                02
              </div>
              <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
                5-Way Escrow Reconciliation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vendor bills are automatically compared against original signed RFQs, approved change orders (+60 guest plate additions), advances paid via RTGS, and on-site supervisor sign-offs with anti-duplicate shields.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Guaranteed 48h verified disbursement</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 rounded-3xl bg-[#FDFBF7] border border-slate-200/90 space-y-4 hover:border-[#C5A059] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#0D1B2A] text-[#C5A059] flex items-center justify-center font-bold text-lg shadow-sm">
                03
              </div>
              <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
                Digital Agreement Gating
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Proprietary RFQ comparisons, architectural mandap blueprints, and caterer pricing structures are cryptographically gated until digital signatures are verified between couple and agency director.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-blue-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Strict intellectual property protection</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Iconic Palace Estates Showcase */}
      <PalaceGalleryScrub />

      {/* 7. Call To Action Banner */}
      <section className="py-20 bg-[#0D1B2A] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] mx-auto shadow-md">
            <Crown className="w-8 h-8" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F1E8]">
            Initiate Your Destination Celebration
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Due to our commitment to absolute precision, The Royal Knot accepts a maximum of six destination celebrations per season. Inquire early to lock your dates.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="gold"
              size="lg"
              onClick={() => setIsConsultationModalOpen(true)}
              className="text-sm font-bold shadow-lg"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Request Royal Date Feasibility
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onNavigateToLogin}
              className="border-slate-500 text-white hover:bg-white/10 text-sm font-semibold"
            >
              Sign In to Your Portal
            </Button>
          </div>
        </div>
      </section>

      {/* 8. Luxury Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0D1B2A] text-[#C5A059] flex items-center justify-center font-bold">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-sm text-[#0D1B2A]">THE ROYAL KNOT</span>
              <p className="text-[11px] text-slate-400">Luxury Wedding Architects Private Limited</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <span>Udaipur: Lake Palace Road</span>
            <span>Mumbai: Nariman Point</span>
            <span>Direct Concierge: +91 98290 11223</span>
          </div>

          <div className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} The Royal Knot. Strict Confidentiality & Non-Disclosure Active.
          </div>
        </div>
      </footer>

      {/* Royal Consultation / Intake Modal */}
      <Modal
        isOpen={isConsultationModalOpen}
        onClose={() => {
          setIsConsultationModalOpen(false);
          setIsSubmitted(false);
        }}
        title="Royal Wedding Feasibility & Date Reservation"
        maxWidth="lg"
      >
        {isSubmitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Feasibility Request Registered
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Your inquiry has been submitted directly to Lead Director Priya Mehra. Reference Code: <strong className="font-mono text-[#0D1B2A]">{submissionRef}</strong>
            </p>
            <div className="p-4 rounded-xl bg-[#F5F1E8]/70 border border-[#C5A059]/40 text-left text-xs space-y-1.5 max-w-sm mx-auto">
              <div><strong>Couple:</strong> {coupleName}</div>
              <div><strong>Destination:</strong> {destination}</div>
              <div><strong>Projected Date:</strong> {targetDate}</div>
              <div><strong>Scope:</strong> {packageType === 'full_service' ? 'Full-Service Royal Architecture' : 'Day-of Management'}</div>
            </div>
            <div className="pt-2">
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  setIsConsultationModalOpen(false);
                  setIsSubmitted(false);
                  onNavigateToLogin();
                }}
              >
                Access Client Portal
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleIntakeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Couple Full Names">
                <Input
                  value={coupleName}
                  onChange={e => setCoupleName(e.target.value)}
                  placeholder="e.g. Vikram & Radhika"
                  required
                />
              </FormField>

              <FormField label="WhatsApp / Phone Contact">
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98290 00000"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Confidential Email Address">
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vikram.radhika@wedding.in"
                />
              </FormField>

              <FormField label="Target Celebration Date">
                <Input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Preferred Palace Venue">
                <Select
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  options={[
                    { value: 'Taj Lake Palace, Udaipur', label: 'Taj Lake Palace, Udaipur' },
                    { value: 'Umaid Bhawan Palace, Jodhpur', label: 'Umaid Bhawan Palace, Jodhpur' },
                    { value: 'Rambagh Palace, Jaipur', label: 'Rambagh Palace, Jaipur' },
                    { value: 'Villa d’Este, Lake Como', label: 'Villa d’Este, Lake Como' }
                  ]}
                />
              </FormField>

              <FormField label="Projected Guest Count">
                <Input
                  type="number"
                  value={guestCount}
                  onChange={e => setGuestCount(e.target.value)}
                  placeholder="450"
                  required
                />
              </FormField>

              <FormField label="Planning Scope">
                <Select
                  value={packageType}
                  onChange={e => setPackageType(e.target.value as any)}
                  options={[
                    { value: 'full_service', label: 'Full-Service Royal Architecture' },
                    { value: 'day_of', label: 'Day-of Ground Coordination' }
                  ]}
                />
              </FormField>
            </div>

            <FormField label="Estimated Budget Range (INR)">
              <Input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="40000000"
                required
              />
            </FormField>

            <FormField label="Special Vision, Ceremonies & Heritage Requirements">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                placeholder="e.g. Lotus mandap at Jagmandir courtyard, 4 multi-tier culinary pavilions, private fireworks clearance."
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConsultationModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                size="sm"
                loading={isSubmitting}
                leftIcon={<Crown className="w-4 h-4" />}
              >
                Register Consultation
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
