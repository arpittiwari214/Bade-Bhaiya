/** Shapes returned by the API. Mirrors the server's Prisma enums and selects. */

export type UserRole = 'STUDENT' | 'PARENT' | 'MENTOR' | 'ADMIN';

export type StreamCode = 'SCIENCE' | 'COMMERCE' | 'ARTS' | 'VOCATIONAL';

export type EducationLevel =
  | 'CLASS_9'
  | 'CLASS_10'
  | 'CLASS_11'
  | 'CLASS_12'
  | 'UNDERGRADUATE'
  | 'POSTGRADUATE'
  | 'OTHER';

export type DegreeType = 'DIPLOMA' | 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'CERTIFICATE';

export type CollegeType = 'GOVERNMENT' | 'GOVERNMENT_AIDED' | 'AUTONOMOUS' | 'PRIVATE';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type TimelineEventType =
  | 'ADMISSION'
  | 'ENTRANCE_EXAM'
  | 'BOARD_EXAM'
  | 'SCHOLARSHIP'
  | 'COUNSELLING'
  | 'RESULT';

export type RoadmapStage =
  | 'CURRENT'
  | 'NEXT_EXAM'
  | 'STREAM_CHOICE'
  | 'DEGREE'
  | 'HIGHER_STUDY'
  | 'CAREER';

export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';

export type BookmarkEntity = 'COLLEGE' | 'SCHOLARSHIP' | 'COURSE' | 'CAREER';

export type QueryStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface Profile {
  id: string;
  avatarUrl: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  educationLevel: EducationLevel | null;
  currentStream: StreamCode | null;
  boardName: string | null;
  schoolName: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  interests: string[];
  preferredLanguage: string;
  onboardingCompleted: boolean;
  updatedAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'role' | 'createdAt'>;
}

export interface Stream {
  id: string;
  code: StreamCode;
  name: string;
  description: string;
  iconKey: string | null;
  _count: { courses: number };
}

export interface Course {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  description: string;
  degreeType: DegreeType;
  durationYears: number;
  eligibility: string;
  averageFeeMin: number | null;
  averageFeeMax: number | null;
  stream: { code: StreamCode; name: string };
}

export interface Career {
  id: string;
  slug: string;
  title: string;
  description: string;
  educationRequired: string;
  averageSalaryMin: number | null;
  averageSalaryMax: number | null;
  growthOutlook: string | null;
  sectors: string[];
}

export interface CourseDetail extends Course {
  careers: { relevance: number; note: string | null; career: Career }[];
  collegeCourses: {
    seats: number | null;
    annualFee: number | null;
    cutoffPercentage: number | null;
    college: Pick<College, 'id' | 'slug' | 'name' | 'city' | 'district' | 'state'>;
  }[];
}

export interface CareerDetail extends Career {
  courses: { relevance: number; note: string | null; course: Course }[];
}

export interface College {
  id: string;
  slug: string;
  name: string;
  type: CollegeType;
  affiliation: string | null;
  city: string;
  district: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  naacGrade: string | null;
  hostelAvailable: boolean;
  establishedYear: number | null;
  _count: { courses: number };
}

export interface CollegeDetail extends Omit<College, '_count'> {
  addressLine: string | null;
  pincode: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  isBookmarked: boolean;
  courses: {
    id: string;
    seats: number | null;
    annualFee: number | null;
    cutoffPercentage: number | null;
    medium: string | null;
    course: Pick<Course, 'id' | 'slug' | 'name' | 'shortName' | 'degreeType' | 'durationYears'> & {
      stream: { code: StreamCode; name: string };
    };
  }[];
}

export interface Scholarship {
  id: string;
  slug: string;
  title: string;
  provider: string;
  description: string;
  criteria: string;
  benefitAmount: number | null;
  benefitDescription: string | null;
  applicationStartDate: string | null;
  deadline: string;
  url: string;
  state: string | null;
  eligibleStreams: StreamCode[];
  eligibleLevels: EducationLevel[];
}

export interface ScholarshipApplication {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: string;
  scholarship: Pick<Scholarship, 'id' | 'slug' | 'title' | 'provider' | 'deadline' | 'url'>;
}

export interface QuizOption {
  id: string;
  text: string;
  displayOrder: number;
}

export interface QuizQuestion {
  id: string;
  category: 'INTEREST' | 'APTITUDE' | 'PERSONALITY';
  text: string;
  helpText: string | null;
  displayOrder: number;
  options: QuizOption[];
}

export type StreamScores = Record<StreamCode, number>;

export interface QuizResult {
  scores: StreamScores;
  percentages: StreamScores;
  recommendedStream: StreamCode;
  closeAlternatives: StreamCode[];
  answeredCount: number;
}

export interface QuizAttempt {
  id: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  startedAt: string;
  completedAt: string | null;
  answers: { questionId: string; optionId: string }[];
  result: QuizResult | null;
}

export interface RoadmapStep {
  id: string;
  stage: RoadmapStage;
  displayOrder: number;
  title: string;
  description: string;
  status: StepStatus;
  targetDate: string | null;
  resourceUrl: string | null;
}

export interface Roadmap {
  id: string;
  title: string;
  summary: string | null;
  stream: StreamCode | null;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  steps: RoadmapStep[];
}

export interface TimelineEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: TimelineEventType;
  startDate: string;
  endDate: string | null;
  url: string | null;
  state: string | null;
  isNational: boolean;
  isSubscribed?: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  entityType: BookmarkEntity;
  entityId: string;
  createdAt: string;
  entity: Record<string, unknown> | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface DashboardData {
  profile: {
    onboardingCompleted: boolean;
    educationLevel: EducationLevel | null;
    currentStream: StreamCode | null;
    state: string | null;
    district: string | null;
    interests: string[];
    user: { name: string };
  } | null;
  quiz: {
    hasCompleted: boolean;
    latestAttempt: {
      id: string;
      scores: StreamScores;
      recommendedStream: StreamCode | null;
      completedAt: string | null;
    } | null;
  };
  roadmap: {
    id: string;
    title: string;
    stream: StreamCode | null;
    totalSteps: number;
    completedSteps: number;
    progress: number;
    nextStep: RoadmapStep | null;
  } | null;
  applications: {
    id: string;
    status: ApplicationStatus;
    appliedAt: string;
    scholarship: { id: string; slug: string; title: string; deadline: string };
  }[];
  upcomingEvents: {
    id: string;
    slug: string;
    title: string;
    type: TimelineEventType;
    startDate: string;
    endDate: string | null;
  }[];
  unreadNotifications: number;
  bookmarks: Partial<Record<BookmarkEntity, number>>;
}

export interface AdminStats {
  users: { total: number; newLast30Days: number };
  content: { colleges: number; scholarships: number; activeScholarships: number };
  engagement: {
    applications: number;
    completedQuizzes: number;
    openQueries: number;
    averageRating: number | null;
    feedbackCount: number;
  };
  streamBreakdown: { stream: StreamCode | null; count: number }[];
}
