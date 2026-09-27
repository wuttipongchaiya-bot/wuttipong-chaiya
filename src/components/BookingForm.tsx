import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Info,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { Room, SchoolEvent, TimeSlotType, WorkshopBooking } from '../types';
import { checkWorkshopConflict, formatThaiDate } from '../utils/conflictDetector';

interface BookingFormProps {
  rooms: Room[];
  schoolEvents: SchoolEvent[];
  existingBookings: WorkshopBooking[];
  initialSelectedDate?: string | null;
  initialSelectedRoomId?: string;
  onSubmitBooking: (bookingData: Omit<WorkshopBooking, 'id' | 'bookingCode' | 'status' | 'submittedAt'>) => void;
  onCancel: () => void;
  onNavigateToRooms?: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  rooms,
  schoolEvents,
  existingBookings,
  initialSelectedDate,
  initialSelectedRoomId,
  onSubmitBooking,
  onCancel,
  onNavigateToRooms,
}) => {
  // 1. Basic & Contact Information
  const [title, setTitle] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [department, setDepartment] = useState('กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี');
  const [contactPhone, setContactPhone] = useState('');
  const [email, setEmail] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState<number>(30);
  const [targetAudience, setTargetAudience] = useState('');
  const [objective, setObjective] = useState('');

  // 2. Room & Multi-day Dates
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    initialSelectedRoomId || rooms[0]?.id || ''
  );

  useEffect(() => {
    if (initialSelectedRoomId) {
      setSelectedRoomId(initialSelectedRoomId);
    }
  }, [initialSelectedRoomId]);
  
  // Initialize dates with initialSelectedDate or tomorrow
  const [selectedDates, setSelectedDates] = useState<string[]>(() => {
    if (initialSelectedDate) return [initialSelectedDate];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return [tomorrow.toISOString().split('T')[0]];
  });

  const [dateInputVal, setDateInputVal] = useState<string>('');

  // 3. Time Slots
  const [timeSlotType, setTimeSlotType] = useState<TimeSlotType>('full_day');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('16:30');

  // 4. Equipment
  const [requestedEquipment, setRequestedEquipment] = useState<string[]>([
    'Projector & จอภาพ',
    'ไมโครโฟนไร้สาย',
    'Wi-Fi โรงเรียน',
  ]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Handle Preset Time Slot changes
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

  // Date Management: Add custom date
  const handleAddDate = () => {
    if (!dateInputVal) return;
    if (!selectedDates.includes(dateInputVal)) {
      const updated = [...selectedDates, dateInputVal].sort();
      setSelectedDates(updated);
    }
    setDateInputVal('');
  };

  // Add consecutive next day
  const handleAddConsecutiveDay = () => {
    if (selectedDates.length === 0) return;
    const lastDateStr = selectedDates[selectedDates.length - 1];
    const d = new Date(lastDateStr);
    d.setDate(d.getDate() + 1);
    const nextDateStr = d.toISOString().split('T')[0];
    if (!selectedDates.includes(nextDateStr)) {
      setSelectedDates([...selectedDates, nextDateStr].sort());
    }
  };

  // Remove a date
  const handleRemoveDate = (dateToRemove: string) => {
    if (selectedDates.length <= 1) {
      alert('การจองต้องระบุอย่างน้อย 1 วัน');
      return;
    }
    setSelectedDates(selectedDates.filter((d) => d !== dateToRemove));
  };

  // Equipment Toggle
  const toggleEquipment = (item: string) => {
    if (requestedEquipment.includes(item)) {
      setRequestedEquipment(requestedEquipment.filter((eq) => eq !== item));
    } else {
      setRequestedEquipment([...requestedEquipment, item]);
    }
  };

  // Real-Time Conflict Analysis
  const conflictResult = useMemo(() => {
    return checkWorkshopConflict(
      selectedDates,
      startTime,
      endTime,
      selectedRoomId,
      rooms,
      schoolEvents,
      existingBookings
    );
  }, [selectedDates, startTime, endTime, selectedRoomId, rooms, schoolEvents, existingBookings]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('กรุณากรอกชื่อหัวข้อ Workshop');
      return;
    }
    if (!organizerName.trim()) {
      alert('กรุณากรอกชื่อครูผู้รับผิดชอบโครงการ');
      return;
    }
    if (selectedDates.length === 0) {
      alert('กรุณาระบุวันจัดกิจกรรมอย่างน้อย 1 วัน');
      return;
    }
    if (!selectedRoomId) {
      alert('กรุณาเลือกสถานที่/ห้อง');
      return;
    }

    if (conflictResult.hasBlockingConflict) {
      alert(
        'ไม่สามารถส่งคำขอได้ เนื่องจากวันและเวลาที่เลือกชนกับกิจกรรมโรงเรียนที่ระบุไว้ในปฏิทินโรงเรียน หรือห้องถูกจองแล้ว กรุณาเลือกวันหรือห้องอื่น'
      );
      return;
    }

    onSubmitBooking({
      title,
      organizerName,
      department,
      contactPhone,
      email,
      roomId: selectedRoomId,
      dates: selectedDates,
      timeSlotType,
      startTime,
      endTime,
      expectedAttendees: Number(expectedAttendees) || 1,
      targetAudience: targetAudience || 'ครูและนักเรียน',
      objective,
      requestedEquipment,
      additionalNotes,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider block">
              ระบบส่งคำขอจองสถานที่
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              แบบฟอร์มจองวันและห้องสำหรับจัด Workshop
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              รองรับการจัดหลายวัน (Multi-day) พร้อมระบบตรวจสอบการชนกับกิจกรรมโรงเรียนแบบเรียลไทม์
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-slate-800 self-start sm:self-center px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            ยกเลิก / กลับไปปฏิทิน
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* STEP 1: Room & Multi-day Dates Selection */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              เลือกสถานที่และวันจัดกิจกรรม (เลือกได้มากกว่า 1 วัน)
            </h3>
          </div>

          {/* Room Selector Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                เลือกห้องหรือสถานที่จัดงาน <span className="text-rose-500">*</span>
              </label>
              {onNavigateToRooms && (
                <button
                  type="button"
                  onClick={onNavigateToRooms}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>จัดการห้องประชุม (เพิ่ม / ลด / แก้ไข)</span>
                </button>
              )}
            </div>

            {rooms.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>ยังไม่มีห้องประชุมในระบบ กรุณาเพิ่มห้องประชุมก่อนทำการจอง</span>
                </div>
                {onNavigateToRooms && (
                  <button
                    type="button"
                    onClick={onNavigateToRooms}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 text-xs shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    + ไปที่หน้าจัดการห้องประชุม
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {rooms.map((room) => {
                  const isSelected = selectedRoomId === room.id;
                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 leading-snug">
                            {room.name}
                          </span>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 ml-1"
                            style={{ backgroundColor: room.color }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                          <span>{room.building}</span>
                          <span>·</span>
                          <span>{room.floor}</span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 flex items-center gap-1 font-medium">
                          <Users className="w-3 h-3 text-slate-400" />
                          ความจุ {room.capacity} ที่นั่ง
                        </span>
                        {isSelected && (
                          <span className="text-indigo-600 font-semibold text-[11px] flex items-center gap-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            เลือกแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Multi-Day Dates Picker */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <label className="text-xs font-semibold text-slate-700">
                วันที่ต้องการจัด (จัดได้มากกว่า 1 วัน เช่น เสาร์-อาทิตย์ หรือ 2-3 วันติดกัน){' '}
                <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddConsecutiveDay}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มวันถัดไปทันที (+1 วัน)
              </button>
            </div>

            {/* Selected Dates Badges */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 min-h-[46px]">
              {selectedDates.map((dateStr) => (
                <div
                  key={dateStr}
                  className="bg-white border border-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs font-medium"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{formatThaiDate(dateStr, { withDay: true })}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(dateStr)}
                    className="text-slate-400 hover:text-rose-600 ml-0.5 p-0.5"
                    title="ลบวันนี้"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add Custom Date Input */}
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={dateInputVal}
                  onChange={(e) => setDateInputVal(e.target.value)}
                  className="text-xs border border-slate-200 bg-white rounded-lg px-2 py-1 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddDate}
                  disabled={!dateInputVal}
                  className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium"
                >
                  เพิ่มวัน
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              รวมจำนวนวันจัดกิจกรรมทั้งหมด: <strong className="text-slate-800">{selectedDates.length} วัน</strong>
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              ช่วงเวลาที่ต้องการใช้ห้อง <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSlotTypeChange('full_day')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                  timeSlotType === 'full_day'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                ทั้งวัน (08:30 - 16:30)
              </button>
              <button
                type="button"
                onClick={() => handleSlotTypeChange('morning')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                  timeSlotType === 'morning'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                ช่วงเช้า (08:30 - 12:00)
              </button>
              <button
                type="button"
                onClick={() => handleSlotTypeChange('afternoon')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                  timeSlotType === 'afternoon'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                ช่วงบ่าย (13:00 - 16:30)
              </button>
              <button
                type="button"
                onClick={() => handleSlotTypeChange('custom')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                  timeSlotType === 'custom'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                กำหนดเวลาเอง
              </button>
            </div>

            {timeSlotType === 'custom' && (
              <div className="flex items-center gap-3 mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-medium">ตั้งแต่:</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 bg-white"
                  />
                  <span>น.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-medium">ถึง:</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 bg-white"
                  />
                  <span>น.</span>
                </div>
              </div>
            )}
          </div>

          {/* REAL-TIME CONFLICT CHECK BOX (CRITICAL REQUIREMENT) */}
          <div className="pt-2">
            {conflictResult.hasBlockingConflict ? (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>พบข้อขัดแย้ง: ชนกับกิจกรรมโรงเรียนหรือการจองห้องอื่น!</span>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed">
                  ระบบตรวจสอบจากข้อมูลปฏิทินโรงเรียนพบว่า วันและเวลาที่ท่านเลือกไม่สามารถจัด Workshop ได้:
                </p>
                <div className="space-y-1.5 mt-2">
                  {conflictResult.conflicts.map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-white/90 p-2.5 rounded-lg border border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <div>
                        <span className="font-semibold text-rose-900">
                          {formatThaiDate(c.date, { withDay: true })}
                        </span>{' '}
                        · <span className="text-slate-700">{c.reason}</span>
                      </div>
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded self-start sm:self-center shrink-0">
                        {c.timeRange}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-rose-800 font-medium pt-1">
                  💡 คำแนะนำ: โปรดเลือกวันอื่น หรือเปลี่ยนเป็นห้องอื่นที่ไม่ได้รับผลกระทบ
                </div>
              </div>
            ) : conflictResult.hasConflict ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>คำเตือน: มีคำขอจองอื่นในวันและเวลาเดียวกัน (ยังไม่ได้รับการอนุมัติ)</span>
                </div>
                <div className="text-xs text-amber-900">
                  {conflictResult.conflicts.map((c, i) => (
                    <div key={i}>
                      · {formatThaiDate(c.date)} : {c.reason} ({c.timeRange})
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-emerald-900">
                  วันและเวลาที่เลือกว่างพร้อมจัด ไม่มีกิจกรรมโรงเรียนหรือการจองชนในทั้ง {selectedDates.length} วัน
                </span>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Workshop Project Details */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              รายละเอียดโครงการและข้อมูลการติดต่อ
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                ชื่อหัวข้อการอบรมเชิงปฏิบัติการ (Workshop Title) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น การสร้างนวัตกรรม AI เพื่อยกระดับผลสัมฤทธิ์ทางการเรียน"
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Organizer Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ชื่อ-นามสกุล ครูผู้รับผิดชอบโครงการ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="เช่น อาจารย์สมชาย เจริญสุข"
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                กลุ่มสาระการเรียนรู้ / งาน <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี">กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี</option>
                <option value="กลุ่มสาระการเรียนรู้คณิตศาสตร์">กลุ่มสาระฯ คณิตศาสตร์</option>
                <option value="กลุ่มสาระการเรียนรู้ภาษาไทย">กลุ่มสาระฯ ภาษาไทย</option>
                <option value="กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ">กลุ่มสาระฯ ภาษาต่างประเทศ</option>
                <option value="กลุ่มสาระการเรียนรู้สังคมศึกษาฯ">กลุ่มสาระฯ สังคมศึกษาฯ</option>
                <option value="กลุ่มงานบริหารวิชาการ">กลุ่มงานบริหารวิชาการ</option>
                <option value="กลุ่มงานกิจการนักเรียน / แนะแนว">กลุ่มงานกิจการนักเรียน / แนะแนว</option>
                <option value="สภานักเรียน / ชุมนุม">สภานักเรียน / ชมรมนักเรียน</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">อีเมลติดต่อของโรงเรียน</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.ac.th"
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Expected Attendees */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                จำนวนผู้เข้าร่วมโดยประมาณ (คน)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={expectedAttendees}
                onChange={(e) => setExpectedAttendees(Number(e.target.value))}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {selectedRoom && expectedAttendees > selectedRoom.capacity && (
                <div className="text-[11px] text-amber-600 mt-1 font-medium">
                  ⚠️ จำนวนผู้เข้าร่วมเกินความจุห้อง ({selectedRoom.capacity} ที่นั่ง)
                </div>
              )}
            </div>

            {/* Target Audience */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">กลุ่มเป้าหมายผู้เข้าร่วม</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="เช่น ครูผู้สอน ม.ปลาย 30 ท่าน, นักเรียน ม.4-6"
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Objective */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                วัตถุประสงค์และสาระสำคัญของ Workshop
              </label>
              <textarea
                rows={2}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="ระบุวัตถุประสงค์เพื่อประกอบการพิจารณาอนุมัติของเจ้าหน้าที่"
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* STEP 3: Equipment Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              อุปกรณ์และสิ่งอำนวยความสะดวกที่ต้องการ
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              'Projector & จอภาพ',
              'ไมโครโฟนไร้สาย',
              'Wi-Fi โรงเรียน',
              'คอมพิวเตอร์ / โน้ตบุ๊ก',
              'ปลั๊กพ่วงสายไฟเสริม',
              'โต๊ะจัดกลุ่ม (Group Workshop)',
              'เครื่องปรับอากาศเต็มระบบ',
              'ชุดเครื่องดื่มและอาหารว่าง',
            ].map((eq) => {
              const isChecked = requestedEquipment.includes(eq);
              return (
                <label
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-colors ${
                    isChecked
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 pointer-events-none"
                  />
                  <span>{eq}</span>
                </label>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุเพิ่มเติมถึงเจ้าหน้าที่อาคารสถานที่
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="เช่น ต้องการให้เปิดเครื่องปรับอากาศก่อนเริ่ม 30 นาที, จัดเก้าอี้รูปตัวยู"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Submit Actions Button */}
        <div className="sticky bottom-16 md:bottom-4 z-20 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 text-center sm:text-left">
            <span>จัดทั้งหมด </span>
            <strong className="text-slate-900">{selectedDates.length} วัน</strong>
            <span> ณ </span>
            <strong className="text-indigo-700">{selectedRoom?.name}</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={conflictResult.hasBlockingConflict}
              className="flex-1 sm:flex-none py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>ส่งคำขอจอง Workshop</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
