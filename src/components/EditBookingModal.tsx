import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Save,
  Plus,
  Trash2,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Room, SchoolEvent, TimeSlotType, WorkshopBooking, BookingStatus } from '../types';
import { checkWorkshopConflict, formatThaiDate } from '../utils/conflictDetector';

interface EditBookingModalProps {
  booking: WorkshopBooking | null;
  rooms: Room[];
  schoolEvents: SchoolEvent[];
  existingBookings: WorkshopBooking[];
  onClose: () => void;
  onSave: (updatedBooking: WorkshopBooking) => void;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  booking,
  rooms,
  schoolEvents,
  existingBookings,
  onClose,
  onSave,
}) => {
  if (!booking) return null;

  // Form State initialized from booking
  const [title, setTitle] = useState(booking.title);
  const [organizerName, setOrganizerName] = useState(booking.organizerName);
  const [department, setDepartment] = useState(booking.department);
  const [contactPhone, setContactPhone] = useState(booking.contactPhone);
  const [email, setEmail] = useState(booking.email);
  const [roomId, setRoomId] = useState(booking.roomId);
  const [dates, setDates] = useState<string[]>([...booking.dates]);
  const [newDateInput, setNewDateInput] = useState('');
  const [timeSlotType, setTimeSlotType] = useState<TimeSlotType>(booking.timeSlotType || 'full_day');
  const [startTime, setStartTime] = useState(booking.startTime);
  const [endTime, setEndTime] = useState(booking.endTime);
  const [expectedAttendees, setExpectedAttendees] = useState(booking.expectedAttendees);
  const [targetAudience, setTargetAudience] = useState(booking.targetAudience || '');
  const [objective, setObjective] = useState(booking.objective || '');
  const [requestedEquipment, setRequestedEquipment] = useState<string[]>([
    ...(booking.requestedEquipment || []),
  ]);
  const [newEquipInput, setNewEquipInput] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState(booking.additionalNotes || '');
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [reviewComment, setReviewComment] = useState(booking.reviewComment || '');

  // Time preset change
  const handleSlotTypeChange = (type: TimeSlotType) => {
    setTimeSlotType(type);
    if (type === 'morning') {
      setStartTime('08:30');
      setEndTime('12:00');
    } else if (type === 'afternoon') {
      setStartTime('13:00');
      setEndTime('16:30');
    } else if (type === 'full_day') {
      setStartTime('08:30');
      setEndTime('16:30');
    }
  };

  // Add date
  const handleAddDate = () => {
    if (!newDateInput) return;
    if (!dates.includes(newDateInput)) {
      setDates((prev) => [...prev, newDateInput].sort());
      setNewDateInput('');
    }
  };

  // Remove date
  const handleRemoveDate = (dateToRemove: string) => {
    if (dates.length <= 1) {
      alert('การจองต้องมีอย่างน้อย 1 วัน');
      return;
    }
    setDates((prev) => prev.filter((d) => d !== dateToRemove));
  };

  // Add equipment
  const handleAddEquipment = () => {
    if (!newEquipInput.trim()) return;
    if (!requestedEquipment.includes(newEquipInput.trim())) {
      setRequestedEquipment((prev) => [...prev, newEquipInput.trim()]);
      setNewEquipInput('');
    }
  };

  // Remove equipment
  const handleRemoveEquipment = (equip: string) => {
    setRequestedEquipment((prev) => prev.filter((e) => e !== equip));
  };

  // Live Conflict Check
  const conflictResult = useMemo(() => {
    return checkWorkshopConflict(
      dates,
      startTime,
      endTime,
      roomId,
      rooms,
      schoolEvents,
      existingBookings,
      booking.id // exclude self
    );
  }, [dates, startTime, endTime, roomId, rooms, schoolEvents, existingBookings, booking.id]);

  // Handle Save
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('กรุณากรอกชื่อหัวข้อการอบรม / กิจกรรม');
      return;
    }
    if (!organizerName.trim()) {
      alert('กรุณากรอกชื่อผู้ขอจอง');
      return;
    }
    if (dates.length === 0) {
      alert('กรุณาระบุวันที่จัดกิจกรรมอย่างน้อย 1 วัน');
      return;
    }

    const updatedBooking: WorkshopBooking = {
      ...booking,
      title: title.trim(),
      organizerName: organizerName.trim(),
      department: department.trim(),
      contactPhone: contactPhone.trim(),
      email: email.trim(),
      roomId,
      dates,
      timeSlotType,
      startTime,
      endTime,
      expectedAttendees: Number(expectedAttendees) || 1,
      targetAudience: targetAudience.trim(),
      objective: objective.trim(),
      requestedEquipment,
      additionalNotes: additionalNotes.trim(),
      status,
      reviewComment: reviewComment.trim(),
      reviewedAt: status !== 'pending' ? (booking.reviewedAt || new Date().toISOString()) : undefined,
    };

    onSave(updatedBooking);
  };

  const selectedRoomObj = rooms.find((r) => r.id === roomId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-xs">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
                  แก้ไขข้อมูลการจอง Workshop
                </h2>
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-indigo-200 border border-white/10">
                  {booking.bookingCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                ระบบจัดการหลังบ้าน: แก้ไขวัน เวลา ห้องประชุม หรือสถานะการพิจารณา
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="edit-booking-form" onSubmit={handleFormSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Conflict Warning Alert if any */}
          {conflictResult.hasConflict && (
            <div className={`p-3.5 rounded-2xl border ${
              conflictResult.hasBlockingConflict
                ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                : 'bg-amber-50/90 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs block">
                    {conflictResult.hasBlockingConflict
                      ? 'คำเตือน: พบรายการชนกับกิจกรรมของโรงเรียนหรือการจองอื่น!'
                      : 'แจ้งเตือนข้อขัดข้องเบื้องต้น'}
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {conflictResult.conflicts.map((c, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{c.title}</span> ({formatThaiDate(c.date)} เวลา {c.timeRange}): {c.reason}
                      </li>
                    ))}
                  </ul>
                  <span className="text-[10px] opacity-80 block pt-0.5">
                    * ในฐานะเจ้าหน้าที่หลังบ้าน คุณสามารถพิจารณาปรับเปลี่ยนวัน เวลา หรือบันทึกเพื่อจัดการตามดุลยพินิจได้
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Workshop Title & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                ชื่อหัวข้อการอบรม / กิจกรรม <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                สถานะคำขอ (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookingStatus)}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold ${
                  status === 'approved'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : status === 'rejected'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                <option value="pending">⏳ รอการพิจารณา (Pending)</option>
                <option value="approved">✅ อนุมัติแล้ว (Approved)</option>
                <option value="rejected">❌ ไม่อนุมัติ / ปฏิเสธ (Rejected)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Room Selection & Attendees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/70 rounded-2xl border border-slate-200">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>ห้องประชุมที่ใช้</span>
                {selectedRoomObj && (
                  <span className="text-[11px] text-slate-500 font-normal">
                    ความจุ {selectedRoomObj.capacity} ที่นั่ง · {selectedRoomObj.building}
                  </span>
                )}
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.building} - ความจุ {r.capacity} คน)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                จำนวนผู้เข้าร่วม (คน)
              </label>
              <input
                type="number"
                min="1"
                value={expectedAttendees}
                onChange={(e) => setExpectedAttendees(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
          </div>

          {/* Section 3: Dates & Multi-day configuration */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>วันที่จัดกิจกรรม ({dates.length} วัน)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={newDateInput}
                  onChange={(e) => setNewDateInput(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddDate}
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>เพิ่มวัน</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {dates.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 text-xs shadow-2xs"
                >
                  <span>{formatThaiDate(d, { withDay: true })}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(d)}
                    className="text-slate-400 hover:text-rose-600 ml-1 p-0.5"
                    title="ลบวันนี้ออก"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section 4: Time Slot & Hours */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>ช่วงเวลาที่ขอใช้ห้อง</span>
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSlotTypeChange('morning')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  timeSlotType === 'morning'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ช่วงเช้า (08:30 - 12:00 น.)
              </button>
              <button
                type="button"
                onClick={() => handleSlotTypeChange('afternoon')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  timeSlotType === 'afternoon'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ช่วงบ่าย (13:00 - 16:30 น.)
              </button>
              <button
                type="button"
                onClick={() => handleSlotTypeChange('full_day')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  timeSlotType === 'full_day'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                เต็มวัน (08:30 - 16:30 น.)
              </button>
              <button
                type="button"
                onClick={() => setTimeSlotType('custom')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  timeSlotType === 'custom'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                กำหนดเวลาเอง
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">เวลาเริ่ม</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setTimeSlotType('custom');
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">เวลาสิ้นสุด</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setTimeSlotType('custom');
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Organizer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ชื่อผู้ขอจอง / ผู้รับผิดชอบ
              </label>
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                กลุ่มสาระ / ฝ่ายงาน
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์ติดต่อ
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                อีเมลติดต่อ
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
          </div>

          {/* Section 6: Requested Equipment */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              อุปกรณ์และโสตทัศนูปกรณ์ที่ขอใช้
            </label>
            <div className="flex items-center gap-1.5 mb-2">
              <input
                type="text"
                value={newEquipInput}
                onChange={(e) => setNewEquipInput(e.target.value)}
                placeholder="ระบุอุปกรณ์เพิ่มเติม..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={handleAddEquipment}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                + เพิ่ม
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {requestedEquipment.map((eq) => (
                <span
                  key={eq}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px]"
                >
                  <span>{eq}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEquipment(eq)}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section 7: Officer Review Comment */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              ความคิดเห็นเจ้าหน้าที่ / หมายเหตุผลการอนุมัติ (แจ้งไปยังผู้ขอ)
            </label>
            <textarea
              rows={2}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="ระบุความคิดเห็น เช่น อนุมัติเรียบร้อย ได้ประสานงานแม่บ้านและช่างโสตฯ ให้แล้ว"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-xs cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            form="edit-booking-form"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการเปลี่ยนแปลง</span>
          </button>
        </div>
      </div>
    </div>
  );
};
