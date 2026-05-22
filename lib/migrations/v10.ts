/**
 * v1.2 T8: Sewa Patient view propagation (PRD §14 was open Q).
 *
 * Adds optional patient_name + patient_mrn to staff_complaints so
 * complaints raised on behalf of a specific patient can be tagged.
 * Both nullable + backwards-compatible — existing rows stay clean.
 */
export const v10_sql = `
  ALTER TABLE staff_complaints ADD COLUMN IF NOT EXISTS patient_name TEXT;
  ALTER TABLE staff_complaints ADD COLUMN IF NOT EXISTS patient_mrn TEXT;
  CREATE INDEX IF NOT EXISTS idx_staff_complaints_patient_mrn
    ON staff_complaints (patient_mrn) WHERE patient_mrn IS NOT NULL;
`;
