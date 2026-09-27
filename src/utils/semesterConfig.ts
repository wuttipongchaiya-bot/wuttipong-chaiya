import { SchoolEvent } from '../types';

export interface SemesterPeriod {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: 'break' | 'term';
}

export const LOCAL_STORAGE_SEMESTER_BREAKS_KEY = 'school_workshop_semester_breaks';
export const LOCAL_STORAGE_SEMESTER_COLOR_KEY = 'school_workshop_semester_color_mode';

// Default standard Thai academic calendar breaks for 2568-2570 (2025-2027)
export const DEFAULT_SEMESTER_BREAKS: SemesterPeriod[] = [
  {
    id: 'sb-2026-summer',
    name: 'ปิดภาคเรียนฤดูร้อน (Summer Break)',
    startDate: '2026-03-11',
    endDate: '2026-05-15',
    type: 'break',
  },
  {
    id: 'sb-2026-oct',
    name: 'ปิดภาคเรียนที่ 1 (October Break)',
    startDate: '2026-10-11',
    endDate: '2026-10-31',
    type: 'break',
  },
  {
    id: 'sb-2027-summer',
    name: 'ปิดภาคเรียนฤดูร้อน (Summer Break)',
    startDate: '2027-03-11',
    endDate: '2027-05-15',
    type: 'break',
  },
  {
    id: 'sb-2027-oct',
    name: 'ปิดภาคเรียนที่ 1 (October Break)',
    startDate: '2027-10-11',
    endDate: '2027-10-31',
    type: 'break',
  },
];

/**
 * Detect if an event title is an academic semester/term period marker rather than a discrete single/multi-day school activity.
 * Examples: "เปิดกลางภาคเรียนที่ 1/2569", "เปิดภาคเรียนที่ 1", "ปิดภาคเรียนที่ 1", "เปิดเทอม", "ปิดเทอม", "ภาคเรียนที่ 1"
 * These represent the overall semester period (which is already displayed using the day cell's background color)
 * and should NOT be rendered as a daily repetitive event pill or blocking badge across every day.
 */
export const isSemesterPeriodMarker = (title?: string): boolean => {
  if (!title) return false;
  const t = title.trim();
  const lower = t.toLowerCase();

  return (
    lower.includes('เปิดกลางภาคเรียน') ||
    lower.includes('เปิดกลางภาค') ||
    lower.includes('ปิดกลางภาค') ||
    lower.includes('เปิดภาคเรียน') ||
    lower.includes('ปิดภาคเรียน') ||
    lower.includes('เปิดเทอม') ||
    lower.includes('ปิดเทอม') ||
    lower.includes('เปิดเรียน') ||
    lower.includes('ปิดเรียน') ||
    lower.includes('ภาคเรียนที่') ||
    lower.includes('semester break') ||
    lower.includes('academic term') ||
    /^ภาคเรียนที่\s*\d+/i.test(t)
  );
};

/**
 * Check if a given date string (YYYY-MM-DD) falls within a semester break period (ช่วงปิดเทอม)
 */
export const checkIsSemesterBreak = (
  dateStr: string,
  breaks: SemesterPeriod[] = DEFAULT_SEMESTER_BREAKS,
  schoolEvents: SchoolEvent[] = []
): boolean => {
  if (!dateStr) return false;

  // 1. Check explicitly configured breaks
  for (const b of breaks) {
    if (b.type === 'break' && dateStr >= b.startDate && dateStr <= b.endDate) {
      return true;
    }
  }

  // 2. Check schoolEvents for titles explicitly marking "เปิดกลางภาคเรียน" / "เปิดภาคเรียน" (definitely NOT a break)
  for (const ev of schoolEvents) {
    if (dateStr >= ev.startDate && dateStr <= ev.endDate) {
      const lower = ev.title.toLowerCase();
      if (
        lower.includes('เปิดกลางภาคเรียน') ||
        lower.includes('เปิดภาคเรียน') ||
        lower.includes('เปิดเทอม') ||
        lower.includes('เปิดเรียน')
      ) {
        return false;
      }
    }
  }

  // 3. Check schoolEvents for titles mentioning "ปิดเทอม" / "ปิดภาคเรียน" / "break"
  for (const ev of schoolEvents) {
    if (dateStr >= ev.startDate && dateStr <= ev.endDate) {
      const lower = ev.title.toLowerCase();
      if (
        lower.includes('ปิดเทอม') ||
        lower.includes('ปิดภาคเรียน') ||
        lower.includes('ปิดเรียน') ||
        lower.includes('semester break') ||
        lower.includes('vacation')
      ) {
        return true;
      }
    }
  }

  // 4. Heuristic fallback for standard Thai school calendar across any year:
  // - October 11 to October 31 (ปิดเทอม 1)
  // - March 11 to May 15 (ปิดเทอมใหญ่)
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);

    // October break: Oct 11 - Oct 31
    if (m === 10 && d >= 11 && d <= 31) return true;
    // Summer break: Mar 11 - May 15
    if (m === 3 && d >= 11) return true;
    if (m === 4) return true;
    if (m === 5 && d <= 15) return true;
  }

  return false;
};
