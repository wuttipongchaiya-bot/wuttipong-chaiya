import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Users,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  FileSpreadsheet,
  Calendar,
  Phone,
  Mail,
  Building,
  Check,
  X,
  MessageSquare,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { Room, SchoolEvent, WorkshopBooking } from '../types';
import { checkWorkshopConflict, formatThaiDate } from '../utils/conflictDetector';
import { exportBookingsToExcel } from '../utils/excelParser';
import { EditBookingModal } from './EditBookingModal';

interface ApprovalViewProps {
  bookings: WorkshopBooking[];
  rooms: Room[];
  schoolEvents: SchoolEvent[];
  onApproveBooking: (bookingId: string, comment?: string) => void;
  onRejectBooking: (bookingId: string, comment?: string) => void;
  onOpenBookingDetails: (booking: WorkshopBooking) => void;
  onUpdateBooking?: (booking: WorkshopBooking) => void;
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({
  bookings,
  rooms,
  schoolEvents,
  onApproveBooking,
  onRejectBooking,
  onOpenBookingDetails,
  onUpdateBooking,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');

  // Modal states for action dialogs
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject';
    booking: WorkshopBooking;
  } | null>(null);
  const [officerComment, setOfficerComment] = useState('');

  // Editing booking state for backend officer
  const [editingBooking, setEditingBooking] = useState<WorkshopBooking | null>(null);

  // Statistics
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;
  const rejectedCount = bookings.filter((b) => b.status === 'rejected').length;

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (activeTab !== 'all' && b.status !== activeTab) return false;
        if (selectedRoomFilter !== 'all' && b.roomId !== selectedRoomFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = b.title.toLowerCase().includes(q);
          const matchOrganizer = b.organizerName.toLowerCase().includes(q);
          const matchDept = b.department.toLowerCase().includes(q);
          const matchCode = b.bookingCode.toLowerCase().includes(q);
          return matchTitle || matchOrganizer || matchDept || matchCode;
        }
        return true;
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [bookings, activeTab, selectedRoomFilter, searchQuery]);

  // Handle open approve modal
  const handleOpenApprove = (booking: WorkshopBooking) => {
    setActionModal({ type: 'approve', booking });
    setOfficerComment('อนุมัติเรียบร้อย ประสานงานฝ่ายอาคารและโสตทัศนูปกรณ์เตรียมความพร้อมให้แล้ว');
  };

  // Handle open reject modal
  const handleOpenReject = (booking: WorkshopBooking) => {
    setActionModal({ type: 'reject', booking });
    setOfficerComment('ขออภัยในความไม่สะดวก เนื่องจากห้องหรือวันดังกล่าวติดกิจกรรมของโรงเรียน');
  };

  // Submit action
  const handleConfirmAction = () => {
    if (!actionModal) return;
    if (actionModal.type === 'approve') {
      onApproveBooking(actionModal.booking.id, officerComment);
    } else {
      if (!officerComment.trim()) {
        alert('กรุณาระบุเหตุผลการปฏิเสธเพื่อให้ผู้ขอรับทราบ');
        return;
      }
      onRejectBooking(actionModal.booking.id, officerComment);
    }
    setActionModal(null);
    setOfficerComment('');
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header & Export */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider block">
                ฝ่ายบริหารอาคารสถานที่และวิชาการ
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                โหมดเจ้าหน้าที่ (Officer Portal)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1">
              ระบบพิจารณาและอนุมัติคำขอจอง Workshop
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ตรวจสอบการชนกับปฏิทินโรงเรียนและอนุมัติคำขอ พร้อมระบบส่งออกรายงาน Excel
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => exportBookingsToExcel(bookings, rooms)}
              className="text-xs font-semibold py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ส่งออกรายงาน Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
          <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50/60 border border-amber-100">
            <div className="text-[11px] font-medium text-amber-700">รอการพิจารณา</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-900 tabular-nums mt-0.5">
              {pendingCount}
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="text-[11px] font-medium text-emerald-700">อนุมัติแล้ว</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-900 tabular-nums mt-0.5">
              {approvedCount}
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50/60 border border-rose-100">
            <div className="text-[11px] font-medium text-rose-700">ไม่อนุมัติ / ปฏิเสธ</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-900 tabular-nums mt-0.5">
              {rejectedCount}
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-medium text-slate-600">คำขอทั้งหมด</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 tabular-nums mt-0.5">
              {bookings.length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'bg-white text-amber-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>รอการพิจารณา</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'approved'
                  ? 'bg-white text-emerald-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              อนุมัติแล้ว ({approvedCount})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'rejected'
                  ? 'bg-white text-rose-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ปฏิเสธ ({rejectedCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({bookings.length})
            </button>
          </div>

          {/* Room Filter */}
          <select
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 max-w-full sm:max-w-[200px]"
          >
            <option value="all">ทุกห้อง / ทุกสถานที่</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ Workshop, ชื่อครูผู้ขอ, หน่วยงาน, หรือรหัสการจอง..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">ไม่พบคำขอจองในหมวดนี้</p>
            <p className="text-xs text-slate-400 mt-0.5">
              ไม่มีรายการที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่เลือก
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const room = rooms.find((r) => r.id === booking.roomId);
            
            // Check conflict live
            const conflictInfo = checkWorkshopConflict(
              booking.dates,
              booking.startTime,
              booking.endTime,
              booking.roomId,
              rooms,
              schoolEvents,
              bookings,
              booking.id
            );

            const isPending = booking.status === 'pending';
            const isApproved = booking.status === 'approved';
            const isRejected = booking.status === 'rejected';

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {booking.bookingCode}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">
                      ยื่นเมื่อ {new Date(booking.submittedAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        รอเจ้าหน้าที่พิจารณา
                      </span>
                    )}
                    {isApproved && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        อนุมัติแล้ว
                      </span>
                    )}
                    {isRejected && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        ไม่อนุมัติ / ปฏิเสธ
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="py-3">
                  <h3 className="font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors">
                    {booking.title}
                  </h3>

                  {/* Conflict Check Alert (CRITICAL FOR OFFICER AUDIT) */}
                  <div className="mt-2.5">
                    {conflictInfo.hasBlockingConflict ? (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-rose-800">คำเตือน: ตรวจพบการชนกับกิจกรรมโรงเรียน</strong>
                          <ul className="list-disc list-inside mt-0.5 text-rose-900 space-y-0.5">
                            {conflictInfo.conflicts.map((c, i) => (
                              <li key={i}>
                                {formatThaiDate(c.date)}: {c.reason} ({c.timeRange})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-100 text-emerald-950 text-xs flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-emerald-900 font-medium">
                          ตรวจสอบแล้ว: ไม่พบกิจกรรมโรงเรียนชนในปฏิทิน (ปลอดภัยสำหรับการอนุมัติ)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dates & Venue Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3 text-xs text-slate-700">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[11px] font-medium text-slate-400">สถานที่ / ห้อง</div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{room?.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {room?.building} {room?.floor}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[11px] font-medium text-slate-400">
                        วันที่จัด ({booking.dates.length} วัน) & เวลา
                      </div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>
                          {booking.dates.map((d) => formatThaiDate(d)).join(', ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        เวลา: {booking.startTime} - {booking.endTime} น.
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2 lg:col-span-1">
                      <div className="text-[11px] font-medium text-slate-400">ผู้ขอจอง & กลุ่มสาระฯ</div>
                      <div className="font-semibold text-slate-900 truncate mt-0.5">
                        {booking.organizerName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {booking.department} · {booking.contactPhone}
                      </div>
                    </div>
                  </div>

                  {/* Attendees & Equipment */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span>
                      จำนวนผู้ร่วม: <strong className="text-slate-800">{booking.expectedAttendees} คน</strong> ({booking.targetAudience})
                    </span>
                    <span>·</span>
                    <span>
                      อุปกรณ์: <strong className="text-slate-800">{booking.requestedEquipment.join(', ') || 'ไม่มี'}</strong>
                    </span>
                  </div>

                  {/* Officer comment display if reviewed */}
                  {booking.reviewComment && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-100/70 text-xs text-slate-700 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">
                          ความเห็นเจ้าหน้าที่ ({booking.reviewedBy || 'เจ้าหน้าที่'}):
                        </span>{' '}
                        <span>{booking.reviewComment}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenBookingDetails(booking)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                  >
                    ดูรายละเอียดคำขอฉบับเต็ม
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingBooking(booking)}
                      className="py-1.5 px-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="แก้ไขรายละเอียดการจอง เช่น เปลี่ยนห้อง วัน เวลา หรือผู้จัด"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>แก้ไขข้อมูล</span>
                    </button>

                    {isPending && (
                      <>
                        <button
                          onClick={() => handleOpenReject(booking)}
                          className="py-1.5 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>ปฏิเสธ (Reject)</span>
                        </button>
                        <button
                          onClick={() => handleOpenApprove(booking)}
                          className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>อนุมัติ (Approve)</span>
                        </button>
                      </>
                    )}

                    {!isPending && (
                      <button
                        onClick={() => {
                          if (isApproved) handleOpenReject(booking);
                          else handleOpenApprove(booking);
                        }}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
                      >
                        {isApproved ? 'เปลี่ยนเป็นปฏิเสธ' : 'เปลี่ยนเป็นอนุมัติ'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* APPROVE / REJECT MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                {actionModal.type === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>ยืนยันการอนุมัติการจอง Workshop</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>ยืนยันการปฏิเสธคำขอจอง</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-xs text-slate-500">โครงการ:</div>
              <div className="font-bold text-sm text-slate-800 mt-0.5">
                {actionModal.booking.title}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                ผู้ขอ: {actionModal.booking.organizerName} ({actionModal.booking.department})
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {actionModal.type === 'approve' ? 'ข้อความกำกับ / หมายเหตุถึงผู้ขอ' : 'เหตุผลการปฏิเสธ (จำเป็น)'}
              </label>
              <textarea
                rows={3}
                value={officerComment}
                onChange={(e) => setOfficerComment(e.target.value)}
                placeholder={
                  actionModal.type === 'approve'
                    ? 'ระบุข้อความกำกับ เช่น ประสานงานจัดเตรียมไมค์และจอเรียบร้อยแล้ว'
                    : 'ระบุเหตุผล เช่น ชนกับกิจกรรมโรงเรียน หรือห้องไม่ว่าง'
                }
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModal(null)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmAction}
                className={`py-2 px-4 rounded-xl text-white text-xs font-semibold transition-colors shadow-xs ${
                  actionModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionModal.type === 'approve' ? 'ยืนยันอนุมัติคำขอ' : 'ยืนยันปฏิเสธคำขอ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          rooms={rooms}
          schoolEvents={schoolEvents}
          existingBookings={bookings}
          onClose={() => setEditingBooking(null)}
          onSave={(updated) => {
            if (onUpdateBooking) {
              onUpdateBooking(updated);
            }
            setEditingBooking(null);
          }}
        />
      )}
    </div>
  );
};
