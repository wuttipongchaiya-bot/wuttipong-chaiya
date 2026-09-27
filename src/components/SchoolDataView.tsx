import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Info,
  Layers,
  FileCheck,
  ClipboardPaste,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  Search,
  FileText,
  X,
  Building,
} from 'lucide-react';
import { Room, SchoolEvent, EventCategory } from '../types';
import { formatThaiDate } from '../utils/conflictDetector';
import {
  downloadSchoolEventsTemplate,
  parseRawTextToEvents,
  inspectExcelFile,
  detectColumnsInRows,
  extractEventsFrom2DArray,
} from '../utils/excelParser';
import { INITIAL_SCHOOL_EVENTS } from '../data/mockData';

interface SchoolDataViewProps {
  schoolEvents: SchoolEvent[];
  rooms: Room[];
  onUpdateSchoolEvents: (events: SchoolEvent[]) => void;
  onAddSchoolEvent: (event: SchoolEvent) => void;
  onDeleteSchoolEvent: (eventId: string) => void;
  onResetToDefault: () => void;
  onNavigateToCalendar?: (date?: string) => void;
}

export const SchoolDataView: React.FC<SchoolDataViewProps> = ({
  schoolEvents,
  rooms,
  onUpdateSchoolEvents,
  onAddSchoolEvent,
  onDeleteSchoolEvent,
  onResetToDefault,
  onNavigateToCalendar,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    firstEventDate?: string;
  } | null>(null);

  // Search & Filter in list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Raw Text Paste Modal state
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [rawPastedText, setRawPastedText] = useState('');
  const [previewParsedEvents, setPreviewParsedEvents] = useState<SchoolEvent[]>([]);

  // Excel File Inspector & Column Mapper Wizard State
  const [excelWizard, setExcelWizard] = useState<{
    fileName: string;
    sheetNames: string[];
    activeSheetName: string;
    sheetsData: Record<string, any[][]>;
    rawRows: any[][];
    headerRowIndex: number;
    titleColIndex: number;
    dateColIndex: number;
    locationColIndex: number;
    categoryColIndex: number;
    noteColIndex: number;
    events: SchoolEvent[];
    error?: string;
  } | null>(null);

  // Manual Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newIsAllDay, setNewIsAllDay] = useState(true);
  const [newStartTime, setNewStartTime] = useState('08:30');
  const [newEndTime, setNewEndTime] = useState('16:30');
  const [newLocationType, setNewLocationType] = useState<'all_campus' | 'specific_rooms'>('all_campus');
  const [newAffectedRooms, setNewAffectedRooms] = useState<string[]>([]);
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<EventCategory>('academic');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Sheet change in Wizard
  const handleSheetChange = (sheetName: string) => {
    if (!excelWizard || !excelWizard.sheetsData[sheetName]) return;
    const newRows = excelWizard.sheetsData[sheetName];
    const detected = detectColumnsInRows(newRows, rooms);
    setExcelWizard({
      ...excelWizard,
      activeSheetName: sheetName,
      rawRows: newRows,
      headerRowIndex: detected.headerRowIndex,
      titleColIndex: detected.titleColIndex,
      dateColIndex: detected.dateColIndex,
      locationColIndex: detected.locationColIndex,
      categoryColIndex: detected.categoryColIndex,
      noteColIndex: detected.noteColIndex,
      events: detected.events,
    });
  };

  // Recompute events in Excel Wizard whenever column mapping or header changes
  const updateWizardMapping = (
    headerIdx: number,
    titleIdx: number,
    dateIdx: number,
    locIdx: number,
    catIdx: number,
    noteIdx: number
  ) => {
    if (!excelWizard) return;
    const recomputed = extractEventsFrom2DArray(
      excelWizard.rawRows,
      headerIdx,
      titleIdx,
      dateIdx,
      locIdx,
      catIdx,
      noteIdx,
      rooms
    );

    setExcelWizard({
      ...excelWizard,
      headerRowIndex: headerIdx,
      titleColIndex: titleIdx,
      dateColIndex: dateIdx,
      locationColIndex: locIdx,
      categoryColIndex: catIdx,
      noteColIndex: noteIdx,
      events: recomputed,
    });
  };

  // Real-time parse when raw text changes
  const handleRawTextChange = (text: string) => {
    setRawPastedText(text);
    if (text.trim()) {
      const result = parseRawTextToEvents(text, rooms);
      setPreviewParsedEvents(result.events);
    } else {
      setPreviewParsedEvents([]);
    }
  };

  // Load sample raw presets
  const loadPreset = (presetType: 'standard' | 'simple' | 'office') => {
    if (presetType === 'standard') {
      const sample = `กิจกรรม\tวันที่\tสถานที่\tหมายเหตุ
สอบกลางภาคเรียนที่ 1/2569\t5-7 ต.ค. 2569\tทั้งโรงเรียน\tสนามสอบทุกห้องเรียน ห้ามใช้เสียง
สัปดาห์วิทยาศาสตร์และนวัตกรรม AI\t14-15 ต.ค. 2569\tห้องปฏิบัติการคอมพิวเตอร์ 101, ห้อง STEM & Robotics Innovation Lab\tกิจกรรมประกวดโครงงาน
พิธีวันไหว้ครูประจำปีการศึกษา 2569\t22 ต.ค. 2569\tหอประชุมใหญ่\tพิธีการช่วงเช้า
ประชุมผู้ปกครองภาคเรียนที่ 1\t28 ต.ค. 2569\tทั้งโรงเรียน\tพบครูที่ปรึกษาประจำชั้น`;
      handleRawTextChange(sample);
    } else if (presetType === 'simple') {
      const sample = `5-7 ต.ค. 69\tสอบกลางภาค\n14 ต.ค. 69\tสัปดาห์วิทยาศาสตร์\n22 ต.ค. 69\tพิธีไหว้ครู\n1-3 พ.ย. 69\tค่ายภาษาอังกฤษ English Camp 2026`;
      handleRawTextChange(sample);
    } else {
      const sample = `05/10/2569 - 07/10/2569\tสอบกลางภาค\tทั้งโรงเรียน
14/10/2569\tอบรมครูแกนนำสะเต็ม\tห้องปฏิบัติการคอมพิวเตอร์ 101
20/10/2569\tประชุมประจำเดือน\tห้องประชุมกานดา`;
      handleRawTextChange(sample);
    }
  };

  // Confirm import from raw text
  const handleConfirmPastedEvents = (mode: 'replace' | 'append') => {
    if (previewParsedEvents.length === 0) {
      alert('ไม่พบข้อมูลกิจกรรมที่แปลงได้ กรุณาตรวจสอบข้อความที่วาง');
      return;
    }

    const finalEvents = mode === 'replace' ? previewParsedEvents : [...schoolEvents, ...previewParsedEvents];
    onUpdateSchoolEvents(finalEvents);
    setShowPasteModal(false);
    setUploadMessage({
      type: 'success',
      text: `นำเข้าข้อมูลกิจกรรม ${previewParsedEvents.length} รายการสำเร็จเรียบร้อย (${mode === 'replace' ? 'แทนที่ทั้งหมด' : 'เพิ่มต่อท้าย'})`,
      firstEventDate: previewParsedEvents[0]?.startDate,
    });
    setRawPastedText('');
    setPreviewParsedEvents([]);
  };

  // Confirm import from Excel Wizard
  const handleConfirmExcelWizard = (mode: 'replace' | 'append') => {
    if (!excelWizard || excelWizard.events.length === 0) {
      alert('ไม่พบข้อมูลกิจกรรมที่แปลงได้ กรุณาตรวจสอบการจับคู่คอลัมน์กิจกรรมและวันที่');
      return;
    }

    const finalEvents = mode === 'replace' ? excelWizard.events : [...schoolEvents, ...excelWizard.events];
    onUpdateSchoolEvents(finalEvents);
    const count = excelWizard.events.length;
    const firstDate = excelWizard.events[0]?.startDate;
    setExcelWizard(null);
    setUploadMessage({
      type: 'success',
      text: `นำเข้าข้อมูลจากไฟล์ Excel สำเร็จ ${count} รายการ (${mode === 'replace' ? 'แทนที่ข้อมูลเดิมทั้งหมด' : 'เพิ่มต่อท้ายข้อมูลเดิม'}) พร้อมใช้งานแล้ว`,
      firstEventDate: firstDate,
    });
  };

  // Handle File Upload (.xlsx, .xls, .csv)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);

    const inspect = await inspectExcelFile(file, rooms);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (inspect.error && inspect.rawRows.length === 0) {
      setUploadMessage({ type: 'error', text: inspect.error });
      return;
    }

    // Open Excel Column Mapper Wizard
    setExcelWizard({
      fileName: file.name,
      sheetNames: inspect.sheetNames,
      activeSheetName: inspect.activeSheetName,
      sheetsData: inspect.sheetsData,
      rawRows: inspect.rawRows,
      headerRowIndex: inspect.suggestedHeaderRowIndex,
      titleColIndex: inspect.detectedTitleColIndex,
      dateColIndex: inspect.detectedDateColIndex,
      locationColIndex: inspect.detectedLocationColIndex,
      categoryColIndex: inspect.detectedCategoryColIndex,
      noteColIndex: inspect.detectedNoteColIndex,
      events: inspect.events,
      error: inspect.events.length === 0 ? 'ระบบต้องการให้ท่านช่วยระบุคอลัมน์ชื่อกิจกรรมและคอลัมน์วันที่' : undefined,
    });
  };

  // Clear All Events
  const handleClearAllEvents = () => {
    if (confirm('คุณต้องการล้างข้อมูลกิจกรรมโรงเรียนทั้งหมดเพื่อเริ่มต้นใหม่ใช่หรือไม่?')) {
      onUpdateSchoolEvents([]);
      setUploadMessage({
        type: 'success',
        text: 'ล้างข้อมูลกิจกรรมโรงเรียนทั้งหมดเรียบร้อยแล้ว ท่านสามารถนำเข้าข้อมูลใหม่ได้ทันที',
      });
    }
  };

  // Toggle Affected Room
  const toggleRoom = (roomId: string) => {
    if (newAffectedRooms.includes(roomId)) {
      setNewAffectedRooms(newAffectedRooms.filter((id) => id !== roomId));
    } else {
      setNewAffectedRooms([...newAffectedRooms, roomId]);
    }
  };

  // Handle Submit Manual Event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStartDate) {
      alert('กรุณากรอกชื่อกิจกรรมและวันที่');
      return;
    }

    const event: SchoolEvent = {
      id: `sch-manual-${Date.now()}`,
      title: newTitle.trim(),
      startDate: newStartDate,
      endDate: newEndDate || newStartDate,
      isAllDay: newIsAllDay,
      startTime: newIsAllDay ? undefined : newStartTime,
      endTime: newIsAllDay ? undefined : newEndTime,
      locationType: newLocationType,
      affectedRooms: newLocationType === 'specific_rooms' ? newAffectedRooms : undefined,
      category: newCategory,
      academicYear: '2569',
      description: newDescription.trim(),
      isMandatoryBlock: true,
    };

    onAddSchoolEvent(event);
    setShowAddModal(false);
    setNewTitle('');
    setNewStartDate('');
    setNewEndDate('');
    setNewDescription('');
    setNewAffectedRooms([]);
  };

  // Filtered Events
  const filteredEvents = schoolEvents.filter((ev) => {
    const matchSearch =
      !searchQuery.trim() ||
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = filterCategory === 'all' || ev.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Header & Excel Sync Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider block">
              ฐานข้อมูลปฏิทินโรงเรียน (School Master Calendar)
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              จัดการและนำเข้าปฏิทินกิจกรรมโรงเรียน
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              นำเข้าไฟล์ Excel ประจำปีการศึกษา หรือวางข้อความตารางดิบ ระบบจะแปลงวันที่และตรวจสอบการจองชนให้อัตโนมัติ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Direct Paste / Convert Raw Data Button */}
            <button
              onClick={() => {
                setShowPasteModal(true);
                if (!rawPastedText) loadPreset('standard');
              }}
              className="text-xs font-semibold py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>วางข้อความข้อมูลดิบ</span>
            </button>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            {/* Upload Excel Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-xs font-semibold py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'กำลังอ่านไฟล์...' : 'นำเข้าไฟล์ Excel'}</span>
            </button>

            {/* Download Template Button */}
            <button
              onClick={downloadSchoolEventsTemplate}
              className="text-xs font-medium py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ดาวน์โหลดไฟล์ตัวอย่าง Excel สำหรับกรอกข้อมูล"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">โหลดแม่แบบ</span>
            </button>

            {/* Manual Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-medium py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>เพิ่มกิจกรรมเดี่ยว</span>
            </button>
          </div>
        </div>

        {/* Upload Status / Success Notice */}
        {uploadMessage && (
          <div
            className={`mt-4 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              uploadMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {uploadMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{uploadMessage.text}</span>
            </div>

            {uploadMessage.type === 'success' && onNavigateToCalendar && (
              <button
                type="button"
                onClick={() => onNavigateToCalendar(uploadMessage.firstEventDate)}
                className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 self-start sm:self-center shrink-0 cursor-pointer shadow-2xs"
              >
                <span>ดูในหน้าปฏิทินทันที</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Summary Info Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              สถานะข้อมูลปัจจุบัน:
            </span>
            <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {schoolEvents.length} กิจกรรมในระบบ
            </span>
            <span className="text-slate-400">·</span>
            <span>(กิจกรรมเหล่านี้จะบล็อกไม่ให้คนจองห้องซ้อนทับ)</span>
          </div>

          <div className="flex items-center gap-2">
            {schoolEvents.length > 0 && onNavigateToCalendar && (
              <button
                onClick={() => onNavigateToCalendar(schoolEvents[0]?.startDate)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>เปิดดูปฏิทิน</span>
              </button>
            )}
            <button
              onClick={handleClearAllEvents}
              className="text-xs text-slate-500 hover:text-rose-600 font-medium transition-colors cursor-pointer"
            >
              ล้างข้อมูลทั้งหมด
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={onResetToDefault}
              className="text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>คืนค่าข้อมูลเริ่มต้น</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหากิจกรรมโรงเรียน หรือคำอธิบาย..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-slate-400 text-[11px] shrink-0">หมวดหมู่:</span>
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'exam', label: 'การสอบ' },
              { id: 'academic', label: 'วิชาการ' },
              { id: 'ceremony', label: 'พิธีการ' },
              { id: 'sports', label: 'กีฬา' },
              { id: 'meeting', label: 'ประชุม' },
              { id: 'holiday', label: 'วันหยุด' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events List Cards */}
        <div className="divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              ไม่พบกิจกรรมโรงเรียนที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : (
            filteredEvents.map((event) => {
              const categoryBadge = {
                exam: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'การสอบ' },
                ceremony: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'พิธีการ' },
                academic: { bg: 'bg-sky-50 text-sky-700 border-sky-200', text: 'วิชาการ' },
                sports: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'กีฬา/กิจกรรม' },
                holiday: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'วันหยุด' },
                meeting: { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'ประชุม' },
              }[event.category] || { bg: 'bg-slate-50 text-slate-700 border-slate-200', text: 'กิจกรรม' };

              return (
                <div
                  key={event.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${categoryBadge.bg}`}>
                        {categoryBadge.text}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs">{event.title}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatThaiDate(event.startDate)}
                        {event.startDate !== event.endDate && ` ถึง ${formatThaiDate(event.endDate)}`}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {event.isAllDay ? 'ตลอดทั้งวัน' : `${event.startTime} - ${event.endTime} น.`}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {event.locationType === 'all_campus' ? 'ทุกอาคาร / ทั้งโรงเรียน' : 'ห้องเฉพาะที่ระบุ'}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-slate-600 text-[11px]">{event.description}</p>
                    )}
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onDeleteSchoolEvent(event.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="ลบกิจกรรมนี้ออกจากปฏิทิน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* EXCEL IMPORT & COLUMN MAPPER WIZARD MODAL */}
      {excelWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/80">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                  เครื่องมือนำเข้าและจับคู่คอลัมน์ Excel (Smart Column Mapper)
                </span>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  ตรวจสอบและกำหนดคอลัมน์ไฟล์: {excelWizard.fileName}
                </h3>
                <p className="text-xs text-slate-500">
                  ระบบตรวจพบ {excelWizard.rawRows.length} แถว กรุณาเลือกคอลัมน์กิจกรรมและวันที่ เพื่อให้ระบบแปลงข้อมูลได้ 100%
                </p>
              </div>
              <button
                onClick={() => setExcelWizard(null)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Sheet selector if multiple */}
              {excelWizard.sheetNames.length > 1 && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-700">เลือกแผ่นงาน (Sheet):</span>
                  <select
                    value={excelWizard.activeSheetName}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium"
                  >
                    {excelWizard.sheetNames.map((name) => (
                      <option key={name} value={name}>
                        {name} ({excelWizard.sheetsData[name]?.length || 0} แถว)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Column Mapping Controls */}
              <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    กำหนดแถวหัวตารางและคอลัมน์ข้อมูล
                  </span>
                  <span className="text-[11px] text-slate-500">
                    แถวหัวตารางช่วยให้ระบบทราบชื่อคอลัมน์
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Header Row Index */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      แถวที่เป็นหัวตาราง (Header Row):
                    </label>
                    <select
                      value={excelWizard.headerRowIndex}
                      onChange={(e) => {
                        const newH = Number(e.target.value);
                        updateWizardMapping(
                          newH,
                          excelWizard.titleColIndex,
                          excelWizard.dateColIndex,
                          excelWizard.locationColIndex,
                          excelWizard.categoryColIndex,
                          excelWizard.noteColIndex
                        );
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {excelWizard.rawRows.slice(0, 15).map((row, idx) => (
                        <option key={idx} value={idx}>
                          แถวที่ {idx + 1}: {row.slice(0, 3).map(String).join(' | ') || '(ว่าง)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title Column */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      คอลัมน์ "ชื่อกิจกรรม / งาน" <span className="text-rose-500">*</span>:
                    </label>
                    <select
                      value={excelWizard.titleColIndex}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateWizardMapping(
                          excelWizard.headerRowIndex,
                          val,
                          excelWizard.dateColIndex,
                          excelWizard.locationColIndex,
                          excelWizard.categoryColIndex,
                          excelWizard.noteColIndex
                        );
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={-1}>-- กรุณาเลือกคอลัมน์ --</option>
                      {excelWizard.rawRows[excelWizard.headerRowIndex]?.map((cell, colIdx) => {
                        const colLetter = String.fromCharCode(65 + colIdx);
                        const sample = excelWizard.rawRows[excelWizard.headerRowIndex + 1]?.[colIdx] || '';
                        return (
                          <option key={colIdx} value={colIdx}>
                            คอลัมน์ {colLetter}: {String(cell || `(คอลัมน์ ${colLetter})`)} {sample ? `(เช่น: ${String(sample).slice(0, 15)})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Date Column */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      คอลัมน์ "วันที่ / ช่วงเวลา" <span className="text-rose-500">*</span>:
                    </label>
                    <select
                      value={excelWizard.dateColIndex}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateWizardMapping(
                          excelWizard.headerRowIndex,
                          excelWizard.titleColIndex,
                          val,
                          excelWizard.locationColIndex,
                          excelWizard.categoryColIndex,
                          excelWizard.noteColIndex
                        );
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={-1}>-- กรุณาเลือกคอลัมน์ --</option>
                      {excelWizard.rawRows[excelWizard.headerRowIndex]?.map((cell, colIdx) => {
                        const colLetter = String.fromCharCode(65 + colIdx);
                        const sample = excelWizard.rawRows[excelWizard.headerRowIndex + 1]?.[colIdx] || '';
                        return (
                          <option key={colIdx} value={colIdx}>
                            คอลัมน์ {colLetter}: {String(cell || `(คอลัมน์ ${colLetter})`)} {sample ? `(เช่น: ${String(sample).slice(0, 15)})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Location Column */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      คอลัมน์ "สถานที่ / ห้องที่ใช้" (ถ้ามี):
                    </label>
                    <select
                      value={excelWizard.locationColIndex}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateWizardMapping(
                          excelWizard.headerRowIndex,
                          excelWizard.titleColIndex,
                          excelWizard.dateColIndex,
                          val,
                          excelWizard.categoryColIndex,
                          excelWizard.noteColIndex
                        );
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={-1}>-- ไม่ระบุ (ถือว่าใช้ทั้งโรงเรียน) --</option>
                      {excelWizard.rawRows[excelWizard.headerRowIndex]?.map((cell, colIdx) => {
                        const colLetter = String.fromCharCode(65 + colIdx);
                        return (
                          <option key={colIdx} value={colIdx}>
                            คอลัมน์ {colLetter}: {String(cell || `คอลัมน์ ${colLetter}`)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Note Column */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      คอลัมน์ "หมายเหตุ / ผู้รับผิดชอบ" (ถ้ามี):
                    </label>
                    <select
                      value={excelWizard.noteColIndex}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateWizardMapping(
                          excelWizard.headerRowIndex,
                          excelWizard.titleColIndex,
                          excelWizard.dateColIndex,
                          excelWizard.locationColIndex,
                          excelWizard.categoryColIndex,
                          val
                        );
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={-1}>-- ไม่ระบุ --</option>
                      {excelWizard.rawRows[excelWizard.headerRowIndex]?.map((cell, colIdx) => {
                        const colLetter = String.fromCharCode(65 + colIdx);
                        return (
                          <option key={colIdx} value={colIdx}>
                            คอลัมน์ {colLetter}: {String(cell || `คอลัมน์ ${colLetter}`)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Real-time Parsed Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    ตัวอย่างกิจกรรมที่ตรวจพบและแปลงแล้ว ({excelWizard.events.length} กิจกรรม):
                  </label>
                  {excelWizard.events.length > 0 ? (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      แปลงข้อมูลสำเร็จ {excelWizard.events.length} รายการ
                    </span>
                  ) : (
                    <span className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      กรุณาเลือกคอลัมน์กิจกรรมและวันที่
                    </span>
                  )}
                </div>

                {excelWizard.events.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                    <p className="font-semibold text-slate-700">ยังไม่พบข้อมูลกิจกรรม</p>
                    <p className="text-[11px]">
                      กรุณาเลือกแถวหัวตาราง และคอลัมน์ "ชื่อกิจกรรม" และ "วันที่" ด้านบน ระบบจะแสดงข้อมูลที่แปลงได้ทันที
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2.5 pl-3">#</th>
                          <th className="p-2.5">ชื่อกิจกรรม</th>
                          <th className="p-2.5">วันที่แปลงแล้ว</th>
                          <th className="p-2.5">สถานที่</th>
                          <th className="p-2.5">หมวดหมู่</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {excelWizard.events.map((ev, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 pl-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{ev.title}</td>
                            <td className="p-2.5 text-slate-700 font-mono text-[11px]">
                              {formatThaiDate(ev.startDate)}
                              {ev.startDate !== ev.endDate && ` ถึง ${formatThaiDate(ev.endDate)}`}
                            </td>
                            <td className="p-2.5 text-slate-600">
                              {ev.locationType === 'all_campus' ? 'ทั้งโรงเรียน' : 'ห้องเฉพาะ'}
                            </td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {ev.category}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setExcelWizard(null)}
                className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
              >
                ยกเลิก
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Append Button */}
                <button
                  type="button"
                  onClick={() => handleConfirmExcelWizard('append')}
                  disabled={excelWizard.events.length === 0}
                  className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  เพิ่มต่อท้ายข้อมูลเดิม ({excelWizard.events.length} รายการ)
                </button>

                {/* Replace Button (Recommended) */}
                <button
                  type="button"
                  onClick={() => handleConfirmExcelWizard('replace')}
                  disabled={excelWizard.events.length === 0}
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>แทนที่ข้อมูลเดิมทั้งหมด ({excelWizard.events.length} รายการ) - แนะนำ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RAW DATA PASTE & CONVERT MODAL */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/80">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                  ตัวแปลงข้อมูลดิบ (Smart Raw Data Transformer)
                </span>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-0.5">
                  วางข้อความตาราง Excel หรือเอกสารโรงเรียนเพื่อแปลงข้อมูลอัตโนมัติ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ก๊อปปี้จาก Excel หรือ Word/PDF แล้วนำมาวางได้ทันที รองรับวันที่ไทย (เช่น 5-7 ต.ค. 2569)
                </p>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Presets Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <span className="text-indigo-900 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  ลองใช้ชุดตัวอย่างรูปแบบข้อมูลดิบ:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => loadPreset('standard')}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg font-medium border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    รูปแบบมาตรฐาน 4 คอลัมน์
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('simple')}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg font-medium border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    รูปแบบ 2 คอลัมน์ (วันที่-กิจกรรม)
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('office')}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg font-medium border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    รูปแบบ ว/ด/ป (05/10/2569)
                  </button>
                </div>
              </div>

              {/* Textarea Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  กล่องข้อความข้อมูลดิบ (วางข้อความตารางที่นี่):
                </label>
                <textarea
                  rows={6}
                  value={rawPastedText}
                  onChange={(e) => handleRawTextChange(e.target.value)}
                  placeholder={`ตัวอย่างเช่น:
กิจกรรม\tวันที่\tสถานที่
สอบกลางภาค\t5-7 ต.ค. 2569\tทั้งโรงเรียน
สัปดาห์วิทยาศาสตร์\t14-15 ต.ค. 2569\tห้องปฏิบัติการคอมพิวเตอร์ 101
พิธีไหว้ครู\t22 ต.ค. 2569\tหอประชุมใหญ่`}
                  className="w-full font-mono text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              {/* Real-time Parsed Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    ผลลัพธ์การแปลงข้อมูลแบบเรียลไทม์ ({previewParsedEvents.length} กิจกรรม):
                  </label>
                  {previewParsedEvents.length > 0 && (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      แปลงข้อมูลสำเร็จ พร้อมนำเข้า
                    </span>
                  )}
                </div>

                {previewParsedEvents.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    วางข้อความด้านบนเพื่อดูตัวอย่างกิจกรรมที่จะถูกสร้าง
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2 pl-3">ชื่อกิจกรรม</th>
                          <th className="p-2">วันที่แปลงแล้ว</th>
                          <th className="p-2">สถานที่</th>
                          <th className="p-2">หมวดหมู่</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {previewParsedEvents.map((ev, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 pl-3 font-semibold text-slate-900">{ev.title}</td>
                            <td className="p-2 text-slate-700 font-mono text-[11px]">
                              {formatThaiDate(ev.startDate)}
                              {ev.startDate !== ev.endDate && ` ถึง ${formatThaiDate(ev.endDate)}`}
                            </td>
                            <td className="p-2 text-slate-600">
                              {ev.locationType === 'all_campus' ? 'ทั้งโรงเรียน' : 'ห้องเฉพาะ'}
                            </td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {ev.category}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
              >
                ยกเลิก
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmPastedEvents('append')}
                  disabled={previewParsedEvents.length === 0}
                  className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  เพิ่มต่อท้ายข้อมูลเดิม
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmPastedEvents('replace')}
                  disabled={previewParsedEvents.length === 0}
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>แทนที่ข้อมูลเดิมทั้งหมด ({previewParsedEvents.length} รายการ)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                เพิ่มกิจกรรมโรงเรียน (ข้อมูลบล็อกวัน/สถานที่)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อกิจกรรมโรงเรียน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น สัปดาห์สอบปลายภาคเรียนที่ 1, วันสถาปนาโรงเรียน"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วันที่เริ่มต้น <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หมวดหมู่กิจกรรม</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="exam">การสอบ (Exam)</option>
                    <option value="ceremony">พิธีการสำคัญ (Ceremony)</option>
                    <option value="academic">วิชาการ (Academic)</option>
                    <option value="meeting">ประชุมผู้ปกครอง (Meeting)</option>
                    <option value="sports">กีฬา/กิจกรรม (Sports)</option>
                    <option value="holiday">วันหยุดราชการ (Holiday)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ขอบเขตสถานที่</label>
                  <select
                    value={newLocationType}
                    onChange={(e: any) => setNewLocationType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all_campus">ทั้งโรงเรียน (ทุกอาคาร/ทุกห้อง)</option>
                    <option value="specific_rooms">เฉพาะบางห้องที่ระบุ</option>
                  </select>
                </div>
              </div>

              {newLocationType === 'specific_rooms' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เลือกห้องที่กิจกรรมนี้ใช้งาน (ห้ามจอง)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {rooms.map((r) => (
                      <label key={r.id} className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAffectedRooms.includes(r.id)}
                          onChange={() => toggleRoom(r.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{r.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newIsAllDay}
                    onChange={(e) => setNewIsAllDay(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>กิจกรรมเต็มวัน (All Day)</span>
                </label>
              </div>

              {!newIsAllDay && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">เวลาเริ่ม</label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">เวลาสิ้นสุด</label>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุ / คำอธิบาย</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="เช่น ห้ามใช้เครื่องเสียงรอบอาคาร 1"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  บันทึกกิจกรรมโรงเรียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
