import React from 'react';
import {
  Building2,
  Calendar,
  Clock3,
  Lock,
  PlusCircle,
  ShieldCheck,
  User,
  ArrowRight,
} from 'lucide-react';
import { AdminUser } from '../types/auth';

interface NavbarProps {
  activeTab: 'calendar' | 'booking' | 'rooms' | 'my-bookings';
  setActiveTab: (tab: 'calendar' | 'booking' | 'rooms' | 'my-bookings') => void;
  roomsCount?: number;
  adminUser: AdminUser | null;
  onOpenBackend: () => void;
  myBookingsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  roomsCount,
  adminUser,
  onOpenBackend,
  myBookingsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-sm shadow-indigo-600/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-base sm:text-lg text-slate-900 tracking-tight leading-tight block">
              School Workshop Reserve
            </span>
            <span className="text-[11px] text-slate-500 font-normal hidden sm:block">
              ระบบจองห้องและตรวจสอบปฏิทินโรงเรียน (หน้าบ้าน)
            </span>
          </div>
        </div>

        {/* Zone 2: Frontend Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'calendar'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            ปฏิทินหลัก
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'booking'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            จอง Workshop
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'rooms'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            ข้อมูลห้องประชุม {roomsCount !== undefined ? `(${roomsCount})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 relative ${
              activeTab === 'my-bookings'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock3 className="w-3.5 h-3.5" />
            ติดตามสถานะการจอง
            {myBookingsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
                {myBookingsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Gateway to Backend Portal */}
        <div className="flex items-center gap-2">
          {adminUser ? (
            <button
              onClick={onOpenBackend}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xs cursor-pointer group"
              title="คุณเข้าสู่ระบบเจ้าหน้าที่แล้ว คลิกเพื่อไปหน้าระบบหลังบ้าน"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>ระบบหลังบ้าน</span>
              <span className="hidden lg:inline text-slate-300 font-normal border-l border-slate-700 pl-1.5 text-[11px]">
                {adminUser.name.split(' ')[0]}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              onClick={onOpenBackend}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="สำหรับเจ้าหน้าที่ฝ่ายอาคารและผู้อนุมัติ"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>เข้าสู่ระบบหลังบ้าน</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
