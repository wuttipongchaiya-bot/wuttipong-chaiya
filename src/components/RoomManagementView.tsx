import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Users,
  MapPin,
  Check,
  X,
  Search,
  Sparkles,
  RefreshCw,
  Tag,
  SlidersHorizontal,
  Info,
  Calendar,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { Room, WorkshopBooking } from '../types';
import { INITIAL_ROOMS } from '../data/mockData';

interface RoomManagementViewProps {
  rooms: Room[];
  bookings: WorkshopBooking[];
  onAddRoom: (room: Omit<Room, 'id'>) => void;
  onUpdateRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string, deleteRelatedBookings?: boolean) => void;
  onResetRooms: () => void;
  onNavigateToBooking?: (roomId?: string) => void;
  isReadOnly?: boolean;
}

// Popular facility presets in Thai schools
const POPULAR_FACILITIES = [
  'Projector 4K',
  'จอ Smart TV 85 นิ้ว',
  'ไมโครโฟนไร้สาย',
  'เครื่องปรับอากาศ',
  'Wi-Fi โรงเรียนความเร็วสูง',
  'โต๊ะประชุมปรับเปลี่ยนได้',
  'ระบบเสียงห้องประชุม',
  'คอมพิวเตอร์ประจำห้อง',
  'เครื่องพิมพ์ 3D Printer',
  'ชุดอุปกรณ์หุ่นยนต์ STEM',
  'เวทีขนาดใหญ่พร้อมไฟเวที',
  'ระบบถ่ายทอดสด / Video Conference',
];

// Preset Color Swatches
const PRESET_COLORS = [
  { label: 'Blue', hex: '#3B82F6' },
  { label: 'Purple', hex: '#8B5CF6' },
  { label: 'Emerald', hex: '#10B981' },
  { label: 'Amber', hex: '#F59E0B' },
  { label: 'Rose', hex: '#F43F5E' },
  { label: 'Indigo', hex: '#6366F1' },
  { label: 'Cyan', hex: '#06B6D4' },
  { label: 'Teal', hex: '#14B8A6' },
];

export const RoomManagementView: React.FC<RoomManagementViewProps> = ({
  rooms,
  bookings,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onResetRooms,
  onNavigateToBooking,
  isReadOnly = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');

  // Modal State (null = closed, 'new' = add room, Room object = edit room)
  const [modalMode, setModalMode] = useState<'new' | Room | null>(null);

  // In-app Confirmation Dialog States (Replacing native window.confirm)
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<Room | null>(null);
  const [deleteRelatedBookings, setDeleteRelatedBookings] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formBuilding, setFormBuilding] = useState('');
  const [formFloor, setFormFloor] = useState('ชั้น 1');
  const [formCapacity, setFormCapacity] = useState<number>(40);
  const [formColor, setFormColor] = useState('#3B82F6');
  const [formFacilities, setFormFacilities] = useState<string[]>([]);
  const [customFacilityInput, setCustomFacilityInput] = useState('');

  // Open modal for new room
  const openNewRoomModal = () => {
    setFormName('');
    setFormBuilding('');
    setFormFloor('ชั้น 1');
    setFormCapacity(40);
    setFormColor('#3B82F6');
    setFormFacilities(['เครื่องปรับอากาศ', 'Projector 4K', 'Wi-Fi โรงเรียนความเร็วสูง']);
    setCustomFacilityInput('');
    setModalMode('new');
  };

  // Open modal for editing existing room
  const openEditRoomModal = (room: Room) => {
    setFormName(room.name);
    setFormBuilding(room.building);
    setFormFloor(room.floor);
    setFormCapacity(room.capacity);
    setFormColor(room.color || '#3B82F6');
    setFormFacilities([...room.facilities]);
    setCustomFacilityInput('');
    setModalMode(room);
  };

  // Toggle facility tag
  const toggleFacility = (facility: string) => {
    if (formFacilities.includes(facility)) {
      setFormFacilities(formFacilities.filter((f) => f !== facility));
    } else {
      setFormFacilities([...formFacilities, facility]);
    }
  };

  // Add custom facility from input
  const addCustomFacility = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customFacilityInput.trim();
    if (trimmed && !formFacilities.includes(trimmed)) {
      setFormFacilities([...formFacilities, trimmed]);
      setCustomFacilityInput('');
    }
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBuilding.trim()) {
      return;
    }

    if (modalMode === 'new') {
      onAddRoom({
        name: formName.trim(),
        building: formBuilding.trim(),
        floor: formFloor.trim(),
        capacity: Number(formCapacity) || 10,
        facilities: formFacilities,
        color: formColor,
      });
    } else if (modalMode && typeof modalMode === 'object') {
      onUpdateRoom({
        ...modalMode,
        name: formName.trim(),
        building: formBuilding.trim(),
        floor: formFloor.trim(),
        capacity: Number(formCapacity) || 10,
        facilities: formFacilities,
        color: formColor,
      });
    }

    setModalMode(null);
  };

  // Filter buildings list
  const buildingsList = Array.from(new Set(rooms.map((r) => r.building))).filter(Boolean);

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    const matchSearch =
      !searchQuery.trim() ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.facilities.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchBuilding = selectedBuilding === 'all' || r.building === selectedBuilding;
    return matchSearch && matchBuilding;
  });

  // Calculate statistics
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);

  return (
    <div className="space-y-4 pb-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider block">
              {isReadOnly
                ? 'ทำเนียบห้องประชุมและสิ่งอำนวยความสะดวก (Rooms & Venues)'
                : 'ระบบจัดการสถานที่ภายในโรงเรียน (Room & Venue Management)'}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {isReadOnly ? 'ข้อมูลห้องประชุมสำหรับจัด Workshop' : 'จัดการห้องประชุมและห้องจัด Workshop'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isReadOnly
                ? 'ตรวจสอบความจุ อาคาร และอุปกรณ์ประจำห้อง หรือกดปุ่ม "จองห้องนี้" เพื่อเริ่มขอใช้สถานที่'
                : 'เพิ่ม ลด หรือแก้ไขรายละเอียดห้องประชุม อาคาร ความจุ และอุปกรณ์ประจำห้อง สำหรับใช้ในระบบจอง'}
            </p>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={openNewRoomModal}
                className="text-xs font-semibold py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มห้องประชุมใหม่</span>
              </button>
              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="text-xs font-medium py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="คืนค่ารายชื่อห้องตั้งต้นของโรงเรียน"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
              </button>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 text-[11px] block">ห้องประชุมทั้งหมด</span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">
              {rooms.length} ห้อง
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 text-[11px] block">ความจุผู้เข้าร่วมรวม</span>
            <span className="text-base font-bold text-indigo-600 mt-0.5 block">
              {totalCapacity.toLocaleString()} ที่นั่ง
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 text-[11px] block">อาคารที่มีห้องประชุม</span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">
              {buildingsList.length} อาคาร
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 text-[11px] block">รายการคำขอจองปัจจุบัน</span>
            <span className="text-base font-bold text-emerald-600 mt-0.5 block">
              {bookings.length} รายการ
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อห้อง อาคาร หรืออุปกรณ์อำนวยความสะดวก..."
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
            <span className="text-slate-400 text-[11px] shrink-0">อาคาร:</span>
            <button
              onClick={() => setSelectedBuilding('all')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedBuilding === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทุกอาคาร ({rooms.length})
            </button>
            {buildingsList.map((bName) => (
              <button
                key={bName}
                onClick={() => setSelectedBuilding(bName)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedBuilding === bName
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {bName} ({rooms.filter((r) => r.building === bName).length})
              </button>
            ))}
          </div>
        </div>

        {/* Room Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full py-12 px-4 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  {rooms.length === 0 ? 'ยังไม่มีห้องประชุมในระบบ' : 'ไม่พบห้องประชุมที่ตรงกับเงื่อนไขการค้นหา'}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {rooms.length === 0
                    ? 'คุณสามารถเพิ่มห้องประชุมใหม่ หรือคืนค่ารายชื่อห้องเริ่มต้นของโรงเรียนได้'
                    : 'ลองปรับคำค้นหา หรือเลือกตัวกรองอาคารอื่น'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={openNewRoomModal}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มห้องประชุมใหม่</span>
                </button>
                {rooms.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmModal(true)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>คืนค่าเริ่มต้น (5 ห้อง)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const roomBookings = bookings.filter((b) => b.roomId === room.id);
              const approvedCount = roomBookings.filter((b) => b.status === 'approved').length;

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-4 flex flex-col justify-between transition-all hover:shadow-xs group"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Color indicator & Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-2 ring-white"
                          style={{ backgroundColor: room.color || '#3B82F6' }}
                          title={`สีประจำห้อง: ${room.color}`}
                        />
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {room.name}
                        </h3>
                      </div>

                      {!isReadOnly && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditRoomModal(room)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                            title="แก้ไขรายละเอียดห้อง"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteRelatedBookings(false);
                              setDeleteConfirmRoom(room);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200/90 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="ลบห้องนี้ออกจากระบบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Location & Capacity Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{room.building} ({room.floor})</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 font-semibold text-slate-700">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{room.capacity} ที่นั่ง</span>
                      </span>
                    </div>

                    {/* Facilities Chips */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                        อุปกรณ์ & สิ่งอำนวยความสะดวก:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {room.facilities.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">ไม่มีอุปกรณ์ระบุ</span>
                        ) : (
                          room.facilities.map((fac, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100/80 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/50"
                            >
                              {fac}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Bookings count & Action button */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      จองแล้ว: <strong className="text-emerald-700">{approvedCount}</strong> รายการ
                    </span>

                    {onNavigateToBooking && (
                      <button
                        onClick={() => onNavigateToBooking(room.id)}
                        className="py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>จองห้องนี้</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DELETE ROOM IN-APP CONFIRMATION MODAL */}
      {deleteConfirmRoom && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                ยืนยันการลบห้องประชุม?
              </h3>
              <p className="text-xs text-slate-600">
                คุณกำลังจะลบห้อง <strong className="text-slate-900 font-bold">"{deleteConfirmRoom.name}"</strong> ({deleteConfirmRoom.building} {deleteConfirmRoom.floor}) ออกจากระบบ
              </p>
            </div>

            {/* Room Info Summary */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>ความจุผู้เข้าร่วม:</span>
                <span className="font-bold text-slate-800">{deleteConfirmRoom.capacity} ที่นั่ง</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>อาคาร / ชั้น:</span>
                <span className="font-semibold text-slate-800">{deleteConfirmRoom.building} ({deleteConfirmRoom.floor})</span>
              </div>
              {deleteConfirmRoom.facilities && deleteConfirmRoom.facilities.length > 0 && (
                <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200/60 mt-1">
                  อุปกรณ์: {deleteConfirmRoom.facilities.join(', ')}
                </div>
              )}
            </div>

            {(() => {
              const related = bookings.filter((b) => b.roomId === deleteConfirmRoom.id);
              if (related.length > 0) {
                return (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">คำเตือน: มีรายการคำขอจองห้องนี้ {related.length} รายการ</span>
                        <span className="text-[11px] text-amber-800">
                          สามารถเลือกลบรายการคำขอจองที่ผูกกับห้องนี้ออกด้วย หรือเก็บข้อมูลไว้
                        </span>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 pt-1.5 border-t border-amber-200/80 cursor-pointer text-[11px] font-medium text-amber-950">
                      <input
                        type="checkbox"
                        checked={deleteRelatedBookings}
                        onChange={(e) => setDeleteRelatedBookings(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-amber-300"
                      />
                      <span>ลบคำขอจองที่ผูกกับห้องนี้ ({related.length} รายการ) ออกด้วย</span>
                    </label>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmRoom(null);
                  setDeleteRelatedBookings(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = deleteConfirmRoom.id;
                  const shouldDeleteBookings = deleteRelatedBookings;
                  setDeleteConfirmRoom(null);
                  setDeleteRelatedBookings(false);
                  onDeleteRoom(targetId, shouldDeleteBookings);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบห้องนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET ROOMS IN-APP CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                คืนค่ารายชื่อห้องเริ่มต้น?
              </h3>
              <p className="text-xs text-slate-600">
                ระบบจะรีเซ็ตและคืนค่ารายชื่อห้องประชุมทั้ง 5 ห้องตั้งต้นของโรงเรียน
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetRooms();
                  setShowResetConfirmModal(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                ยืนยันคืนค่าเริ่มต้น
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT ROOM MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                  {modalMode === 'new' ? 'เพิ่มห้องใหม่' : 'แก้ไขห้อง'}
                </span>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  {modalMode === 'new' ? 'รายละเอียดห้องประชุม / สถานที่จัด Workshop' : `แก้ไข: ${formName}`}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Room Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อห้องประชุม / สถานที่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น ห้องประชุมกานดา, ห้องคอมพิวเตอร์ 2"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Building & Floor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชื่ออาคาร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formBuilding}
                    onChange={(e) => setFormBuilding(e.target.value)}
                    placeholder="เช่น อาคาร 2, อาคารเฉลิมพระเกียรติ"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชั้น</label>
                  <input
                    type="text"
                    value={formFloor}
                    onChange={(e) => setFormFloor(e.target.value)}
                    placeholder="เช่น ชั้น 1, ชั้น 3"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Capacity & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ความจุผู้เข้าร่วม (คน) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สีประจำห้อง</label>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setFormColor(col.hex)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          formColor === col.hex ? 'scale-120 ring-2 ring-indigo-500 ring-offset-1' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5 ml-1"
                      title="เลือกสีอื่น"
                    />
                  </div>
                </div>
              </div>

              {/* Facilities selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  อุปกรณ์ & สิ่งอำนวยความสะดวก:
                </label>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                  {POPULAR_FACILITIES.map((fac) => {
                    const isSelected = formFacilities.includes(fac);
                    return (
                      <button
                        key={fac}
                        type="button"
                        onClick={() => toggleFacility(fac)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{fac}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom facility input */}
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="text"
                    value={customFacilityInput}
                    onChange={(e) => setCustomFacilityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomFacility();
                      }
                    }}
                    placeholder="พิมพ์อุปกรณ์อื่นเพิ่มเติม เช่น จอสัมผัสอัจฉริยะ..."
                    className="flex-1 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomFacility()}
                    disabled={!customFacilityInput.trim()}
                    className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 rounded-xl font-medium shrink-0 cursor-pointer"
                  >
                    + เพิ่ม
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                {modalMode && modalMode !== 'new' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const roomToDelete = modalMode as Room;
                      setModalMode(null);
                      setDeleteRelatedBookings(false);
                      setDeleteConfirmRoom(roomToDelete);
                    }}
                    className="py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบห้องนี้</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                  >
                    {modalMode === 'new' ? 'บันทึกห้องใหม่' : 'บันทึกการแก้ไข'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

