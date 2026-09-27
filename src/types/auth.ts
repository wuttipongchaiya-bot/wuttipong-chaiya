export interface AdminUser {
  username: string;
  name: string;
  roleTitle: string;
  department: string;
  avatarColor?: string;
  loginTime: string;
}

export const DEMO_ADMIN_ACCOUNTS: Array<{
  username: string;
  password: string;
  user: AdminUser;
}> = [
  {
    username: 'admin',
    password: 'password',
    user: {
      username: 'admin',
      name: 'อาจารย์สุวรรณา พงษ์ศิริ',
      roleTitle: 'หัวหน้าฝ่ายอาคารสถานที่และงานบริการ',
      department: 'กลุ่มงานบริหารทั่วไปและอาคารสถานที่',
      avatarColor: 'bg-indigo-600',
      loginTime: '',
    },
  },
  {
    username: 'officer',
    password: 'password',
    user: {
      username: 'officer',
      name: 'นายพิชัย สุขเกษม',
      roleTitle: 'เจ้าหน้าที่เทคโนโลยีและโสตทัศนูปกรณ์',
      department: 'ฝ่ายส่งเสริมวิชาการและเทคโนโลยี',
      avatarColor: 'bg-emerald-600',
      loginTime: '',
    },
  },
];
