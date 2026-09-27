export type EventCategory = 'academic' | 'ceremony' | 'exam' | 'sports' | 'holiday' | 'meeting' | 'training';

export interface SchoolEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isAllDay: boolean;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  locationType: 'all_campus' | 'specific_rooms';
  affectedRooms?: string[]; // room IDs or names if specific
  category: EventCategory;
  academicYear: string;
  description?: string;
  rawSource?: string;
  activityType?: string;
  isMandatoryBlock: boolean; // cannot book workshops during this
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  facilities: string[];
  color: string;
  imageUrl?: string;
}

export type TimeSlotType = 'full_day' | 'morning' | 'afternoon' | 'custom';
export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface WorkshopBooking {
  id: string;
  bookingCode: string;
  title: string;
  organizerName: string;
  department: string;
  contactPhone: string;
  email: string;
  roomId: string;
  dates: string[]; // YYYY-MM-DD array (multi-day support)
  timeSlotType: TimeSlotType;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  expectedAttendees: number;
  targetAudience: string;
  objective: string;
  requestedEquipment: string[];
  additionalNotes?: string;
  status: BookingStatus;
  submittedAt: string; // ISO string
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
}

export interface ConflictItem {
  type: 'school_event' | 'existing_booking';
  date: string;
  title: string;
  timeRange: string;
  roomName: string;
  reason: string;
  severity: 'blocking' | 'warning';
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  hasBlockingConflict: boolean;
  conflicts: ConflictItem[];
}
