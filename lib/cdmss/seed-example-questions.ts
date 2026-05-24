/**
 * v1.7 Sprint G — 55 seed example questions weighted to EHRC OT case mix
 * (Aug 2025–May 2026: 46% Gen Surg, 15% Ortho, 7% ENT, 3-3-3% Uro/OB-GYN/Gastro,
 *  plus medical-side specialties for breadth). See PRD Appendix A.
 */
export type Seed = { question: string; specialty: string };

export const EXAMPLE_QUESTION_SEED: Seed[] = [
  // General Surgery — heavy weight (15 questions, ~27%)
  { specialty: 'General Surgery', question: 'Indications for laser hemorrhoidopexy vs stapler hemorrhoidectomy in grade III internal hemorrhoids' },
  { specialty: 'General Surgery', question: 'Preoperative workup for laparoscopic cholecystectomy in a patient with suspected choledocholithiasis' },
  { specialty: 'General Surgery', question: 'Antibiotic prophylaxis regimen for clean elective surgery vs contaminated bowel surgery' },
  { specialty: 'General Surgery', question: 'Management of pilonidal sinus — primary closure vs Limberg flap vs Bascom procedure' },
  { specialty: 'General Surgery', question: 'When is mesh repair preferred over Bassini for inguinal hernia in young adults' },
  { specialty: 'General Surgery', question: 'EVLT vs RFA vs traditional stripping for great saphenous vein insufficiency — recurrence rates and complications' },
  { specialty: 'General Surgery', question: 'Postoperative pain management after laser hemorrhoidectomy — multimodal protocol' },
  { specialty: 'General Surgery', question: 'Indications for laparoscopic vs open repair of umbilical hernia in adults' },
  { specialty: 'General Surgery', question: 'DVT prophylaxis in elective laparoscopic surgery — when to use mechanical vs pharmacological' },
  { specialty: 'General Surgery', question: 'Management of grade IV hemorrhoids with prolapse — surgical options and recurrence rates' },
  { specialty: 'General Surgery', question: 'Workup of a 45y with painless rectal bleeding — algorithm before assuming hemorrhoids' },
  { specialty: 'General Surgery', question: 'Anal fissure management — lateral internal sphincterotomy vs botulinum toxin vs GTN ointment' },
  { specialty: 'General Surgery', question: 'Lipoma excision under local anaesthesia — patient selection and technique pearls' },
  { specialty: 'General Surgery', question: 'Phimosis in adults — when to circumcise vs preputioplasty vs topical steroids' },
  { specialty: 'General Surgery', question: 'Postop wound infection after lap chole — risk factors and prevention bundle' },

  // Orthopedics (8, ~15%)
  { specialty: 'Orthopedics', question: 'Indications for total knee replacement vs unicompartmental in osteoarthritis' },
  { specialty: 'Orthopedics', question: 'Bilateral TKR — single-stage vs staged — patient selection criteria and complications' },
  { specialty: 'Orthopedics', question: 'ACL reconstruction graft choice — hamstring vs BTB vs allograft in a 30y athlete' },
  { specialty: 'Orthopedics', question: 'Postop DVT prophylaxis after total hip replacement — duration and agent selection' },
  { specialty: 'Orthopedics', question: 'Frozen shoulder in a diabetic — conservative vs arthroscopic capsular release timing' },
  { specialty: 'Orthopedics', question: 'When to remove orthopedic implants — fracture healing criteria plus patient symptoms' },
  { specialty: 'Orthopedics', question: 'Periprosthetic joint infection workup after TKR — when to aspirate, when to revise' },
  { specialty: 'Orthopedics', question: 'Pain management protocol after TKR — multimodal including adductor canal block' },

  // ENT (4, ~7%)
  { specialty: 'ENT', question: 'Indications for FESS in chronic rhinosinusitis with nasal polyps — when conservative fails' },
  { specialty: 'ENT', question: 'Adenotonsillectomy criteria in pediatric OSA — Paradise criteria vs polysomnography' },
  { specialty: 'ENT', question: 'Endoscopic CSF leak repair — preop localization and graft choice' },
  { specialty: 'ENT', question: 'Septoplasty + turbinoplasty in chronic nasal obstruction — patient selection and outcomes' },

  // Urology (3)
  { specialty: 'Urology', question: 'Workup and management of a 5mm vs 10mm vs 15mm ureteric calculus' },
  { specialty: 'Urology', question: 'RIRS vs ESWL vs PCNL for renal stones — size-based algorithm' },
  { specialty: 'Urology', question: 'BPH workup before TURP — IPSS, uroflowmetry, prostate volume thresholds' },

  // OB-GYN (3)
  { specialty: 'OB-GYN', question: 'TLH vs open hysterectomy — indications, contraindications, complication profiles' },
  { specialty: 'OB-GYN', question: 'LSCS in a previous LSCS patient — VBAC eligibility and uterine rupture risk' },
  { specialty: 'OB-GYN', question: 'Postpartum hemorrhage management — uterotonic algorithm and surgical escalation' },

  // Gastro (2)
  { specialty: 'Gastro', question: 'Acute cholecystitis severity grading (Tokyo) and timing of cholecystectomy' },
  { specialty: 'Gastro', question: 'ERCP for CBD stones — pre-procedure workup and post-ERCP pancreatitis prevention' },

  // Cardiology (3)
  { specialty: 'Cardiology', question: 'First-line management of HFrEF NYHA III — quadruple therapy initiation order' },
  { specialty: 'Cardiology', question: 'New-onset AFib in a 65y — rate vs rhythm plus anticoagulation decision (CHA2DS2-VASc)' },
  { specialty: 'Cardiology', question: 'NSTEMI workup and risk stratification — HEART score and TIMI in the ED' },

  // Pulm (2)
  { specialty: 'Pulm', question: 'Empiric antibiotics for community-acquired pneumonia in a 70y with COPD' },
  { specialty: 'Pulm', question: 'COPD exacerbation management — when to escalate to systemic steroids and antibiotics' },

  // Neuro (2)
  { specialty: 'Neuro', question: 'Acute ischemic stroke workup in the first 4.5h — tPA eligibility and contraindications' },
  { specialty: 'Neuro', question: 'First unprovoked seizure in an adult — workup and AED initiation criteria' },

  // ID (2)
  { specialty: 'ID', question: 'Sepsis bundle for an adult presenting with suspected urosepsis — 1h and 3h goals' },
  { specialty: 'ID', question: 'Surgical antibiotic prophylaxis duration — when 24h is too long and when to continue' },

  // Endo (2)
  { specialty: 'Endo', question: 'DKA management — fluid and insulin algorithm, when to add dextrose' },
  { specialty: 'Endo', question: 'Subclinical hypothyroidism in a 50y woman — when to treat with levothyroxine' },

  // Renal (2)
  { specialty: 'Renal', question: 'Workup for hyponatremia, serum osmolality 268 — algorithm by volume status' },
  { specialty: 'Renal', question: 'Acute kidney injury in a postoperative patient — pre-renal vs intrinsic vs post-renal workup' },

  // Heme (2)
  { specialty: 'Heme', question: 'Anticoagulation reversal — DOACs vs warfarin in the bleeding patient' },
  { specialty: 'Heme', question: 'Iron deficiency anemia workup in a 55y male — when to scope' },

  // EM (2)
  { specialty: 'EM', question: 'Anaphylaxis management — epinephrine dosing, biphasic risk, observation period' },
  { specialty: 'EM', question: 'Chest pain risk stratification in the ED — HEART pathway vs traditional rule-out' },

  // Psych (1)
  { specialty: 'Psych', question: 'Acute delirium in a postoperative elderly patient — workup and pharmacologic approach' },

  // Peds (1)
  { specialty: 'Peds', question: 'Pediatric fever without source in a 6m–24m — workup tiers and disposition' },

  // General (1)
  { specialty: 'General', question: 'Perioperative antiplatelet management — when to hold aspirin and clopidogrel before surgery' },
];
