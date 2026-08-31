// lib/mockDb.ts
// ─────────────────────────────────────────────────────────────────────
// ALL demo data lives here.  No network calls.  All passwords = "12345".
// ─────────────────────────────────────────────────────────────────────

export type Role = "student" | "teacher" | "admin";

export interface Student {
  id: string;          // PRN
  grNumber: string;
  name: string;
  password: string;
  role: Role;
  photo?: string;      // initials avatar used when absent
  dob: string;
  gender: string;
  bloodGroup: string;
  guardianName: string;
  guardianContact: string;
  address: string;
  department: string;
  year: number;
  semester: number;
  division: string;
  admissionDate: string;
  feesDue: number;
  feeDueDate?: string;
  documentsReady: number;
}

export interface Teacher {
  id: string;
  name: string;
  password: string;
  role: Role;
  department: string;
  subjects: string[];
}

export interface AdminUser {
  id: string;
  name: string;
  password: string;
  role: Role;
  department: string;
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  credits: number;
}

export interface TimetableSlot {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  period: number; // 1–8
  startTime: string;
  endTime: string;
  subjectId: string;
  room: string;
  teacherId: string;
  batch?: string;
}

export interface AttendanceRecord {
  studentId: string;
  subjectId: string;
  date: string; // ISO date
  status: "present" | "absent";
  method: "self-scan" | "manual" | "biometric";
  time?: string;
}

export interface MarkRecord {
  studentId: string;
  subjectId: string;
  cie1: number;
  cie2: number;
  cie3: number;
  ese: number | null; // null = not yet declared
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  category: "academic" | "events" | "fee" | "general";
  date: string;
  postedBy: string;
}

export interface Document {
  id: string;
  studentId: string;
  type: "bonafide" | "fee_receipt" | "migration" | "character";
  label: string;
  status: "ready" | "processing" | "pending";
  requestedDate: string;
  readyDate?: string;
}

export interface StudentBadge {
  label: string;
  icon: string;
  color: "gold" | "moss" | "ink" | "marigold";
}

export interface ActionPlanItem {
  title: string;
  pts: number;
  description: string;
  type: "academic" | "attendance" | "activity";
}

export interface StudentRanking {
  studentId: string;
  name: string;
  department: string;
  year: number;
  division: string;
  rankClass: number;
  rankDept: number;
  rankCollege: number;
  rankChange: number; // e.g. +2, 0, -1
  totalScore: number; // max 1000
  academicScore: number; // max 500
  attendanceScore: number; // max 300
  activityScore: number; // max 200
  spi: number;
  attendancePct: number;
  badges: StudentBadge[];
  actionPlan: ActionPlanItem[];
}

// ─────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────

export const students: Student[] = [
  // ── TY (Year 3) ──────────────────────────────────────────────────
  {
    id: "72201234M",
    grNumber: "GR2022001",
    name: "Aarav Sharma",
    password: "12345",
    role: "student",
    dob: "2004-03-15",
    gender: "Male",
    bloodGroup: "B+",
    guardianName: "Ramesh Sharma",
    guardianContact: "+91 98765 43210",
    address: "12, Narhe Gaon, Pune – 411041",
    department: "Computer Engineering",
    year: 3,
    semester: 5,
    division: "A",
    admissionDate: "2022-08-01",
    feesDue: 0,
    documentsReady: 2,
  },
  {
    id: "72201235M",
    grNumber: "GR2022002",
    name: "Priya Desai",
    password: "12345",
    role: "student",
    dob: "2004-07-22",
    gender: "Female",
    bloodGroup: "O+",
    guardianName: "Sunita Desai",
    guardianContact: "+91 91234 56789",
    address: "45, Dhayari, Pune – 411041",
    department: "Computer Engineering",
    year: 3,
    semester: 5,
    division: "A",
    admissionDate: "2022-08-01",
    feesDue: 28500,
    feeDueDate: "2026-09-30",
    documentsReady: 0,
  },
  {
    id: "72201236M",
    grNumber: "GR2022003",
    name: "Rohit Patil",
    password: "12345",
    role: "student",
    dob: "2003-11-08",
    gender: "Male",
    bloodGroup: "A+",
    guardianName: "Ganesh Patil",
    guardianContact: "+91 70123 45678",
    address: "78, Ambegaon Bk, Pune – 411046",
    department: "Information Technology",
    year: 3,
    semester: 5,
    division: "B",
    admissionDate: "2022-08-01",
    feesDue: 0,
    documentsReady: 1,
  },
  {
    id: "72201238M",
    grNumber: "GR2022005",
    name: "Arjun Nair",
    password: "12345",
    role: "student",
    dob: "2004-05-12",
    gender: "Male",
    bloodGroup: "O-",
    guardianName: "Suresh Nair",
    guardianContact: "+91 77890 12345",
    address: "56, Katraj, Pune – 411046",
    department: "Computer Engineering",
    year: 3,
    semester: 5,
    division: "A",
    admissionDate: "2022-08-01",
    feesDue: 0,
    documentsReady: 1,
  },

  // ── FY (First Year - Year 1) Divisions A, B, C, D, E, F ───────────
  {
    id: "72401001M",
    grNumber: "GR2024001",
    name: "Aditya Joshi",
    password: "12345",
    role: "student",
    dob: "2006-02-14",
    gender: "Male",
    bloodGroup: "B+",
    guardianName: "Sunil Joshi",
    guardianContact: "+91 98220 11223",
    address: "Narhe, Pune",
    department: "Computer Engineering",
    year: 1,
    semester: 1,
    division: "A",
    admissionDate: "2024-08-01",
    feesDue: 0,
    documentsReady: 1,
  },
  {
    id: "72401002M",
    grNumber: "GR2024002",
    name: "Bhavana More",
    password: "12345",
    role: "student",
    dob: "2006-05-20",
    gender: "Female",
    bloodGroup: "A+",
    guardianName: "Kishor More",
    guardianContact: "+91 98220 22334",
    address: "Dhayari, Pune",
    department: "Computer Engineering",
    year: 1,
    semester: 1,
    division: "B",
    admissionDate: "2024-08-01",
    feesDue: 0,
    documentsReady: 1,
  },
  {
    id: "72401003M",
    grNumber: "GR2024003",
    name: "Chetan Shinde",
    password: "12345",
    role: "student",
    dob: "2006-08-11",
    gender: "Male",
    bloodGroup: "O+",
    guardianName: "Prakash Shinde",
    guardianContact: "+91 98220 33445",
    address: "Katraj, Pune",
    department: "Information Technology",
    year: 1,
    semester: 1,
    division: "C",
    admissionDate: "2024-08-01",
    feesDue: 0,
    documentsReady: 1,
  },
  {
    id: "72401004M",
    grNumber: "GR2024004",
    name: "Divya Jagtap",
    password: "12345",
    role: "student",
    dob: "2006-11-04",
    gender: "Female",
    bloodGroup: "AB+",
    guardianName: "Santosh Jagtap",
    guardianContact: "+91 98220 44556",
    address: "Ambegaon, Pune",
    department: "Mechanical Engineering",
    year: 1,
    semester: 1,
    division: "D",
    admissionDate: "2024-08-01",
    feesDue: 15000,
    feeDueDate: "2026-10-15",
    documentsReady: 0,
  },
  {
    id: "72401005M",
    grNumber: "GR2024005",
    name: "Eklavya Thorat",
    password: "12345",
    role: "student",
    dob: "2006-03-09",
    gender: "Male",
    bloodGroup: "B-",
    guardianName: "Dnyaneshwar Thorat",
    guardianContact: "+91 98220 55667",
    address: "Warje, Pune",
    department: "Electronics & Telecommunication",
    year: 1,
    semester: 1,
    division: "E",
    admissionDate: "2024-08-01",
    feesDue: 0,
    documentsReady: 1,
  },
  {
    id: "72401006M",
    grNumber: "GR2024006",
    name: "Farhan Shaikh",
    password: "12345",
    role: "student",
    dob: "2006-09-18",
    gender: "Male",
    bloodGroup: "O-",
    guardianName: "Imran Shaikh",
    guardianContact: "+91 98220 66778",
    address: "Kothrud, Pune",
    department: "Artificial Intelligence & Data Science",
    year: 1,
    semester: 1,
    division: "F",
    admissionDate: "2024-08-01",
    feesDue: 0,
    documentsReady: 1,
  },

  // ── SY (Second Year - SYCO) Divisions A, B, C, D, E, F (Real ZPRN Data) ──
  // Division A
  { id: "225P10229R", grNumber: "GR2025001", name: "Aarav Patil", password: "12345", role: "student", dob: "2005-03-15", gender: "Male", bloodGroup: "B+", guardianName: "Suresh Patil", guardianContact: "+91 98220 10229", address: "Narhe, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "A", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10241R", grNumber: "GR2025002", name: "Aditya Shinde", password: "12345", role: "student", dob: "2005-07-22", gender: "Male", bloodGroup: "O+", guardianName: "Vikas Shinde", guardianContact: "+91 98220 10241", address: "Dhayari, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "A", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10256R", grNumber: "GR2025003", name: "Rohan Jadhav", password: "12345", role: "student", dob: "2005-11-08", gender: "Male", bloodGroup: "A+", guardianName: "Dattatray Jadhav", guardianContact: "+91 98220 10256", address: "Katraj, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "A", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10273R", grNumber: "GR2025004", name: "Omkar More", password: "12345", role: "student", dob: "2005-01-30", gender: "Male", bloodGroup: "AB+", guardianName: "Shivaji More", guardianContact: "+91 98220 10273", address: "Ambegaon, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "A", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10288R", grNumber: "GR2025005", name: "Vedant Kulkarni", password: "12345", role: "student", dob: "2005-05-12", gender: "Male", bloodGroup: "O-", guardianName: "Milind Kulkarni", guardianContact: "+91 98220 10288", address: "Warje, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "A", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },

  // Division B
  { id: "225P10304R", grNumber: "GR2025006", name: "Yash Deshmukh", password: "12345", role: "student", dob: "2005-02-14", gender: "Male", bloodGroup: "B+", guardianName: "Anand Deshmukh", guardianContact: "+91 98220 10304", address: "Narhe, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "B", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10319R", grNumber: "GR2025007", name: "Atharva Pawar", password: "12345", role: "student", dob: "2005-06-20", gender: "Male", bloodGroup: "A+", guardianName: "Rajendra Pawar", guardianContact: "+91 98220 10319", address: "Dhayari, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "B", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10337R", grNumber: "GR2025008", name: "Sarthak Joshi", password: "12345", role: "student", dob: "2005-09-11", gender: "Male", bloodGroup: "O+", guardianName: "Ganesh Joshi", guardianContact: "+91 98220 10337", address: "Katraj, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "B", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10352R", grNumber: "GR2025009", name: "Pranav Chavan", password: "12345", role: "student", dob: "2005-12-04", gender: "Male", bloodGroup: "AB+", guardianName: "Sanjay Chavan", guardianContact: "+91 98220 10352", address: "Ambegaon, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "B", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10368R", grNumber: "GR2025010", name: "Shubham Gaikwad", password: "12345", role: "student", dob: "2005-04-09", gender: "Male", bloodGroup: "B-", guardianName: "Ramesh Gaikwad", guardianContact: "+91 98220 10368", address: "Warje, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "B", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },

  // Division C
  { id: "225P10381R", grNumber: "GR2025011", name: "Kunal Bhosale", password: "12345", role: "student", dob: "2005-03-18", gender: "Male", bloodGroup: "O-", guardianName: "Vijay Bhosale", guardianContact: "+91 98220 10381", address: "Kothrud, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "C", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10396R", grNumber: "GR2025012", name: "Siddhant Kadam", password: "12345", role: "student", dob: "2005-07-30", gender: "Male", bloodGroup: "A+", guardianName: "Prakash Kadam", guardianContact: "+91 98220 10396", address: "Bavdhan, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "C", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10412R", grNumber: "GR2025013", name: "Harsh Vaidya", password: "12345", role: "student", dob: "2005-10-12", gender: "Male", bloodGroup: "B+", guardianName: "Nilesh Vaidya", guardianContact: "+91 98220 10412", address: "Sinhagad Road, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "C", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10427R", grNumber: "GR2025014", name: "Raj Malhotra", password: "12345", role: "student", dob: "2005-01-25", gender: "Male", bloodGroup: "O+", guardianName: "Rakesh Malhotra", guardianContact: "+91 98220 10427", address: "Narhe, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "C", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10443R", grNumber: "GR2025015", name: "Akshay Salunkhe", password: "12345", role: "student", dob: "2005-05-15", gender: "Male", bloodGroup: "AB-", guardianName: "Dilip Salunkhe", guardianContact: "+91 98220 10443", address: "Dhayari, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "C", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },

  // Division D
  { id: "225P10459R", grNumber: "GR2025016", name: "Manas Kulkarni", password: "12345", role: "student", dob: "2005-08-03", gender: "Male", bloodGroup: "A-", guardianName: "Shripad Kulkarni", guardianContact: "+91 98220 10459", address: "Katraj, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "D", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10474R", grNumber: "GR2025017", name: "Tanmay Wagh", password: "12345", role: "student", dob: "2005-11-29", gender: "Male", bloodGroup: "B+", guardianName: "Sudhir Wagh", guardianContact: "+91 98220 10474", address: "Ambegaon Bk, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "D", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10491R", grNumber: "GR2025018", name: "Aniket Pawar", password: "12345", role: "student", dob: "2005-02-17", gender: "Male", bloodGroup: "O+", guardianName: "Bhaskar Pawar", guardianContact: "+91 98220 10491", address: "Warje, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "D", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10506R", grNumber: "GR2025019", name: "Mihir Joshi", password: "12345", role: "student", dob: "2005-06-22", gender: "Male", bloodGroup: "AB+", guardianName: "Hemant Joshi", guardianContact: "+91 98220 10506", address: "Kothrud, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "D", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10522R", grNumber: "GR2025020", name: "Soham Patil", password: "12345", role: "student", dob: "2005-09-08", gender: "Male", bloodGroup: "A+", guardianName: "Tukaram Patil", guardianContact: "+91 98220 10522", address: "Bavdhan, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "D", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },

  // Division E
  { id: "225P10538R", grNumber: "GR2025021", name: "Ayush Shinde", password: "12345", role: "student", dob: "2005-12-14", gender: "Male", bloodGroup: "O-", guardianName: "Nitin Shinde", guardianContact: "+91 98220 10538", address: "Sinhagad Road, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "E", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10554R", grNumber: "GR2025022", name: "Neel Jadhav", password: "12345", role: "student", dob: "2005-03-20", gender: "Male", bloodGroup: "B+", guardianName: "Amol Jadhav", guardianContact: "+91 98220 10554", address: "Narhe, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "E", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10569R", grNumber: "GR2025023", name: "Rajveer More", password: "12345", role: "student", dob: "2005-07-11", gender: "Male", bloodGroup: "A+", guardianName: "Vishwas More", guardianContact: "+91 98220 10569", address: "Dhayari, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "E", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10583R", grNumber: "GR2025024", name: "Abhishek Chavan", password: "12345", role: "student", dob: "2005-10-04", gender: "Male", bloodGroup: "AB+", guardianName: "Tanaji Chavan", guardianContact: "+91 98220 10583", address: "Katraj, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "E", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10597R", grNumber: "GR2025025", name: "Aryan Deshmukh", password: "12345", role: "student", dob: "2005-01-09", gender: "Male", bloodGroup: "O+", guardianName: "Pandurang Deshmukh", guardianContact: "+91 98220 10597", address: "Ambegaon, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "E", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },

  // Division F
  { id: "225P10613R", grNumber: "GR2025026", name: "Parth Gaikwad", password: "12345", role: "student", dob: "2005-04-18", gender: "Male", bloodGroup: "B-", guardianName: "Subhash Gaikwad", guardianContact: "+91 98220 10613", address: "Warje, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "F", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10628R", grNumber: "GR2025027", name: "Ansh Bhosale", password: "12345", role: "student", dob: "2005-08-30", gender: "Male", bloodGroup: "A+", guardianName: "Hanumant Bhosale", guardianContact: "+91 98220 10628", address: "Kothrud, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "F", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10644R", grNumber: "GR2025028", name: "Hrishikesh Kadam", password: "12345", role: "student", dob: "2005-11-12", gender: "Male", bloodGroup: "O+", guardianName: "Laxman Kadam", guardianContact: "+91 98220 10644", address: "Bavdhan, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "F", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10659R", grNumber: "GR2025029", name: "Tejas Pawar", password: "12345", role: "student", dob: "2005-02-25", gender: "Male", bloodGroup: "AB+", guardianName: "Jagannath Pawar", guardianContact: "+91 98220 10659", address: "Sinhagad Road, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "F", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
  { id: "225P10675R", grNumber: "GR2025030", name: "Dev Kulkarni", password: "12345", role: "student", dob: "2005-06-15", gender: "Male", bloodGroup: "B+", guardianName: "Shrinivas Kulkarni", guardianContact: "+91 98220 10675", address: "Narhe, Pune", department: "Computer Engineering", year: 2, semester: 3, division: "F", admissionDate: "2025-08-01", feesDue: 0, documentsReady: 2 },
];

export const teachers: Teacher[] = [
  {
    id: "TCH001",
    name: "Dr. Meera Joshi",
    password: "12345",
    role: "teacher",
    department: "Computer Engineering",
    subjects: ["SUB001", "SUB002", "SUB003"],
  },
  {
    id: "TCH002",
    name: "Prof. Anand Kulkarni",
    password: "12345",
    role: "teacher",
    department: "Computer Engineering",
    subjects: ["SUB004", "SUB005"],
  },
];

export const admins: AdminUser[] = [
  {
    id: "EMP001",
    name: "Smt. Kavita Waghmare",
    password: "12345",
    role: "admin",
    department: "Office",
  },
];

// ─────────────────────────────────────────────────────────────────────
// SUBJECTS
// ─────────────────────────────────────────────────────────────────────

export const subjects: Subject[] = [
  { id: "SUB001", name: "Database Management Systems", shortName: "DBMS", credits: 4 },
  { id: "SUB002", name: "Computer Networks", shortName: "CN", credits: 4 },
  { id: "SUB003", name: "Software Engineering", shortName: "SE", credits: 3 },
  { id: "SUB004", name: "Operating Systems", shortName: "OS", credits: 4 },
  { id: "SUB005", name: "Theory of Computation", shortName: "TOC", credits: 3 },
  { id: "SUB006", name: "Engineering Mathematics-V", shortName: "M-V", credits: 3 },
];

// ─────────────────────────────────────────────────────────────────────
// TIMETABLE  (Sem 5, Div A, Week schedule)
// ─────────────────────────────────────────────────────────────────────

export const timetable: TimetableSlot[] = [
  // Monday
  { day: "Mon", period: 1, startTime: "08:00", endTime: "09:00", subjectId: "SUB001", room: "Room 304", teacherId: "TCH001" },
  { day: "Mon", period: 2, startTime: "09:00", endTime: "10:00", subjectId: "SUB002", room: "Room 304", teacherId: "TCH001" },
  { day: "Mon", period: 3, startTime: "10:00", endTime: "11:00", subjectId: "SUB004", room: "Room 305", teacherId: "TCH002" },
  { day: "Mon", period: 5, startTime: "12:00", endTime: "13:00", subjectId: "SUB006", room: "Room 301", teacherId: "TCH002" },
  { day: "Mon", period: 6, startTime: "13:00", endTime: "14:00", subjectId: "SUB003", room: "Room 304", teacherId: "TCH001" },
  // Tuesday
  { day: "Tue", period: 1, startTime: "08:00", endTime: "09:00", subjectId: "SUB005", room: "Room 302", teacherId: "TCH002" },
  { day: "Tue", period: 2, startTime: "09:00", endTime: "10:00", subjectId: "SUB001", room: "Room 304", teacherId: "TCH001" },
  { day: "Tue", period: 3, startTime: "10:00", endTime: "11:00", subjectId: "SUB006", room: "Room 301", teacherId: "TCH002" },
  { day: "Tue", period: 5, startTime: "12:00", endTime: "13:00", subjectId: "SUB002", room: "Room 304", teacherId: "TCH001" },
  { day: "Tue", period: 6, startTime: "13:00", endTime: "14:00", subjectId: "SUB004", room: "Room 305", teacherId: "TCH002" },
  // Wednesday
  { day: "Wed", period: 1, startTime: "08:00", endTime: "09:00", subjectId: "SUB003", room: "Lab 201", teacherId: "TCH001", batch: "A1" },
  { day: "Wed", period: 2, startTime: "09:00", endTime: "10:00", subjectId: "SUB003", room: "Lab 201", teacherId: "TCH001", batch: "A1" },
  { day: "Wed", period: 3, startTime: "10:00", endTime: "11:00", subjectId: "SUB001", room: "Room 304", teacherId: "TCH001" },
  { day: "Wed", period: 5, startTime: "12:00", endTime: "13:00", subjectId: "SUB005", room: "Room 302", teacherId: "TCH002" },
  // Thursday
  { day: "Thu", period: 1, startTime: "08:00", endTime: "09:00", subjectId: "SUB004", room: "Room 305", teacherId: "TCH002" },
  { day: "Thu", period: 2, startTime: "09:00", endTime: "10:00", subjectId: "SUB002", room: "Room 304", teacherId: "TCH001" },
  { day: "Thu", period: 3, startTime: "10:00", endTime: "11:00", subjectId: "SUB006", room: "Room 301", teacherId: "TCH002" },
  { day: "Thu", period: 5, startTime: "12:00", endTime: "13:00", subjectId: "SUB001", room: "Lab 203", teacherId: "TCH001", batch: "A2" },
  { day: "Thu", period: 6, startTime: "13:00", endTime: "14:00", subjectId: "SUB001", room: "Lab 203", teacherId: "TCH001", batch: "A2" },
  // Friday
  { day: "Fri", period: 1, startTime: "08:00", endTime: "09:00", subjectId: "SUB005", room: "Room 302", teacherId: "TCH002" },
  { day: "Fri", period: 2, startTime: "09:00", endTime: "10:00", subjectId: "SUB003", room: "Room 304", teacherId: "TCH001" },
  { day: "Fri", period: 3, startTime: "10:00", endTime: "11:00", subjectId: "SUB004", room: "Room 305", teacherId: "TCH002" },
  { day: "Fri", period: 5, startTime: "12:00", endTime: "13:00", subjectId: "SUB002", room: "Room 304", teacherId: "TCH001" },
];

// ─────────────────────────────────────────────────────────────────────
// ATTENDANCE  (student 72201234M — Aarav)
// SUB004 is deliberately below 75% to demo the brick badge
// ─────────────────────────────────────────────────────────────────────

function makeAttendance(
  studentId: string,
  subjectId: string,
  total: number,
  presentCount: number,
  method: AttendanceRecord["method"] = "self-scan"
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const baseDate = new Date("2026-07-01");
  for (let i = 0; i < total; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i * 2);
    records.push({
      studentId,
      subjectId,
      date: d.toISOString().split("T")[0],
      status: i < presentCount ? "present" : "absent",
      method: i < presentCount ? method : "manual",
      time: i < presentCount ? "10:02 AM" : undefined,
    });
  }
  return records;
}

export const attendance: AttendanceRecord[] = [
  ...makeAttendance("72201234M", "SUB001", 56, 42),            // 75.0%
  ...makeAttendance("72201234M", "SUB002", 52, 48),            // 92.3%
  ...makeAttendance("72201234M", "SUB003", 44, 38),            // 86.4%
  ...makeAttendance("72201234M", "SUB004", 56, 38),            // 67.9% ← below 75
  ...makeAttendance("72201234M", "SUB005", 40, 35),            // 87.5%
  ...makeAttendance("72201234M", "SUB006", 48, 40),            // 83.3%
];

// Attendance summary helper (with localStorage QR integration)
export function getAttendanceSummary(studentId: string) {
  const summary: Record<string, { total: number; present: number; records: AttendanceRecord[] }> = {};
  const studentRecords = attendance.filter((r) => r.studentId === studentId);
  for (const r of studentRecords) {
    if (!summary[r.subjectId]) summary[r.subjectId] = { total: 0, present: 0, records: [] };
    summary[r.subjectId].total++;
    if (r.status === "present") summary[r.subjectId].present++;
    summary[r.subjectId].records.push(r);
  }

  // Merge localStorage real QR attendance if in browser
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("zcoer_attendance");
      if (raw) {
        const storedList = JSON.parse(raw);
        for (const item of storedList) {
          if (item.studentId === studentId && item.subjectId) {
            if (!summary[item.subjectId]) {
              summary[item.subjectId] = { total: 0, present: 0, records: [] };
            }
            const d = new Date(item.markedAt * 1000);
            const dateStr = d.toISOString().split("T")[0];
            const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

            // Avoid double counting same date/session
            const alreadyExists = summary[item.subjectId].records.some((r) => r.date === dateStr && r.time === timeStr);
            if (!alreadyExists) {
              summary[item.subjectId].total++;
              if (item.status === "present") summary[item.subjectId].present++;
              summary[item.subjectId].records.push({
                studentId,
                subjectId: item.subjectId,
                date: dateStr,
                status: item.status,
                method: "self-scan",
                time: timeStr,
              });
            }
          }
        }
      }
    } catch (e) {
      // Storage parse fallback
    }
  }

  return summary;
}

// ─────────────────────────────────────────────────────────────────────
// MARKS
// ─────────────────────────────────────────────────────────────────────

export const marks: MarkRecord[] = [
  { studentId: "72201234M", subjectId: "SUB001", cie1: 22, cie2: 24, cie3: 21, ese: 58 },
  { studentId: "72201234M", subjectId: "SUB002", cie1: 25, cie2: 23, cie3: 24, ese: 62 },
  { studentId: "72201234M", subjectId: "SUB003", cie1: 20, cie2: 22, cie3: 19, ese: 54 },
  { studentId: "72201234M", subjectId: "SUB004", cie1: 18, cie2: 20, cie3: 17, ese: 48 },
  { studentId: "72201234M", subjectId: "SUB005", cie1: 24, cie2: 25, cie3: 23, ese: 65 },
  { studentId: "72201234M", subjectId: "SUB006", cie1: 21, cie2: 19, cie3: 22, ese: null },
];

export function getGrade(total: number): string {
  if (total >= 75) return "O";
  if (total >= 65) return "A+";
  if (total >= 55) return "A";
  if (total >= 50) return "B+";
  if (total >= 45) return "B";
  if (total >= 40) return "C";
  return "F";
}

// ─────────────────────────────────────────────────────────────────────
// NOTICES
// ─────────────────────────────────────────────────────────────────────

export const notices: Notice[] = [
  {
    id: "N001",
    title: "End Semester Examination Schedule — November 2026",
    body: "The End Semester Examinations for Semester V will commence from 15th November 2026. Detailed date-sheet and seating plan will be displayed on the notice board by 1st November. Students are advised to submit their examination forms by 10th October 2026. No late submissions will be entertained.",
    category: "academic",
    date: "2026-08-28",
    postedBy: "Examination Cell",
  },
  {
    id: "N002",
    title: "Fee Payment Deadline — Last Date 30 September 2026",
    body: "All students who have pending fees for the academic year 2026–27 are requested to clear their dues before 30th September 2026. Students with outstanding fees will not be permitted to appear in the End Semester Examinations. Online payment portal is available at the college website. For any discrepancies, contact the accounts office.",
    category: "fee",
    date: "2026-08-25",
    postedBy: "Accounts Section",
  },
  {
    id: "N003",
    title: "Annual Technical Fest — ZENITH 2026 (15–17 September)",
    body: "The annual technical festival ZENITH 2026 is scheduled from 15th to 17th September 2026. Registration for events is now open on the ZENITH portal. Events include Hackathon, Paper Presentation, Coding Contest, Robo-Race, and cultural events. First prize winners will receive certificates and cash awards. All students are encouraged to participate.",
    category: "events",
    date: "2026-08-20",
    postedBy: "Student Council",
  },
  {
    id: "N004",
    title: "Library — Updated Timings from 1st September",
    body: "The central library will now be open from 7:30 AM to 9:00 PM on weekdays and 9:00 AM to 5:00 PM on Saturdays starting 1st September 2026. Students can borrow up to 3 books for 14 days. Renewal is available online through the library portal. Any overdue books must be returned before the new academic borrowing cycle begins.",
    category: "general",
    date: "2026-08-18",
    postedBy: "Library",
  },
];

// ─────────────────────────────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────────────────────────────

export const documents: Document[] = [
  {
    id: "DOC001",
    studentId: "72201234M",
    type: "bonafide",
    label: "Bonafide Certificate",
    status: "ready",
    requestedDate: "2026-08-10",
    readyDate: "2026-08-14",
  },
  {
    id: "DOC002",
    studentId: "72201234M",
    type: "fee_receipt",
    label: "Fee Payment Receipt 2026–27",
    status: "ready",
    requestedDate: "2026-08-01",
    readyDate: "2026-08-02",
  },
];

// ─────────────────────────────────────────────────────────────────────
// TEACHER SESSION DATA (roster for demo)
// ─────────────────────────────────────────────────────────────────────

export interface SessionRosterEntry {
  studentId: string;
  name: string;
  status: "present" | "absent" | "unset";
  flagged?: boolean; // multiple-device flag
}

export function getSessionRoster(subjectId: string): SessionRosterEntry[] {
  // For demo, return 5 students from Div A with mock status
  return [
    { studentId: "72201234M", name: "Aarav Sharma",   status: "present" },
    { studentId: "72201235M", name: "Priya Desai",    status: "present" },
    { studentId: "72201236M", name: "Rohit Patil",    status: "absent" },
    { studentId: "72201238M", name: "Arjun Nair",     status: "present", flagged: true },
    { studentId: "72201237M", name: "Sneha Kulkarni", status: "unset" },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// LOOKUP HELPERS
// ─────────────────────────────────────────────────────────────────────

export function findUser(id: string, password: string): { role: Role; id: string; name: string } | null {
  const student = students.find((s) => s.id === id && s.password === password);
  if (student) return { role: "student", id: student.id, name: student.name };

  const teacher = teachers.find((t) => t.id === id && t.password === password);
  if (teacher) return { role: "teacher", id: teacher.id, name: teacher.name };

  const admin = admins.find((a) => a.id === id && a.password === password);
  if (admin) return { role: "admin", id: admin.id, name: admin.name };

  return null;
}

export function getStudent(id: string): Student | undefined {
  return students.find((s) => s.id === id);
}

export function getSubject(id: string): Subject | undefined {
  return subjects.find((s) => s.id === id);
}

export function getTeacher(id: string): Teacher | undefined {
  return teachers.find((t) => t.id === id);
}

export function getTodaySlots(day: TimetableSlot["day"]): TimetableSlot[] {
  return timetable.filter((s) => s.day === day).sort((a, b) => a.period - b.period);
}

export function getDayOfWeek(): TimetableSlot["day"] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  const day = days[new Date().getDay()];
  // Fallback to Mon if weekend (demo purposes)
  if (day === "Sun" || day === "Sat") return "Mon";
  return day;
}

// ─────────────────────────────────────────────────────────────────────
// MOCK ADD STUDENT (persisted in localStorage for demo)
// ─────────────────────────────────────────────────────────────────────

export const ADDED_STUDENTS_KEY = "zcoer_added_students";

export function getAddedStudents(): Student[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ADDED_STUDENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addStudentToMock(student: Omit<Student, "password" | "role">): Student {
  const newStudent: Student = { ...student, password: "12345", role: "student" };
  if (typeof window !== "undefined") {
    const existing = getAddedStudents();
    localStorage.setItem(ADDED_STUDENTS_KEY, JSON.stringify([...existing, newStudent]));
  }
  return newStudent;
}

export function findUserIncludingAdded(id: string, password: string): { role: Role; id: string; name: string } | null {
  const base = findUser(id, password);
  if (base) return base;
  // Check added students
  const added = getAddedStudents();
  const s = added.find((a) => a.id === id && password === "12345");
  if (s) return { role: "student", id: s.id, name: s.name };
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// STUDENT RANKING & GAMIFIED SCORING SYSTEM
// ─────────────────────────────────────────────────────────────────────

export const studentRankings: StudentRanking[] = [
  {
    studentId: "72201235M",
    name: "Priya Desai",
    department: "Computer Engineering",
    year: 3,
    division: "A",
    rankClass: 1,
    rankDept: 1,
    rankCollege: 3,
    rankChange: 1,
    totalScore: 940,
    academicScore: 480,
    attendanceScore: 280,
    activityScore: 180,
    spi: 9.6,
    attendancePct: 92.3,
    badges: [
      { label: "Class Topper #1", icon: "👑", color: "gold" },
      { label: "92%+ Attendance", icon: "🔥", color: "moss" },
      { label: "Hackathon Winner", icon: "🏆", color: "marigold" },
    ],
    actionPlan: [
      {
        title: "Maintain 90%+ Study Streak",
        pts: 20,
        description: "Stay ahead in ESE preparations to defend your #1 Gold Crown",
        type: "academic",
      },
    ],
  },
  {
    studentId: "72201238M",
    name: "Arjun Nair",
    department: "Computer Engineering",
    year: 3,
    division: "A",
    rankClass: 2,
    rankDept: 4,
    rankCollege: 8,
    rankChange: 0,
    totalScore: 915,
    academicScore: 460,
    attendanceScore: 275,
    activityScore: 180,
    spi: 9.1,
    attendancePct: 87.5,
    badges: [
      { label: "Silver Honor Roll", icon: "🥈", color: "marigold" },
      { label: "Code Master", icon: "⚡", color: "ink" },
    ],
    actionPlan: [
      {
        title: "Score 28+ in TOC CIE-2",
        pts: 25,
        description: "Only 25 pts needed to challenge Priya Desai for the #1 spot!",
        type: "academic",
      },
    ],
  },
  {
    studentId: "72201236M",
    name: "Rohit Patil",
    department: "Information Technology",
    year: 3,
    division: "B",
    rankClass: 3,
    rankDept: 6,
    rankCollege: 14,
    rankChange: 2,
    totalScore: 890,
    academicScore: 445,
    attendanceScore: 265,
    activityScore: 180,
    spi: 8.8,
    attendancePct: 86.4,
    badges: [
      { label: "Bronze Medalist", icon: "🥉", color: "marigold" },
      { label: "Math Ace", icon: "📐", color: "moss" },
    ],
    actionPlan: [
      {
        title: "Complete Advanced Lab Assignments",
        pts: 25,
        description: "Submit all lab exercises early for +25 Zeal Points",
        type: "activity",
      },
    ],
  },
  {
    studentId: "72201234M",
    name: "Aarav Sharma",
    department: "Computer Engineering",
    year: 3,
    division: "A",
    rankClass: 4,
    rankDept: 9,
    rankCollege: 22,
    rankChange: 1,
    totalScore: 865,
    academicScore: 430,
    attendanceScore: 245,
    activityScore: 190,
    spi: 8.42,
    attendancePct: 75.0,
    badges: [
      { label: "Top 10% College", icon: "⭐", color: "moss" },
      { label: "DBMS Ace", icon: "💡", color: "ink" },
      { label: "Event Lead", icon: "🎯", color: "marigold" },
    ],
    actionPlan: [
      {
        title: "Boost Operating Systems Attendance (Currently 67.9%)",
        pts: 40,
        description: "Attend next 6 OS lectures to cross 82% threshold (+40 pts).",
        type: "attendance",
      },
      {
        title: "Score 26+ in DBMS CIE-2 Test",
        pts: 25,
        description: "Improve internal assessment test performance (+25 pts).",
        type: "academic",
      },
      {
        title: "Register & Submit Paper for ZENITH 2026",
        pts: 20,
        description: "Submit technical paper proposal before Sept 10 (+20 pts).",
        type: "activity",
      },
    ],
  },
  {
    studentId: "72201237M",
    name: "Sneha Kulkarni",
    department: "Mechanical Engineering",
    year: 2,
    division: "A",
    rankClass: 5,
    rankDept: 12,
    rankCollege: 35,
    rankChange: -1,
    totalScore: 820,
    academicScore: 410,
    attendanceScore: 230,
    activityScore: 180,
    spi: 8.0,
    attendancePct: 83.3,
    badges: [
      { label: "Consistent Learner", icon: "📖", color: "ink" },
    ],
    actionPlan: [
      {
        title: "Target 25+ in Engineering Maths Test",
        pts: 30,
        description: "Practice university question bank papers for +30 pts.",
        type: "academic",
      },
    ],
  },
];

export function getStudentRanking(studentId: string): StudentRanking | undefined {
  const existing = studentRankings.find((r) => r.studentId === studentId);
  if (existing) return existing;
  
  // For dynamically added students:
  const added = getAddedStudents().find((s) => s.id === studentId);
  if (added) {
    return {
      studentId: added.id,
      name: added.name,
      department: added.department,
      year: added.year,
      division: added.division,
      rankClass: 6,
      rankDept: 15,
      rankCollege: 42,
      rankChange: 0,
      totalScore: 780,
      academicScore: 390,
      attendanceScore: 240,
      activityScore: 150,
      spi: 7.8,
      attendancePct: 80.0,
      badges: [{ label: "New Challenger", icon: "🚀", color: "marigold" }],
      actionPlan: [
        {
          title: "Complete First Semester Evaluation",
          pts: 50,
          description: "Attempt all internal assessments and maintain 85%+ attendance",
          type: "academic",
        },
      ],
    };
  }
  return undefined;
}

export function getLeaderboard(scope: "class" | "dept" | "college", division = "A", dept = "Computer Engineering"): StudentRanking[] {
  let list = [...studentRankings];
  if (scope === "class") {
    list = list.filter((r) => r.division === division || r.department === dept);
  } else if (scope === "dept") {
    list = list.filter((r) => r.department === dept);
  }
  return list.sort((a, b) => b.totalScore - a.totalScore);
}

