import type { EducationLevel, RoadmapStage, StreamCode } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../lib/errors';

interface StepTemplate {
  stage: RoadmapStage;
  title: string;
  description: string;
  /** Months from today, used to seed a suggested target date. */
  monthsAhead?: number;
}

const STREAM_LABEL: Record<StreamCode, string> = {
  SCIENCE: 'Science',
  COMMERCE: 'Commerce',
  ARTS: 'Arts and Humanities',
  VOCATIONAL: 'Vocational',
};

/**
 * Where a student currently is determines which steps are still ahead of them.
 * A Class 12 student should not be told to choose a stream they already chose.
 */
const STAGE_ORDER: EducationLevel[] = [
  'CLASS_9',
  'CLASS_10',
  'CLASS_11',
  'CLASS_12',
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'OTHER',
];

function buildTemplates(
  level: EducationLevel | null,
  stream: StreamCode,
  topCourseNames: string[],
): StepTemplate[] {
  const streamLabel = STREAM_LABEL[stream];
  const courseList = topCourseNames.length
    ? topCourseNames.slice(0, 3).join(', ')
    : `${streamLabel} degree programmes`;

  const index = level ? STAGE_ORDER.indexOf(level) : 0;
  const beforeClass11 = index <= STAGE_ORDER.indexOf('CLASS_10');
  const beforeClass12 = index <= STAGE_ORDER.indexOf('CLASS_11');
  const beforeDegree = index <= STAGE_ORDER.indexOf('CLASS_12');

  const steps: StepTemplate[] = [
    {
      stage: 'CURRENT',
      title: 'Complete your profile',
      description:
        'Add your class, board, and location so college and scholarship suggestions match where you actually are.',
      monthsAhead: 0,
    },
  ];

  if (beforeClass11) {
    steps.push(
      {
        stage: 'NEXT_EXAM',
        title: 'Prepare for your Class 10 board exams',
        description:
          'Your Class 10 percentage decides which streams and schools accept you. Focus on the subjects that feed into your recommended stream.',
        monthsAhead: 3,
      },
      {
        stage: 'STREAM_CHOICE',
        title: `Choose the ${streamLabel} stream in Class 11`,
        description: `Based on your quiz results, ${streamLabel} fits your interests and aptitude best. Confirm the subject combination your school offers.`,
        monthsAhead: 5,
      },
    );
  }

  if (beforeClass12) {
    steps.push({
      stage: 'NEXT_EXAM',
      title: 'Build a strong Class 12 foundation',
      description:
        'Class 12 marks are the main admission criterion for most government degree colleges. Track your school tests and fix weak subjects early.',
      monthsAhead: beforeClass11 ? 18 : 6,
    });
  }

  if (beforeDegree) {
    steps.push(
      {
        stage: 'DEGREE',
        title: `Shortlist degree courses: ${courseList}`,
        description:
          'Compare course duration, eligibility, and fees. Save at least three courses so you have backups during admissions.',
        monthsAhead: beforeClass11 ? 26 : 10,
      },
      {
        stage: 'DEGREE',
        title: 'Shortlist nearby government colleges',
        description:
          'Use the college directory to filter by your district and preferred course. Note each cutoff and the admission window.',
        monthsAhead: beforeClass11 ? 28 : 12,
      },
      {
        stage: 'DEGREE',
        title: 'Apply for scholarships you qualify for',
        description:
          'Most government scholarships close before admissions do. Check deadlines now and keep income and caste certificates ready.',
        monthsAhead: beforeClass11 ? 27 : 11,
      },
    );
  }

  steps.push(
    {
      stage: 'HIGHER_STUDY',
      title: 'Plan your higher-study options',
      description:
        'Decide early whether you want a postgraduate degree, a professional qualification, or a competitive exam after graduation. It changes which electives you pick.',
      monthsAhead: beforeDegree ? 40 : 12,
    },
    {
      stage: 'CAREER',
      title: 'Map your target careers',
      description:
        'Open the course-to-career view for your shortlisted courses and note the roles, expected salary range, and sectors they lead to.',
      monthsAhead: beforeDegree ? 44 : 18,
    },
  );

  return steps;
}

function targetDate(monthsAhead: number | undefined): Date | null {
  if (monthsAhead === undefined) return null;
  const date = new Date();
  date.setMonth(date.getMonth() + monthsAhead);
  return date;
}

/**
 * Generates a roadmap from the user's latest completed quiz attempt and their
 * profile. Any previous roadmap is marked non-current rather than deleted, so
 * a student can look back at what they were advised earlier.
 */
export async function generateRoadmap(userId: string, attemptId?: string) {
  const attempt = attemptId
    ? await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        select: { id: true, userId: true, status: true, recommendedStream: true },
      })
    : await prisma.quizAttempt.findFirst({
        where: { userId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        select: { id: true, userId: true, status: true, recommendedStream: true },
      });

  if (!attempt || attempt.userId !== userId) {
    throw new NotFoundError('Completed quiz attempt');
  }

  if (attempt.status !== 'COMPLETED' || !attempt.recommendedStream) {
    throw new BadRequestError('Finish the aptitude quiz before generating a roadmap');
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { educationLevel: true },
  });

  const stream = attempt.recommendedStream;

  const courses = await prisma.course.findMany({
    where: { isActive: true, stream: { code: stream } },
    orderBy: { name: 'asc' },
    take: 3,
    select: { name: true, shortName: true },
  });

  const templates = buildTemplates(
    profile?.educationLevel ?? null,
    stream,
    courses.map((c) => c.shortName ?? c.name),
  );

  return prisma.$transaction(async (tx) => {
    await tx.roadmap.updateMany({ where: { userId, isCurrent: true }, data: { isCurrent: false } });

    return tx.roadmap.create({
      data: {
        userId,
        attemptId: attempt.id,
        title: `Your ${STREAM_LABEL[stream]} roadmap`,
        summary: `A step-by-step path from where you are now to a career in ${STREAM_LABEL[stream]}, based on your quiz results.`,
        stream,
        isCurrent: true,
        steps: {
          create: templates.map((template, index) => ({
            stage: template.stage,
            displayOrder: index,
            title: template.title,
            description: template.description,
            targetDate: targetDate(template.monthsAhead),
          })),
        },
      },
      select: roadmapSelect,
    });
  });
}

export const roadmapSelect = {
  id: true,
  title: true,
  summary: true,
  stream: true,
  isCurrent: true,
  createdAt: true,
  updatedAt: true,
  steps: {
    orderBy: { displayOrder: 'asc' as const },
    select: {
      id: true,
      stage: true,
      displayOrder: true,
      title: true,
      description: true,
      status: true,
      targetDate: true,
      resourceUrl: true,
    },
  },
};

export async function getCurrentRoadmap(userId: string) {
  return prisma.roadmap.findFirst({
    where: { userId, isCurrent: true },
    orderBy: { createdAt: 'desc' },
    select: roadmapSelect,
  });
}

export async function updateStepStatus(
  userId: string,
  stepId: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED',
) {
  const step = await prisma.roadmapStep.findUnique({
    where: { id: stepId },
    select: { id: true, roadmap: { select: { userId: true } } },
  });

  if (!step || step.roadmap.userId !== userId) throw new NotFoundError('Roadmap step');

  return prisma.roadmapStep.update({
    where: { id: stepId },
    data: { status },
    select: { id: true, status: true },
  });
}
