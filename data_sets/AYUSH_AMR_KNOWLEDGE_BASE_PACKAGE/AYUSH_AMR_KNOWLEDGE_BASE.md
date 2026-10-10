---
schema:
  name: AMR AYUSH Knowledge Base
  version: '1.0'
  format: markdown-with-yaml-records
  record_schema: amr.record.v1
corpus:
  id: amr-india-ayush-evidence-kb
  title: India AYUSH and AMR Evidence Knowledge Base
  language: en
  record_count: 10
  source_count: 10
  generated_from: curated_ayush_amr_evidence_records
indexing:
  primary_key: record.id
  source_key: record.source_id
  time_key: record.publication_year
  layer_key: record.data_layer
  type_key: record.record_type
  entity_keys:
  - record.medical_system
  - record.pathogen
  - record.infection_site
  - record.intervention
  metric_keys:
  - record.outcome
  - record.unit
  - record.value
  citation_key: record.source_citation
  anchor_pattern: '#record-{record_id}'
  content_hash: sha256(record.text)
integrity:
  unique_record_ids: true
  all_source_ids_resolve: true
  unresolved_source_ids: 0
  records_with_missing_ids: 0
  validation_scope: curated records in this document
coverage:
  layers:
    AYUSH_government_policy: 4
    homeopathy_AMR_laboratory_research: 2
    homeopathy_AMR_review: 1
    AMR_surveillance_cross_reference: 1
    clinical_safety_workflow: 2
  record_types:
    policy_context: 4
    research_evidence: 3
    surveillance_context: 1
    clinical_workflow: 2
provenance:
  source_registry: AYUSH_AMR_SOURCE_INDEX.yaml
  raw_authority: Original government and research publications remain authoritative.
  normalization_policy: Curated summaries do not replace source documents.
  evidence_boundary: Policy recognition, laboratory activity, clinical efficacy, and surveillance are distinct evidence types.
---

# India AYUSH and AMR Evidence Knowledge Base

> Backend/RAG-oriented knowledge base for supporting patients and AYUSH practitioners. This is an evidence and safety layer, not a treatment protocol or a substitute for clinical assessment.

## Record-level index contract

- **Primary key:** `id`
- **Source join:** `source_id` → `AYUSH_AMR_SOURCE_INDEX.yaml`
- **Retrieval dimensions:** `data_layer`, `record_type`, `publication_year`, `medical_system`, `pathogen`, `infection_site`, `intervention`, `evidence_type`, `clinical_status`
- **Evidence rule:** government recognition of research does not prove efficacy; in-vitro activity does not establish clinical effectiveness.
- **Safety rule:** do not delay urgent assessment, indicated cultures/AST, referral or appropriate clinical treatment to try an unproven intervention.

## Important source boundary

AYUSH policy documents, Ayurveda research, homeopathy research, NCDC surveillance and ICMR surveillance answer different questions. Do not combine them into one prevalence estimate or infer that a traditional intervention reverses a patient's laboratory-confirmed resistance. Preserve each surveillance source's setting, denominator, specimen and year.

<a id="record-AYUSH_POLICY_NAPAMR_2025_2029"></a>
## Record `AYUSH_POLICY_NAPAMR_2025_2029`

```yaml
id: 'AYUSH_POLICY_NAPAMR_2025_2029'
index_key: 'amr/AYUSH_government_policy/policy_context/AYUSH_POLICY_NAPAMR_2025_2029'
source_id: 'AYUSH_NAP_AMR_2_0'
source_role: 'government_policy_source'
publisher: 'Government of India / AMR-Guard curated source record'
network: null
data_layer: 'AYUSH_government_policy'
record_type: 'policy_context'
publication_year: 2025
medical_system: 'AYUSH'
pathogen: null
antibiotic: null
specimen: null
infection_site: null
intervention: null
evidence_type: 'government_policy'
clinical_status: 'policy_context_not_efficacy_evidence'
outcome: null
value: null
unit: null
quality_flag: 'Government policy; research activity does not establish clinical efficacy.'
source_citation: 'National One Health Mission.pdf; NAP-AMR 2.0 (2025–2029)'
source_ordinal: 1
content_sha256: 6514c4393a68028b22f981c000771eea35505562ab914523b73dee5ba58a85d3
retrieval:
  searchable: true
  anchor: record-AYUSH_POLICY_NAPAMR_2025_2029
  index_terms:
  - 'AYUSH'
  - AMR
  - 'government_policy'
```

### Source-grounded content

The supplied National One Health Mission document mentions AYUSH-related research, including ongoing clinical trials in Ayurveda and Siddha institutes for systemic and topical interventions for infectious diseases, as adjuvant or alternative approaches. This is evidence of policy and research activity, not proof that a specific formulation is effective against an AMR infection.

### Evidence / implementation boundary

Government policy; research activity does not establish clinical efficacy.

<a id="record-AYUSH_RESEARCH_PORTAL"></a>
## Record `AYUSH_RESEARCH_PORTAL`

```yaml
id: 'AYUSH_RESEARCH_PORTAL'
index_key: 'amr/AYUSH_government_policy/policy_context/AYUSH_RESEARCH_PORTAL'
source_id: 'AYUSH_RESEARCH_PORTAL_OFFICIAL'
source_role: 'government_policy_source'
publisher: 'Government of India / AMR-Guard curated source record'
network: null
data_layer: 'AYUSH_government_policy'
record_type: 'policy_context'
publication_year: null
medical_system: 'AYUSH'
pathogen: null
antibiotic: null
specimen: null
infection_site: null
intervention: null
evidence_type: 'research_repository'
clinical_status: 'policy_context_not_efficacy_evidence'
outcome: null
value: null
unit: null
quality_flag: 'Official repository; not itself efficacy evidence.'
source_citation: 'https://arp.ayush.gov.in/researchabout'
source_ordinal: 2
content_sha256: 405f6688f303bd2544c5bdaa95f934578b3c942231fcd2ffe14836e573f0367d
retrieval:
  searchable: true
  anchor: record-AYUSH_RESEARCH_PORTAL
  index_terms:
  - 'AYUSH'
  - AMR
  - 'research_repository'
```

### Source-grounded content

The Ministry of AYUSH Research Portal indexes research across Ayurveda, Homoeopathy, Siddha, Unani, Yoga and Naturopathy, with categories including clinical, preclinical, drug and fundamental research. Use it to discover papers, then appraise the original study. Portal inclusion alone is not proof of efficacy.

### Evidence / implementation boundary

Official repository; not itself efficacy evidence.

<a id="record-HOMEO_SAUREUS_MOTHER_TINCTURE_2024"></a>
## Record `HOMEO_SAUREUS_MOTHER_TINCTURE_2024`

```yaml
id: 'HOMEO_SAUREUS_MOTHER_TINCTURE_2024'
index_key: 'amr/homeopathy_AMR_laboratory_research/research_evidence/HOMEO_SAUREUS_MOTHER_TINCTURE_2024'
source_id: 'HOMEO_STAPHYLOCOCCUS_IN_VITRO_2024'
source_role: 'research_source'
publisher: 'Government of India / AMR-Guard curated source record'
network: null
data_layer: 'homeopathy_AMR_laboratory_research'
record_type: 'research_evidence'
publication_year: 2024
medical_system: 'Homoeopathy'
pathogen: null
antibiotic: null
specimen: null
infection_site: null
intervention: null
evidence_type: 'in_vitro'
clinical_status: 'evidence_limited'
outcome: null
value: null
unit: null
quality_flag: 'Exploratory laboratory evidence only; verify isolate count, controls, concentrations, replicates, results and conflicts from full text.'
source_citation: 'Antibiotic Resistant Staphyloccus sensitivity to Homeopathic drugs, supplied 2024 PDF'
source_ordinal: 3
content_sha256: 59593ee131452c72abaebedbc9f4c34aea91458123acc893a76a67b185b1452b
retrieval:
  searchable: true
  anchor: record-HOMEO_SAUREUS_MOTHER_TINCTURE_2024
  index_terms:
  - 'Homoeopathy'
  - AMR
  - 'in_vitro'
```

### Source-grounded content

The supplied abstract reports in-vitro testing of Calendula officinalis, Echinacea angustifolia and Vitex negundo mother tinctures against a Staphylococcus aureus sample described as resistant to azithromycin, clarithromycin and erythromycin; activity was reported for Calendula and Vitex. It does not establish clinical cure, dosing, safety or effectiveness in patients.

### Evidence / implementation boundary

Exploratory laboratory evidence only; verify isolate count, controls, concentrations, replicates, results and conflicts from full text.

<a id="record-HOMEO_KPNEUMONIAE_MOTHER_TINCTURE_2025"></a>
## Record `HOMEO_KPNEUMONIAE_MOTHER_TINCTURE_2025`

```yaml
id: 'HOMEO_KPNEUMONIAE_MOTHER_TINCTURE_2025'
index_key: 'amr/homeopathy_AMR_laboratory_research/research_evidence/HOMEO_KPNEUMONIAE_MOTHER_TINCTURE_2025'
source_id: 'HOMEO_KLEBSIELLA_IN_VITRO_2025'
source_role: 'research_source'
publisher: 'Government of India / AMR-Guard curated source record'
network: null
data_layer: 'homeopathy_AMR_laboratory_research'
record_type: 'research_evidence'
publication_year: 2025
medical_system: 'Homoeopathy'
pathogen: null
antibiotic: null
specimen: null
infection_site: null
intervention: null
evidence_type: 'in_vitro'
clinical_status: 'evidence_limited'
outcome: null
value: null
unit: null
quality_flag: 'Exploratory laboratory evidence only; verify exact isolate panel, methods, controls, concentration, replication and numerical results.'
source_citation: 'Exploring the efficacy of homeopathic remedies as antimicrobials against multidrug-resistant Klebsiella pneumoniae, supplied 2025 PDF'
source_ordinal: 4
content_sha256: d5dc48762a39871fab09f5e753710979d7c55080df918b46621fd1c4ce2a712a
retrieval:
  searchable: true
  anchor: record-HOMEO_KPNEUMONIAE_MOTHER_TINCTURE_2025
  index_terms:
  - 'Homoeopathy'
  - AMR
  - 'in_vitro'
```

### Source-grounded content

The supplied abstract describes in-vitro testing of Calendula officinalis, Echinacea angustifolia and Vitex negundo mother tinctures against a K. pneumoniae sample reported resistant to 36 antibiotics; activity was reported for Echinacea angustifolia. This does not establish patient-level treatment efficacy.

### Evidence / implementation boundary

Exploratory laboratory evidence only; verify exact isolate panel, methods, controls, concentration, replication and numerical results.

<a id="record-HOMEO_AMR_PERSPECTIVE_REVIEW_2025"></a>
## Record `HOMEO_AMR_PERSPECTIVE_REVIEW_2025`

```yaml
id: 'HOMEO_AMR_PERSPECTIVE_REVIEW_2025'
index_key: 'amr/homeopathy_AMR_review/research_evidence/HOMEO_AMR_PERSPECTIVE_REVIEW_2025'
source_id: 'HOMEO_AMR_REVIEW_2025'
source_role: 'research_source'
publisher: 'Government of India / AMR-Guard curated source record'
network: null
data_layer: 'homeopathy_AMR_review'
record_type: 'research_evidence'
publication_year: 2025
medical_system: 'Homoeopathy'
pathogen: null
antibiotic: null
specimen: null
infection_site: null
intervention: null
evidence_type: 'narrative_review'
clinical_status: 'evidence_limited'
outcome: null
value: null
unit: null
quality_flag: 'Review article; clinical validation remains necessary.'
source_citation: 'Global Scenario of Antimicrobial Resistance: A Review of the Homoeopathic Perspective in Mitigating this Menace, supplied 2025 PDF'
source_ordinal: 5
content_sha256: 2d226180a63f3c2869365bde62878efd81369967f9560335785a0ada61e56ff1
retrieval:
  searchable: true
  anchor: record-HOMEO_AMR_PERSPECTIVE_REVIEW_2025
  index_terms:
  - 'Homoeopathy'
  - AMR
  - 'narrative_review'
```

### Source-grounded content

The supplied review discusses a possible role for homeopathy in reducing antibiotic reliance and calls for rigorous larger-scale clinical research to validate efficacy. It is a review and research agenda, not proof that homeopathy can replace indicated treatment for confirmed AMR infection.

### Evidence / implementation boundary

Review article; clinical validation remains necessary.

<a id="record-AYUSH_ONE_HEALTH_REVIEW"></a>
## Record `AYUSH_ONE_HEALTH_REVIEW`

```yaml
id: 'AYUSH_ONE_HEALTH_REVIEW'
index_key: 'amr/AYUSH_government_policy/policy_context/AYUSH_ONE_HEALTH_REVIEW'
source_id: 'AYUSH_ONE_HEALTH_REVIEW_ARTICLE'
source_role: 'government_policy_source'
publisher: 'Government of India / AMR-Guard curated source record'
network: null
data_layer: 'AYUSH_government_policy'
record_type: 'policy_context'
publication_year: null
medical_system: 'AYUSH; Ayurveda'
pathogen: null
antibiotic: null
specimen: null
infection_site: null
intervention: null
evidence_type: 'review_or_policy_perspective'
clinical_status: 'policy_context_not_efficacy_evidence'
outcome: null
value: null
unit: null
quality_flag: 'Policy/review perspective, not primary clinical evidence.'
source_citation: 'Advancing the one health approach through integration of Ayush systems: Opportunities and way forward, supplied PDF'
source_ordinal: 6
content_sha256: 7bcd7fc9bdac4a68a776f5b00c782fbebfffaf68648e940525c2b05ed5555a1b
retrieval:
  searchable: true
  anchor: record-AYUSH_ONE_HEALTH_REVIEW
  index_terms:
  - 'AYUSH; Ayurveda'
  - AMR
  - 'review_or_policy_perspective'
```

### Source-grounded content

The supplied article discusses opportunities for AYUSH participation in One Health and AMR research and recommends focused research and collaboration. It does not establish efficacy for any particular product or indication.

### Evidence / implementation boundary

Policy/review perspective, not primary clinical evidence.

<a id="record-NCDC_ICMR_CROSS_REFERENCE"></a>
## Record `NCDC_ICMR_CROSS_REFERENCE`

```yaml
id: 'NCDC_ICMR_CROSS_REFERENCE'
index_key: 'amr/AMR_surveillance_cross_reference/surveillance_context/NCDC_ICMR_CROSS_REFERENCE'
source_id: 'NCDC_AMR_2025_AND_ICMR_AMRSN_2024'
source_role: 'primary_surveillance_sources'
publisher: 'Government of India / AMR-Guard curated source record'
network: null
data_layer: 'AMR_surveillance_cross_reference'
record_type: 'surveillance_context'
publication_year: 2025
medical_system: 'Clinical microbiology; all care pathways'
pathogen: null
antibiotic: null
specimen: null
infection_site: null
intervention: null
evidence_type: 'national_network_surveillance'
clinical_status: 'surveillance_context_not_individual_diagnosis'
outcome: null
value: null
unit: null
quality_flag: 'Surveillance context, not an individual diagnosis; do not merge denominators.'
source_citation: 'NCDC AMR Surveillance Network Annual Report 2025; ICMR AMR Surveillance Network Annual Report 2024'
source_ordinal: 7
content_sha256: 66dd5c9b902e4ec5899191a18b073e458b1fc34453a84ea1fe38366ff19c9dbb
retrieval:
  searchable: true
  anchor: record-NCDC_ICMR_CROSS_REFERENCE
  index_terms:
  - 'Clinical microbiology; all care pathways'
  - AMR
  - 'national_network_surveillance'
```

### Source-grounded content

NCDC 2025 and ICMR 2024 provide organism- and report-specific resistance/susceptibility context. They do not prove or disprove an individual AYUSH intervention. Retain each report's network, year, specimen, organism, antimicrobial, denominator and setting; ICMR tertiary-care observations are not community prevalence.

### Evidence / implementation boundary

Surveillance context, not an individual diagnosis; do not merge denominators.

<a id="record-AYUSH_CLINICAL_WORKFLOW"></a>
## Record `AYUSH_CLINICAL_WORKFLOW`

```yaml
id: 'AYUSH_CLINICAL_WORKFLOW'
index_key: 'amr/clinical_safety_workflow/clinical_workflow/AYUSH_CLINICAL_WORKFLOW'
source_id: 'AMR_GUARD_CLINICAL_SAFETY_POLICY'
source_role: 'product_safety_policy'
publisher: 'Government of India / AMR-Guard curated source record'
network: null
data_layer: 'clinical_safety_workflow'
record_type: 'clinical_workflow'
publication_year: 2026
medical_system: 'Ayurveda; Homoeopathy; coordinating medical services'
pathogen: null
antibiotic: null
specimen: null
infection_site: null
intervention: null
evidence_type: 'clinical_safety_rule'
clinical_status: 'product_guardrail'
outcome: null
value: null
unit: null
quality_flag: 'Product safety guardrail; not a treatment guideline.'
source_citation: 'AMR-Guard product safety policy; WHO sepsis information https://www.who.int/news-room/fact-sheets/detail/sepsis'
source_ordinal: 8
content_sha256: 5b236bd05aa1f4a22a028058836e9b0d880c61e0f15a0f388f36c33f88d6c200
retrieval:
  searchable: true
  anchor: record-AYUSH_CLINICAL_WORKFLOW
  index_terms:
  - 'Ayurveda; Homoeopathy; coordinating medical services'
  - AMR
  - 'clinical_safety_rule'
```

### Source-grounded content

Gather symptoms, duration, relevant history, allergies, current medicines, previous antibiotics and culture reports. Check emergency red flags first. Where indicated, coordinate clinical assessment, cultures and AST; testing must not delay emergency treatment. Respect patient preferences while explaining uncertainty and facilitating referral or second opinion. Do not recommend stopping prescribed treatment or substitute an unproven remedy for urgent care.

### Evidence / implementation boundary

Product safety guardrail; not a treatment guideline.

<a id="record-AYUSH_EVIDENCE_CLASSIFICATION"></a>
## Record `AYUSH_EVIDENCE_CLASSIFICATION`

```yaml
id: 'AYUSH_EVIDENCE_CLASSIFICATION'
index_key: 'amr/clinical_safety_workflow/clinical_workflow/AYUSH_EVIDENCE_CLASSIFICATION'
source_id: 'AMR_GUARD_EVIDENCE_POLICY'
source_role: 'product_safety_policy'
publisher: 'Government of India / AMR-Guard curated source record'
network: null
data_layer: 'clinical_safety_workflow'
record_type: 'clinical_workflow'
publication_year: 2026
medical_system: 'Ayurveda; Homoeopathy'
pathogen: null
antibiotic: null
specimen: null
infection_site: null
intervention: null
evidence_type: 'evidence_appraisal_rule'
clinical_status: 'product_guardrail'
outcome: null
value: null
unit: null
quality_flag: 'Mandatory evidence policy; no clinical recommendation without reliable applicable evidence and relevant guidelines.'
source_citation: 'AMR-Guard evidence policy; Ministry of AYUSH Research Portal https://arp.ayush.gov.in/researchabout'
source_ordinal: 9
content_sha256: 8b25a098449c12365b4577ad13c985e3df61fc7271e2108c546677f413fd3b0e
retrieval:
  searchable: true
  anchor: record-AYUSH_EVIDENCE_CLASSIFICATION
  index_terms:
  - 'Ayurveda; Homoeopathy'
  - AMR
  - 'evidence_appraisal_rule'
```

### Source-grounded content

Classify policy documents, in-vitro studies, animal/preclinical studies, case reports, controlled trials and systematic reviews separately. For each intervention record preparation, concentration, route, organism, infection site, outcome, comparator, adverse events, bias and reproducibility. In-vitro activity does not establish human efficacy; absence of evidence is uncertainty, not proof of benefit or harm.

### Evidence / implementation boundary

Mandatory evidence policy; no clinical recommendation without reliable applicable evidence and relevant guidelines.

<a id="record-AYUSH_CROSS_REFERRAL"></a>
## Record `AYUSH_CROSS_REFERRAL`

```yaml
id: 'AYUSH_CROSS_REFERRAL'
index_key: 'amr/AYUSH_government_policy/policy_context/AYUSH_CROSS_REFERRAL'
source_id: 'AYUSH_CROSS_REFERRAL_GUIDANCE'
source_role: 'government_policy_source'
publisher: 'Government of India / AMR-Guard curated source record'
network: null
data_layer: 'AYUSH_government_policy'
record_type: 'policy_context'
publication_year: 2022
medical_system: 'Ayurveda; conventional medicine'
pathogen: null
antibiotic: null
specimen: null
infection_site: null
intervention: null
evidence_type: 'official_guidance'
clinical_status: 'policy_context_not_efficacy_evidence'
outcome: null
value: null
unit: null
quality_flag: 'Referral policy context; follow current local protocols and qualified clinical judgment.'
source_citation: 'AYUSH Research Portal, Ayurveda and Conventional Medicine—Cross Referral Approach for Selected Disease Conditions https://arp.ayush.gov.in/admin/assets/pdf/AYURVEDA_AND_CONVENTIONAL_MEDICINE.pdf'
source_ordinal: 10
content_sha256: 4e662a42cbff7b8bfffcbf080e85e25569864dac1a796acdfdbc6e866bbafa7b
retrieval:
  searchable: true
  anchor: record-AYUSH_CROSS_REFERRAL
  index_terms:
  - 'Ayurveda; conventional medicine'
  - AMR
  - 'official_guidance'
```

### Source-grounded content

The official AYUSH portal hosts cross-referral guidance describing referral as coordination between providers when the current level lacks resources, skills or services. This supports a referral-and-continuity-of-care workflow; it does not itself validate any AMR treatment.

### Evidence / implementation boundary

Referral policy context; follow current local protocols and qualified clinical judgment.

## Cross-reference policy

- Link research to NCDC/ICMR records only when organism, antimicrobial, specimen or infection site and clinical question genuinely match.
- Keep in-vitro results separate from surveillance proportions and patient-level susceptibility results.
- Do not infer causation between consumption patterns and resistance from parallel trends alone.
- Do not assume mother tinctures, plant extracts and highly diluted homeopathic preparations are interchangeable.
- Treat product identity, quality, concentration, toxicity, contamination and interactions as separate safety questions.

## Known gaps

- Full-text methods and numerical results for the two supplied mother-tincture papers still require independent extraction and quality appraisal.
- The AYUSH One Health review and homeopathy AMR review need full bibliographic metadata/DOI verification.
- No record in this document establishes that Ayurveda or homeopathy can cure a culture-confirmed AMR infection.
- This is a first curated version; update counts and source registry after complete source inventory and backend validation.
