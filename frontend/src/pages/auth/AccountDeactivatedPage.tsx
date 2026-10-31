import React from 'react';
import { UserX, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccountDeactivatedPageProps {
  onReturnToLogin: () => void;
}

/**
 * AccountDeactivatedPage component
 *
 * Suspended account notification screen.
 */
export const AccountDeactivatedPage: React.FC<AccountDeactivatedPageProps> = ({ onReturnToLogin }) => {
  const { logout } = useAuth();

  const handleSignOut = () => {
    logout();
    onReturnToLogin();
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <UserX className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
            Account Deactivated
          </h2>
          <p className="text-xs text-slate-500">
            This account has been deactivated by an Agency Administrator.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left">
          <p className="text-[11px] leading-relaxed">
            If you believe this is an error or require access restored for upcoming destination operations, contact the lead director:
          </p>
          <a
            href="mailto:admin@theroyalknot.com"
            className="text-xs font-semibold text-[#1B3B6F] flex items-center gap-1 mt-2 hover:underline"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>admin@theroyalknot.com</span>
          </a>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Sign Out of Account
        </button>
      </div>
    </div>
  );
};
