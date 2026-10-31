import React from 'react';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileCheck2,
  Download,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Lock,
  Calendar,
  Building
} from 'lucide-react';

/**
 * ClientDocumentsPage component
 *
 * Client repository for contracts, invoices, and floor plans.
 */
export const ClientDocumentsPage: React.FC = () => {
  const documents = [
    {
      id: 'doc-001',
      title: 'The Royal Knot Master Planning & Execution Agreement',
      category: 'Legal Contract',
      size: '2.4 MB',
      signedAt: '2026-10-12 · 16:45 IST',
      signers: 'Rahul Sharma & Devendra Kaviraj (Director)',
      status: 'VERIFIED & LEGALLY BINDING',
      fileName: 'TRK-2026-Executed-Agreement-RahulAnanya.pdf'
    },
    {
      id: 'doc-002',
      title: 'Architectural Seating & Mandap Floor Plan (Jagmandir)',
      category: 'Venue Blueprint',
      size: '5.1 MB',
      signedAt: '2026-10-20 · Approved',
      signers: 'Taj Hospitality & Lead Architect Siddharth Jain',
      status: 'APPROVED FOR EXECUTION',
      fileName: 'TajLakePalace-Jagmandir-Mandap-Floorplan-V3.pdf'
    },
    {
      id: 'doc-003',
      title: 'Sound, Illumination & Heritage Fire Safety Permissions',
      category: 'Statutory Clearance',
      size: '1.8 MB',
      signedAt: '2026-10-22 · Approved',
      signers: 'Udaipur Municipal & District Administration',
      status: 'STATUTORY COMPLIANCE OK',
      fileName: 'Govt-Udaipur-Heritage-Permits-2026.pdf'
    }
  ];

  const handleDownload = (fileName: string) => {
    alert(`Downloading verified copy of ${fileName}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Executed Contracts & Architectural Blueprints
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 3.3: Digital agreements, verified signatures, and municipal heritage clearances for Rahul & Ananya.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Legally Protected · Cryptographically Verified</span>
        </div>
      </div>

      {/* Primary Signed Contract Highlight */}
      <div className="bg-[#0D1B2A] text-white rounded-2xl p-6 sm:p-8 border border-[#C5A059]/30 relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30">
                MASTER DIGITAL AGREEMENT
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Fully Executed</span>
              </span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F1E8]">
              The Royal Knot Full-Service Wedding Architecture Contract
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Executed between <strong>Rahul Sharma & Ananya Singh</strong> and <strong>The Royal Knot Luxury Weddings Private Limited</strong>. Encompasses full planning concierge, 3-tier vendor management, live timeline command centre, and financial escrow reconciliation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
              <div>
                <span className="text-slate-400">Signers:</span>{' '}
                <strong className="text-white">Rahul Sharma & Devendra Kaviraj</strong>
              </div>
              <div>
                <span className="text-slate-400">Timestamp:</span>{' '}
                <strong className="text-white">12 Oct 2026 at 16:45 IST</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => handleDownload('TRK-2026-Executed-Agreement-RahulAnanya.pdf')}
            >
              Download Executed PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Verified Documents List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
            Archived Project Blueprints & Permissions
          </h3>
          <span className="text-xs text-slate-400">3 verified records</span>
        </div>

        <div className="space-y-3">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F5F1E8] border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {doc.category}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{doc.size}</span>
                  </div>
                  <h4 className="font-bold text-xs text-[#0D1B2A] mt-0.5">{doc.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Signatures: {doc.signers} ({doc.signedAt})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge label={doc.status} variant="success" size="sm" />
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => handleDownload(doc.fileName)}
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
