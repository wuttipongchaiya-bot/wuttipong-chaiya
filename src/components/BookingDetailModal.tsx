import React from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  FileText,
  Layers,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  Edit3,
} from 'lucide-react';
import { Room, SchoolEvent, WorkshopBooking } from '../types';
import { checkWorkshopConflict, formatThaiDate } from '../utils/conflictDetector';

interface BookingDetailModalProps {
  booking: WorkshopBooking | null;
  rooms: Room[];
  schoolEvents: SchoolEvent[];
  existingBookings: WorkshopBooking[];
  userRole: 'teacher' | 'officer';
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEditBooking?: (booking: WorkshopBooking) => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  rooms,
  schoolEvents,
  existingBookings,
  userRole,
  onClose,
  onApprove,
  onReject,
  onEditBooking,
}) => {
  if (!booking) return null;

  const room = rooms.find((r) => r.id === booking.roomId);

  const conflictInfo = checkWorkshopConflict(
    booking.dates,
    booking.startTime,
    booking.endTime,
    booking.roomId,
    rooms,
    schoolEvents,
    existingBookings,
    booking.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                {booking.bookingCode}
              </span>
              <span className="text-slate-300">·</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  booking.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : booking.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {booking.status === 'approved'
                  ? 'อนุมัติเรียบร้อย'
                  : booking.status === 'rejected'
                  ? 'ปฏิเสธ / ไม่อนุมัติ'
                  : 'รอเจ้าหน้าที่พิจารณา'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
              {booking.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Conflict Analysis Report */}
          <div>
            {conflictInfo.hasBlockingConflict ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>ตรวจพบการชนกับกิจกรรมโรงเรียน</span>
                </div>
                <div className="text-rose-900 space-y-0.5 pl-5">
                  {conflictInfo.conflicts.map((c, i) => (
                    <div key={i}>
                      · {formatThaiDate(c.date)}: {c.reason} ({c.timeRange})
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-emerald-900">
                  สถานะความพร้อม: ไม่พบการชนกับกิจกรรมโรงเรียน
                </span>
              </div>
            )}
          </div>

          {/* Date & Location Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                วันที่และเวลาจัดงาน ({booking.dates.length} วัน)
              </span>
              <div className="space-y-1 pt-1">
                {booking.dates.map((d) => (
                  <div key={d} className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{formatThaiDate(d, { withDay: true })}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>เวลา: {booking.startTime} - {booking.endTime} น.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                สถานที่ / ห้อง
              </span>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>{room?.name}</span>
              </div>
              <div className="text-slate-600">
                {room?.building} {room?.floor}
              </div>
              <div className="text-slate-600 flex items-center gap-1 pt-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>ความจุห้อง {room?.capacity} ที่นั่ง (ขอเข้าใช้ {booking.expectedAttendees} คน)</span>
              </div>
            </div>
          </div>

          {/* Organizer Details */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              ข้อมูลผู้ขอจองโครงการ
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-400">ผู้รับผิดชอบ: </span>
                <strong className="text-slate-900">{booking.organizerName}</strong>
              </div>
              <div>
                <span className="text-slate-400">หน่วยงาน: </span>
                <span className="text-slate-800 font-medium">{booking.department}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{booking.contactPhone}</span>
              </div>
              {booking.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{booking.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Target Audience & Objectives */}
          {booking.objective && (
            <div>
              <span className="font-semibold text-slate-700 block mb-1">วัตถุประสงค์โครงการ:</span>
              <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 leading-relaxed">
                {booking.objective}
              </p>
            </div>
          )}

          {/* Requested Equipment */}
          <div>
            <span className="font-semibold text-slate-700 block mb-1">อุปกรณ์ที่ขอใช้:</span>
            <div className="flex flex-wrap gap-1.5">
              {booking.requestedEquipment.map((eq) => (
                <span
                  key={eq}
                  className="bg-indigo-50 text-indigo-800 border border-indigo-100 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                >
                  {eq}
                </span>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          {booking.additionalNotes && (
            <div>
              <span className="font-semibold text-slate-700 block mb-1">หมายเหตุเพิ่มเติม:</span>
              <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                {booking.additionalNotes}
              </p>
            </div>
          )}

          {/* Officer Review Feedback */}
          {booking.reviewComment && (
            <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
              <span className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                ความเห็นและการอนุมัติของเจ้าหน้าที่
              </span>
              <p className="text-slate-800 font-medium">{booking.reviewComment}</p>
              <div className="text-[11px] text-slate-500 pt-1">
                พิจารณาโดย: {booking.reviewedBy || 'เจ้าหน้าที่ฝ่ายอาคาร'} ·{' '}
                {booking.reviewedAt && new Date(booking.reviewedAt).toLocaleDateString('th-TH')}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>

            {userRole === 'officer' && onEditBooking && (
              <button
                onClick={() => {
                  onEditBooking(booking);
                  onClose();
                }}
                className="py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="แก้ไขข้อมูลการจองนี้"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>แก้ไขข้อมูลการจอง</span>
              </button>
            )}
          </div>

          {userRole === 'officer' && booking.status === 'pending' && (
            <div className="flex items-center gap-2">
              {onReject && (
                <button
                  onClick={() => {
                    onClose();
                    onReject(booking.id);
                  }}
                  className="py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                >
                  ปฏิเสธ
                </button>
              )}
              {onApprove && (
                <button
                  onClick={() => {
                    onClose();
                    onApprove(booking.id);
                  }}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  อนุมัติคำขอนี้
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
