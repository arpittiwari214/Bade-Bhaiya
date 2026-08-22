import type { DegreeType, QuizCategory, StreamCode, TimelineEventType } from '@prisma/client';

/**
 * Seed content. This is illustrative reference data for development and demos.
 * Figures such as fees, cutoffs, and salary bands are indicative ranges, not
 * verified official values, and should be replaced from authoritative sources
 * (AISHE, NSP, state education portals) before a public launch.
 */

export const streams: {
  code: StreamCode;
  name: string;
  description: string;
  iconKey: string;
  displayOrder: number;
}[] = [
  {
    code: 'SCIENCE',
    name: 'Science',
    description:
      'Physics, Chemistry, Biology and Mathematics. Leads to engineering, medicine, research, data and technology roles.',
    iconKey: 'flask',
    displayOrder: 1,
  },
  {
    code: 'COMMERCE',
    name: 'Commerce',
    description:
      'Accountancy, Business Studies and Economics. Leads to finance, chartered accountancy, banking, and business roles.',
    iconKey: 'chart',
    displayOrder: 2,
  },
  {
    code: 'ARTS',
    name: 'Arts and Humanities',
    description:
      'History, Political Science, Psychology, Literature and Sociology. Leads to civil services, law, media, teaching and social work.',
    iconKey: 'book',
    displayOrder: 3,
  },
  {
    code: 'VOCATIONAL',
    name: 'Vocational',
    description:
      'Skill-focused trades and applied programmes with shorter durations and direct routes into employment.',
    iconKey: 'tools',
    displayOrder: 4,
  },
];

export const courses: {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  degreeType: DegreeType;
  durationYears: number;
  eligibility: string;
  averageFeeMin: number;
  averageFeeMax: number;
  stream: StreamCode;
}[] = [
  {
    slug: 'bsc-physics',
    name: 'Bachelor of Science in Physics',
    shortName: 'B.Sc. Physics',
    description:
      'Three-year degree covering mechanics, electromagnetism, quantum physics and laboratory practice. A common route into research, teaching and technical roles.',
    degreeType: 'BACHELOR',
    durationYears: 3,
    eligibility: 'Class 12 with Physics, Chemistry and Mathematics, usually 50 percent or above.',
    averageFeeMin: 3000,
    averageFeeMax: 25000,
    stream: 'SCIENCE',
  },
  {
    slug: 'bsc-computer-science',
    name: 'Bachelor of Science in Computer Science',
    shortName: 'B.Sc. CS',
    description:
      'Programming, data structures, databases and networks. The most direct science route into software and data roles without an engineering entrance exam.',
    degreeType: 'BACHELOR',
    durationYears: 3,
    eligibility: 'Class 12 with Mathematics, usually 50 percent or above.',
    averageFeeMin: 5000,
    averageFeeMax: 40000,
    stream: 'SCIENCE',
  },
  {
    slug: 'bsc-nursing',
    name: 'Bachelor of Science in Nursing',
    shortName: 'B.Sc. Nursing',
    description:
      'Four-year professional degree combining clinical training with coursework. Strong and steady demand across government and private hospitals.',
    degreeType: 'BACHELOR',
    durationYears: 4,
    eligibility: 'Class 12 with Physics, Chemistry and Biology, minimum 45 to 50 percent.',
    averageFeeMin: 10000,
    averageFeeMax: 60000,
    stream: 'SCIENCE',
  },
  {
    slug: 'btech-computer-science',
    name: 'Bachelor of Technology in Computer Science',
    shortName: 'B.Tech CSE',
    description:
      'Four-year engineering degree. Admission is usually through JEE Main or a state entrance exam.',
    degreeType: 'BACHELOR',
    durationYears: 4,
    eligibility: 'Class 12 with PCM and a qualifying rank in JEE Main or a state entrance exam.',
    averageFeeMin: 15000,
    averageFeeMax: 200000,
    stream: 'SCIENCE',
  },
  {
    slug: 'bcom-general',
    name: 'Bachelor of Commerce',
    shortName: 'B.Com',
    description:
      'Accounting, taxation, business law and economics. The standard base degree for finance careers and for the CA and CS qualifications.',
    degreeType: 'BACHELOR',
    durationYears: 3,
    eligibility: 'Class 12 in any stream; Commerce with Accountancy preferred.',
    averageFeeMin: 2500,
    averageFeeMax: 30000,
    stream: 'COMMERCE',
  },
  {
    slug: 'bba',
    name: 'Bachelor of Business Administration',
    shortName: 'BBA',
    description:
      'Management, marketing, human resources and operations, with case work and internships. Often followed by an MBA.',
    degreeType: 'BACHELOR',
    durationYears: 3,
    eligibility: 'Class 12 in any stream, usually 50 percent or above.',
    averageFeeMin: 10000,
    averageFeeMax: 90000,
    stream: 'COMMERCE',
  },
  {
    slug: 'ba-economics',
    name: 'Bachelor of Arts in Economics',
    shortName: 'BA Economics',
    description:
      'Micro and macroeconomics, statistics and Indian economic policy. A strong base for civil services, banking and policy research.',
    degreeType: 'BACHELOR',
    durationYears: 3,
    eligibility: 'Class 12 in any stream; Mathematics is an advantage.',
    averageFeeMin: 2000,
    averageFeeMax: 25000,
    stream: 'COMMERCE',
  },
  {
    slug: 'ba-political-science',
    name: 'Bachelor of Arts in Political Science',
    shortName: 'BA Pol. Sci.',
    description:
      'Political theory, the Indian Constitution, public administration and international relations. Overlaps heavily with the UPSC syllabus.',
    degreeType: 'BACHELOR',
    durationYears: 3,
    eligibility: 'Class 12 in any stream.',
    averageFeeMin: 1500,
    averageFeeMax: 20000,
    stream: 'ARTS',
  },
  {
    slug: 'ba-psychology',
    name: 'Bachelor of Arts in Psychology',
    shortName: 'BA Psychology',
    description:
      'Human behaviour, cognition, and counselling foundations. Leads to clinical practice, HR and research after a postgraduate degree.',
    degreeType: 'BACHELOR',
    durationYears: 3,
    eligibility: 'Class 12 in any stream.',
    averageFeeMin: 3000,
    averageFeeMax: 35000,
    stream: 'ARTS',
  },
  {
    slug: 'ba-english',
    name: 'Bachelor of Arts in English',
    shortName: 'BA English',
    description:
      'Literature, criticism and academic writing. Common route into teaching, publishing, content and communications.',
    degreeType: 'BACHELOR',
    durationYears: 3,
    eligibility: 'Class 12 in any stream.',
    averageFeeMin: 1500,
    averageFeeMax: 20000,
    stream: 'ARTS',
  },
  {
    slug: 'bed',
    name: 'Bachelor of Education',
    shortName: 'B.Ed.',
    description:
      'Two-year professional degree required to teach in most schools. Taken after graduation.',
    degreeType: 'BACHELOR',
    durationYears: 2,
    eligibility: 'A bachelor degree with at least 50 percent.',
    averageFeeMin: 10000,
    averageFeeMax: 80000,
    stream: 'ARTS',
  },
  {
    slug: 'diploma-mechanical-engineering',
    name: 'Diploma in Mechanical Engineering',
    shortName: 'Diploma (Mech)',
    description:
      'Three-year polytechnic diploma with workshop training. Allows lateral entry into the second year of a B.Tech.',
    degreeType: 'DIPLOMA',
    durationYears: 3,
    eligibility: 'Class 10 with Mathematics and Science.',
    averageFeeMin: 5000,
    averageFeeMax: 40000,
    stream: 'VOCATIONAL',
  },
  {
    slug: 'iti-electrician',
    name: 'ITI Electrician Trade',
    shortName: 'ITI Electrician',
    description:
      'Two-year Industrial Training Institute certificate with an apprenticeship. One of the fastest routes from Class 10 to paid work.',
    degreeType: 'CERTIFICATE',
    durationYears: 2,
    eligibility: 'Class 10 pass.',
    averageFeeMin: 2000,
    averageFeeMax: 15000,
    stream: 'VOCATIONAL',
  },
  {
    slug: 'bvoc-hospitality',
    name: 'Bachelor of Vocation in Hospitality and Tourism',
    shortName: 'B.Voc Hospitality',
    description:
      'Applied degree with industry placements in hotels, travel and event operations.',
    degreeType: 'BACHELOR',
    durationYears: 3,
    eligibility: 'Class 12 in any stream.',
    averageFeeMin: 8000,
    averageFeeMax: 60000,
    stream: 'VOCATIONAL',
  },
];

export const careers: {
  slug: string;
  title: string;
  description: string;
  educationRequired: string;
  averageSalaryMin: number;
  averageSalaryMax: number;
  growthOutlook: string;
  sectors: string[];
}[] = [
  {
    slug: 'software-developer',
    title: 'Software Developer',
    description:
      'Builds and maintains applications and services. Entry is possible from B.Tech, BCA or B.Sc. Computer Science, and portfolios matter as much as the degree.',
    educationRequired: 'B.Tech CSE, B.Sc. Computer Science or BCA',
    averageSalaryMin: 300000,
    averageSalaryMax: 1500000,
    growthOutlook: 'High',
    sectors: ['Technology', 'Finance', 'Government'],
  },
  {
    slug: 'data-analyst',
    title: 'Data Analyst',
    description:
      'Turns raw data into decisions using SQL, spreadsheets and visualisation tools. Recruits from statistics, economics and computer science backgrounds.',
    educationRequired: 'B.Sc. Statistics or Computer Science, or BA Economics with analytics skills',
    averageSalaryMin: 350000,
    averageSalaryMax: 1200000,
    growthOutlook: 'High',
    sectors: ['Technology', 'Finance', 'Healthcare', 'Retail'],
  },
  {
    slug: 'chartered-accountant',
    title: 'Chartered Accountant',
    description:
      'Audit, taxation and financial advisory. Qualification is through the ICAI examinations, usually alongside or after a B.Com.',
    educationRequired: 'B.Com plus ICAI CA Foundation, Intermediate and Final',
    averageSalaryMin: 600000,
    averageSalaryMax: 2500000,
    growthOutlook: 'Steady',
    sectors: ['Finance', 'Consulting', 'Government'],
  },
  {
    slug: 'civil-services-officer',
    title: 'Civil Services Officer',
    description:
      'IAS, IPS and allied services through the UPSC examination. Any graduate may apply; Political Science, History and Economics overlap most with the syllabus.',
    educationRequired: 'Any bachelor degree, plus the UPSC Civil Services Examination',
    averageSalaryMin: 700000,
    averageSalaryMax: 2000000,
    growthOutlook: 'Steady',
    sectors: ['Government', 'Public Administration'],
  },
  {
    slug: 'school-teacher',
    title: 'School Teacher',
    description:
      'Teaches at primary or secondary level. Requires a B.Ed. and, for government schools, a state or central eligibility test.',
    educationRequired: 'Bachelor degree plus B.Ed. and CTET or a state TET',
    averageSalaryMin: 250000,
    averageSalaryMax: 900000,
    growthOutlook: 'Steady',
    sectors: ['Education', 'Government'],
  },
  {
    slug: 'staff-nurse',
    title: 'Staff Nurse',
    description:
      'Patient care in hospitals and clinics. Registration with the state nursing council is required to practise.',
    educationRequired: 'B.Sc. Nursing or GNM, plus state nursing council registration',
    averageSalaryMin: 240000,
    averageSalaryMax: 800000,
    growthOutlook: 'High',
    sectors: ['Healthcare', 'Government'],
  },
  {
    slug: 'clinical-psychologist',
    title: 'Clinical Psychologist',
    description:
      'Assesses and treats mental health conditions. Requires postgraduate study and, for clinical practice, RCI registration.',
    educationRequired: 'BA or B.Sc. Psychology, then M.A. or M.Sc. and an M.Phil. in Clinical Psychology',
    averageSalaryMin: 300000,
    averageSalaryMax: 1200000,
    growthOutlook: 'High',
    sectors: ['Healthcare', 'Education', 'Corporate'],
  },
  {
    slug: 'bank-probationary-officer',
    title: 'Bank Probationary Officer',
    description:
      'Officer-grade role in public sector banks, recruited through IBPS or SBI examinations. Open to graduates from any stream.',
    educationRequired: 'Any bachelor degree plus the IBPS PO or SBI PO examination',
    averageSalaryMin: 500000,
    averageSalaryMax: 1200000,
    growthOutlook: 'Steady',
    sectors: ['Banking', 'Government'],
  },
  {
    slug: 'electrician-technician',
    title: 'Electrician and Electrical Technician',
    description:
      'Installs and maintains electrical systems. ITI certification plus an apprenticeship leads to work in months rather than years.',
    educationRequired: 'ITI Electrician certificate and an apprenticeship',
    averageSalaryMin: 180000,
    averageSalaryMax: 600000,
    growthOutlook: 'Steady',
    sectors: ['Manufacturing', 'Construction', 'Utilities'],
  },
  {
    slug: 'hotel-operations-manager',
    title: 'Hotel Operations Manager',
    description:
      'Runs front office, housekeeping and food service teams. Career progresses quickly from supervisory roles with on-the-job performance.',
    educationRequired: 'B.Voc Hospitality or a hotel management degree',
    averageSalaryMin: 250000,
    averageSalaryMax: 1000000,
    growthOutlook: 'Moderate',
    sectors: ['Hospitality', 'Tourism'],
  },
  {
    slug: 'content-writer',
    title: 'Content Writer and Editor',
    description:
      'Writes and edits for publications, brands and digital products. Portfolio-driven, with wide entry from any humanities degree.',
    educationRequired: 'BA English, Journalism or any degree with strong writing samples',
    averageSalaryMin: 240000,
    averageSalaryMax: 900000,
    growthOutlook: 'Moderate',
    sectors: ['Media', 'Technology', 'Marketing'],
  },
  {
    slug: 'mechanical-technician',
    title: 'Mechanical Technician',
    description:
      'Maintains and repairs machinery in plants and workshops. A diploma allows lateral entry into engineering later.',
    educationRequired: 'Diploma in Mechanical Engineering',
    averageSalaryMin: 200000,
    averageSalaryMax: 700000,
    growthOutlook: 'Moderate',
    sectors: ['Manufacturing', 'Automotive', 'Energy'],
  },
];

/** courseSlug -> careerSlug with a relevance weight (higher shows first). */
export const courseCareerLinks: { course: string; career: string; relevance: number; note?: string }[] =
  [
    { course: 'bsc-computer-science', career: 'software-developer', relevance: 95 },
    { course: 'bsc-computer-science', career: 'data-analyst', relevance: 85 },
    { course: 'btech-computer-science', career: 'software-developer', relevance: 98 },
    { course: 'btech-computer-science', career: 'data-analyst', relevance: 80 },
    {
      course: 'bsc-physics',
      career: 'data-analyst',
      relevance: 65,
      note: 'Physics graduates move into analytics via the strong mathematics and modelling base.',
    },
    { course: 'bsc-physics', career: 'school-teacher', relevance: 70 },
    { course: 'bsc-nursing', career: 'staff-nurse', relevance: 98 },
    { course: 'bcom-general', career: 'chartered-accountant', relevance: 95 },
    { course: 'bcom-general', career: 'bank-probationary-officer', relevance: 80 },
    { course: 'bba', career: 'bank-probationary-officer', relevance: 70 },
    { course: 'bba', career: 'hotel-operations-manager', relevance: 55 },
    { course: 'ba-economics', career: 'data-analyst', relevance: 75 },
    { course: 'ba-economics', career: 'civil-services-officer', relevance: 85 },
    { course: 'ba-economics', career: 'bank-probationary-officer', relevance: 80 },
    { course: 'ba-political-science', career: 'civil-services-officer', relevance: 92 },
    { course: 'ba-political-science', career: 'content-writer', relevance: 55 },
    { course: 'ba-psychology', career: 'clinical-psychologist', relevance: 95 },
    { course: 'ba-psychology', career: 'school-teacher', relevance: 60 },
    { course: 'ba-english', career: 'content-writer', relevance: 90 },
    { course: 'ba-english', career: 'school-teacher', relevance: 75 },
    { course: 'bed', career: 'school-teacher', relevance: 98 },
    { course: 'diploma-mechanical-engineering', career: 'mechanical-technician', relevance: 95 },
    { course: 'iti-electrician', career: 'electrician-technician', relevance: 98 },
    { course: 'bvoc-hospitality', career: 'hotel-operations-manager', relevance: 92 },
  ];

export const colleges: {
  slug: string;
  name: string;
  city: string;
  district: string;
  state: string;
  affiliation: string;
  establishedYear: number;
  naacGrade: string;
  hostelAvailable: boolean;
  latitude: number;
  longitude: number;
  courseSlugs: string[];
}[] = [
  {
    slug: 'government-degree-college-jammu',
    name: 'Government Degree College, Jammu',
    city: 'Jammu',
    district: 'Jammu',
    state: 'Jammu and Kashmir',
    affiliation: 'University of Jammu',
    establishedYear: 1944,
    naacGrade: 'A',
    hostelAvailable: true,
    latitude: 32.7266,
    longitude: 74.857,
    courseSlugs: ['bsc-physics', 'bcom-general', 'ba-political-science', 'ba-english'],
  },
  {
    slug: 'government-college-for-women-srinagar',
    name: 'Government College for Women, Srinagar',
    city: 'Srinagar',
    district: 'Srinagar',
    state: 'Jammu and Kashmir',
    affiliation: 'University of Kashmir',
    establishedYear: 1950,
    naacGrade: 'A+',
    hostelAvailable: true,
    latitude: 34.0837,
    longitude: 74.7973,
    courseSlugs: ['ba-english', 'ba-psychology', 'bcom-general', 'bsc-computer-science'],
  },
  {
    slug: 'government-holkar-science-college-indore',
    name: 'Government Holkar Science College, Indore',
    city: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    affiliation: 'Devi Ahilya Vishwavidyalaya',
    establishedYear: 1891,
    naacGrade: 'A+',
    hostelAvailable: true,
    latitude: 22.7196,
    longitude: 75.8577,
    courseSlugs: ['bsc-physics', 'bsc-computer-science', 'ba-economics'],
  },
  {
    slug: 'government-arts-college-coimbatore',
    name: 'Government Arts College, Coimbatore',
    city: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    affiliation: 'Bharathiar University',
    establishedYear: 1875,
    naacGrade: 'A',
    hostelAvailable: true,
    latitude: 11.0168,
    longitude: 76.9558,
    courseSlugs: ['ba-english', 'ba-economics', 'bcom-general', 'bsc-computer-science'],
  },
  {
    slug: 'government-college-rajahmundry',
    name: 'Government College, Rajahmundry',
    city: 'Rajahmundry',
    district: 'East Godavari',
    state: 'Andhra Pradesh',
    affiliation: 'Adikavi Nannaya University',
    establishedYear: 1853,
    naacGrade: 'B++',
    hostelAvailable: false,
    latitude: 17.0005,
    longitude: 81.804,
    courseSlugs: ['bcom-general', 'bsc-physics', 'ba-political-science'],
  },
  {
    slug: 'government-polytechnic-pune',
    name: 'Government Polytechnic, Pune',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    affiliation: 'Maharashtra State Board of Technical Education',
    establishedYear: 1957,
    naacGrade: 'A',
    hostelAvailable: true,
    latitude: 18.5204,
    longitude: 73.8567,
    courseSlugs: ['diploma-mechanical-engineering', 'iti-electrician'],
  },
  {
    slug: 'government-nursing-college-lucknow',
    name: 'Government Nursing College, Lucknow',
    city: 'Lucknow',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    affiliation: 'Atal Bihari Vajpayee Medical University',
    establishedYear: 1978,
    naacGrade: 'B+',
    hostelAvailable: true,
    latitude: 26.8467,
    longitude: 80.9462,
    courseSlugs: ['bsc-nursing'],
  },
  {
    slug: 'government-college-of-commerce-patna',
    name: 'Government College of Commerce, Patna',
    city: 'Patna',
    district: 'Patna',
    state: 'Bihar',
    affiliation: 'Patliputra University',
    establishedYear: 1957,
    naacGrade: 'B',
    hostelAvailable: false,
    latitude: 25.5941,
    longitude: 85.1376,
    courseSlugs: ['bcom-general', 'bba', 'ba-economics'],
  },
];

export const scholarships: {
  slug: string;
  title: string;
  provider: string;
  description: string;
  criteria: string;
  benefitAmount: number;
  benefitDescription: string;
  /** Days from the seed run, so deadlines are always in a sensible window. */
  deadlineInDays: number;
  url: string;
  state: string | null;
  eligibleStreams: StreamCode[];
  eligibleLevels: (
    | 'CLASS_9'
    | 'CLASS_10'
    | 'CLASS_11'
    | 'CLASS_12'
    | 'UNDERGRADUATE'
    | 'POSTGRADUATE'
    | 'OTHER'
  )[];
}[] = [
  {
    slug: 'national-scholarship-portal-post-matric',
    title: 'Post Matric Scholarship (National Scholarship Portal)',
    provider: 'Ministry of Social Justice and Empowerment',
    description:
      'Central scholarship for students continuing education after Class 10, covering tuition and maintenance allowance.',
    criteria:
      'Family income below the notified ceiling; applicable category certificate; enrolled in a recognised institution.',
    benefitAmount: 12000,
    benefitDescription: 'Tuition reimbursement plus an annual maintenance allowance',
    deadlineInDays: 75,
    url: 'https://scholarships.gov.in',
    state: null,
    eligibleStreams: [],
    eligibleLevels: ['CLASS_11', 'CLASS_12', 'UNDERGRADUATE', 'POSTGRADUATE'],
  },
  {
    slug: 'central-sector-scheme-college-students',
    title: 'Central Sector Scheme of Scholarship for College and University Students',
    provider: 'Department of Higher Education',
    description:
      'Merit scholarship for students in the top percentile of their Class 12 board who pursue a regular degree course.',
    criteria:
      'Above the 80th percentile in the Class 12 board examination; family income within the notified limit; regular degree course.',
    benefitAmount: 10000,
    benefitDescription: 'Annual award for the duration of the degree',
    deadlineInDays: 50,
    url: 'https://scholarships.gov.in',
    state: null,
    eligibleStreams: [],
    eligibleLevels: ['UNDERGRADUATE'],
  },
  {
    slug: 'pragati-scholarship-girl-students',
    title: 'Pragati Scholarship for Girl Students',
    provider: 'All India Council for Technical Education',
    description:
      'Supports girl students admitted to technical degree and diploma programmes, covering fees and study materials.',
    criteria:
      'Girl students admitted to an AICTE-approved technical degree or diploma; family income within the notified limit.',
    benefitAmount: 50000,
    benefitDescription: 'Annual award towards fees and learning materials',
    deadlineInDays: 95,
    url: 'https://www.aicte-india.org',
    state: null,
    eligibleStreams: ['SCIENCE', 'VOCATIONAL'],
    eligibleLevels: ['UNDERGRADUATE'],
  },
  {
    slug: 'inspire-scholarship-higher-education',
    title: 'INSPIRE Scholarship for Higher Education',
    provider: 'Department of Science and Technology',
    description:
      'Encourages talented students to pursue natural and basic sciences at the degree level.',
    criteria:
      'Top one percent in the Class 12 board examination or a qualifying national examination rank; enrolled in a basic sciences course.',
    benefitAmount: 80000,
    benefitDescription: 'Annual scholarship plus a summer research grant',
    deadlineInDays: 120,
    url: 'https://online-inspire.gov.in',
    state: null,
    eligibleStreams: ['SCIENCE'],
    eligibleLevels: ['UNDERGRADUATE'],
  },
  {
    slug: 'maharashtra-rajarshi-shahu-maharaj-scholarship',
    title: 'Rajarshi Shahu Maharaj Scholarship',
    provider: 'Government of Maharashtra',
    description:
      'State scholarship supporting students from economically weaker sections in professional and degree courses.',
    criteria: 'Domicile of Maharashtra; family income within the notified limit; regular enrolment.',
    benefitAmount: 25000,
    benefitDescription: 'Fee waiver component plus maintenance support',
    deadlineInDays: 40,
    url: 'https://mahadbt.maharashtra.gov.in',
    state: 'Maharashtra',
    eligibleStreams: [],
    eligibleLevels: ['UNDERGRADUATE', 'POSTGRADUATE'],
  },
  {
    slug: 'nsp-pre-matric-class-9-10',
    title: 'Pre Matric Scholarship for Class 9 and 10',
    provider: 'Ministry of Minority Affairs',
    description:
      'Supports students in Classes 9 and 10 so that financial pressure does not end schooling before the board examination.',
    criteria: 'Enrolled in Class 9 or 10; at least 50 percent in the previous class; income ceiling applies.',
    benefitAmount: 6000,
    benefitDescription: 'Admission and tuition fee support plus maintenance allowance',
    deadlineInDays: 30,
    url: 'https://scholarships.gov.in',
    state: null,
    eligibleStreams: [],
    eligibleLevels: ['CLASS_9', 'CLASS_10'],
  },
];

export const timelineEvents: {
  slug: string;
  title: string;
  description: string;
  type: TimelineEventType;
  startInDays: number;
  endInDays: number | null;
  url: string;
  state: string | null;
  isNational: boolean;
}[] = [
  {
    slug: 'cbse-class-12-board-exams',
    title: 'CBSE Class 12 Board Examinations',
    description:
      'Annual Class 12 board examinations. Marks are the primary admission criterion for most government degree colleges.',
    type: 'BOARD_EXAM',
    startInDays: 180,
    endInDays: 215,
    url: 'https://www.cbse.gov.in',
    state: null,
    isNational: true,
  },
  {
    slug: 'jee-main-session-1',
    title: 'JEE Main Session 1',
    description:
      'National engineering entrance examination. Required for B.Tech admission at NITs, IIITs and many state colleges.',
    type: 'ENTRANCE_EXAM',
    startInDays: 140,
    endInDays: 146,
    url: 'https://jeemain.nta.nic.in',
    state: null,
    isNational: true,
  },
  {
    slug: 'neet-ug',
    title: 'NEET UG',
    description:
      'Single entrance examination for undergraduate medical, dental and allied health courses across India.',
    type: 'ENTRANCE_EXAM',
    startInDays: 250,
    endInDays: null,
    url: 'https://neet.nta.nic.in',
    state: null,
    isNational: true,
  },
  {
    slug: 'cuet-ug-registration',
    title: 'CUET UG Registration',
    description:
      'Registration window for the Common University Entrance Test, used by central and many state universities for degree admission.',
    type: 'ADMISSION',
    startInDays: 25,
    endInDays: 60,
    url: 'https://cuet.nta.nic.in',
    state: null,
    isNational: true,
  },
  {
    slug: 'nsp-scholarship-window',
    title: 'National Scholarship Portal Application Window',
    description:
      'Annual window to apply for central government scholarships. Keep income and category certificates ready before it opens.',
    type: 'SCHOLARSHIP',
    startInDays: 10,
    endInDays: 75,
    url: 'https://scholarships.gov.in',
    state: null,
    isNational: true,
  },
  {
    slug: 'maharashtra-fyjc-admission',
    title: 'Maharashtra FYJC Online Admission',
    description:
      'First Year Junior College admission process for Class 11 in Maharashtra, conducted online by the state board.',
    type: 'ADMISSION',
    startInDays: 45,
    endInDays: 90,
    url: 'https://mahafyjcadmissions.in',
    state: 'Maharashtra',
    isNational: false,
  },
  {
    slug: 'class-10-results',
    title: 'Class 10 Board Results',
    description:
      'Class 10 results are declared. This is the point at which stream selection for Class 11 must be finalised.',
    type: 'RESULT',
    startInDays: 20,
    endInDays: null,
    url: 'https://results.gov.in',
    state: null,
    isNational: true,
  },
];

/**
 * Twelve questions across interest, aptitude and personality. Each option
 * carries per-stream points; the totals decide the recommendation. Weights are
 * kept on a 0-3 scale so no single question can dominate the result.
 */
export const quizQuestions: {
  category: QuizCategory;
  text: string;
  helpText?: string;
  options: { text: string; weights: Partial<Record<StreamCode, number>> }[];
}[] = [
  {
    category: 'INTEREST',
    text: 'Which of these would you most enjoy spending a free afternoon on?',
    options: [
      { text: 'Taking apart a gadget to see how it works', weights: { SCIENCE: 3, VOCATIONAL: 2 } },
      { text: 'Tracking prices and working out where the money goes', weights: { COMMERCE: 3 } },
      { text: 'Reading about history or debating an issue with friends', weights: { ARTS: 3 } },
      { text: 'Building or repairing something with your hands', weights: { VOCATIONAL: 3, SCIENCE: 1 } },
    ],
  },
  {
    category: 'APTITUDE',
    text: 'Which school subject do you find easiest to score well in?',
    options: [
      { text: 'Mathematics or Physics', weights: { SCIENCE: 3, COMMERCE: 1 } },
      { text: 'Accountancy or Business Studies', weights: { COMMERCE: 3 } },
      { text: 'History, Civics or Languages', weights: { ARTS: 3 } },
      { text: 'Practical and workshop subjects', weights: { VOCATIONAL: 3 } },
    ],
  },
  {
    category: 'INTEREST',
    text: 'A news story catches your eye. Which headline do you open first?',
    options: [
      { text: 'A new discovery in medicine or space', weights: { SCIENCE: 3 } },
      { text: 'A company results announcement or a budget decision', weights: { COMMERCE: 3 } },
      { text: 'An election result or a social issue', weights: { ARTS: 3 } },
      { text: 'A new factory or infrastructure project opening', weights: { VOCATIONAL: 2, COMMERCE: 1 } },
    ],
  },
  {
    category: 'PERSONALITY',
    text: 'When you work on a group project, what role do you naturally take?',
    options: [
      { text: 'The one who figures out how to solve the technical part', weights: { SCIENCE: 3 } },
      { text: 'The one who plans, budgets and keeps everyone on schedule', weights: { COMMERCE: 3 } },
      { text: 'The one who writes it up and presents it', weights: { ARTS: 3 } },
      { text: 'The one who actually builds the thing', weights: { VOCATIONAL: 3 } },
    ],
  },
  {
    category: 'APTITUDE',
    text: 'You are given a problem with no obvious answer. What is your first move?',
    options: [
      { text: 'Break it into smaller parts and test each one', weights: { SCIENCE: 3, VOCATIONAL: 1 } },
      { text: 'Look for a pattern in the numbers or past examples', weights: { COMMERCE: 3, SCIENCE: 1 } },
      { text: 'Ask people involved and understand the context first', weights: { ARTS: 3 } },
      { text: 'Try something practical and adjust as you go', weights: { VOCATIONAL: 3 } },
    ],
  },
  {
    category: 'INTEREST',
    text: 'Which of these club activities appeals to you most?',
    options: [
      { text: 'Science exhibition or robotics club', weights: { SCIENCE: 3 } },
      { text: 'Commerce fair or a stock market simulation', weights: { COMMERCE: 3 } },
      { text: 'Debate, drama or the school magazine', weights: { ARTS: 3 } },
      { text: 'Workshop, electronics or automotive club', weights: { VOCATIONAL: 3 } },
    ],
  },
  {
    category: 'PERSONALITY',
    text: 'How do you feel about work that involves talking to people all day?',
    options: [
      { text: 'I would rather focus on the problem than the people', weights: { SCIENCE: 2, VOCATIONAL: 2 } },
      { text: 'I enjoy it when there is a clear goal, like a deal or a target', weights: { COMMERCE: 3 } },
      { text: 'I enjoy it; understanding people is the interesting part', weights: { ARTS: 3 } },
      { text: 'I prefer working alongside a small team on something concrete', weights: { VOCATIONAL: 3 } },
    ],
  },
  {
    category: 'APTITUDE',
    text: 'How comfortable are you with mathematics beyond basic arithmetic?',
    helpText: 'Answer honestly. This affects which courses will feel sustainable, not how capable you are.',
    options: [
      { text: 'Very comfortable, I enjoy it', weights: { SCIENCE: 3, COMMERCE: 2 } },
      { text: 'Comfortable when it is applied to real situations like money', weights: { COMMERCE: 3 } },
      { text: 'I would rather avoid heavy mathematics', weights: { ARTS: 3 } },
      { text: 'I am fine with practical measurement and calculation', weights: { VOCATIONAL: 3 } },
    ],
  },
  {
    category: 'INTEREST',
    text: 'Which outcome would make you feel a day was well spent?',
    options: [
      { text: 'You understood something you did not understand before', weights: { SCIENCE: 3, ARTS: 1 } },
      { text: 'You made a plan that will save or earn money', weights: { COMMERCE: 3 } },
      { text: 'You changed someone opinion or helped them through something', weights: { ARTS: 3 } },
      { text: 'You finished something you can point at', weights: { VOCATIONAL: 3 } },
    ],
  },
  {
    category: 'PERSONALITY',
    text: 'How important is it to start earning soon after school?',
    helpText: 'There is no wrong answer. Some strong paths pay sooner, others pay more later.',
    options: [
      { text: 'Very important, I want to be earning within two years', weights: { VOCATIONAL: 3, COMMERCE: 1 } },
      { text: 'Somewhat important, but I will study longer for a better role', weights: { COMMERCE: 2, SCIENCE: 2 } },
      { text: 'Not important, I am willing to study for several years', weights: { SCIENCE: 3, ARTS: 2 } },
      { text: 'I want to prepare for a government examination after graduating', weights: { ARTS: 3, COMMERCE: 1 } },
    ],
  },
  {
    category: 'APTITUDE',
    text: 'Which comes more easily to you?',
    options: [
      { text: 'Remembering formulas and applying them correctly', weights: { SCIENCE: 3 } },
      { text: 'Keeping accurate records and spotting an error in them', weights: { COMMERCE: 3 } },
      { text: 'Writing a clear argument in your own words', weights: { ARTS: 3 } },
      { text: 'Learning a physical skill by watching and repeating', weights: { VOCATIONAL: 3 } },
    ],
  },
  {
    category: 'PERSONALITY',
    text: 'Ten years from now, which sounds most like the work you want?',
    options: [
      { text: 'Designing or building systems, in a lab or on a computer', weights: { SCIENCE: 3 } },
      { text: 'Running the finances of an organisation, or my own business', weights: { COMMERCE: 3 } },
      { text: 'In government, teaching, law or media, working with people', weights: { ARTS: 3 } },
      { text: 'A skilled trade or operations role with clear, hands-on work', weights: { VOCATIONAL: 3 } },
    ],
  },
];

export const faqs: { question: string; answer: string; category: string; displayOrder: number }[] = [
  {
    question: 'Is Bade Bhaiya free to use?',
    answer:
      'Yes. Browsing colleges, scholarships, courses and careers, taking the aptitude quiz and generating a roadmap are all free.',
    category: 'general',
    displayOrder: 1,
  },
  {
    question: 'How is my recommended stream decided?',
    answer:
      'The quiz scores your answers across four streams. Each option adds points to one or more streams, and the stream with the highest total is recommended. If two streams are close, both are shown so you can weigh them yourself.',
    category: 'quiz',
    displayOrder: 1,
  },
  {
    question: 'Is the quiz result final?',
    answer:
      'No. It is a starting point based on your interests and aptitude, not a test you pass or fail. You can retake it at any time, and your roadmap regenerates from the latest result.',
    category: 'quiz',
    displayOrder: 2,
  },
  {
    question: 'Does applying here submit my scholarship application to the government?',
    answer:
      'No. Bade Bhaiya tracks which scholarships you are interested in and reminds you before deadlines. The actual application must be submitted on the official portal, which we link to on every scholarship page.',
    category: 'scholarships',
    displayOrder: 1,
  },
  {
    question: 'How current is the college and scholarship information?',
    answer:
      'Listings are maintained by administrators and link to official sources. Always confirm fees, cutoffs and deadlines on the college or government portal before you rely on them.',
    category: 'general',
    displayOrder: 2,
  },
  {
    question: 'Who can see my profile?',
    answer:
      'Your quiz results, roadmap and saved items are private to you. Other signed-in users can only see your name, city and stream if you have filled them in.',
    category: 'privacy',
    displayOrder: 1,
  },
  {
    question: 'Can my parents use this too?',
    answer:
      'Yes. Choose the Parent role when registering. Parents see the same college, course and scholarship information, which is often the part families most need to discuss together.',
    category: 'general',
    displayOrder: 3,
  },
  {
    question: 'I chose the wrong stream. Is it too late?',
    answer:
      'Usually not. Many degree courses accept students from any stream, and diploma and vocational routes have lateral entry options. Use the course pages to check eligibility, which lists exactly what each course requires.',
    category: 'general',
    displayOrder: 4,
  },
];
