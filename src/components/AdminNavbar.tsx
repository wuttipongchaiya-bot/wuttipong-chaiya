import React from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  LogOut,
  ExternalLink,
  ShieldCheck,
  User,
} from 'lucide-react';
import { AdminUser } from '../types/auth';

interface AdminNavbarProps {
  activeAdminTab: 'approval' | 'rooms' | 'school-data' | 'calendar';
  setActiveAdminTab: (tab: 'approval' | 'rooms' | 'school-data' | 'calendar') => void;
  pendingCount: number;
  roomsCount: number;
  adminUser: AdminUser;
  onLogout: () => void;
  onSwitchToFrontend: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  activeAdminTab,
  setActiveAdminTab,
  pendingCount,
  roomsCount,
  adminUser,
  onLogout,
  onSwitchToFrontend,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand & Admin Mode Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight leading-none">
                ระบบจัดการหลังบ้าน
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-400/20 uppercase">
                Officer Portal
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal hidden sm:block mt-0.5">
              อนุมัติคำขอจอง · จัดการห้องประชุม · จัดการปฏิทินโรงเรียน
            </span>
          </div>
        </div>

        {/* Center: Admin Tabs for Desktop */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveAdminTab('approval')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 relative ${
              activeAdminTab === 'approval'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            อนุมัติคำขอจอง
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('rooms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeAdminTab === 'rooms'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            จัดการห้องประชุม ({roomsCount})
          </button>

          <button
            onClick={() => setActiveAdminTab('school-data')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeAdminTab === 'school-data'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            ปฏิทินโรงเรียน (Excel)
          </button>

          <button
            onClick={() => setActiveAdminTab('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeAdminTab === 'calendar'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            ภาพรวมปฏิทิน
          </button>
        </nav>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-2">
          {/* Switch to Frontend Button */}
          <button
            onClick={onSwitchToFrontend}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="สลับไปหน้าระบบหน้าบ้านสำหรับคุณครู"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">ไปหน้าบ้าน</span>
          </button>

          {/* Admin User Info Pill */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800 text-right">
            <div className="text-right">
              <div className="text-xs font-semibold text-white leading-tight">
                {adminUser.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                {adminUser.roleTitle}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold border border-indigo-400/40">
              {adminUser.name.charAt(0)}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 transition-colors flex items-center gap-1 cursor-pointer"
            title="ออกจากระบบหลังบ้าน"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
