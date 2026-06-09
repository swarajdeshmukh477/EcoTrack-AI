import { jsPDF } from "jspdf";
import { formatSustainabilityRating } from "@/features/carbon/carbon-engine";
import { formatCarbon } from "@/lib/format";
import type { CarbonReport } from "./report.types";

type PdfLine = {
  text: string;
  size: number;
  bold?: boolean;
};

const margin = 16;
const pageWidth = 210;
const pageHeight = 297;

export function createReportPdfBlob(report: CarbonReport) {
  return createReportPdfDocument(report).output("blob");
}

export function createReportPdfDocument(report: CarbonReport) {
  const document = new jsPDF({
    format: "a4",
    orientation: "portrait",
    unit: "mm",
  });

  document.setProperties({
    title: "EcoTrack AI Sustainability Report",
    subject: "Personal carbon footprint report generated from EcoTrack AI user data.",
    creator: "EcoTrack AI",
  });

  renderLines(document, buildReportLines(report));

  return document;
}

export function buildReportFileName(report: CarbonReport) {
  return `ecotrack-report-${report.generatedAt.slice(0, 10)}.pdf`;
}

function buildReportLines(report: CarbonReport): PdfLine[] {
  return [
    { text: "EcoTrack AI Sustainability Report", size: 20, bold: true },
    { text: `Report Generation Date: ${new Date(report.generatedAt).toLocaleString()}`, size: 10 },
    { text: "", size: 8 },
    { text: "Carbon Score", size: 14, bold: true },
    { text: `${report.score.value}/100`, size: 12, bold: true },
    { text: `Annualized emissions: ${formatCarbon(report.score.annualizedKg)}`, size: 10 },
    { text: "", size: 8 },
    { text: "Sustainability Rating", size: 14, bold: true },
    { text: formatSustainabilityRating(report.score.rating), size: 12, bold: true },
    { text: "The rating is calculated from logged activity emissions stored locally in EcoTrack AI.", size: 10 },
    { text: "", size: 8 },
    { text: "Carbon Twin Profile", size: 14, bold: true },
    { text: report.twin.identity, size: 12, bold: true },
    { text: report.twin.profile, size: 10 },
    { text: `Dominant category: ${formatCategory(report.twin.dominantCategory)}`, size: 10 },
    { text: "Strengths", size: 11, bold: true },
    ...toBullets(report.twin.strengths),
    { text: "Weaknesses", size: 11, bold: true },
    ...toBullets(report.twin.weaknesses),
    { text: "Improvement Opportunities", size: 11, bold: true },
    ...toBullets(report.twin.opportunities),
    { text: "", size: 8 },
    { text: "Emission Breakdown", size: 14, bold: true },
    ...report.breakdown.map((item) => ({
      text: `${formatCategory(item.category)}: ${formatCarbon(item.co2eKg)} (${item.percentage.toFixed(1)}%)`,
      size: 10,
    })),
    { text: "", size: 8 },
    { text: "Personalized Recommendations", size: 14, bold: true },
    ...report.recommendations.flatMap((item) => [
      { text: item.title, size: 11, bold: true },
      { text: `${item.detail} Estimated impact: ${formatCarbon(item.estimatedImpactKg)}.`, size: 10 },
    ]),
    { text: "", size: 8 },
    { text: "Weekly Sustainability Plan", size: 14, bold: true },
    ...report.weeklyPlan.map((item) => ({
      text: `${item.day}: ${item.task} ${item.reason}`,
      size: 10,
    })),
    { text: "", size: 8 },
    { text: "Future Impact Summary", size: 14, bold: true },
    { text: `Data source: ${report.futureImpact.dataSource === "activity_logs" ? "Activity logs" : "Profile"}`, size: 10 },
    { text: `Current emissions: ${formatCarbon(report.futureImpact.currentAnnualKg)}`, size: 10 },
    { text: `Future emissions: ${formatCarbon(report.futureImpact.futureAnnualKg)}`, size: 10 },
    { text: `Reduction percentage: ${report.futureImpact.reductionPercent.toFixed(1)}%`, size: 10 },
    { text: `Annual savings: ${formatCarbon(report.futureImpact.annualSavingsKg)}`, size: 10 },
  ];
}

function renderLines(document: jsPDF, lines: PdfLine[]) {
  let y = margin;
  const contentWidth = pageWidth - margin * 2;

  for (const line of lines) {
    if (!line.text) {
      y += 4;
      continue;
    }

    document.setFont("helvetica", line.bold ? "bold" : "normal");
    document.setFontSize(line.size);

    const wrappedLines = document.splitTextToSize(line.text, contentWidth) as string[];
    const lineHeight = Math.max(5, line.size * 0.42);

    for (const wrappedLine of wrappedLines) {
      if (y > pageHeight - margin) {
        document.addPage();
        y = margin;
      }

      document.text(wrappedLine, margin, y);
      y += lineHeight;
    }
  }
}

function toBullets(items: string[]): PdfLine[] {
  if (items.length === 0) {
    return [{ text: "- More data is needed for this section.", size: 10 }];
  }

  return items.map((item) => ({ text: `- ${item}`, size: 10 }));
}

function formatCategory(value: string) {
  const labels: Record<string, string> = {
    food: "Food",
    home: "Electricity",
    shopping: "Shopping",
    transport: "Transportation",
    waste: "Waste",
  };

  return labels[value] ?? `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
