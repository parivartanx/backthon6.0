// [SOLID: SRP] Clinical PDF Report Generator using jsPDF and jspdf-autotable
// Generates a simple, mature, professional medical audit report
// Adheres strictly to hospital EMR standards: neutral palette, high contrast, clean typography, zero flashy elements

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PrescriptionCase } from "@/types/prescription";

interface GeneratePdfOptions {
  action?: "download" | "print" | "open";
}

type RgbColor = [number, number, number];

/**
 * Generates a clean, mature, publication-ready clinical audit PDF report.
 * Styled like a formal hospital laboratory / EMR stewardship record.
 */
export async function generatePrescriptionReportPdf(
  prescriptionCase: PrescriptionCase,
  options: GeneratePdfOptions = { action: "open" }
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  // Mature, Neutral Medical Document Palette (Strictly Greyscale / High-Contrast Slate)
  const textDark: RgbColor = [17, 24, 39]; // Near black (#111827)
  const textMuted: RgbColor = [75, 85, 99]; // Muted Slate (#4B5563)
  const textSubtle: RgbColor = [107, 114, 128]; // Light Slate (#6B7280)
  const borderLight: RgbColor = [229, 231, 235]; // Hairline Grey (#E5E7EB)
  const borderMedium: RgbColor = [209, 213, 219]; // Mid Grey (#D1D5DB)
  const headerFill: RgbColor = [243, 244, 246]; // Soft Neutral Grey (#F3F4F6)

  // -------------------------------------------------------------
  // 1. HOSPITAL / INSTITUTIONAL HEADER (Clean, Formal, Dignified)
  // -------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...textDark);
  doc.text("AMR SENTINEL PRESCRIPTION SAFETY REPORT", margin, currentY);

  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(
    "Antibiotic Safety & Prescription Decision Support",
    margin,
    currentY
  );

  currentY += 3.5;
  doc.setFontSize(7.5);
  doc.setTextColor(...textSubtle);
  doc.text(
    "Standard Treatment Protocols: ICMR STG (2022) & WHO AWaRe Framework",
    margin,
    currentY
  );

  // Metadata Block (Top Right)
  const reportDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  doc.text(`CASE REF: ${prescriptionCase.id}`, pageWidth - margin, margin, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(`Date: ${reportDate}`, pageWidth - margin, margin + 4.5, { align: "right" });
  doc.text(
    `Status: ${prescriptionCase.workflowStatus.toUpperCase()}`,
    pageWidth - margin,
    margin + 8,
    { align: "right" }
  );

  currentY += 5;

  // Solid Hairline Divider
  doc.setDrawColor(...borderMedium);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // -------------------------------------------------------------
  // 2. AUDIT EVALUATION SUMMARY (Clean & Mature Table)
  // -------------------------------------------------------------
  const audit = prescriptionCase.auditResult;

  if (audit) {
    const statusText =
      audit.status === "APPROVED"
        ? "APPROVED (Guideline Compliant)"
        : audit.status === "BLOCKED"
        ? "BLOCKED (Contraindication Detected)"
        : "FLAGGED (Clinical Review Needed)";

    const penalties = audit.penalties;
    const flaggedItems: string[] = [];
    if (penalties?.p_class) flaggedItems.push("Drug Class");
    if (penalties?.p_duration) flaggedItems.push("Treatment Duration");
    if (penalties?.p_indication) flaggedItems.push("Clinical Indication");
    const reviewPoints = flaggedItems.length > 0 ? flaggedItems.join(", ") : "Standard Checks Passed";

    const auditSummaryData = [
      [
        { content: "Safety Decision:", styles: { fontStyle: "bold" as const, textColor: textMuted } },
        { content: statusText, styles: { fontStyle: "bold" as const, textColor: textDark } },
        { content: "Safety Risk Score:", styles: { fontStyle: "bold" as const, textColor: textMuted } },
        { content: `${audit.score} / 100 (Band: ${audit.band})`, styles: { fontStyle: "bold" as const, textColor: textDark } },
      ],
      [
        { content: "Care Setting:", styles: { fontStyle: "bold" as const, textColor: textMuted } },
        { content: prescriptionCase.patient.is_outpatient !== false ? "Outpatient (OPD)" : "Inpatient", styles: { textColor: textDark } },
        { content: "Review Factors:", styles: { fontStyle: "bold" as const, textColor: textMuted } },
        { content: reviewPoints, styles: { textColor: textDark } },
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "grid",
      tableWidth: pageWidth - margin * 2,
      body: auditSummaryData,
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        lineColor: borderLight,
        lineWidth: 0.25,
      },
      columnStyles: {
        0: { cellWidth: 34, fillColor: headerFill },
        1: { cellWidth: 56 },
        2: { cellWidth: 36, fillColor: headerFill },
        3: { cellWidth: 54 },
      },
    });

    // @ts-expect-error lastAutoTable injected by jspdf-autotable
    currentY = doc.lastAutoTable.finalY + 5;
  }

  // -------------------------------------------------------------
  // 3. PATIENT CONTEXT & CLINICAL VIGILANCE PARAMETERS
  // -------------------------------------------------------------
  const p = prescriptionCase.patient;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  doc.text("PATIENT DEMOGRAPHICS & CLINICAL PARAMETERS", margin, currentY);
  currentY += 2;

  const patientDetails = [
    [
      { content: "Patient Name", styles: { fontStyle: "bold" as const } },
      p.patientName || "—",
      { content: "Age / Sex", styles: { fontStyle: "bold" as const } },
      `${p.age || "—"} yrs / ${p.sex}`,
    ],
    [
      { content: "Pregnancy Status", styles: { fontStyle: "bold" as const } },
      p.pregnancyStatus || "Not recorded",
      { content: "Renal Function", styles: { fontStyle: "bold" as const } },
      p.egfr ? `${p.egfr} mL/min (eGFR)` : "Normal / Not recorded",
    ],
    [
      { content: "Culture Report", styles: { fontStyle: "bold" as const } },
      p.has_culture_report ? "Available" : "Empiric Care (No culture)",
      { content: "Known Allergies", styles: { fontStyle: "bold" as const } },
      p.allergies || "None reported",
    ],
    [
      { content: "Symptoms & Diagnosis", styles: { fontStyle: "bold" as const } },
      {
        content: `${p.symptoms || "—"}${p.suspectedDiagnosis ? ` (${p.suspectedDiagnosis})` : ""}`,
        colSpan: 3,
      },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "grid",
    tableWidth: pageWidth - margin * 2,
    body: patientDetails,
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: textDark,
      lineColor: borderLight,
      lineWidth: 0.25,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 34, fillColor: headerFill, textColor: textMuted },
      1: { cellWidth: 56 },
      2: { cellWidth: 36, fillColor: headerFill, textColor: textMuted },
      3: { cellWidth: 54 },
    },
  });

  // @ts-expect-error lastAutoTable injected by jspdf-autotable
  currentY = doc.lastAutoTable.finalY + 6;

  // -------------------------------------------------------------
  // 4. PRESCRIBED MEDICATION REGIMEN
  // -------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  doc.text("PRESCRIBED MEDICATION REGIMEN", margin, currentY);
  currentY += 2;

  const medicineRows = prescriptionCase.medicines.map((m, idx) => [
    (idx + 1).toString(),
    m.brandName || "—",
    m.genericName || "—",
    m.aware_tier ? m.aware_tier.toUpperCase() : "UNCLASSIFIED",
    `${m.dose || "—"}${m.route ? ` (${m.route})` : ""}`,
    m.frequency || "—",
    m.duration ? `${m.duration}` : "—",
    m.verificationStatus,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["#", "Brand Name", "Generic Molecule", "AWaRe Tier", "Dose & Route", "Frequency", "Duration", "Status"]],
    body: medicineRows.length > 0 ? medicineRows : [["—", "No medications recorded", "—", "—", "—", "—", "—", "—"]],
    theme: "grid",
    headStyles: {
      fillColor: headerFill,
      textColor: textDark,
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 2.2,
      lineColor: borderMedium,
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: textDark,
      lineColor: borderLight,
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center", textColor: textMuted },
      1: { cellWidth: 30, fontStyle: "bold" },
      2: { cellWidth: 36 },
      3: { cellWidth: 24, fontStyle: "bold" },
      4: { cellWidth: 26 },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
      7: { cellWidth: 20, textColor: textMuted },
    },
  });

  // @ts-expect-error lastAutoTable injected by jspdf-autotable
  currentY = doc.lastAutoTable.finalY + 6;

  // -------------------------------------------------------------
  // 5. STEWARDSHIP FLAGS & COMPLIANCE FINDINGS
  // -------------------------------------------------------------
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  doc.text("PRESCRIPTION SAFETY FINDINGS & RECOMMENDATIONS", margin, currentY);
  currentY += 2;

  if (!audit || audit.flags.length === 0) {
    // Mature, simple note (no catchy colored card)
    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, currentY, pageWidth - margin * 2, 9, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text(
      "No rule violations identified. Prescribed regimen conforms with first-line ICMR Standard Treatment Guidelines.",
      margin + 3,
      currentY + 5.5
    );
    currentY += 14;
  } else {
    const flagRows = audit.flags.map((flag) => [
      `Tier ${flag.tier || "—"} (${flag.rule_id || "RULE"})`,
      flag.severity ? flag.severity.toUpperCase() : "FLAG",
      flag.drug || "General Regimen",
      flag.rationale || "Guideline divergence detected",
      flag.citation || "ICMR STG / WHO AWaRe",
      `-${flag.penalty_score || 0}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [["Tier / Code", "Severity", "Target Drug", "Clinical Mechanism & Observation", "Guideline Citation", "Penalty"]],
      body: flagRows,
      theme: "grid",
      headStyles: {
        fillColor: headerFill,
        textColor: textDark,
        fontSize: 7.5,
        fontStyle: "bold",
        cellPadding: 2,
        lineColor: borderMedium,
        lineWidth: 0.3,
      },
      bodyStyles: {
        fontSize: 7.2,
        cellPadding: 2,
        textColor: textDark,
        lineColor: borderLight,
        lineWidth: 0.25,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: "bold" },
        1: { cellWidth: 18, fontStyle: "bold" },
        2: { cellWidth: 28 },
        3: { cellWidth: 58 },
        4: { cellWidth: 36, textColor: textMuted },
        5: { cellWidth: 14, halign: "center", fontStyle: "bold" },
      },
    });

    // @ts-expect-error lastAutoTable injected by jspdf-autotable
    currentY = doc.lastAutoTable.finalY + 6;
  }

  // -------------------------------------------------------------
  // 6. CLINICAL REMEDIATION ADVISORY (if present)
  // -------------------------------------------------------------
  if (audit && audit.remediation_options && audit.remediation_options.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text("RECOMMENDED CLINICAL REMEDIATION ADVISORY", margin, currentY);
    currentY += 2;

    const remediationRows = audit.remediation_options.map((opt) => [
      opt.recommendation_type.replace(/_/g, " "),
      opt.suggested_drug
        ? `${opt.suggested_drug} ${opt.suggested_duration_days ? `(${opt.suggested_duration_days}d)` : ""}`
        : "—",
      opt.guidance,
      opt.source_citation || "ICMR STG",
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [["Action Type", "Suggested Regimen", "Clinical Guidance", "Guideline Reference"]],
      body: remediationRows,
      theme: "grid",
      headStyles: {
        fillColor: headerFill,
        textColor: textDark,
        fontSize: 7.5,
        fontStyle: "bold",
        cellPadding: 2,
        lineColor: borderMedium,
        lineWidth: 0.3,
      },
      bodyStyles: {
        fontSize: 7.2,
        cellPadding: 2,
        textColor: textDark,
        lineColor: borderLight,
        lineWidth: 0.25,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: "bold" },
        1: { cellWidth: 36 },
        2: { cellWidth: 76 },
        3: { cellWidth: 36, textColor: textMuted },
      },
    });

    // @ts-expect-error lastAutoTable injected by jspdf-autotable
    currentY = doc.lastAutoTable.finalY + 6;
  }

  // -------------------------------------------------------------
  // 7. INSTITUTIONAL DISCLAIMER & PHYSICIAN SIGN-OFF
  // -------------------------------------------------------------
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = margin;
  }

  // Disclaimer text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...textSubtle);
  const disclaimer =
    "NOTICE: This document is an automated clinical decision support safety evaluation generated in accordance with ICMR Standard Treatment Guidelines and WHO AWaRe safety guidelines. It is intended for authorized healthcare providers to support clinical decision-making. Prescribing and diagnostic responsibility remains with the attending physician.";
  doc.text(doc.splitTextToSize(disclaimer, pageWidth - margin * 2), margin, currentY);

  currentY += 12;

  // Clean physician sign-off lines
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);
  doc.text("Attending Physician: ____________________________________", margin, currentY);
  doc.text("Signature: __________________________", pageWidth - margin - 65, currentY);

  currentY += 5;
  doc.text("Registration / Medical Council No: ______________________", margin, currentY);
  doc.text("Date: _______________________________", pageWidth - margin - 65, currentY);

  // -------------------------------------------------------------
  // 8. UNIFORM RUNNING FOOTER ON ALL PAGES
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...textSubtle);

    // Hairline bottom divider
    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.text(
      `AMR Sentinel Prescription Safety Report • Case Ref: ${prescriptionCase.id} • Confidential Medical Record`,
      margin,
      pageHeight - 5
    );

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, {
      align: "right",
    });
  }

  // -------------------------------------------------------------
  // 9. OUTPUT DISPATCH
  // -------------------------------------------------------------
  const fileName = `AMR_Prescription_Safety_${prescriptionCase.id || "Case"}.pdf`;

  if (options.action === "download") {
    doc.save(fileName);
  } else if (options.action === "print") {
    doc.autoPrint();
    const blobUrl = doc.output("bloburl");
    const printWindow = window.open(blobUrl, "_blank");
    if (!printWindow) {
      doc.save(fileName);
    }
  } else {
    const blobUrl = doc.output("bloburl");
    const newWindow = window.open(blobUrl, "_blank");
    if (!newWindow) {
      doc.save(fileName);
    }
  }

  return doc;
}
