import React from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Lock,
  PlusCircle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface BottomTabBarProps {
  portal: 'frontend' | 'backend';
  activeFrontendTab: 'calendar' | 'booking' | 'rooms' | 'my-bookings';
  setActiveFrontendTab: (tab: 'calendar' | 'booking' | 'rooms' | 'my-bookings') => void;
  activeAdminTab: 'approval' | 'rooms' | 'school-data' | 'calendar';
  setActiveAdminTab: (tab: 'approval' | 'rooms' | 'school-data' | 'calendar') => void;
  pendingCount: number;
  myBookingsCount: number;
  onOpenBackend: () => void;
  onSwitchToFrontend: () => void;
  isAdminLoggedIn: boolean;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  portal,
  activeFrontendTab,
  setActiveFrontendTab,
  activeAdminTab,
  setActiveAdminTab,
  pendingCount,
  myBookingsCount,
  onOpenBackend,
  onSwitchToFrontend,
  isAdminLoggedIn,
}) => {
  if (portal === 'backend') {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white border-t border-slate-800 px-1 py-1 safe-area-bottom">
        <div className="grid grid-cols-5 items-center h-14 text-center">
          {/* Admin Tab 1: Approval */}
          <button
            onClick={() => setActiveAdminTab('approval')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors relative ${
              activeAdminTab === 'approval' ? 'text-indigo-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="อนุมัติคำขอ"
          >
            <div className="relative">
              <CheckCircle2 className={`w-5 h-5 ${activeAdminTab === 'approval' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">อนุมัติ</span>
            {activeAdminTab === 'approval' && (
              <span className="w-1 h-1 rounded-full bg-indigo-400 absolute bottom-1" />
            )}
          </button>

          {/* Admin Tab 2: Rooms */}
          <button
            onClick={() => setActiveAdminTab('rooms')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors relative ${
              activeAdminTab === 'rooms' ? 'text-indigo-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="จัดการห้องประชุม"
          >
            <Building2 className={`w-5 h-5 ${activeAdminTab === 'rooms' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">จัดการห้อง</span>
            {activeAdminTab === 'rooms' && (
              <span className="w-1 h-1 rounded-full bg-indigo-400 absolute bottom-1" />
            )}
          </button>

          {/* Admin Tab 3: School Data (Excel) */}
          <button
            onClick={() => setActiveAdminTab('school-data')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors relative ${
              activeAdminTab === 'school-data' ? 'text-indigo-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="ปฏิทินโรงเรียน Excel"
          >
            <FileSpreadsheet className={`w-5 h-5 ${activeAdminTab === 'school-data' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">Excel ร.ร.</span>
            {activeAdminTab === 'school-data' && (
              <span className="w-1 h-1 rounded-full bg-indigo-400 absolute bottom-1" />
            )}
          </button>

          {/* Admin Tab 4: Calendar Preview */}
          <button
            onClick={() => setActiveAdminTab('calendar')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors relative ${
              activeAdminTab === 'calendar' ? 'text-indigo-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="ดูปฏิทิน"
          >
            <Calendar className={`w-5 h-5 ${activeAdminTab === 'calendar' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">ปฏิทิน</span>
            {activeAdminTab === 'calendar' && (
              <span className="w-1 h-1 rounded-full bg-indigo-400 absolute bottom-1" />
            )}
          </button>

          {/* Admin Tab 5: Switch back to frontend */}
          <button
            onClick={onSwitchToFrontend}
            className="min-h-[44px] flex flex-col items-center justify-center text-slate-300 hover:text-white transition-colors"
            aria-label="ไปหน้าบ้าน"
          >
            <ExternalLink className="w-5 h-5 stroke-[1.8] text-indigo-300" />
            <span className="text-[10px] tracking-tight mt-0.5">หน้าบ้าน</span>
          </button>
        </div>
      </div>
    );
  }

  // Frontend mobile bottom bar
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 safe-area-bottom">
      <div className="grid grid-cols-5 items-center h-14 text-center">
        {/* Tab 1: Calendar */}
        <button
          onClick={() => setActiveFrontendTab('calendar')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors relative ${
            activeFrontendTab === 'calendar' ? 'text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="ปฏิทินหลัก"
        >
          <Calendar className={`w-5 h-5 ${activeFrontendTab === 'calendar' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">ปฏิทิน</span>
          {activeFrontendTab === 'calendar' && (
            <span className="w-1 h-1 rounded-full bg-indigo-600 absolute bottom-1" />
          )}
        </button>

        {/* Tab 2: Booking */}
        <button
          onClick={() => setActiveFrontendTab('booking')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors relative ${
            activeFrontendTab === 'booking' ? 'text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="จอง Workshop"
        >
          <PlusCircle className={`w-5 h-5 ${activeFrontendTab === 'booking' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">จองห้อง</span>
          {activeFrontendTab === 'booking' && (
            <span className="w-1 h-1 rounded-full bg-indigo-600 absolute bottom-1" />
          )}
        </button>

        {/* Tab 3: Rooms Directory */}
        <button
          onClick={() => setActiveFrontendTab('rooms')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors relative ${
            activeFrontendTab === 'rooms' ? 'text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="ข้อมูลห้องประชุม"
        >
          <Building2 className={`w-5 h-5 ${activeFrontendTab === 'rooms' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">ห้องประชุม</span>
          {activeFrontendTab === 'rooms' && (
            <span className="w-1 h-1 rounded-full bg-indigo-600 absolute bottom-1" />
          )}
        </button>

        {/* Tab 4: My Bookings Tracking */}
        <button
          onClick={() => setActiveFrontendTab('my-bookings')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors relative ${
            activeFrontendTab === 'my-bookings' ? 'text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="ติดตามสถานะจอง"
        >
          <div className="relative">
            <Clock3 className={`w-5 h-5 ${activeFrontendTab === 'my-bookings' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
            {myBookingsCount > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {myBookingsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">สถานะจอง</span>
          {activeFrontendTab === 'my-bookings' && (
            <span className="w-1 h-1 rounded-full bg-indigo-600 absolute bottom-1" />
          )}
        </button>

        {/* Tab 5: Portal Gateway to Backend */}
        <button
          onClick={onOpenBackend}
          className="min-h-[44px] flex flex-col items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors"
          aria-label="ระบบหลังบ้าน"
        >
          {isAdminLoggedIn ? (
            <ShieldCheck className="w-5 h-5 stroke-[1.8] text-indigo-600" />
          ) : (
            <Lock className="w-5 h-5 stroke-[1.8] text-slate-500" />
          )}
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">หลังบ้าน</span>
        </button>
      </div>
    </div>
  );
};
