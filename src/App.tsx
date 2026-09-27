/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  INITIAL_BOOKINGS,
  INITIAL_ROOMS,
  INITIAL_SCHOOL_EVENTS,
} from './data/mockData';
import { Room, SchoolEvent, WorkshopBooking } from './types';
import { AdminUser } from './types/auth';
import { Navbar } from './components/Navbar';
import { AdminNavbar } from './components/AdminNavbar';
import { AdminLoginView } from './components/AdminLoginView';
import { BottomTabBar } from './components/BottomTabBar';
import { CalendarView } from './components/CalendarView';
import { BookingForm } from './components/BookingForm';
import { ApprovalView } from './components/ApprovalView';
import { SchoolDataView } from './components/SchoolDataView';
import { RoomManagementView } from './components/RoomManagementView';
import { MyBookingsView } from './components/MyBookingsView';
import { BookingDetailModal } from './components/BookingDetailModal';
import { EditBookingModal } from './components/EditBookingModal';
import { CheckCircle2, X } from 'lucide-react';

const LOCAL_STORAGE_EVENTS_KEY = 'school_workshop_events_v1';
const LOCAL_STORAGE_BOOKINGS_KEY = 'school_workshop_bookings_v1';
const LOCAL_STORAGE_ROOMS_KEY = 'school_workshop_rooms_v1';
const LOCAL_STORAGE_ADMIN_USER_KEY = 'school_workshop_admin_user_v1';
const LOCAL_STORAGE_PORTAL_KEY = 'school_workshop_portal_v1';

export default function App() {
  // Portal Mode: 'frontend' (Public / Teachers) vs 'backend' (Officers & Admins)
  const [portal, setPortal] = useState<'frontend' | 'backend'>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PORTAL_KEY);
      if (saved === 'backend' || saved === 'frontend') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'frontend';
  });

  // Authenticated Admin User Session
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ADMIN_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load admin user session', e);
    }
    return null;
  });

  // Navigation states for Frontend & Backend
  const [activeFrontendTab, setActiveFrontendTab] = useState<'calendar' | 'booking' | 'rooms' | 'my-bookings'>('calendar');
  const [activeAdminTab, setActiveAdminTab] = useState<'approval' | 'rooms' | 'school-data' | 'calendar'>('approval');

  // Rooms State (Persistent in localStorage)
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ROOMS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load rooms from storage', e);
    }
    return INITIAL_ROOMS;
  });

  // School Events State (Persistent in localStorage)
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load events from storage', e);
    }
    return INITIAL_SCHOOL_EVENTS;
  });

  // Workshop Bookings State (Persistent in localStorage)
  const [bookings, setBookings] = useState<WorkshopBooking[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load bookings from storage', e);
    }
    return INITIAL_BOOKINGS;
  });

  // Selected date for new booking from calendar click
  const [prefilledBookingDate, setPrefilledBookingDate] = useState<string | null>(null);

  // Selected room for prefilled booking
  const [prefilledRoomId, setPrefilledRoomId] = useState<string | null>(null);

  // Focus date for CalendarView navigation
  const [calendarFocusDate, setCalendarFocusDate] = useState<string | null>(null);

  // Selected booking for detail view
  const [detailBooking, setDetailBooking] = useState<WorkshopBooking | null>(null);

  // Selected booking for editing from detail modal
  const [editingBookingFromDetail, setEditingBookingFromDetail] = useState<WorkshopBooking | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PORTAL_KEY, portal);
    } catch (e) {
      console.error(e);
    }
  }, [portal]);

  useEffect(() => {
    try {
      if (adminUser) {
        localStorage.setItem(LOCAL_STORAGE_ADMIN_USER_KEY, JSON.stringify(adminUser));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_ADMIN_USER_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [adminUser]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ROOMS_KEY, JSON.stringify(rooms));
    } catch (e) {
      console.error(e);
    }
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(schoolEvents));
    } catch (e) {
      console.error(e);
    }
  }, [schoolEvents]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
    } catch (e) {
      console.error(e);
    }
  }, [bookings]);

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Pending count for officer badge
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  // Handlers for Authentication
  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setPortal('backend');
    setActiveAdminTab('approval');
    showToast(`ยินดีต้อนรับ ${user.name} เข้าสู่ระบบจัดการหลังบ้าน`);
  };

  const handleLogout = () => {
    setAdminUser(null);
    setPortal('frontend');
    showToast('ออกจากระบบหลังบ้านเรียบร้อยแล้ว');
  };

  const handleOpenBackend = () => {
    setPortal('backend');
    if (adminUser) {
      setActiveAdminTab('approval');
    }
  };

  const handleSwitchToFrontend = () => {
    setPortal('frontend');
  };

  // Handlers for Bookings & Calendar
  const handleSelectDateForBooking = (dateStr: string) => {
    setPrefilledBookingDate(dateStr);
    setPortal('frontend');
    setActiveFrontendTab('booking');
  };

  const handleCreateBooking = (
    bookingData: Omit<WorkshopBooking, 'id' | 'bookingCode' | 'status' | 'submittedAt'>
  ) => {
    const newBooking: WorkshopBooking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      bookingCode: `WS-2569-${String(bookings.length + 1).padStart(3, '0')}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    showToast(`ส่งคำขอจอง "${newBooking.title}" เรียบร้อยแล้ว (รหัส: ${newBooking.bookingCode})`);
    setPrefilledBookingDate(null);
    setActiveFrontendTab('my-bookings');
  };

  const handleApproveBooking = (bookingId: string, comment?: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: 'approved',
            reviewedAt: new Date().toISOString(),
            reviewedBy: adminUser?.name || 'เจ้าหน้าที่ฝ่ายอาคารสถานที่และวิชาการ',
            reviewComment: comment || 'อนุมัติเรียบร้อย',
          };
        }
        return b;
      })
    );
    showToast('อนุมัติการจอง Workshop เรียบร้อยแล้ว');
  };

  const handleRejectBooking = (bookingId: string, comment?: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: 'rejected',
            reviewedAt: new Date().toISOString(),
            reviewedBy: adminUser?.name || 'เจ้าหน้าที่ฝ่ายอาคารสถานที่และวิชาการ',
            reviewComment: comment || 'ไม่อนุมัติ',
          };
        }
        return b;
      })
    );
    showToast('บันทึกการปฏิเสธคำขอจองเรียบร้อยแล้ว');
  };

  const handleUpdateBooking = (updatedBooking: WorkshopBooking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
    if (detailBooking && detailBooking.id === updatedBooking.id) {
      setDetailBooking(updatedBooking);
    }
    showToast(`อัปเดตข้อมูลการจอง "${updatedBooking.title}" (${updatedBooking.bookingCode}) เรียบร้อยแล้ว`);
  };

  const handleUpdateSchoolEvents = (newEvents: SchoolEvent[]) => {
    setSchoolEvents(newEvents);
    showToast(`อัปเดตปฏิทินกิจกรรมโรงเรียนเรียบร้อย (${newEvents.length} รายการ)`);
  };

  const handleAddSchoolEvent = (event: SchoolEvent) => {
    setSchoolEvents((prev) => [event, ...prev]);
    showToast(`เพิ่มกิจกรรม "${event.title}" เข้าสู่ปฏิทินโรงเรียนแล้ว`);
  };

  const handleDeleteSchoolEvent = (eventId: string) => {
    setSchoolEvents((prev) => prev.filter((e) => e.id !== eventId));
    showToast('ลบกิจกรรมออกจากปฏิทินโรงเรียนแล้ว');
  };

  const handleResetToDefault = () => {
    setSchoolEvents(INITIAL_SCHOOL_EVENTS);
    setBookings(INITIAL_BOOKINGS);
    showToast('คืนค่าข้อมูลปฏิทินโรงเรียนและคำขอจองเริ่มต้นเรียบร้อยแล้ว');
  };

  const handleNavigateToCalendar = (date?: string) => {
    if (date) {
      setCalendarFocusDate(date);
    }
    if (portal === 'backend') {
      setActiveAdminTab('calendar');
    } else {
      setActiveFrontendTab('calendar');
    }
  };

  // Room Management Handlers
  const handleAddRoom = (newRoomData: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      ...newRoomData,
      id: `room-${Date.now()}`,
    };
    setRooms((prev) => [...prev, newRoom]);
    showToast(`เพิ่มห้อง "${newRoom.name}" สำเร็จเรียบร้อยแล้ว`);
  };

  const handleUpdateRoom = (updatedRoom: Room) => {
    setRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
    showToast(`อัปเดตข้อมูลห้อง "${updatedRoom.name}" เรียบร้อยแล้ว`);
  };

  const handleDeleteRoom = (roomId: string, deleteRelatedBookings: boolean = false) => {
    const target = rooms.find((r) => r.id === roomId);
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    if (prefilledRoomId === roomId) {
      setPrefilledRoomId(null);
    }
    if (deleteRelatedBookings) {
      setBookings((prev) => prev.filter((b) => b.roomId !== roomId));
      showToast(`ลบห้อง "${target?.name || ''}" และคำขอจองที่เกี่ยวข้องเรียบร้อยแล้ว`);
    } else {
      showToast(`ลบห้อง "${target?.name || ''}" เรียบร้อยแล้ว`);
    }
  };

  const handleResetRooms = () => {
    setRooms(INITIAL_ROOMS);
    showToast('คืนค่ารายชื่อห้องประชุมเริ่มต้น (5 ห้อง) เรียบร้อยแล้ว');
  };

  const handleNavigateToBookingFromRoom = (roomId?: string) => {
    if (roomId) setPrefilledRoomId(roomId);
    setPortal('frontend');
    setActiveFrontendTab('booking');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-['Prompt',sans-serif]">
      {/* Top Navigation based on active Portal */}
      {portal === 'backend' && adminUser ? (
        <AdminNavbar
          activeAdminTab={activeAdminTab}
          setActiveAdminTab={setActiveAdminTab}
          pendingCount={pendingCount}
          roomsCount={rooms.length}
          adminUser={adminUser}
          onLogout={handleLogout}
          onSwitchToFrontend={handleSwitchToFrontend}
        />
      ) : (
        <Navbar
          activeTab={activeFrontendTab}
          setActiveTab={setActiveFrontendTab}
          roomsCount={rooms.length}
          adminUser={adminUser}
          onOpenBackend={handleOpenBackend}
          myBookingsCount={bookings.length}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 md:pb-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-16 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="bg-slate-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="ml-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ----------------- BACKEND PORTAL ----------------- */}
        {portal === 'backend' && (
          <>
            {/* If not logged in, enforce authentication gate */}
            {!adminUser ? (
              <AdminLoginView
                onLoginSuccess={handleLoginSuccess}
                onBackToFrontend={handleSwitchToFrontend}
              />
            ) : (
              <>
                {/* Admin Tab 1: Approval View */}
                {activeAdminTab === 'approval' && (
                  <ApprovalView
                    bookings={bookings}
                    rooms={rooms}
                    schoolEvents={schoolEvents}
                    onApproveBooking={handleApproveBooking}
                    onRejectBooking={handleRejectBooking}
                    onOpenBookingDetails={(b) => setDetailBooking(b)}
                    onUpdateBooking={handleUpdateBooking}
                  />
                )}

                {/* Admin Tab 2: Room Management View (Full Edit / Delete / Add Rights) */}
                {activeAdminTab === 'rooms' && (
                  <RoomManagementView
                    rooms={rooms}
                    bookings={bookings}
                    onAddRoom={handleAddRoom}
                    onUpdateRoom={handleUpdateRoom}
                    onDeleteRoom={handleDeleteRoom}
                    onResetRooms={handleResetRooms}
                    onNavigateToBooking={handleNavigateToBookingFromRoom}
                    isReadOnly={false}
                  />
                )}

                {/* Admin Tab 3: School Data & Excel Import View */}
                {activeAdminTab === 'school-data' && (
                  <SchoolDataView
                    schoolEvents={schoolEvents}
                    rooms={rooms}
                    onUpdateSchoolEvents={handleUpdateSchoolEvents}
                    onAddSchoolEvent={handleAddSchoolEvent}
                    onDeleteSchoolEvent={handleDeleteSchoolEvent}
                    onResetToDefault={handleResetToDefault}
                    onNavigateToCalendar={handleNavigateToCalendar}
                  />
                )}

                {/* Admin Tab 4: Calendar Overview for Admin */}
                {activeAdminTab === 'calendar' && (
                  <CalendarView
                    schoolEvents={schoolEvents}
                    bookings={bookings}
                    rooms={rooms}
                    focusDate={calendarFocusDate}
                    onSelectDateForBooking={handleSelectDateForBooking}
                    onOpenBookingDetails={(b) => setDetailBooking(b)}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* ----------------- FRONTEND PORTAL (Public / Teachers) ----------------- */}
        {portal === 'frontend' && (
          <>
            {/* Frontend Tab 1: Calendar View */}
            {activeFrontendTab === 'calendar' && (
              <CalendarView
                schoolEvents={schoolEvents}
                bookings={bookings}
                rooms={rooms}
                focusDate={calendarFocusDate}
                onSelectDateForBooking={handleSelectDateForBooking}
                onOpenBookingDetails={(b) => setDetailBooking(b)}
              />
            )}

            {/* Frontend Tab 2: Booking Form View */}
            {activeFrontendTab === 'booking' && (
              <BookingForm
                rooms={rooms}
                schoolEvents={schoolEvents}
                existingBookings={bookings}
                initialSelectedDate={prefilledBookingDate}
                initialSelectedRoomId={prefilledRoomId || undefined}
                onSubmitBooking={handleCreateBooking}
                onCancel={() => {
                  setPrefilledBookingDate(null);
                  setPrefilledRoomId(null);
                  setActiveFrontendTab('calendar');
                }}
                onNavigateToRooms={() => setActiveFrontendTab('rooms')}
              />
            )}

            {/* Frontend Tab 3: Rooms Directory (Read-only for public/teachers) */}
            {activeFrontendTab === 'rooms' && (
              <RoomManagementView
                rooms={rooms}
                bookings={bookings}
                onAddRoom={handleAddRoom}
                onUpdateRoom={handleUpdateRoom}
                onDeleteRoom={handleDeleteRoom}
                onResetRooms={handleResetRooms}
                onNavigateToBooking={handleNavigateToBookingFromRoom}
                isReadOnly={true}
              />
            )}

            {/* Frontend Tab 4: My Bookings & Application Status Tracking */}
            {activeFrontendTab === 'my-bookings' && (
              <MyBookingsView
                bookings={bookings}
                rooms={rooms}
                onOpenBookingDetails={(b) => setDetailBooking(b)}
                onNavigateToBooking={() => setActiveFrontendTab('booking')}
              />
            )}
          </>
        )}
      </main>

      {/* Booking Detail Modal */}
      {detailBooking && (
        <BookingDetailModal
          booking={detailBooking}
          rooms={rooms}
          schoolEvents={schoolEvents}
          existingBookings={bookings}
          userRole={portal === 'backend' && adminUser ? 'officer' : 'teacher'}
          onClose={() => setDetailBooking(null)}
          onApprove={(id) => {
            handleApproveBooking(id);
            setDetailBooking(null);
          }}
          onReject={(id) => {
            handleRejectBooking(id);
            setDetailBooking(null);
          }}
          onEditBooking={(bookingToEdit) => {
            setEditingBookingFromDetail(bookingToEdit);
          }}
        />
      )}

      {/* Global Edit Booking Modal (when triggered from detail view) */}
      {editingBookingFromDetail && (
        <EditBookingModal
          booking={editingBookingFromDetail}
          rooms={rooms}
          schoolEvents={schoolEvents}
          existingBookings={bookings}
          onClose={() => setEditingBookingFromDetail(null)}
          onSave={(updated) => {
            handleUpdateBooking(updated);
            setEditingBookingFromDetail(null);
          }}
        />
      )}

      {/* Mobile Bottom Tab Navigation */}
      <BottomTabBar
        portal={portal}
        activeFrontendTab={activeFrontendTab}
        setActiveFrontendTab={setActiveFrontendTab}
        activeAdminTab={activeAdminTab}
        setActiveAdminTab={setActiveAdminTab}
        pendingCount={pendingCount}
        myBookingsCount={bookings.length}
        onOpenBackend={handleOpenBackend}
        onSwitchToFrontend={handleSwitchToFrontend}
        isAdminLoggedIn={!!adminUser}
      />
    </div>
  );
}
