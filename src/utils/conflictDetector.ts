import { ConflictCheckResult, ConflictItem, Room, SchoolEvent, WorkshopBooking } from '../types';
import { isSemesterPeriodMarker } from './semesterConfig';

// Convert HH:mm to minutes for comparison
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Check if two time ranges overlap
export const isTimeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
};

// Check if a date string falls between start and end date (inclusive)
export const isDateInRange = (date: string, startDate: string, endDate: string): boolean => {
  return date >= startDate && date <= endDate;
};

export const checkWorkshopConflict = (
  dates: string[],
  startTime: string,
  endTime: string,
  roomId: string,
  rooms: Room[],
  schoolEvents: SchoolEvent[],
  existingBookings: WorkshopBooking[],
  currentBookingId?: string
): ConflictCheckResult => {
  const conflicts: ConflictItem[] = [];
  const room = rooms.find((r) => r.id === roomId);
  const roomName = room ? room.name : 'ห้องที่เลือก';

  if (!dates || dates.length === 0 || !roomId || !startTime || !endTime) {
    return { hasConflict: false, hasBlockingConflict: false, conflicts: [] };
  }

  // 1. Check against School Events (from raw data / Excel)
  for (const date of dates) {
    for (const event of schoolEvents) {
      // Semester period markers (e.g. "เปิดกลางภาคเรียนที่ 1", "เปิดภาคเรียน", "เปิดเทอม") do not block room bookings
      if (isSemesterPeriodMarker(event.title)) {
        continue;
      }

      if (isDateInRange(date, event.startDate, event.endDate)) {
        let isRoomAffected = false;
        if (event.locationType === 'all_campus') {
          isRoomAffected = true;
        } else if (event.locationType === 'specific_rooms' && event.affectedRooms) {
          isRoomAffected = event.affectedRooms.includes(roomId);
        }

        if (isRoomAffected) {
          let timeClash = false;
          let timeDesc = 'ทั้งวัน';

          if (event.isAllDay) {
            timeClash = true;
          } else if (event.startTime && event.endTime) {
            timeDesc = `${event.startTime} - ${event.endTime} น.`;
            timeClash = isTimeOverlap(startTime, endTime, event.startTime, event.endTime);
          }

          if (timeClash) {
            conflicts.push({
              type: 'school_event',
              date,
              title: event.title,
              timeRange: timeDesc,
              roomName: event.locationType === 'all_campus' ? 'ทั้งโรงเรียน (ทุกอาคาร)' : roomName,
              reason: `ชนกับกิจกรรมโรงเรียน: "${event.title}" (${event.locationType === 'all_campus' ? 'ปิดการใช้งานทุกห้อง' : 'ใช้ห้องนี้'})`,
              severity: 'blocking',
            });
          }
        }
      }
    }
  }

  // 2. Check against Existing Workshop Bookings (Approved or Pending)
  for (const date of dates) {
    for (const booking of existingBookings) {
      if (currentBookingId && booking.id === currentBookingId) continue;
      // We only consider approved bookings as hard blocks, and pending as warning or blocking
      if (booking.status === 'rejected') continue;

      if (booking.roomId === roomId && booking.dates.includes(date)) {
        const timeClash = isTimeOverlap(startTime, endTime, booking.startTime, booking.endTime);
        if (timeClash) {
          const isApproved = booking.status === 'approved';
          conflicts.push({
            type: 'existing_booking',
            date,
            title: booking.title,
            timeRange: `${booking.startTime} - ${booking.endTime} น.`,
            roomName,
            reason: `ห้องนี้ถูก${isApproved ? 'จองและอนุมัติแล้ว' : 'ส่งคำขอจองแล้ว'} โดย "${booking.organizerName}" (${booking.department})`,
            severity: isApproved ? 'blocking' : 'warning',
          });
        }
      }
    }
  }

  const hasBlockingConflict = conflicts.some((c) => c.severity === 'blocking');

  return {
    hasConflict: conflicts.length > 0,
    hasBlockingConflict,
    conflicts,
  };
};

export const formatThaiDate = (dateStr: string, options: { shortYear?: boolean; withDay?: boolean } = {}): string => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const fullThaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

    const thaiYear = y + 543;
    const yearDisplay = options.shortYear ? thaiYear.toString().slice(-2) : thaiYear.toString();
    const dayName = options.withDay ? `วัน${thaiDays[date.getDay()]}ที่ ` : '';

    return `${dayName}${d} ${thaiMonths[m - 1]} ${yearDisplay}`;
  } catch {
    return dateStr;
  }
};
