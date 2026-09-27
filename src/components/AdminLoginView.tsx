import React, { useState } from 'react';
import { ShieldCheck, Lock, User, KeyRound, ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { AdminUser, DEMO_ADMIN_ACCOUNTS } from '../types/auth';

interface AdminLoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToFrontend: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onBackToFrontend,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setIsLoading(true);

    // Simulate swift network verification
    setTimeout(() => {
      const match = DEMO_ADMIN_ACCOUNTS.find(
        (acc) => acc.username.toLowerCase() === trimmedUser.toLowerCase() && acc.password === password
      );

      if (match) {
        onLoginSuccess({
          ...match.user,
          loginTime: new Date().toISOString(),
        });
      } else {
        // Also allow generic admin login if password is password/admin123
        if ((trimmedUser.toLowerCase() === 'admin' || trimmedUser.toLowerCase() === 'officer') && (password === 'admin' || password === '123456')) {
          const fallback = DEMO_ADMIN_ACCOUNTS[0];
          onLoginSuccess({
            ...fallback.user,
            username: trimmedUser,
            loginTime: new Date().toISOString(),
          });
        } else {
          setErrorMessage('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (ลองใช้ demo: admin / password)');
          setIsLoading(false);
        }
      }
    }, 400);
  };

  const handleQuickDemoLogin = (account: typeof DEMO_ADMIN_ACCOUNTS[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      onLoginSuccess({
        ...account.user,
        loginTime: new Date().toISOString(),
      });
    }, 300);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBackToFrontend}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าบ้าน</span>
            </button>
            <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/90 border border-indigo-400/40 flex items-center justify-center text-white shadow-lg shadow-indigo-900/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                ระบบจัดการหลังบ้าน
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                สำหรับเจ้าหน้าที่ฝ่ายอาคารและผู้อนุมัติห้อง
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin หรือ officer"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังตรวจสอบสิทธิ์...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>เข้าสู่ระบบหลังบ้าน</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>หรือเลือกเข้าสู่ระบบด่วน (บัญชีทดสอบ):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ADMIN_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc)}
                  className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs group cursor-pointer"
                >
                  <div className="font-semibold text-slate-900 group-hover:text-indigo-600 flex items-center justify-between">
                    <span>{acc.user.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-mono">
                      {acc.username}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {acc.user.roleTitle}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onBackToFrontend}
              className="text-xs text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
            >
              ← กลับสู่ระบบหน้าบ้าน (คุณครู/ผู้ใช้งานทั่วไป)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
