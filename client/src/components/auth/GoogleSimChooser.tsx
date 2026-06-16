import { Chrome } from 'lucide-react';
import { nativeAlert } from '../../utils/dialog';

interface GoogleSimChooserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (email: string, name: string) => void;
  customSimEmail: string;
  setCustomSimEmail: (value: string) => void;
  customSimName: string;
  setCustomSimName: (value: string) => void;
  showCustomSimForm: boolean;
  setShowCustomSimForm: (value: boolean) => void;
}

export const GoogleSimChooser: React.FC<GoogleSimChooserProps> = ({
  isOpen,
  onClose,
  onSelect,
  customSimEmail,
  setCustomSimEmail,
  customSimName,
  setCustomSimName,
  showCustomSimForm,
  setShowCustomSimForm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-darkbg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-panel border border-border rounded-lg shadow-2xl p-6 glow-accent animate-fade-in font-mono text-off-white">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2 text-accent">
            <Chrome className="w-4 h-4 shrink-0 animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase">Choose Google Account</span>
          </div>
          <span className="text-[10px] bg-border px-1.5 py-0.5 rounded text-off-white-muted">
            SIM_GATEWAY
          </span>
        </div>

        <p className="text-[11px] text-off-white-muted leading-relaxed mb-4">
          Select a Google account to log in to <span className="text-accent font-bold">DailyOS</span>:
        </p>

        {/* List of Simulated Accounts */}
        <div className="space-y-2.5 max-h-60 overflow-y-auto mb-4 pr-1">
          {[
            { name: 'Aditya Singh', email: 'adityakumar62719@gmail.com', avatar: 'AS' },
            { name: 'Developer Sandbox', email: 'dev.tester@gmail.com', avatar: 'DS' },
            { name: 'Test User B', email: 'test.user.b@gmail.com', avatar: 'TB' }
          ].map((acc) => (
            <button
              key={acc.email}
              onClick={() => onSelect(acc.email, acc.name)}
              className="w-full p-3 bg-card hover:bg-card/75 border border-border hover:border-accent/40 rounded flex items-center gap-3.5 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent font-bold text-xs uppercase group-hover:bg-accent group-hover:text-darkbg transition-colors">
                {acc.avatar}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-off-white truncate">{acc.name}</span>
                <span className="text-[10px] text-off-white-muted truncate mt-0.5">{acc.email}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Collapsible custom account form */}
        <div className="border-t border-border pt-3 mt-3">
          {!showCustomSimForm ? (
            <button
              type="button"
              onClick={() => setShowCustomSimForm(true)}
              className="w-full py-2 border border-border hover:border-accent/20 border-dashed rounded text-[10px] uppercase text-off-white-muted hover:text-accent font-bold text-center transition-all"
            >
              + Use another account
            </button>
          ) : (
            <div className="space-y-3 p-3 bg-card/40 border border-border rounded animate-fade-in">
              <span className="text-[10px] uppercase text-accent font-bold">Add Simulated Account</span>
              
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. customized@gmail.com"
                  value={customSimEmail}
                  onChange={(e) => setCustomSimEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[11px] bg-darkbg border border-border rounded text-off-white focus:border-accent outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Custom User"
                  value={customSimName}
                  onChange={(e) => setCustomSimName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[11px] bg-darkbg border border-border rounded text-off-white focus:border-accent outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomSimForm(false)}
                  className="w-1/2 py-1.5 border border-border hover:bg-red-500/10 rounded text-[9px] uppercase font-bold text-off-white-muted hover:text-red-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const email = customSimEmail.trim();
                    const name = customSimName.trim() || email.split('@')[0] || 'Custom User';
                    if (!email.includes('@')) {
                      nativeAlert('Please enter a valid email address.', 'Invalid Email');
                      return;
                    }
                    onSelect(email, name);
                  }}
                  className="w-full py-1.5 rounded bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white font-bold text-[9px] uppercase transition-all"
                >
                  Add & Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cancel Button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-[9px] uppercase tracking-wider text-off-white-muted hover:underline"
          >
            Go back to login
          </button>
        </div>
      </div>
    </div>
  );
};
