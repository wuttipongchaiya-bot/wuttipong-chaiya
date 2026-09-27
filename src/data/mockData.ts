import { Room, SchoolEvent, WorkshopBooking } from '../types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1',
    name: 'ห้องประชุมกานดา',
    building: 'อาคารเฉลิมพระเกียรติ 80 พรรษา',
    floor: 'ชั้น 3',
    capacity: 80,
    facilities: ['Projector ความสว่างสูง 4K', 'ไมโครโฟนไร้สาย 4 ตัว', 'เครื่องปรับอากาศ 4 ทิศทาง', 'ระบบบันทึกเสียงและวิดีโอ', 'Wi-Fi โรงเรียน'],
    color: '#3B82F6', // Blue
  },
  {
    id: 'room-2',
    name: 'หอประชุมใหญ่สุพรรณิการ์',
    building: 'อาคารอเนกประสงค์',
    floor: 'ชั้น 1',
    capacity: 350,
    facilities: ['เวทีขนาดใหญ่พร้อมระบบไฟเวที', 'ระบบเสียงห้องประชุมขนาดใหญ่', 'จอ LED ขนาดใหญ่ 6x3.5m', 'ไมโครโฟนตั้งโต๊ะและไร้สาย', 'ห้องรับรองวิทยากร'],
    color: '#8B5CF6', // Purple
  },
  {
    id: 'room-3',
    name: 'ห้องปฏิบัติการคอมพิวเตอร์ 101',
    building: 'อาคารวิทยาศาสตร์และเทคโนโลยี',
    floor: 'ชั้น 1',
    capacity: 45,
    facilities: ['คอมพิวเตอร์ Core i7 จำนวน 45 เครื่อง', 'จอ Smart TV 85 นิ้ว', 'ระบบ LAN ความเร็ว 1Gbps', 'โปรแกรมเฉพาะทางด้าน AI และ Data', 'เครื่องปรับอากาศ'],
    color: '#10B981', // Emerald
  },
  {
    id: 'room-4',
    name: 'ห้อง STEM & Robotics Innovation Lab',
    building: 'อาคารวิทยาศาสตร์และเทคโนโลยี',
    floor: 'ชั้น 2',
    capacity: 40,
    facilities: ['โต๊ะปฏิบัติการกลุ่มปรับเปลี่ยนได้', 'ชุดอุปกรณ์ไมโครบิตและหุ่นยนต์', 'เครื่องพิมพ์ 3D Printer 4 เครื่อง', 'Interactive Touchscreen Display', 'จุดจ่ายไฟฟ้ารอบห้อง'],
    color: '#F59E0B', // Amber
  },
  {
    id: 'room-5',
    name: 'ห้องสัมมนาชวนชม',
    building: 'อาคาร 2 (อำนวยการ)',
    floor: 'ชั้น 2',
    capacity: 35,
    facilities: ['โต๊ะประชุมรูปตัว U', 'ระบบ Video Conference (Zoom/Teams)', 'Smart TV 75 นิ้ว', 'ไมค์ประชุมรอบทิศทาง', 'จุดชงกาแฟและของว่าง'],
    color: '#EC4899', // Pink
  },
];

// Helper to format date offset from a reference date
export const getDateOffset = (dayOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split('T')[0];
};

export const getTodayStr = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const INITIAL_SCHOOL_EVENTS: SchoolEvent[] = [
  {
    id: 'sch-1',
    title: 'สอบกลางภาคเรียนที่ 1/2569 (ม.1 - ม.6)',
    startDate: getDateOffset(4),
    endDate: getDateOffset(6),
    isAllDay: true,
    locationType: 'all_campus',
    category: 'exam',
    academicYear: '2569',
    description: 'โรงเรียนใช้ทุกอาคารเรียนและห้องประชุมเป็นสนามสอบกลางภาค ห้ามจัดกิจกรรมภายนอกหรืออบรมที่ใช้เสียง',
    isMandatoryBlock: true,
  },
  {
    id: 'sch-2',
    title: 'วันประชุมผู้ปกครองและมอบผลการเรียนสัญจร',
    startDate: getDateOffset(12),
    endDate: getDateOffset(12),
    isAllDay: true,
    locationType: 'all_campus',
    category: 'meeting',
    academicYear: '2569',
    description: 'ผู้ปกครองทุกระดับชั้นเข้าร่วมประชุม ณ หอประชุมใหญ่และห้องประจำชั้น',
    isMandatoryBlock: true,
  },
  {
    id: 'sch-3',
    title: 'กิจกรรมสัปดาห์วันวิทยาศาสตร์และเทคโนโลยี',
    startDate: getDateOffset(18),
    endDate: getDateOffset(19),
    isAllDay: false,
    startTime: '08:30',
    endTime: '15:30',
    locationType: 'specific_rooms',
    affectedRooms: ['room-3', 'room-4'], // Computer Lab & STEM Lab
    category: 'academic',
    academicYear: '2569',
    description: 'นิทรรศการโครงงานวิทย์และแข่งขันทักษะหุ่นยนต์ จัดที่แล็บคอมและแล็บ STEM',
    isMandatoryBlock: true,
  },
  {
    id: 'sch-4',
    title: 'พิธีมอบเกียรติบัตรและปัจฉิมนิเทศนักเรียน',
    startDate: getDateOffset(24),
    endDate: getDateOffset(24),
    isAllDay: false,
    startTime: '08:00',
    endTime: '13:00',
    locationType: 'specific_rooms',
    affectedRooms: ['room-2'], // หอประชุมใหญ่
    category: 'ceremony',
    academicYear: '2569',
    description: 'พิธีมอบเกียรติบัตรนักเรียนที่มีผลการเรียนยอดเยี่ยม ณ หอประชุมใหญ่สุพรรณิการ์',
    isMandatoryBlock: true,
  },
  {
    id: 'sch-5',
    title: 'การแข่งขันกีฬาภายในโรงเรียน (กีฬาสี)',
    startDate: getDateOffset(-5),
    endDate: getDateOffset(-3),
    isAllDay: true,
    locationType: 'all_campus',
    category: 'sports',
    academicYear: '2569',
    description: 'กิจกรรมกีฬาสีประจำปีการศึกษา',
    isMandatoryBlock: true,
  },
  {
    id: 'sch-6',
    title: 'วันหยุดราชการประจำปี / วันสำคัญแห่งชาติ',
    startDate: getDateOffset(15),
    endDate: getDateOffset(15),
    isAllDay: true,
    locationType: 'all_campus',
    category: 'holiday',
    academicYear: '2569',
    description: 'วันหยุดราชการ อาคารเรียนปิดทำการ',
    isMandatoryBlock: true,
  }
];

export const INITIAL_BOOKINGS: WorkshopBooking[] = [
  {
    id: 'bk-1',
    bookingCode: 'WS-2569-001',
    title: 'Workshop การประยุกต์ใช้ Generative AI สำหรับคุณครูยุคใหม่',
    organizerName: 'อาจารย์อรรถพล รัตนศิริ',
    department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    contactPhone: '081-456-7890',
    email: 'attapol.r@school.ac.th',
    roomId: 'room-1', // ห้องประชุมกานดา
    dates: [getDateOffset(1), getDateOffset(2)], // 2 days workshop
    timeSlotType: 'full_day',
    startTime: '09:00',
    endTime: '16:00',
    expectedAttendees: 45,
    targetAudience: 'ครูผู้สอนระดับมัธยมศึกษาตอนปลาย จำนวน 45 ท่าน',
    objective: 'พัฒนาทักษะการสร้างสื่อการสอนและใบงานอัจฉริยะด้วยเทคโนโลยีปัญญาประดิษฐ์',
    requestedEquipment: ['Projector ความสว่างสูง 4K', 'ไมโครโฟนไร้สาย 4 ตัว', 'Wi-Fi โรงเรียน', 'ปลั๊กพ่วง 10 จุด'],
    additionalNotes: 'ต้องการโต๊ะแบบจัดกลุ่มย่อย 8 กลุ่ม กลุ่มละ 5-6 คน',
    status: 'approved',
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    reviewedBy: 'อาจารย์สุวรรณา (ฝ่ายวิชาการและอาคารสถานที่)',
    reviewComment: 'อนุมัติเรียบร้อย ได้ประสานงานแม่บ้านและช่างโสตฯ จัดเตรียมสถานที่ล่วงหน้า 1 วัน',
  },
  {
    id: 'bk-2',
    bookingCode: 'WS-2569-002',
    title: 'ค่ายอบรมพัฒนาทักษะการเขียนโปรแกรม Python และ Data Analysis เบื้องต้น',
    organizerName: 'คุณครูณัฐชา วงศ์สว่าง',
    department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์และคอมพิวเตอร์',
    contactPhone: '089-234-5678',
    email: 'natcha.w@school.ac.th',
    roomId: 'room-3', // ห้องคอม 101
    dates: [getDateOffset(8), getDateOffset(9)],
    timeSlotType: 'morning',
    startTime: '08:30',
    endTime: '12:00',
    expectedAttendees: 38,
    targetAudience: 'นักเรียนชั้นมัธยมศึกษาปีที่ 4-5 แผนการเรียนวิทย์-คอม',
    objective: 'เตรียมความพร้อมนักเรียนสู่การแข่งขันโอลิมปิกวิชาการและโครงงานคอมพิวเตอร์',
    requestedEquipment: ['คอมพิวเตอร์ Core i7 จำนวน 45 เครื่อง', 'จอ Smart TV 85 นิ้ว', 'ระบบ LAN ความเร็ว 1Gbps'],
    additionalNotes: 'ต้องการให้ฝ่ายเทคนิคลงซอฟต์แวร์ VS Code และ Anaconda ล่วงหน้า',
    status: 'pending',
    submittedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'bk-3',
    bookingCode: 'WS-2569-003',
    title: 'อบรมเชิงปฏิบัติการ Active Learning & การวัดประเมินผลตามสมรรถนะ',
    organizerName: 'อาจารย์ชัชวาล เลิศปัญญา',
    department: 'กลุ่มงานบริหารวิชาการ',
    contactPhone: '086-789-0123',
    email: 'chatchawal.l@school.ac.th',
    roomId: 'room-5', // ห้องสัมมนาชวนชม
    dates: [getDateOffset(10)],
    timeSlotType: 'afternoon',
    startTime: '13:00',
    endTime: '16:30',
    expectedAttendees: 30,
    targetAudience: 'หัวหน้ากลุ่มสาระและครูแกนนำวิชาการ',
    objective: 'ออกแบบเกณฑ์รูบริกส์และการประเมินผลการเรียนรู้เชิงรุก',
    requestedEquipment: ['โต๊ะประชุมรูปตัว U', 'Smart TV 75 นิ้ว', 'ไมค์ประชุมรอบทิศทาง'],
    status: 'pending',
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'bk-4',
    bookingCode: 'WS-2569-004',
    title: 'การสร้างสรรค์หุ่นยนต์กู้ภัยขนาดเล็กด้วย Micro:bit',
    organizerName: 'ครูปิยะพงษ์ สว่างดี',
    department: 'ชมรมนักประดิษฐ์และหุ่นยนต์',
    contactPhone: '095-876-5432',
    email: 'piyapong.s@school.ac.th',
    roomId: 'room-4', // STEM Lab
    dates: [getDateOffset(18)], // THIS WILL CLASH with School Event sch-3!
    timeSlotType: 'morning',
    startTime: '09:00',
    endTime: '12:00',
    expectedAttendees: 30,
    targetAudience: 'นักเรียนสมาชิกชมรมหุ่นยนต์',
    objective: 'ประดิษฐ์หุ่นยนต์สำรวจ',
    requestedEquipment: ['เครื่องพิมพ์ 3D Printer 4 เครื่อง', 'ชุดอุปกรณ์ไมโครบิตและหุ่นยนต์'],
    status: 'rejected',
    submittedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewedBy: 'อาจารย์สุวรรณา (ฝ่ายวิชาการและอาคารสถานที่)',
    reviewComment: 'ปฏิเสธเนื่องจากชนกับกิจกรรมสัปดาห์วันวิทยาศาสตร์และเทคโนโลยีของโรงเรียนที่มีการใช้ห้อง STEM Lab ทั้งวัน แนะนำให้เปลี่ยนวันหรือสถานที่',
  }
];
