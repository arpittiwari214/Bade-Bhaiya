import { formatDate } from './format';

interface ReportInput {
  streamLabel: string;
  percentages: { label: string; value: number }[];
  completedAt: string | null;
}

/**
 * Generates the downloadable career report. jsPDF is imported dynamically so
 * the library (roughly 350 KB) is fetched only when a user actually asks for a
 * PDF, rather than shipping in the results-page chunk.
 */
export async function downloadCareerReport(input: ReportInput): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const marginX = 56;
  let y = 72;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Bade Bhaiya', marginX, y);

  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text('Aptitude and interest report', marginX, y);

  y += 40;
  doc.setTextColor(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Recommended stream', marginX, y);

  y += 24;
  doc.setFontSize(20);
  doc.setTextColor(30, 64, 175);
  doc.text(input.streamLabel, marginX, y);

  y += 40;
  doc.setTextColor(20);
  doc.setFontSize(13);
  doc.text('How each stream scored', marginX, y);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const barWidth = 240;

  for (const row of input.percentages) {
    y += 24;

    doc.setTextColor(40);
    doc.text(row.label, marginX, y);

    // Track, then filled portion, so the ranking reads at a glance in print.
    doc.setFillColor(226, 232, 240);
    doc.rect(marginX + 160, y - 9, barWidth, 10, 'F');

    doc.setFillColor(37, 99, 235);
    doc.rect(marginX + 160, y - 9, (barWidth * Math.max(0, Math.min(100, row.value))) / 100, 10, 'F');

    doc.setTextColor(80);
    doc.text(`${row.value}%`, marginX + 160 + barWidth + 12, y);
  }

  y += 48;
  doc.setTextColor(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('What to do next', marginX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60);

  const steps = [
    '1. Open your roadmap on Bade Bhaiya and work through the steps in order.',
    `2. Shortlist three ${input.streamLabel} courses and check what each one leads to.`,
    '3. Filter government colleges by your district and note their cutoffs.',
    '4. Check scholarship deadlines early. Most close before admissions do.',
  ];

  for (const step of steps) {
    y += 20;
    doc.text(step, marginX, y);
  }

  y += 44;
  doc.setFontSize(9);
  doc.setTextColor(130);

  const disclaimer = doc.splitTextToSize(
    'This report reflects your answers to a short interest and aptitude questionnaire. It is a starting point for a conversation, not an assessment of ability. Always confirm course eligibility, fees and deadlines with the college or the official government portal.',
    doc.internal.pageSize.getWidth() - marginX * 2,
  );
  doc.text(disclaimer, marginX, y);

  y += disclaimer.length * 12 + 14;
  doc.text(`Generated ${formatDate(new Date())}`, marginX, y);
  if (input.completedAt) {
    doc.text(`Quiz completed ${formatDate(input.completedAt)}`, marginX, y + 12);
  }

  doc.save('bade-bhaiya-career-report.pdf');
}
