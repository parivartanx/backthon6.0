// [SOLID: SRP] Deterministic realistic outpatient OPD cases for clinical simulation
import { PrescriptionCase } from "@/types/prescription";

export interface ClinicalSamplePreset {
  id: string;
  title: string;
  category: string;
  description: string;
  sourceText: string;
  data: PrescriptionCase;
}

export const CLINICAL_SAMPLE_PRESETS: ClinicalSamplePreset[] = [
  {
    id: "sample-uri-01",
    title: "Acute Bronchitis & Cough (Adult OPD)",
    category: "Respiratory",
    description: "Standard outpatient prescription with high-potency cephalosporin and macrolide.",
    sourceText: `Rx - Outpatient Clinic Slip
Patient: Rahul Verma, 34M
Diagnosis: Acute Purulent Bronchitis / Viral URI with secondary bacterial concern
Symptoms: Persistent productive cough (yellowish sputum), low-grade fever for 4 days, mild retrosternal chest discomfort. No prior drug allergies.

Prescription:
1. Tab. Taxim-O (Cefixime) 200 mg - 1 tab PO BD x 5 days
2. Tab. Azithral (Azithromycin) 500 mg - 1 tab PO OD x 3 days
3. Tab. Dolo (Paracetamol) 650 mg - 1 tab PO SOS (Max 3/day) x 3 days
4. Tab. Cetzine (Cetirizine) 10 mg - 1 tab PO HS x 5 days`,
    data: {
      id: "CASE-2026-0891",
      sourceType: "manual",
      sourceText: `Rx - Outpatient Clinic Slip\nPatient: Rahul Verma, 34M\nDiagnosis: Acute Purulent Bronchitis\nSymptoms: Persistent productive cough (yellowish sputum), fever 4 days.\n\n1. Tab. Taxim-O (Cefixime) 200 mg - 1 tab PO BD x 5 days\n2. Tab. Azithral (Azithromycin) 500 mg - 1 tab PO OD x 3 days\n3. Tab. Dolo (Paracetamol) 650 mg - 1 tab PO SOS x 3 days\n4. Tab. Cetzine (Cetirizine) 10 mg - 1 tab PO HS x 5 days`,
      patient: {
        caseId: "CASE-2026-0891",
        patientName: "Rahul Verma",
        age: 34,
        sex: "Male",
        pregnancyStatus: "Not applicable",
        allergies: "No known drug allergies (NKDA)",
        symptoms: "Productive cough with purulent sputum x 4 days, low grade fever (100.2 F), sore throat",
        medicalHistory: "Mild seasonal asthma; no hospitalizations in past 2 years",
        suspectedDiagnosis: "Acute Purulent Bronchitis",
      },
      medicines: [
        {
          id: "med-1",
          brandName: "Taxim-O",
          genericName: "Cefixime",
          strength: "200 mg",
          dose: "1 tablet (200 mg)",
          route: "Oral",
          frequency: "Twice daily (BD)",
          duration: "5 days",
          verificationStatus: "Verified",
        },
        {
          id: "med-2",
          brandName: "Azithral",
          genericName: "Azithromycin",
          strength: "500 mg",
          dose: "1 tablet (500 mg)",
          route: "Oral",
          frequency: "Once daily (OD)",
          duration: "3 days",
          verificationStatus: "Verified",
        },
        {
          id: "med-3",
          brandName: "Dolo",
          genericName: "Paracetamol",
          strength: "650 mg",
          dose: "1 tablet (650 mg)",
          route: "Oral",
          frequency: "As needed (SOS)",
          duration: "3 days",
          verificationStatus: "Verified",
        },
        {
          id: "med-4",
          brandName: "Cetzine",
          genericName: "Cetirizine",
          strength: "10 mg",
          dose: "1 tablet (10 mg)",
          route: "Oral",
          frequency: "At bedtime (HS)",
          duration: "5 days",
          verificationStatus: "Verified",
        },
      ],
      workflowStatus: "Extraction Complete",
      createdAt: "2026-10-09T08:30:00.000Z",
      updatedAt: "2026-10-09T08:32:00.000Z",
    },
  },
  {
    id: "sample-pediatric-02",
    title: "Pediatric Febrile Illness (Needs Duration & Route)",
    category: "Pediatrics",
    description: "Pediatric OPD prescription with missing duration and route—demonstrates unresolved clinical fields.",
    sourceText: `Rx - Pediatric OPD
Patient: Master Aarav Patel, 6 yrs M
Presenting Complaint: High spike fever (102°F) since yesterday evening, earache (R side otalgia), reduced appetite.
Known allergies: None recorded.

Prescribed:
- Syp. Augmentin (Amoxicillin + Clavulanic Acid) 228mg/5ml - 5 ml BD
- Syp. Crocin (Paracetamol) 120mg/5ml - 7.5 ml SOS for temp > 100°F`,
    data: {
      id: "CASE-2026-0894",
      sourceType: "upload",
      sourceText: `Rx - Pediatric OPD\nPatient: Master Aarav Patel, 6 yrs M\nDiagnosis: Acute Otitis Media / Febrile illness\n- Syp. Augmentin (Amoxicillin + Clavulanate) 228mg/5ml - 5 ml BD\n- Syp. Crocin (Paracetamol) 120mg/5ml - 7.5 ml SOS`,
      imageFileName: "pediatric_opd_slip_0894.jpg",
      patient: {
        caseId: "CASE-2026-0894",
        patientName: "Master Aarav Patel",
        age: 6,
        sex: "Male",
        pregnancyStatus: "Not applicable",
        allergies: "Unknown / None reported",
        symptoms: "Fever spikes (102°F) x 24h, right ear pain, irritable",
        medicalHistory: "Recurrent upper respiratory tract infections",
        suspectedDiagnosis: "Acute Otitis Media (AOM)",
      },
      medicines: [
        {
          id: "med-p1",
          brandName: "Augmentin Syrup",
          genericName: "Amoxicillin + Clavulanic Acid",
          strength: "228 mg / 5 mL",
          dose: "5 mL",
          route: "Oral",
          frequency: "Twice daily (BD)",
          duration: "", // Missing duration triggers Needs Verification!
          verificationStatus: "Needs Verification",
        },
        {
          id: "med-p2",
          brandName: "Crocin Suspension",
          genericName: "Paracetamol",
          strength: "120 mg / 5 mL",
          dose: "7.5 mL",
          route: "Oral",
          frequency: "SOS (when needed for fever > 100°F)",
          duration: "3 days",
          verificationStatus: "Verified",
        },
      ],
      workflowStatus: "Needs Verification",
      createdAt: "2026-10-09T09:15:00.000Z",
      updatedAt: "2026-10-09T09:20:00.000Z",
    },
  },
  {
    id: "sample-dental-03",
    title: "Dental Abscess with Penicillin Allergy",
    category: "Dental / Poly-antimicrobial",
    description: "Complex case with flagged penicillin allergy and combination antimicrobial therapy.",
    sourceText: `Rx - Dental & Maxillofacial Outpatient
Patient: Sunita Nair, 42F
Allergy Alert: Severe cutaneous reaction to Penicillin / Ampicillin in 2021 (Urticaria)
Symptoms: Severe throbbing toothache #36 with localized alveolar swelling, trismus.
Prescription:
- Tab. Flagyl (Metronidazole) 400 mg - 1 tab PO TID x 5 days
- Tab. Dalacin C (Clindamycin) 300 mg - 1 cap PO QID x 5 days
- Tab. Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase) - 1 tab PO BD x 3 days`,
    data: {
      id: "CASE-2026-0898",
      sourceType: "manual",
      sourceText: `Rx - Dental OPD\nPatient: Sunita Nair, 42F\nALLERGY: Severe Penicillin allergy (Urticaria)\nDiagnosis: Mandibular Abscess\n- Tab. Flagyl 400mg TID x 5d\n- Tab. Dalacin C 300mg QID x 5d\n- Tab. Zerodol-SP BD x 3d`,
      patient: {
        caseId: "CASE-2026-0898",
        patientName: "Sunita Nair",
        age: 42,
        sex: "Female",
        pregnancyStatus: "Not pregnant",
        allergies: "PENICILLIN ALLERGY (documented severe urticaria/angioedema)",
        symptoms: "Severe mandibular pain #36, facial swelling, difficulty chewing",
        medicalHistory: "Hypothyroidism on Levothyroxine 50 mcg",
        suspectedDiagnosis: "Acute Periapical Abscess with Cellulitis",
      },
      medicines: [
        {
          id: "med-d1",
          brandName: "Flagyl",
          genericName: "Metronidazole",
          strength: "400 mg",
          dose: "1 tablet (400 mg)",
          route: "Oral",
          frequency: "Three times daily (TID)",
          duration: "5 days",
          verificationStatus: "Verified",
        },
        {
          id: "med-d2",
          brandName: "Dalacin C",
          genericName: "Clindamycin",
          strength: "300 mg",
          dose: "1 capsule (300 mg)",
          route: "Oral",
          frequency: "Four times daily (QID)",
          duration: "5 days",
          verificationStatus: "Verified",
        },
        {
          id: "med-d3",
          brandName: "Zerodol-SP",
          genericName: "Aceclofenac + Paracetamol + Serratiopeptidase",
          strength: "100mg / 325mg / 15mg",
          dose: "1 tablet",
          route: "Oral",
          frequency: "Twice daily (BD)",
          duration: "3 days",
          verificationStatus: "Verified",
        },
      ],
      workflowStatus: "Needs Verification",
      createdAt: "2026-10-09T10:05:00.000Z",
      updatedAt: "2026-10-09T10:10:00.000Z",
    },
  },
];
