import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  careers,
  colleges,
  courseCareerLinks,
  courses,
  faqs,
  quizQuestions,
  scholarships,
  streams,
  timelineEvents,
} from './seed/data';

const prisma = new PrismaClient();

/**
 * Idempotent seed: every write is an upsert keyed on a natural unique field, so
 * running it repeatedly against the same database converges rather than
 * duplicating or failing.
 */

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
}

async function seedStreams() {
  for (const stream of streams) {
    await prisma.stream.upsert({
      where: { code: stream.code },
      create: stream,
      update: stream,
    });
  }
  return prisma.stream.findMany({ select: { id: true, code: true } });
}

async function seedCourses(streamIds: Map<string, string>) {
  for (const course of courses) {
    const streamId = streamIds.get(course.stream);
    if (!streamId) throw new Error(`Missing stream ${course.stream} for course ${course.slug}`);

    const { stream: _stream, ...fields } = course;
    await prisma.course.upsert({
      where: { slug: course.slug },
      create: { ...fields, streamId },
      update: { ...fields, streamId },
    });
  }
}

async function seedCareers() {
  for (const career of careers) {
    await prisma.career.upsert({
      where: { slug: career.slug },
      create: career,
      update: career,
    });
  }
}

async function seedCourseCareerLinks() {
  const courseIds = new Map(
    (await prisma.course.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]),
  );
  const careerIds = new Map(
    (await prisma.career.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]),
  );

  for (const link of courseCareerLinks) {
    const courseId = courseIds.get(link.course);
    const careerId = careerIds.get(link.career);
    if (!courseId || !careerId) {
      throw new Error(`Cannot link ${link.course} -> ${link.career}: missing record`);
    }

    await prisma.courseCareer.upsert({
      where: { courseId_careerId: { courseId, careerId } },
      create: { courseId, careerId, relevance: link.relevance, note: link.note ?? null },
      update: { relevance: link.relevance, note: link.note ?? null },
    });
  }
}

async function seedColleges() {
  const courseIds = new Map(
    (await prisma.course.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]),
  );

  for (const college of colleges) {
    const { courseSlugs, ...fields } = college;

    const record = await prisma.college.upsert({
      where: { slug: college.slug },
      create: { ...fields, type: 'GOVERNMENT' },
      update: fields,
      select: { id: true },
    });

    for (const slug of courseSlugs) {
      const courseId = courseIds.get(slug);
      if (!courseId) throw new Error(`College ${college.slug} references unknown course ${slug}`);

      // Indicative offering figures, varied deterministically from the slug so
      // the demo data looks plausible without being random on each run.
      const seed = slug.length + college.slug.length;

      await prisma.collegeCourse.upsert({
        where: { collegeId_courseId: { collegeId: record.id, courseId } },
        create: {
          collegeId: record.id,
          courseId,
          seats: 40 + (seed % 5) * 20,
          annualFee: 2000 + (seed % 7) * 1500,
          cutoffPercentage: 45 + (seed % 40),
          medium: 'English',
        },
        update: {},
      });
    }
  }
}

async function seedScholarships() {
  for (const scholarship of scholarships) {
    const { deadlineInDays, ...fields } = scholarship;
    const data = {
      ...fields,
      deadline: daysFromNow(deadlineInDays),
      applicationStartDate: daysFromNow(Math.max(0, deadlineInDays - 60)),
    };

    await prisma.scholarship.upsert({
      where: { slug: scholarship.slug },
      create: data,
      update: data,
    });
  }
}

async function seedTimelineEvents() {
  for (const event of timelineEvents) {
    const { startInDays, endInDays, ...fields } = event;
    const data = {
      ...fields,
      startDate: daysFromNow(startInDays),
      endDate: endInDays === null ? null : daysFromNow(endInDays),
    };

    await prisma.timelineEvent.upsert({
      where: { slug: event.slug },
      create: data,
      update: data,
    });
  }
}

/**
 * Questions have no natural unique key, so they are matched on their text.
 * Options are replaced wholesale for a question, which keeps the scoring
 * weights in the file the single source of truth.
 */
async function seedQuiz() {
  for (const [index, question] of quizQuestions.entries()) {
    const existing = await prisma.quizQuestion.findFirst({
      where: { text: question.text },
      select: { id: true },
    });

    const questionId = existing
      ? (
          await prisma.quizQuestion.update({
            where: { id: existing.id },
            data: {
              category: question.category,
              helpText: question.helpText ?? null,
              displayOrder: index,
              isActive: true,
            },
            select: { id: true },
          })
        ).id
      : (
          await prisma.quizQuestion.create({
            data: {
              category: question.category,
              text: question.text,
              helpText: question.helpText ?? null,
              displayOrder: index,
            },
            select: { id: true },
          })
        ).id;

    await prisma.quizOption.deleteMany({ where: { questionId } });
    await prisma.quizOption.createMany({
      data: question.options.map((option, optionIndex) => ({
        questionId,
        text: option.text,
        displayOrder: optionIndex,
        streamWeights: option.weights,
      })),
    });
  }
}

async function seedFaqs() {
  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({
      where: { question: faq.question },
      select: { id: true },
    });

    if (existing) {
      await prisma.faq.update({ where: { id: existing.id }, data: faq });
    } else {
      await prisma.faq.create({ data: faq });
    }
  }
}

/**
 * Demo accounts exist only outside production. Seeding a known password into a
 * live database would be a standing backdoor.
 */
async function seedUsers() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO_USERS !== 'true') {
    console.log('  Skipping demo users (production)');
    return;
  }

  const password = process.env.SEED_USER_PASSWORD ?? 'ChangeMe123';
  const passwordHash = await bcrypt.hash(password, 12);

  const demoUsers = [
    { email: 'admin@badebhaiya.local', name: 'Platform Admin', role: 'ADMIN' as const },
    { email: 'student@badebhaiya.local', name: 'Demo Student', role: 'STUDENT' as const },
    { email: 'parent@badebhaiya.local', name: 'Demo Parent', role: 'PARENT' as const },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        ...user,
        passwordHash,
        emailVerified: true,
        profile: {
          create: {
            educationLevel: user.role === 'STUDENT' ? 'CLASS_12' : null,
            state: 'Maharashtra',
            district: 'Pune',
            city: 'Pune',
          },
        },
      },
      update: { name: user.name, role: user.role },
    });
  }

  console.log(`  Demo users seeded with password: ${password}`);
}

async function main() {
  console.log('Seeding database...');

  console.log('- streams');
  const streamRecords = await seedStreams();
  const streamIds = new Map(streamRecords.map((s) => [s.code as string, s.id]));

  console.log('- courses');
  await seedCourses(streamIds);

  console.log('- careers');
  await seedCareers();

  console.log('- course to career links');
  await seedCourseCareerLinks();

  console.log('- colleges');
  await seedColleges();

  console.log('- scholarships');
  await seedScholarships();

  console.log('- timeline events');
  await seedTimelineEvents();

  console.log('- quiz');
  await seedQuiz();

  console.log('- faqs');
  await seedFaqs();

  console.log('- users');
  await seedUsers();

  const counts = {
    streams: await prisma.stream.count(),
    courses: await prisma.course.count(),
    careers: await prisma.career.count(),
    colleges: await prisma.college.count(),
    scholarships: await prisma.scholarship.count(),
    timelineEvents: await prisma.timelineEvent.count(),
    quizQuestions: await prisma.quizQuestion.count(),
    faqs: await prisma.faq.count(),
  };

  console.log('\nSeed complete:', counts);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
