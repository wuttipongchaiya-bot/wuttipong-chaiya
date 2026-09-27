import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  Plus,
  Filter,
  CheckCircle,
  Layers,
  Sparkles,
  X,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react';
import { Room, SchoolEvent, WorkshopBooking } from '../types';
import { formatThaiDate, isDateInRange } from '../utils/conflictDetector';
import {
  SemesterPeriod,
  DEFAULT_SEMESTER_BREAKS,
  checkIsSemesterBreak,
  isSemesterPeriodMarker,
  LOCAL_STORAGE_SEMESTER_BREAKS_KEY,
  LOCAL_STORAGE_SEMESTER_COLOR_KEY,
} from '../utils/semesterConfig';

interface CalendarViewProps {
  schoolEvents: SchoolEvent[];
  bookings: WorkshopBooking[];
  rooms: Room[];
  focusDate?: string | null;
  onSelectDateForBooking: (dateStr: string) => void;
  onOpenBookingDetails: (booking: WorkshopBooking) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  schoolEvents,
  bookings,
  rooms,
  focusDate,
  onSelectDateForBooking,
  onOpenBookingDetails,
}) => {
  // Current viewing month
  const [currentDate, setCurrentDate] = useState(() => {
    if (focusDate) {
      const d = new Date(focusDate);
      if (!isNaN(d.getTime())) return d;
    }
    // If there are school events, default to the month of the first event if today is empty
    if (schoolEvents.length > 0 && schoolEvents[0].startDate) {
      const d = new Date(schoolEvents[0].startDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  // Semester Break Configuration & Color Mode
  const [semesterBreaks, setSemesterBreaks] = useState<SemesterPeriod[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SEMESTER_BREAKS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SEMESTER_BREAKS;
  });

  // Color mode: 'break-green_term-brown' (Default: ปิดเทอม=เขียวอ่อน, เปิดเทอม=น้ำตาลอ่อน)
  // or 'break-brown_term-green' (ปิดเทอม=น้ำตาลอ่อน, เปิดเทอม=เขียวอ่อน)
  const [colorMode, setColorMode] = useState<'break-green_term-brown' | 'break-brown_term-green'>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SEMESTER_COLOR_KEY);
      if (saved === 'break-brown_term-green' || saved === 'break-green_term-brown') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'break-green_term-brown';
  });

  // Modal to customize semester break dates
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [newBreakName, setNewBreakName] = useState('');
  const [newBreakStart, setNewBreakStart] = useState('');
  const [newBreakEnd, setNewBreakEnd] = useState('');

  // Persist semester breaks & colorMode
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SEMESTER_BREAKS_KEY, JSON.stringify(semesterBreaks));
    } catch (e) {
      console.error(e);
    }
  }, [semesterBreaks]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SEMESTER_COLOR_KEY, colorMode);
    } catch (e) {
      console.error(e);
    }
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode((prev) =>
      prev === 'break-green_term-brown' ? 'break-brown_term-green' : 'break-green_term-brown'
    );
  };

  const handleAddBreak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBreakName.trim() || !newBreakStart || !newBreakEnd) {
      alert('กรุณากรอกชื่อและช่วงวันที่ปิดเทอม');
      return;
    }
    const newPeriod: SemesterPeriod = {
      id: `sb-${Date.now()}`,
      name: newBreakName.trim(),
      startDate: newBreakStart,
      endDate: newBreakEnd,
      type: 'break',
    };
    setSemesterBreaks((prev) => [...prev, newPeriod]);
    setNewBreakName('');
    setNewBreakStart('');
    setNewBreakEnd('');
  };

  const handleDeleteBreak = (id: string) => {
    setSemesterBreaks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleResetBreaks = () => {
    if (confirm('คืนค่าช่วงเวลาปิดภาคเรียนเป็นค่ามาตรฐานใช่หรือไม่?')) {
      setSemesterBreaks(DEFAULT_SEMESTER_BREAKS);
    }
  };

  // Sync when focusDate changes
  React.useEffect(() => {
    if (focusDate) {
      const d = new Date(focusDate);
      if (!isNaN(d.getTime())) {
        setCurrentDate(d);
      }
    }
  }, [focusDate]);

  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'school' | 'workshop'>('all');
  
  // Selected day for bottom sheet / detail drawer
  const [selectedDayModal, setSelectedDayModal] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  // Calendar days generation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevLastDate - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDate; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month filler days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month]);

  // Helper to find events for a specific date string
  const getEventsForDate = (dateStr: string) => {
    // School events
    let filteredSchool = schoolEvents.filter((e) => isDateInRange(dateStr, e.startDate, e.endDate));
    if (selectedRoomFilter !== 'all') {
      filteredSchool = filteredSchool.filter(
        (e) => e.locationType === 'all_campus' || (e.affectedRooms && e.affectedRooms.includes(selectedRoomFilter))
      );
    }
    if (typeFilter === 'workshop') {
      filteredSchool = [];
    }

    // Exclude semester period markers (e.g. "เปิดกลางภาคเรียนที่ 1/...", "เปิดภาคเรียน", "เปิดเทอม", "ปิดเทอม")
    // from daily event pills because semester status is already clearly represented by the day background color.
    const dailySchoolEvents = filteredSchool.filter((e) => !isSemesterPeriodMarker(e.title));
    const semesterMarkers = filteredSchool.filter((e) => isSemesterPeriodMarker(e.title));

    // Workshop bookings
    let filteredBookings = bookings.filter((b) => b.dates.includes(dateStr) && b.status !== 'rejected');
    if (selectedRoomFilter !== 'all') {
      filteredBookings = filteredBookings.filter((b) => b.roomId === selectedRoomFilter);
    }
    if (typeFilter === 'school') {
      filteredBookings = [];
    }

    return {
      schoolEvents: dailySchoolEvents,
      semesterMarkers,
      bookings: filteredBookings,
      hasBlockingEvent: dailySchoolEvents.some((e) => e.isMandatoryBlock),
      totalCount: dailySchoolEvents.length + filteredBookings.length,
    };
  };

  // Agenda items for the current month
  const agendaItems = useMemo(() => {
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const items: Array<{
      dateStr: string;
      schoolEvents: SchoolEvent[];
      bookings: WorkshopBooking[];
    }> = [];

    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const { schoolEvents: sEvents, bookings: bList } = getEventsForDate(dateStr);
      if (sEvents.length > 0 || bList.length > 0) {
        items.push({
          dateStr,
          schoolEvents: sEvents,
          bookings: bList,
        });
      }
    }
    return items;
  }, [year, month, schoolEvents, bookings, selectedRoomFilter, typeFilter]);

  // Selected Day Modal Data
  const selectedDayData = selectedDayModal ? getEventsForDate(selectedDayModal) : null;

  return (
    <div className="space-y-4">
      {/* Top Controls & Month Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Month & Year Title */}
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{monthNamesThai[month]}</span>
              <span className="text-slate-400 font-light">{year + 543}</span>
            </h2>
            <div className="flex items-center gap-0.5 ml-2">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                title="เดือนก่อนหน้า"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                วันนี้
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                title="เดือนถัดไป"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Mode & Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher: Month / Agenda */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แบบตารางเดือน
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'agenda' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แบบกำหนดการ
              </button>
            </div>

            {/* Room Selector */}
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 max-w-[150px] sm:max-w-[180px] truncate"
            >
              <option value="all">ทุกห้อง / ทุกสถานที่</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend / Category Tags Filter & Semester Color Legend */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 text-[11px] font-medium">แสดง:</span>
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setTypeFilter('school')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  typeFilter === 'school'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                กิจกรรมโรงเรียน (ห้ามชน)
              </button>
              <button
                onClick={() => setTypeFilter('workshop')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  typeFilter === 'workshop'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Workshop ที่จองแล้ว
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              แตะที่วันเพื่อดูรายละเอียดหรือจองห้อง
            </div>
          </div>

          {/* Semester Color Indicator Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50/90 rounded-xl border border-slate-200/80 text-[11px]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-600">สีพื้นหลังของวัน:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md bg-[#DCFCE7] border border-[#86EFAC] shadow-2xs inline-block" />
                <span className="font-medium text-emerald-900">
                  สีเขียว = {colorMode === 'break-green_term-brown' ? 'ช่วงปิดเทอม' : 'ช่วงเปิดเทอม'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md bg-[#EEDBC5] border border-[#CCA785] shadow-2xs inline-block" />
                <span className="font-medium text-amber-950">
                  สีน้ำตาล = {colorMode === 'break-green_term-brown' ? 'ช่วงเปิดเทอม' : 'ช่วงปิดเทอม'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleColorMode}
                className="text-[11px] text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                title="คลิกเพื่อสลับสีระหว่างปิดเทอมและเปิดเทอม"
              >
                <RefreshCw className="w-3 h-3 text-slate-400" />
                <span>สลับคู่สี (เขียว ⇄ น้ำตาล)</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setShowSemesterModal(true)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-white border border-transparent hover:border-indigo-200 transition-colors cursor-pointer"
              >
                <CalendarIcon className="w-3 h-3 text-indigo-500" />
                <span>กำหนดช่วงวันปิดเทอม</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-semibold text-slate-600 py-2">
            <div className="text-rose-600">อา.</div>
            <div>จ.</div>
            <div>อ.</div>
            <div>พ.</div>
            <div>พฤ.</div>
            <div>ศ.</div>
            <div className="text-indigo-600">ส.</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200/90">
            {calendarDays.map((day, idx) => {
              const { schoolEvents: sEvents, bookings: bList, hasBlockingEvent } = getEventsForDate(day.dateStr);
              const isPast = day.dateStr < new Date().toISOString().split('T')[0];
              const isBreak = checkIsSemesterBreak(day.dateStr, semesterBreaks, schoolEvents);

              // Distinct Day Cell Background:
              // Clearly differentiated soft Green (#DCFCE7) or soft Brown (#EEDBC5) without distracting text
              let cellBgClass = '';
              if (!day.isCurrentMonth) {
                cellBgClass = 'bg-slate-100/60 text-slate-400';
              } else {
                const isGreen = colorMode === 'break-green_term-brown' ? isBreak : !isBreak;
                if (isGreen) {
                  // Distinct soft light green
                  cellBgClass = 'bg-[#DCFCE7] hover:bg-[#C8F7D7] text-slate-900 border-emerald-200/40';
                } else {
                  // Distinct soft warm brown/tan
                  cellBgClass = 'bg-[#EEDBC5] hover:bg-[#E3CBAD] text-slate-900 border-amber-200/40';
                }
              }

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayModal(day.dateStr)}
                  className={`min-h-[76px] sm:min-h-[100px] p-1.5 sm:p-2 cursor-pointer transition-colors relative flex flex-col justify-between ${cellBgClass} ${
                    day.isToday ? 'ring-2 ring-inset ring-indigo-600 shadow-sm' : ''
                  }`}
                >
                  {/* Day header (Clean number only, completely free of text labels to prevent eye strain) */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold inline-flex items-center justify-center w-5 h-5 rounded-full ${
                        day.isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : day.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                    {hasBlockingEvent && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-2xs" title="มีกิจกรรมโรงเรียนห้ามชน" />
                    )}
                  </div>

                  {/* Badges / Micro bars for events */}
                  <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                    {/* School Event Bar */}
                    {sEvents.slice(0, 1).map((ev) => (
                      <div
                        key={ev.id}
                        className="truncate text-[10px] leading-tight px-1 py-0.5 rounded bg-rose-100/90 text-rose-800 font-medium border border-rose-200/50 shadow-2xs"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}

                    {/* Workshop Bookings Bar */}
                    {bList.slice(0, 2).map((bk) => (
                      <div
                        key={bk.id}
                        className={`truncate text-[10px] leading-tight px-1 py-0.5 rounded font-medium ${
                          bk.status === 'approved'
                            ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/50 shadow-2xs'
                            : 'bg-amber-100/90 text-amber-800 border border-amber-200/50 shadow-2xs'
                        }`}
                        title={`${bk.title} (${bk.startTime}-${bk.endTime})`}
                      >
                        {bk.title}
                      </div>
                    ))}

                    {/* Overflow count */}
                    {sEvents.length + bList.length > 2 && (
                      <div className="text-[9px] text-slate-500 font-medium text-right pr-0.5">
                        +{sEvents.length + bList.length - 2} เพิ่มเติม
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA LIST VIEW (Especially great for mobile browsing) */}
      {viewMode === 'agenda' && (
        <div className="space-y-3">
          {agendaItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">ไม่มีกิจกรรมหรือ Workshop ในเดือนนี้</p>
              <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนตัวกรอง หรือกดปุ่มจองห้องเพื่อเพิ่มกิจกรรม</p>
            </div>
          ) : (
            agendaItems.map((item) => (
              <div
                key={item.dateStr}
                className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span className="font-semibold text-slate-900 text-sm sm:text-base">
                      {formatThaiDate(item.dateStr, { withDay: true })}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectDateForBooking(item.dateStr)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    จองวันนี้
                  </button>
                </div>

                <div className="mt-3 space-y-2.5">
                  {/* School Events */}
                  {item.schoolEvents.map((se) => (
                    <div
                      key={se.id}
                      className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-100 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                            กิจกรรมโรงเรียน
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs font-semibold text-rose-900">{se.title}</span>
                        </div>
                        <div className="text-xs text-rose-700/80 flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-rose-500" />
                            {se.isAllDay ? 'ตลอดทั้งวัน' : `${se.startTime} - ${se.endTime} น.`}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            {se.locationType === 'all_campus' ? 'ทุกอาคาร / ทั้งโรงเรียน' : 'ห้องเฉพาะที่ระบุ'}
                          </span>
                        </div>
                        {se.description && (
                          <p className="text-[11px] text-rose-800/70 mt-1">{se.description}</p>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-rose-600 bg-white/70 px-2 py-0.5 rounded-md border border-rose-200 self-start sm:self-center shrink-0">
                        ห้ามจองชน
                      </span>
                    </div>
                  ))}

                  {/* Workshop Bookings */}
                  {item.bookings.map((bk) => {
                    const room = rooms.find((r) => r.id === bk.roomId);
                    const isApproved = bk.status === 'approved';
                    return (
                      <div
                        key={bk.id}
                        onClick={() => onOpenBookingDetails(bk)}
                        className={`p-2.5 rounded-xl border cursor-pointer hover:shadow-xs transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isApproved
                            ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950'
                            : 'bg-amber-50/60 border-amber-100 text-amber-950'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wider ${
                                isApproved ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {isApproved ? 'Workshop อนุมัติแล้ว' : 'รอการอนุมัติ'}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs font-semibold text-slate-900">{bk.title}</span>
                          </div>

                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {bk.startTime} - {bk.endTime} น.
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {room?.name}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              {bk.expectedAttendees} คน
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1">
                            ผู้จัด: {bk.organizerName} ({bk.department})
                          </div>
                        </div>

                        <div className="text-right self-start sm:self-center shrink-0">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {isApproved ? 'อนุมัติเรียบร้อย' : 'รอพิจารณา'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DAY DETAIL DRAWER / BOTTOM SHEET MODAL */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 pt-3 pb-3 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
              <div>
                <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider block">
                  รายละเอียดกำหนดการ
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {formatThaiDate(selectedDayModal, { withDay: true })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3.5 flex-1">
              {/* Semester Break / Term Status Chip */}
              {(() => {
                const isBreak = selectedDayModal
                  ? checkIsSemesterBreak(selectedDayModal, semesterBreaks, schoolEvents)
                  : false;
                const isGreen = colorMode === 'break-green_term-brown' ? isBreak : !isBreak;
                return (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                      isGreen
                        ? 'bg-[#DCFCE7] border-[#86EFAC] text-emerald-950'
                        : 'bg-[#EEDBC5] border-[#CCA785] text-amber-950'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isGreen ? 'bg-emerald-600' : 'bg-amber-700'
                      }`}
                    />
                    <div className="leading-tight">
                      <span className="font-bold">
                        {isBreak ? 'ช่วงปิดภาคเรียน (ปิดเทอม)' : 'ช่วงเปิดภาคเรียน (เปิดเทอม)'}
                      </span>
                      {selectedDayData?.semesterMarkers && selectedDayData.semesterMarkers.length > 0 && (
                        <span className="text-[11px] block font-medium opacity-90 mt-0.5">
                          {selectedDayData.semesterMarkers[0].title}
                        </span>
                      )}
                      <span className="text-[11px] block text-slate-600 mt-0.5">
                        {isBreak
                          ? 'ห้องเรียนและอาคารส่วนใหญ่ว่าง เหมาะสมและสะดวกต่อการจัด Workshop ภายในโรงเรียน'
                          : 'มีการเรียนการสอนตามปกติของโรงเรียน'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* School Events Alert */}
              {selectedDayData && selectedDayData.schoolEvents.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    กิจกรรมโรงเรียนประจำวัน
                  </span>
                  {selectedDayData.schoolEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900"
                    >
                      <div className="font-semibold text-sm">{ev.title}</div>
                      <div className="text-xs text-rose-700 mt-1 flex flex-wrap items-center gap-2">
                        <span>เวลา: {ev.isAllDay ? 'ตลอดทั้งวัน' : `${ev.startTime} - ${ev.endTime} น.`}</span>
                        <span>·</span>
                        <span>
                          สถานที่: {ev.locationType === 'all_campus' ? 'ทุกอาคาร / ทั้งโรงเรียน' : 'ห้องเฉพาะที่ระบุ'}
                        </span>
                      </div>
                      {ev.description && (
                        <p className="text-xs text-rose-800/80 mt-1.5">{ev.description}</p>
                      )}
                      <div className="mt-2 text-[11px] font-medium text-rose-600 bg-white/80 px-2 py-0.5 rounded inline-block">
                        ⚠️ ห้ามจอง Workshop ซ้อนทับในช่วงเวลานี้
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Workshop Bookings */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                  การจองห้อง Workshop ในวันนี้
                </span>
                {selectedDayData && selectedDayData.bookings.length > 0 ? (
                  selectedDayData.bookings.map((bk) => {
                    const room = rooms.find((r) => r.id === bk.roomId);
                    const isApproved = bk.status === 'approved';
                    return (
                      <div
                        key={bk.id}
                        onClick={() => {
                          setSelectedDayModal(null);
                          onOpenBookingDetails(bk);
                        }}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-sm text-slate-900">{bk.title}</div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isApproved ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                          <span>ห้อง: {room?.name}</span>
                          <span>·</span>
                          <span>เวลา: {bk.startTime} - {bk.endTime} น.</span>
                          <span>·</span>
                          <span>ผู้ขอ: {bk.organizerName}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    ยังไม่มีการจอง Workshop ในวันนี้
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-3 sm:p-4 flex items-center gap-2">
              <button
                onClick={() => {
                  const d = selectedDayModal;
                  setSelectedDayModal(null);
                  if (d) onSelectDateForBooking(d);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                จองห้อง Workshop ในวันนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEMESTER BREAKS CONFIGURATION MODAL */}
      {showSemesterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  ตั้งค่าช่วงวันปิดภาคเรียน (Semester Breaks)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ระบบจะแสดงสีพื้นหลังของแต่ละวันอัตโนมัติ ({colorMode === 'break-green_term-brown' ? 'ปิดเทอม = สีเขียว, เปิดเทอม = สีน้ำตาล' : 'ปิดเทอม = สีน้ำตาล, เปิดเทอม = สีเขียว'})
                </p>
              </div>
              <button
                onClick={() => setShowSemesterModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form to add break */}
            <form onSubmit={handleAddBreak} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-800 block text-xs">
                + เพิ่มช่วงวันปิดเทอมใหม่
              </span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  ชื่อช่วงปิดเทอม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newBreakName}
                  onChange={(e) => setNewBreakName(e.target.value)}
                  placeholder="เช่น ปิดภาคเรียนที่ 1/2569, ปิดเทอมพิเศษ"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    วันที่เริ่ม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newBreakStart}
                    onChange={(e) => setNewBreakStart(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    วันที่สิ้นสุด <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newBreakEnd}
                    onChange={(e) => setNewBreakEnd(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer transition-colors"
              >
                บันทึกช่วงวันปิดเทอม
              </button>
            </form>

            {/* List of current breaks */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block text-xs">
                รายการช่วงวันปิดเทอมที่บันทึกไว้ ({semesterBreaks.length} ช่วงเวลา)
              </span>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                {semesterBreaks.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    ไม่มีรายการช่วงวันปิดเทอมที่กำหนด
                  </div>
                ) : (
                  semesterBreaks.map((b) => (
                    <div key={b.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-slate-900">{b.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatThaiDate(b.startDate)} ถึง {formatThaiDate(b.endDate)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBreak(b.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetBreaks}
                className="text-[11px] text-slate-500 hover:text-indigo-600 underline cursor-pointer"
              >
                คืนค่าช่วงปิดเทอมมาตรฐาน
              </button>
              <button
                type="button"
                onClick={() => setShowSemesterModal(false)}
                className="py-1.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium cursor-pointer"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
