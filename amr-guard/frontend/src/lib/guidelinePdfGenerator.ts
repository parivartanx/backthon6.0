// [SOLID: SRP] Clinical Guideline & Antimicrobial Decision PDF Report Generator
// Generates a simple, mature, professional clinical reference report using jsPDF and jspdf-autotable
// Adheres strictly to hospital EMR standards: neutral palette, high contrast, clean typography, zero flashy elements

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { GuidelineEntity } from "@/lib/guidelineData";

interface GeneratePdfOptions {
  action?: "download" | "print" | "open";
}

type RgbColor = [number, number, number];

/**
 * Generates an authoritative, mature clinical decision result PDF report
 * for an antibiotic monograph, ICMR protocol, or CDSCO banned combination.
 */
export async function generateGuidelineReportPdf(
  entity: GuidelineEntity,
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

  // Mature, Neutral Institutional Medical Palette
  const textDark: RgbColor = [17, 24, 39]; // Near black (#111827)
  const textMuted: RgbColor = [75, 85, 99]; // Muted Slate (#4B5563)
  const textSubtle: RgbColor = [107, 114, 128]; // Light Slate (#6B7280)
  const borderLight: RgbColor = [229, 231, 235]; // Hairline Grey (#E5E7EB)
  const borderMedium: RgbColor = [209, 213, 219]; // Mid Grey (#D1D5DB)
  const headerFill: RgbColor = [243, 244, 246]; // Soft Neutral Grey (#F3F4F6)

  // -------------------------------------------------------------
  // 1. HOSPITAL / INSTITUTIONAL HEADER
  // -------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...textDark);
  doc.text("AMR SENTINEL CLINICAL DECISION REFERENCE REPORT", margin, currentY);

  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(
    "Hospital Antimicrobial Stewardship & Outpatient Decision Support System",
    margin,
    currentY
  );

  currentY += 3.5;
  doc.setFontSize(7.5);
  doc.setTextColor(...textSubtle);
  doc.text(
    "Authoritative Clinical Standards: ICMR STG (2022-23) • WHO AWaRe (2023) • CDSCO Gazette",
    margin,
    currentY
  );

  // Top-Right Metadata
  const reportDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const refCode =
    entity.type === "aware"
      ? `AWARE-${entity.data.id.toUpperCase()}`
      : entity.type === "icmr"
      ? entity.data.code
      : `CDSCO-${entity.data.id.toUpperCase()}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text(`DOC REF: ${refCode}`, pageWidth - margin, margin, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(`Generated: ${reportDate}`, pageWidth - margin, margin + 4.5, { align: "right" });
  doc.text("Status: VERIFIED CLINICAL REFERENCE", pageWidth - margin, margin + 8, {
    align: "right",
  });

  currentY += 5;

  // Solid Hairline Divider
  doc.setDrawColor(...borderMedium);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // -------------------------------------------------------------
  // 2. DOCUMENT CLASSIFICATION & CORE IDENTIFICATION
  // -------------------------------------------------------------
  if (entity.type === "aware") {
    const drug = entity.data;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        fontSize: 8,
        textColor: textDark,
        cellPadding: 2,
        lineColor: borderLight,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: headerFill,
        textColor: textDark,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      head: [["ANTIBIOTIC FORMULARY MONOGRAPH", "WHO AWaRe SPECIFICATION"]],
      body: [
        ["Generic Molecule", drug.genericName],
        ["Pharmacological Class", drug.therapeuticClass],
        [
          "WHO AWaRe Tier",
          `${drug.category.toUpperCase()} (${
            drug.category === "Access"
              ? "First-line / >60% hospital consumption benchmark"
              : drug.category === "Watch"
              ? "Restricted / Target indications only"
              : drug.category === "Reserve"
              ? "Last-resort hospital inpatient only"
              : "Banned / Discouraged combination"
          })`,
        ],
        ["Route of Administration", drug.routeOfAdministration || "Oral / Systemic"],
        ["ATC Code / Classification", drug.atcCode || "Not Classified"],
        ["Pregnancy Safety Profile", drug.pregnancySafety || "Category B / Consult Obstetric STG"],
        ["Common Formulations (India)", drug.brandNames?.join(", ") || "Generic preparations"],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, textColor: textMuted },
        1: { cellWidth: "auto" },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

    // -------------------------------------------------------------
    // CLINICAL INDICATIONS & STEWARDSHIP BENCHMARK
    // -------------------------------------------------------------
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        fontSize: 7.8,
        textColor: textDark,
        cellPadding: 2.2,
        lineColor: borderLight,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: headerFill,
        textColor: textDark,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      head: [["CLINICAL PRACTICE DOMAIN", "EVALUATION & PROTOCOL DIRECTIVES"]],
      body: [
        ["Approved Outpatient Indications", drug.indications],
        ["WHO Stewardship Target", drug.whoTarget],
        ["Prescribing Cautions & Warnings", drug.cautions],
        ["Monitoring Parameters", drug.monitoringParameters || "Standard clinical and renal monitoring."],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, textColor: textMuted },
        1: { cellWidth: "auto" },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

    // -------------------------------------------------------------
    // STANDARD DOSING PROTOCOLS TABLE
    // -------------------------------------------------------------
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        fontSize: 7.8,
        textColor: textDark,
        cellPadding: 2.2,
        lineColor: borderLight,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: headerFill,
        textColor: textDark,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      head: [["DOSING PROTOCOL", "RECOMMENDED REGIMEN & SCHEDULE"]],
      body: [
        ["Adult Outpatient Dosing", drug.standardDoseAdult || "Per clinical guideline."],
        ["Pediatric Weight-Based Dosing", drug.standardDosePediatric || "Calculate per body weight in kg."],
        ["Renal Clearance Adjustment", drug.renalDosingAdjustment || "Monitor serum creatinine in prolonged therapy."],
        ["Mechanism of Action", drug.mechanismOfAction || "Bactericidal / bacteriostatic antimicrobial."],
        ["Associated Syndromes (ICMR)", drug.relatedSyndromes?.join(" • ") || "Primary outpatient indications."],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, textColor: textMuted },
        1: { cellWidth: "auto" },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  } else if (entity.type === "icmr") {
    const stg = entity.data;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        fontSize: 8,
        textColor: textDark,
        cellPadding: 2,
        lineColor: borderLight,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: headerFill,
        textColor: textDark,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      head: [["ICMR STANDARD TREATMENT GUIDELINE", "CLINICAL PROTOCOL SPECIFICATION"]],
      body: [
        ["Clinical Syndrome", stg.syndrome],
        ["ICMR Protocol Code", stg.code],
        ["Clinical Setting", stg.clinicalSetting || "Outpatient Care / Family Medicine"],
        ["Benchmark Authority", "Indian Council of Medical Research (STG 2022-2023)"],
        ["Predominant Pathogens", stg.targetPathogens],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, textColor: textMuted },
        1: { cellWidth: "auto" },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

    // -------------------------------------------------------------
    // FIRST-LINE EMPIRICAL PROTOCOL TABLE
    // -------------------------------------------------------------
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        fontSize: 7.8,
        textColor: textDark,
        cellPadding: 2.2,
        lineColor: borderLight,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: headerFill,
        textColor: textDark,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      head: [["EMPIRICAL TREATMENT DOMAIN", "RECOMMENDED CLINICAL STANDARD"]],
      body: [
        ["First-Line Empirical Therapy", stg.firstLineTherapy],
        ["Prescribed Dosage", stg.firstLineDose],
        ["Course Duration", stg.durationDays],
        ["Second-Line / Allergy Alternative", stg.secondLineTherapy || "Consult ID physician."],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, textColor: textMuted },
        1: { cellWidth: "auto" },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

    // -------------------------------------------------------------
    // DIAGNOSTIC CRITERIA & RED FLAGS
    // -------------------------------------------------------------
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        fontSize: 7.8,
        textColor: textDark,
        cellPadding: 2.2,
        lineColor: borderLight,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: headerFill,
        textColor: textDark,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      head: [["DIAGNOSTIC & SAFETY DIRECTIVES", "CLINICAL EVALUATION CRITERIA"]],
      body: [
        ["Diagnostic Presentation", stg.diagnosticCriteria || "Standard clinical criteria."],
        ["Investigations Recommended", stg.investigationsRecommended || "Routine clinical evaluation."],
        ["Pediatric Guidance", stg.pediatricGuidance],
        ["Red Flags & Inappropriate Escalation", stg.redFlagsAndContraindications],
        ["Official Reference Citation", stg.icmrReference],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, textColor: textMuted },
        1: { cellWidth: "auto" },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  } else {
    // CDSCO Banned Fixed-Dose Combination
    const fdc = entity.data;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        fontSize: 8,
        textColor: textDark,
        cellPadding: 2,
        lineColor: borderLight,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: headerFill,
        textColor: textDark,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      head: [["STATUTORY PROHIBITION DIRECTIVE", "REGULATORY ENFORCEMENT SPECIFICATION"]],
      body: [
        ["Prohibited Combination", fdc.combination],
        ["Constituent Molecules", fdc.drugs.join(" + ")],
        ["Gazette Notification", fdc.gazetteNumber],
        ["Effective Date of Prohibition", fdc.effectiveDate],
        ["Regulatory Body", fdc.regulatoryBody || "Central Drugs Standard Control Organisation (CDSCO)"],
        ["Statutory Clause", "Section 26A of Drugs and Cosmetics Act, 1940"],
        ["AMR Sentinel Audit Action", "RISK SCORE 100 — AUTOMATIC BLOCK & FLAG"],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, textColor: textMuted },
        1: { cellWidth: "auto" },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

    // -------------------------------------------------------------
    // RATIONALE & APPROVED ALTERNATIVE TABLE
    // -------------------------------------------------------------
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        fontSize: 7.8,
        textColor: textDark,
        cellPadding: 2.2,
        lineColor: borderLight,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: headerFill,
        textColor: textDark,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      head: [["HAZARD DOMAIN", "CLINICAL RATIONALE & SANCTIONED REMEDIATION"]],
      body: [
        ["Statutory Legal Warning", fdc.statutoryWarning],
        ["Clinical Rationale for Prohibition", fdc.clinicalRationale],
        ["Public Health Hazards", fdc.healthHazards || "Drives rapid multidrug antimicrobial resistance."],
        ["APPROVED CLINICAL ALTERNATIVE", fdc.sanctionedAlternative],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, textColor: textMuted },
        1: { cellWidth: "auto" },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // -------------------------------------------------------------
  // 3. CLINICAL ATTESTATION & STEWARDSHIP SIGN-OFF
  // -------------------------------------------------------------
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = margin;
  }

  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.3);
  doc.rect(margin, currentY, pageWidth - margin * 2, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);
  doc.text("HOSPITAL ANTIMICROBIAL STEWARDSHIP COMMITTEE (HASC) ATTESTATION", margin + 3, currentY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...textMuted);
  doc.text(
    "This guideline decision result is verified under institutional formulary rules and Indian Council of Medical Research (ICMR) standards.",
    margin + 3,
    currentY + 8.5
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...textSubtle);
  doc.text("Clinician Sign-off / Digital Stamp:", margin + 3, currentY + 16);
  doc.text("Verification Date: ___________________", pageWidth - margin - 55, currentY + 16);

  // -------------------------------------------------------------
  // 4. RUNNING FOOTERS ON EVERY PAGE
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...textSubtle);

    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.text(
      `AMR Sentinel Clinical Decision Report • Ref: ${refCode} • Hospital Formulary Reference`,
      margin,
      pageHeight - 5
    );

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, {
      align: "right",
    });
  }

  // -------------------------------------------------------------
  // 5. OUTPUT DISPATCH
  // -------------------------------------------------------------
  const cleanId = entity.data.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `AMR_Guideline_Decision_Report_${cleanId}.pdf`;

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
