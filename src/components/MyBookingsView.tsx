import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Clock3,
  XCircle,
  PlusCircle,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Room, WorkshopBooking } from '../types';
import { formatThaiDate } from '../utils/conflictDetector';

interface MyBookingsViewProps {
  bookings: WorkshopBooking[];
  rooms: Room[];
  onOpenBookingDetails: (booking: WorkshopBooking) => void;
  onNavigateToBooking: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  rooms,
  onOpenBookingDetails,
  onNavigateToBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredBookings = bookings.filter((b) => {
    // Status filter
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const room = rooms.find((r) => r.id === b.roomId);
      const matchesTitle = b.title.toLowerCase().includes(q);
      const matchesCode = b.bookingCode.toLowerCase().includes(q);
      const matchesOrganizer = b.organizerName.toLowerCase().includes(q);
      const matchesDept = b.department.toLowerCase().includes(q);
      const matchesRoom = room?.name.toLowerCase().includes(q);
      if (!matchesTitle && !matchesCode && !matchesOrganizer && !matchesDept && !matchesRoom) {
        return false;
      }
    }
    return true;
  });

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;
  const rejectedCount = bookings.filter((b) => b.status === 'rejected').length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock3 className="w-5 h-5 text-indigo-600" />
            <span>ติดตามสถานะการจอง Workshop</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจสอบผลการพิจารณาคำขอจองห้องประชุมและรายละเอียดการอนุมัติ
          </p>
        </div>

        <button
          onClick={onNavigateToBooking}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>ยื่นคำขอจองใหม่</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อการอบรม, รหัสจอง (WS-...), ผู้ขอจอง หรือชื่อห้อง..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({bookings.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Clock3 className="w-3.5 h-3.5" />
            รอพิจารณา ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            อนุมัติแล้ว ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            ไม่อนุมัติ ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-medium text-slate-700 text-sm">ไม่พบรายการคำขอจองตามเงื่อนไขที่เลือก</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "ยื่นคำขอจองใหม่"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((bk) => {
            const room = rooms.find((r) => r.id === bk.roomId);
            const isApproved = bk.status === 'approved';
            const isPending = bk.status === 'pending';
            const isRejected = bk.status === 'rejected';

            return (
              <div
                key={bk.id}
                onClick={() => onOpenBookingDetails(bk)}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                      {bk.bookingCode}
                    </span>

                    {/* Status Badge */}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        อนุมัติเรียบร้อย
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock3 className="w-3.5 h-3.5" />
                        รอเจ้าหน้าที่พิจารณา
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        ไม่อนุมัติ
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400">
                      ยื่นเมื่อ: {formatThaiDate(bk.submittedAt.split('T')[0])}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {bk.title}
                  </h3>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-y-1 gap-x-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {bk.dates.map((d) => formatThaiDate(d)).join(', ')}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {bk.startTime} - {bk.endTime} น.
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-medium text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {room?.name || 'ห้องที่เลือก'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {bk.expectedAttendees} คน
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    ผู้จัด: <span className="font-medium text-slate-700">{bk.organizerName}</span> ({bk.department})
                  </div>

                  {/* Officer feedback comment if any */}
                  {bk.reviewComment && (
                    <div className="text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 mt-2">
                      <span className="font-semibold text-slate-900">
                        ความเห็นเจ้าหน้าที่:
                      </span>{' '}
                      {bk.reviewComment}
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 shrink-0">
                  <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 group-hover:underline">
                    ดูรายละเอียดเต็ม <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
