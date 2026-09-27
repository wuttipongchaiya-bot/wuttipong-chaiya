import * as XLSX from 'xlsx';
import { EventCategory, Room, SchoolEvent, WorkshopBooking } from '../types';
import { isSemesterPeriodMarker } from './semesterConfig';

export interface ParseResult {
  events: SchoolEvent[];
  error?: string;
  count: number;
}

// Thai months mapping
const THAI_MONTH_MAP: Record<string, number> = {
  'ม.ค.': 1, 'มกราคม': 1, 'มกรา': 1, 'jan': 1, 'january': 1,
  'ก.พ.': 2, 'กุมภาพันธ์': 2, 'กุมภา': 2, 'feb': 2, 'february': 2,
  'มี.ค.': 3, 'มีนาคม': 3, 'มีนา': 3, 'mar': 3, 'march': 3,
  'เม.ย.': 4, 'เมษายน': 4, 'เมษา': 4, 'apr': 4, 'april': 4,
  'พ.ค.': 5, 'พฤษภาคม': 5, 'พฤษภา': 5, 'may': 5,
  'มิ.ย.': 6, 'มิถุนายน': 6, 'มิถุนา': 6, 'jun': 6, 'june': 6,
  'ก.ค.': 7, 'กรกฎาคม': 7, 'กรกฎา': 7, 'jul': 7, 'july': 7,
  'ส.ค.': 8, 'สิงหาคม': 8, 'สิงหา': 8, 'aug': 8, 'august': 8,
  'ก.ย.': 9, 'กันยายน': 9, 'กันยา': 9, 'sep': 9, 'september': 9,
  'ต.ค.': 10, 'ตุลาคม': 10, 'ตุลา': 10, 'oct': 10, 'october': 10,
  'พ.ย.': 11, 'พฤศจิกายน': 11, 'พฤศจิกา': 11, 'nov': 11, 'november': 11,
  'ธ.ค.': 12, 'ธันวาคม': 12, 'ธันวา': 12, 'dec': 12, 'december': 12,
};

// Normalize Thai or English column names
export const normalizeKey = (key: string): string => {
  return key.trim().toLowerCase().replace(/[\s_.-]+/g, '');
};

export interface RawSheetData {
  sheetName: string;
  rows: any[][];
}

export interface ExcelInspectResult {
  sheetNames: string[];
  activeSheetName: string;
  sheetsData: Record<string, any[][]>;
  rawRows: any[][];
  suggestedHeaderRowIndex: number;
  detectedTitleColIndex: number;
  detectedDateColIndex: number;
  detectedLocationColIndex: number;
  detectedCategoryColIndex: number;
  detectedNoteColIndex: number;
  events: SchoolEvent[];
  error?: string;
}

// Convert Excel serial number to ISO date
const excelSerialToIso = (serial: number): string | null => {
  if (typeof serial !== 'number' || serial < 1000 || serial > 70000) return null;
  try {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const y = date_info.getUTCFullYear();
    const m = String(date_info.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date_info.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return null;
  }
};

// Parse flexible Thai date strings into ISO YYYY-MM-DD
// Supports:
// "2026-10-05"
// Excel numeric serial dates (e.g. 45500)
// "05/10/2569" or "5/10/69"
// "05/10/2569 - 07/10/2569"
// "5-7 ต.ค. 2569" or "5-7 ต.ค. 69" -> returns { start, end }
// "วันที่ 15 สิงหาคม 2569"
// "29 ต.ค. - 2 พ.ย. 2569"
export const parseThaiDateString = (
  rawVal: any,
  defaultYear: number = new Date().getFullYear()
): { startDate: string; endDate: string } => {
  if (rawVal === undefined || rawVal === null || rawVal === '') {
    return { startDate: '', endDate: '' };
  }

  // Check Excel serial number
  if (typeof rawVal === 'number') {
    const iso = excelSerialToIso(rawVal);
    if (iso) return { startDate: iso, endDate: iso };
  }

  if (rawVal instanceof Date) {
    const y = rawVal.getFullYear();
    const m = String(rawVal.getMonth() + 1).padStart(2, '0');
    const d = String(rawVal.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    return { startDate: iso, endDate: iso };
  }

  let text = String(rawVal).trim();
  if (!text) return { startDate: '', endDate: '' };

  // Strip prefixes like "วันที่", "วันจันทร์ที่", "ช่วงเวลา", "ระหว่างวันที่"
  text = text
    .replace(/^(ระหว่างวันที่|ช่วงวันที่|วันที่|วัน(?:จันทร์|อังคาร|พุธ|พฤหัสบดี|พฤหัส|ศุกร์|เสาร์|อาทิตย์)?ที่?)\s*/i, '')
    .trim();

  // Check numeric string that might be serial number
  if (/^\d{5}$/.test(text)) {
    const num = parseInt(text, 10);
    const iso = excelSerialToIso(num);
    if (iso) return { startDate: iso, endDate: iso };
  }

  // 1. Direct ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return { startDate: text, endDate: text };
  }

  // 2. Format Range with slashes: DD/MM/YYYY - DD/MM/YYYY
  const slashRange = text.match(
    /^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\s*[-–ถึง]\s*(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/
  );
  if (slashRange) {
    const d1 = String(slashRange[1]).padStart(2, '0');
    const m1 = String(slashRange[2]).padStart(2, '0');
    let y1 = parseInt(slashRange[3], 10);
    if (y1 < 100) y1 += 2500;
    if (y1 > 2400) y1 -= 543;

    const d2 = String(slashRange[4]).padStart(2, '0');
    const m2 = String(slashRange[5]).padStart(2, '0');
    let y2 = parseInt(slashRange[6], 10);
    if (y2 < 100) y2 += 2500;
    if (y2 > 2400) y2 -= 543;

    return {
      startDate: `${y1}-${m1}-${d1}`,
      endDate: `${y2}-${m2}-${d2}`,
    };
  }

  // 3. Format Single DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = text.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (slashMatch) {
    const d = String(slashMatch[1]).padStart(2, '0');
    const m = String(slashMatch[2]).padStart(2, '0');
    let y = parseInt(slashMatch[3], 10);
    if (y < 100) y += 2500;
    if (y > 2400) y -= 543;
    const iso = `${y}-${m}-${d}`;
    return { startDate: iso, endDate: iso };
  }

  // 4. Match Thai natural text pattern like "5-7 ต.ค. 2569" or "5 - 7 ตุลาคม 2569" or "5 ต.ค. 69"
  const rangeSameMonth = text.match(
    /(\d{1,2})\s*[-–ถึง]\s*(\d{1,2})\s+([ก-๙a-zA-Z.]+)\s*(\d{2,4})?/
  );
  if (rangeSameMonth) {
    const d1 = String(rangeSameMonth[1]).padStart(2, '0');
    const d2 = String(rangeSameMonth[2]).padStart(2, '0');
    const mStr = rangeSameMonth[3].trim().toLowerCase();
    const monthNum = THAI_MONTH_MAP[mStr] || 1;
    let y = rangeSameMonth[4] ? parseInt(rangeSameMonth[4], 10) : defaultYear;
    if (y < 100) y += 2500;
    if (y > 2400) y -= 543;
    const mPadded = String(monthNum).padStart(2, '0');
    return {
      startDate: `${y}-${mPadded}-${d1}`,
      endDate: `${y}-${mPadded}-${d2}`,
    };
  }

  // 5. Range across months: "29 ต.ค. - 2 พ.ย. 2569"
  const rangeCrossMonth = text.match(
    /(\d{1,2})\s+([ก-๙a-zA-Z.]+)\s*[-–ถึง]\s*(\d{1,2})\s+([ก-๙a-zA-Z.]+)\s*(\d{2,4})?/
  );
  if (rangeCrossMonth) {
    const d1 = String(rangeCrossMonth[1]).padStart(2, '0');
    const mStr1 = rangeCrossMonth[2].trim().toLowerCase();
    const d2 = String(rangeCrossMonth[3]).padStart(2, '0');
    const mStr2 = rangeCrossMonth[4].trim().toLowerCase();
    let y = rangeCrossMonth[5] ? parseInt(rangeCrossMonth[5], 10) : defaultYear;
    if (y < 100) y += 2500;
    if (y > 2400) y -= 543;

    const m1 = String(THAI_MONTH_MAP[mStr1] || 1).padStart(2, '0');
    const m2 = String(THAI_MONTH_MAP[mStr2] || 1).padStart(2, '0');
    return {
      startDate: `${y}-${m1}-${d1}`,
      endDate: `${y}-${m2}-${d2}`,
    };
  }

  // 6. Single date with Thai month: "15 ต.ค. 2569" or "15 ตุลาคม 69" or "15 ต.ค."
  const singleThaiDate = text.match(/(\d{1,2})\s+([ก-๙a-zA-Z.]+)(?:\s+(\d{2,4}))?/);
  if (singleThaiDate) {
    const d = String(singleThaiDate[1]).padStart(2, '0');
    const mStr = singleThaiDate[2].trim().toLowerCase();
    const monthNum = THAI_MONTH_MAP[mStr] || 1;
    let y = singleThaiDate[3] ? parseInt(singleThaiDate[3], 10) : defaultYear;
    if (y < 100) y += 2500;
    if (y > 2400) y -= 543;
    const mPadded = String(monthNum).padStart(2, '0');
    const iso = `${y}-${mPadded}-${d}`;
    return { startDate: iso, endDate: iso };
  }

  return { startDate: '', endDate: '' };
};


// Transform raw text (e.g. pasted directly from Excel, CSV, or Tab-separated text)
export const parseRawTextToEvents = (
  rawText: string,
  rooms: Room[],
  defaultAcademicYear: string = '2569'
): ParseResult => {
  if (!rawText || !rawText.trim()) {
    return { events: [], error: 'ไม่มีข้อมูลข้อความ', count: 0 };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { events: [], error: 'ข้อความว่างเปล่า', count: 0 };
  }

  // Detect delimiter: tab (\t), comma (,), semicolon (;), pipe (|)
  const firstLine = lines[0];
  let delimiter = '\t';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(',')) delimiter = ',';
  else if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.includes('|')) delimiter = '|';

  // Check if first line is a header
  const headers = firstLine.split(delimiter).map((h) => normalizeKey(h));
  const hasHeader =
    headers.some((h) =>
      ['กิจกรรม', 'ชื่อกิจกรรม', 'ชื่อ', 'event', 'title', 'ว/ด/ป', 'วันที่', 'date'].includes(h)
    );

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const events: SchoolEvent[] = [];
  let index = 1;

  for (const line of dataLines) {
    const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
    if (cols.length === 0 || !cols.some((c) => c.length > 0)) continue;

    let title = '';
    let dateStr = '';
    let roomStr = '';
    let categoryStr = '';
    let desc = '';

    if (hasHeader) {
      // Map according to header indices
      headers.forEach((h, i) => {
        const val = cols[i] || '';
        if (['กิจกรรม', 'ชื่อกิจกรรม', 'ชื่อ', 'รายการ', 'event', 'title'].includes(h)) {
          title = val;
        } else if (['วันที่', 'ว/ด/ป', 'วันเดือนปี', 'ช่วงเวลา', 'วันจัดกิจกรรม', 'date', 'startdate'].includes(h)) {
          dateStr = val;
        } else if (['สถานที่', 'ห้อง', 'ห้องที่ใช้', 'location', 'room'].includes(h)) {
          roomStr = val;
        } else if (['หมวดหมู่', 'ประเภท', 'category', 'type'].includes(h)) {
          categoryStr = val;
        } else if (['หมายเหตุ', 'รายละเอียด', 'description', 'notes'].includes(h)) {
          desc = val;
        }
      });
    } else {
      // Fallback heuristics based on column count and contents
      if (cols.length >= 2) {
        // Find which column has digits/dates
        const dateColIdx = cols.findIndex((c) => /\d/.test(c) && (c.includes('/') || c.includes('-') || Object.keys(THAI_MONTH_MAP).some(m => c.includes(m))));
        if (dateColIdx !== -1) {
          dateStr = cols[dateColIdx];
          title = cols.filter((_, idx) => idx !== dateColIdx).join(' ');
        } else {
          dateStr = cols[0];
          title = cols[1];
        }
        if (cols[2]) roomStr = cols[2];
        if (cols[3]) desc = cols[3];
      } else {
        // Only 1 column: try splitting by space
        title = cols[0];
      }
    }

    if (!title && !dateStr) continue;
    if (!title) title = `กิจกรรมโรงเรียน ${index}`;

    // Parse dates
    const { startDate, endDate } = parseThaiDateString(dateStr);
    const finalStartDate = startDate || new Date().toISOString().split('T')[0];
    const finalEndDate = endDate || finalStartDate;

    // Detect category
    let category: EventCategory = 'academic';
    const textToScan = `${title} ${categoryStr}`.toLowerCase();
    if (textToScan.includes('สอบ') || textToScan.includes('exam')) category = 'exam';
    else if (textToScan.includes('พิธี') || textToScan.includes('ceremony') || textToScan.includes('ไหว้ครู')) category = 'ceremony';
    else if (textToScan.includes('กีฬา') || textToScan.includes('sport')) category = 'sports';
    else if (textToScan.includes('หยุด') || textToScan.includes('holiday')) category = 'holiday';
    else if (textToScan.includes('ประชุม') || textToScan.includes('meeting')) category = 'meeting';

    // Check room
    const isAllCampus = !roomStr || roomStr.includes('ทั้งโรงเรียน') || roomStr.includes('ทุกห้อง') || roomStr.includes('all');
    let affectedRooms: string[] = [];
    if (!isAllCampus && roomStr) {
      for (const r of rooms) {
        if (roomStr.toLowerCase().includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(roomStr.toLowerCase())) {
          affectedRooms.push(r.id);
        }
      }
    }

    events.push({
      id: `sch-raw-${Date.now()}-${index++}`,
      title: title.trim(),
      startDate: finalStartDate,
      endDate: finalEndDate,
      isAllDay: true,
      locationType: isAllCampus ? 'all_campus' : 'specific_rooms',
      affectedRooms: isAllCampus ? undefined : affectedRooms,
      category,
      academicYear: defaultAcademicYear,
      description: desc || (roomStr ? `สถานที่: ${roomStr}` : ''),
      isMandatoryBlock: !isSemesterPeriodMarker(title),
    });
  }

  return { events, count: events.length };
};

// Intelligent event extraction from raw 2D array of rows
export const extractEventsFrom2DArray = (
  rawRows: any[][],
  headerRowIndex: number,
  titleColIndex: number,
  dateColIndex: number,
  locationColIndex: number = -1,
  categoryColIndex: number = -1,
  noteColIndex: number = -1,
  rooms: Room[] = [],
  defaultAcademicYear: string = '2569'
): SchoolEvent[] => {
  const events: SchoolEvent[] = [];
  if (!rawRows || rawRows.length <= headerRowIndex + 1) return events;

  let index = 1;
  const dataRows = rawRows.slice(headerRowIndex + 1);

  for (const row of dataRows) {
    if (!row || row.length === 0) continue;

    const rawTitle = titleColIndex >= 0 && row[titleColIndex] !== undefined ? String(row[titleColIndex]).trim() : '';
    const rawDate = dateColIndex >= 0 && row[dateColIndex] !== undefined ? row[dateColIndex] : '';

    // If both title and date are empty, skip row
    if (!rawTitle && !rawDate) continue;
    // Skip if title looks like a repeated sub-header or page number
    if (rawTitle.length < 2 || rawTitle === 'กิจกรรม' || rawTitle === 'ชื่อกิจกรรม' || rawTitle === 'รายการ') continue;

    const { startDate, endDate } = parseThaiDateString(rawDate);
    const finalStartDate = startDate || new Date().toISOString().split('T')[0];
    const finalEndDate = endDate || finalStartDate;

    const rawLocation = locationColIndex >= 0 && row[locationColIndex] !== undefined ? String(row[locationColIndex]).trim() : '';
    const rawCategory = categoryColIndex >= 0 && row[categoryColIndex] !== undefined ? String(row[categoryColIndex]).trim() : '';
    const rawNote = noteColIndex >= 0 && row[noteColIndex] !== undefined ? String(row[noteColIndex]).trim() : '';

    // Determine location and affected rooms
    const isAllCampus = !rawLocation || rawLocation.includes('ทั้งโรงเรียน') || rawLocation.includes('ทุกห้อง') || rawLocation.includes('all');
    const affectedRooms: string[] = [];
    if (!isAllCampus && rawLocation) {
      for (const rm of rooms) {
        if (
          rawLocation.toLowerCase().includes(rm.name.toLowerCase()) ||
          rm.name.toLowerCase().includes(rawLocation.toLowerCase())
        ) {
          affectedRooms.push(rm.id);
        }
      }
    }

    // Determine category
    let category: EventCategory = 'academic';
    const textCat = `${rawTitle} ${rawCategory}`.toLowerCase();
    if (textCat.includes('สอบ') || textCat.includes('exam')) category = 'exam';
    else if (textCat.includes('พิธี') || textCat.includes('ceremony') || textCat.includes('ไหว้ครู')) category = 'ceremony';
    else if (textCat.includes('กีฬา') || textCat.includes('sport')) category = 'sports';
    else if (textCat.includes('หยุด') || textCat.includes('holiday')) category = 'holiday';
    else if (textCat.includes('ประชุม') || textCat.includes('meeting')) category = 'meeting';

    events.push({
      id: `sch-imp-${Date.now()}-${index++}`,
      title: rawTitle,
      startDate: finalStartDate,
      endDate: finalEndDate,
      isAllDay: true,
      locationType: isAllCampus ? 'all_campus' : 'specific_rooms',
      affectedRooms: isAllCampus ? undefined : affectedRooms,
      category,
      academicYear: defaultAcademicYear,
      description: rawNote || (rawLocation ? `สถานที่: ${rawLocation}` : ''),
      isMandatoryBlock: !isSemesterPeriodMarker(rawTitle),
    });
  }

  return events;
};

// Auto-detect header and column indices from raw 2D rows
export const detectColumnsInRows = (
  rows: any[][],
  rooms: Room[] = []
): {
  headerRowIndex: number;
  titleColIndex: number;
  dateColIndex: number;
  locationColIndex: number;
  categoryColIndex: number;
  noteColIndex: number;
  events: SchoolEvent[];
} => {
  let headerRowIndex = 0;
  let titleColIndex = -1;
  let dateColIndex = -1;
  let locationColIndex = -1;
  let categoryColIndex = -1;
  let noteColIndex = -1;
  let maxKeywordsFound = 0;

  for (let r = 0; r < Math.min(15, rows.length); r++) {
    const row = rows[r];
    if (!row || !Array.isArray(row)) continue;

    let keywordsInThisRow = 0;
    let tempTitle = -1;
    let tempDate = -1;
    let tempLoc = -1;
    let tempCat = -1;
    let tempNote = -1;

    row.forEach((cell, colIdx) => {
      const str = String(cell || '').trim().toLowerCase();
      if (!str) return;

      // Date keywords
      if (
        ['ว/ด/ป', 'วัน', 'วันที่', 'วันเดือนปี', 'ช่วงเวลา', 'ระยะเวลา', 'date', 'dates', 'time'].some((k) =>
          str.includes(k)
        )
      ) {
        tempDate = colIdx;
        keywordsInThisRow++;
      }
      // Title keywords
      else if (
        ['กิจกรรม', 'ชื่อกิจกรรม', 'รายการ', 'โครงการ', 'งาน', 'หัวข้อ', 'title', 'event', 'name', 'activity'].some(
          (k) => str.includes(k)
        )
      ) {
        tempTitle = colIdx;
        keywordsInThisRow++;
      }
      // Location keywords
      else if (
        ['สถานที่', 'ห้อง', 'บริเวณ', 'location', 'room', 'venue', 'place'].some((k) => str.includes(k))
      ) {
        tempLoc = colIdx;
        keywordsInThisRow++;
      }
      // Category keywords
      else if (['ประเภท', 'หมวดหมู่', 'category', 'type'].some((k) => str.includes(k))) {
        tempCat = colIdx;
        keywordsInThisRow++;
      }
      // Note / Dept keywords
      else if (
        ['หมายเหตุ', 'รายละเอียด', 'ผู้รับผิดชอบ', 'กลุ่มสาระ', 'หน่วยงาน', 'note', 'remark', 'owner'].some((k) =>
          str.includes(k)
        )
      ) {
        tempNote = colIdx;
        keywordsInThisRow++;
      }
    });

    if (keywordsInThisRow > maxKeywordsFound) {
      maxKeywordsFound = keywordsInThisRow;
      headerRowIndex = r;
      titleColIndex = tempTitle;
      dateColIndex = tempDate;
      locationColIndex = tempLoc;
      categoryColIndex = tempCat;
      noteColIndex = tempNote;
    }
  }

  // If title or date column still wasn't found by keyword, scan columns by data content heuristics!
  const sampleDataRows = rows.slice(headerRowIndex + 1, headerRowIndex + 25);
  if (dateColIndex === -1 && sampleDataRows.length > 0) {
    const colDateScores: Record<number, number> = {};
    sampleDataRows.forEach((row) => {
      row.forEach((cell, colIdx) => {
        const str = String(cell || '');
        if (
          typeof cell === 'number' &&
          cell > 20000 &&
          cell < 60000 // Excel date serial
        ) {
          colDateScores[colIdx] = (colDateScores[colIdx] || 0) + 2;
        } else if (
          /\d{1,2}[\/\.-]\d{1,2}/.test(str) ||
          Object.keys(THAI_MONTH_MAP).some((m) => str.toLowerCase().includes(m))
        ) {
          colDateScores[colIdx] = (colDateScores[colIdx] || 0) + 1;
        }
      });
    });

    let bestDateCol = -1;
    let bestDateScore = 0;
    for (const [col, score] of Object.entries(colDateScores)) {
      if (score > bestDateScore) {
        bestDateScore = score;
        bestDateCol = Number(col);
      }
    }
    if (bestDateCol !== -1) dateColIndex = bestDateCol;
  }

  if (titleColIndex === -1 && sampleDataRows.length > 0) {
    const colTitleScores: Record<number, number> = {};
    sampleDataRows.forEach((row) => {
      row.forEach((cell, colIdx) => {
        if (colIdx === dateColIndex) return;
        const str = String(cell || '').trim();
        if (str.length > 3 && /[ก-๙]/.test(str)) {
          colTitleScores[colIdx] = (colTitleScores[colIdx] || 0) + 1;
        }
      });
    });

    let bestTitleCol = -1;
    let bestTitleScore = 0;
    for (const [col, score] of Object.entries(colTitleScores)) {
      if (score > bestTitleScore) {
        bestTitleScore = score;
        bestTitleCol = Number(col);
      }
    }
    if (bestTitleCol !== -1) titleColIndex = bestTitleCol;
  }

  const events =
    titleColIndex !== -1 && dateColIndex !== -1
      ? extractEventsFrom2DArray(
          rows,
          headerRowIndex,
          titleColIndex,
          dateColIndex,
          locationColIndex,
          categoryColIndex,
          noteColIndex,
          rooms
        )
      : [];

  return {
    headerRowIndex,
    titleColIndex,
    dateColIndex,
    locationColIndex,
    categoryColIndex,
    noteColIndex,
    events,
  };
};

// Inspect an Excel file and auto-detect header and columns
export const inspectExcelFile = async (
  file: File,
  rooms: Room[]
): Promise<ExcelInspectResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheetNames = workbook.SheetNames || [];
        if (sheetNames.length === 0) {
          return resolve({
            sheetNames: [],
            activeSheetName: '',
            sheetsData: {},
            rawRows: [],
            suggestedHeaderRowIndex: 0,
            detectedTitleColIndex: -1,
            detectedDateColIndex: -1,
            detectedLocationColIndex: -1,
            detectedCategoryColIndex: -1,
            detectedNoteColIndex: -1,
            events: [],
            error: 'ไม่พบแผ่นงาน (Sheet) ในไฟล์ Excel',
          });
        }

        // Search for best sheet (one with the most rows)
        let bestSheetName = sheetNames[0];
        let bestRows: any[][] = [];
        const sheetsData: Record<string, any[][]> = {};

        for (const sName of sheetNames) {
          const ws = workbook.Sheets[sName];
          const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          sheetsData[sName] = rows;
          if (rows.length > bestRows.length) {
            bestRows = rows;
            bestSheetName = sName;
          }
        }

        if (bestRows.length === 0) {
          return resolve({
            sheetNames,
            activeSheetName: bestSheetName,
            sheetsData,
            rawRows: [],
            suggestedHeaderRowIndex: 0,
            detectedTitleColIndex: -1,
            detectedDateColIndex: -1,
            detectedLocationColIndex: -1,
            detectedCategoryColIndex: -1,
            detectedNoteColIndex: -1,
            events: [],
            error: 'ไฟล์ Excel ไม่มีข้อมูลแถว',
          });
        }

        const detected = detectColumnsInRows(bestRows, rooms);

        resolve({
          sheetNames,
          activeSheetName: bestSheetName,
          sheetsData,
          rawRows: bestRows,
          suggestedHeaderRowIndex: detected.headerRowIndex,
          detectedTitleColIndex: detected.titleColIndex,
          detectedDateColIndex: detected.dateColIndex,
          detectedLocationColIndex: detected.locationColIndex,
          detectedCategoryColIndex: detected.categoryColIndex,
          detectedNoteColIndex: detected.noteColIndex,
          events: detected.events,
        });
      } catch (err: any) {
        resolve({
          sheetNames: [],
          activeSheetName: '',
          sheetsData: {},
          rawRows: [],
          suggestedHeaderRowIndex: 0,
          detectedTitleColIndex: -1,
          detectedDateColIndex: -1,
          detectedLocationColIndex: -1,
          detectedCategoryColIndex: -1,
          detectedNoteColIndex: -1,
          events: [],
          error: `เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        sheetNames: [],
        activeSheetName: '',
        sheetsData: {},
        rawRows: [],
        suggestedHeaderRowIndex: 0,
        detectedTitleColIndex: -1,
        detectedDateColIndex: -1,
        detectedLocationColIndex: -1,
        detectedCategoryColIndex: -1,
        detectedNoteColIndex: -1,
        events: [],
        error: 'ไม่สามารถเปิดไฟล์ Excel ได้',
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

export const parseSchoolEventsFromExcel = async (
  file: File,
  rooms: Room[]
): Promise<ParseResult> => {
  const inspect = await inspectExcelFile(file, rooms);
  if (inspect.error) {
    return { events: [], error: inspect.error, count: 0 };
  }
  return {
    events: inspect.events,
    count: inspect.events.length,
  };
};


// Generate and trigger download for School Academic Calendar Template (.xlsx)
export const downloadSchoolEventsTemplate = () => {
  const sampleData = [
    {
      'ชื่อกิจกรรม': 'สอบกลางภาคเรียนที่ 1/2569',
      'วันที่เริ่มต้น (YYYY-MM-DD)': '2026-10-05',
      'วันที่สิ้นสุด (YYYY-MM-DD)': '2026-10-07',
      'ทั้งวัน (ใช่/ไม่ใช่)': 'ใช่',
      'เวลาเริ่มต้น': '08:30',
      'เวลาสิ้นสุด': '16:00',
      'ประเภทสถานที่ (ทั้งโรงเรียน/ระบุห้อง)': 'ทั้งโรงเรียน',
      'ห้องที่เกี่ยวข้อง': '',
      'หมวดหมู่ (exam/academic/ceremony/sports/holiday)': 'exam',
      'ปีการศึกษา': '2569',
      'หมายเหตุ': 'ห้ามจัดกิจกรรมหรือใช้เสียงดังทุกอาคาร',
    },
    {
      'ชื่อกิจกรรม': 'สัปดาห์วิทยาศาสตร์และนวัตกรรม',
      'วันที่เริ่มต้น (YYYY-MM-DD)': '2026-10-14',
      'วันที่สิ้นสุด (YYYY-MM-DD)': '2026-10-15',
      'ทั้งวัน (ใช่/ไม่ใช่)': 'ไม่ใช่',
      'เวลาเริ่มต้น': '08:30',
      'เวลาสิ้นสุด': '15:30',
      'ประเภทสถานที่ (ทั้งโรงเรียน/ระบุห้อง)': 'ระบุห้อง',
      'ห้องที่เกี่ยวข้อง': 'ห้องปฏิบัติการคอมพิวเตอร์ 101, ห้อง STEM & Robotics Innovation Lab',
      'หมวดหมู่ (exam/academic/ceremony/sports/holiday)': 'academic',
      'ปีการศึกษา': '2569',
      'หมายเหตุ': 'จัดแสดงโครงงานและแข่งขันหุ่นยนต์',
    },
    {
      'ชื่อกิจกรรม': 'วันประชุมผู้ปกครองภาคเรียนที่ 1',
      'วันที่เริ่มต้น (YYYY-MM-DD)': '2026-10-20',
      'วันที่สิ้นสุด (YYYY-MM-DD)': '2026-10-20',
      'ทั้งวัน (ใช่/ไม่ใช่)': 'ใช่',
      'เวลาเริ่มต้น': '08:30',
      'เวลาสิ้นสุด': '16:30',
      'ประเภทสถานที่ (ทั้งโรงเรียน/ระบุห้อง)': 'ทั้งโรงเรียน',
      'ห้องที่เกี่ยวข้อง': '',
      'หมวดหมู่ (exam/academic/ceremony/sports/holiday)': 'meeting',
      'ปีการศึกษา': '2569',
      'หมายเหตุ': 'ประชุมผู้ปกครองทุกระดับชั้น',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 32 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
    { wch: 45 },
    { wch: 24 },
    { wch: 12 },
    { wch: 40 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ปฏิทินโรงเรียน');
  XLSX.writeFile(workbook, 'แม่แบบปฏิทินกิจกรรมโรงเรียน.xlsx');
};

// Export Bookings Report to Excel (.xlsx)
export const exportBookingsToExcel = (bookings: WorkshopBooking[], rooms: Room[]) => {
  const data = bookings.map((b) => {
    const room = rooms.find((r) => r.id === b.roomId);
    const statusThai =
      b.status === 'approved' ? 'อนุมัติแล้ว' : b.status === 'rejected' ? 'ไม่อนุมัติ/ปฏิเสธ' : 'รอการอนุมัติ';
    return {
      'รหัสการจอง': b.bookingCode,
      'ชื่อโครงการ / Workshop': b.title,
      'ผู้ขอจอง': b.organizerName,
      'กลุ่มสาระ / หน่วยงาน': b.department,
      'เบอร์โทรศัพท์': b.contactPhone,
      'อีเมล': b.email,
      'ห้องที่ขอใช้': room?.name || b.roomId,
      'อาคาร/ชั้น': `${room?.building || ''} ${room?.floor || ''}`,
      'วันที่จัด (ทุกวัน)': b.dates.join(', '),
      'จำนวนวัน': b.dates.length,
      'ช่วงเวลา': `${b.startTime} - ${b.endTime} น.`,
      'จำนวนผู้เข้าร่วม (คน)': b.expectedAttendees,
      'กลุ่มเป้าหมาย': b.targetAudience,
      'วัตถุประสงค์': b.objective,
      'อุปกรณ์ที่ขอใช้': b.requestedEquipment.join(', '),
      'สถานะการอนุมัติ': statusThai,
      'วันที่ยื่นคำขอ': new Date(b.submittedAt).toLocaleDateString('th-TH'),
      'ผู้อนุมัติ': b.reviewedBy || '-',
      'วันที่พิจารณา': b.reviewedAt ? new Date(b.reviewedAt).toLocaleDateString('th-TH') : '-',
      'ความเห็นเจ้าหน้าที่': b.reviewComment || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานการจอง Workshop');
  XLSX.writeFile(workbook, `รายงานการจอง_Workshop_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

