"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { buildCarbonReport } from "@/features/report/report-builder";
import { buildReportFileName, createReportPdfBlob } from "@/features/report/pdf-generator";
import { useEcoTrack } from "@/state/ecotrack-state";

type DownloadStatus = "idle" | "generating" | "success" | "error";

export function ReportDownloadPanel() {
  const { activities, profile } = useEcoTrack();
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const report = buildCarbonReport(profile, activities);

  if (!report) {
    return (
      <EmptyState
        title="Generate a report from your carbon profile"
        description="The report summarizes your score, breakdown, Carbon Twin, recommendations, and weekly plan. Log one activity to unlock a complete downloadable report."
      />
    );
  }

  function downloadReport() {
    if (!report) {
      return;
    }

    try {
      flushSync(() => {
        setDownloadStatus("generating");
        setMessage("Generating Report...");
      });

      const blob = createReportPdfBlob(report);

      if (blob.size === 0) {
        throw new Error("Generated PDF is empty.");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildReportFileName(report);
      link.rel = "noopener";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);

      setDownloadStatus("success");
      setMessage("Report downloaded successfully");
    } catch {
      setDownloadStatus("error");
      setMessage("Report download failed. Please try again.");
    }
  }

  const isGenerating = downloadStatus === "generating";

  return (
    <section className="space-y-3" aria-label="Download carbon report">
      <p className="text-sm text-muted-foreground">
        Download a professional PDF generated from your current carbon score, category breakdown, carbon twin,
        recommendations, weekly plan, and future impact summary.
      </p>
      <Button
        aria-busy={isGenerating}
        aria-describedby={message ? "report-download-status" : undefined}
        aria-label={isGenerating ? "Generating sustainability report" : "Download Sustainability Report"}
        className="w-full sm:w-auto"
        disabled={isGenerating}
        type="button"
        onClick={downloadReport}
      >
        <Download aria-hidden="true" className="h-4 w-4" />
        {isGenerating ? "Generating Report..." : "Download Sustainability Report"}
      </Button>
      {message ? (
        <p
          className={downloadStatus === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
          id="report-download-status"
          role={downloadStatus === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
