/**
 * Seed Data - Academic Subjects by Grade Level & Group
 */

export const PRIMARY_SUBJECTS = [
  { name: "English Language", code: "ENG-PRI", department: "English", periodsPerWeek: 6 },
  { name: "Urdu Literature", code: "URD-PRI", department: "Urdu", periodsPerWeek: 6 },
  { name: "Mathematics", code: "MATH-PRI", department: "Mathematics", periodsPerWeek: 6 },
  { name: "Islamiat & Ethics", code: "ISL-PRI", department: "Islamiat", periodsPerWeek: 4 },
  { name: "General Knowledge", code: "GK-PRI", department: "Science", periodsPerWeek: 3 },
  { name: "Art & Craft", code: "ART-PRI", department: "Arts", periodsPerWeek: 2 },
  { name: "Physical Education", code: "PE-PRI", department: "Sports", periodsPerWeek: 2 },
];

export const MIDDLE_SUBJECTS = [
  { name: "English Language", code: "ENG-MID", department: "English", periodsPerWeek: 5 },
  { name: "Urdu Literature", code: "URD-MID", department: "Urdu", periodsPerWeek: 5 },
  { name: "Mathematics", code: "MATH-MID", department: "Mathematics", periodsPerWeek: 5 },
  { name: "General Science", code: "SCI-MID", department: "Science", periodsPerWeek: 4 },
  { name: "Islamiat & Ethics", code: "ISL-MID", department: "Islamiat", periodsPerWeek: 3 },
  { name: "Computer Science", code: "CS-MID", department: "Computer Science", periodsPerWeek: 3 },
  { name: "Social Studies", code: "SST-MID", department: "Social Studies", periodsPerWeek: 3 },
  { name: "Physical Education", code: "PE-MID", department: "Sports", periodsPerWeek: 2 },
];

export const SECONDARY_SUBJECTS = [
  { name: "English Language", code: "ENG-SEC", department: "English", periodsPerWeek: 5 },
  { name: "Urdu Literature", code: "URD-SEC", department: "Urdu", periodsPerWeek: 4 },
  { name: "Mathematics", code: "MATH-SEC", department: "Mathematics", periodsPerWeek: 5 },
  { name: "Physics", code: "PHY-SEC", department: "Physics", periodsPerWeek: 4 },
  { name: "Chemistry", code: "CHEM-SEC", department: "Chemistry", periodsPerWeek: 4 },
  { name: "Biology", code: "BIO-SEC", department: "Biology", periodsPerWeek: 4 },
  { name: "Computer Science", code: "CS-SEC", department: "Computer Science", periodsPerWeek: 3 },
  { name: "Pakistan Studies", code: "PST-SEC", department: "Social Studies", periodsPerWeek: 3 },
  { name: "Islamiat & Ethics", code: "ISL-SEC", department: "Islamiat", periodsPerWeek: 2 },
];

export const HIGHER_SECONDARY_GROUPS = {
  "Section A": {
    groupName: "Pre-Medical",
    subjects: [
      { name: "English Language", code: "ENG-HSEC", department: "English", periodsPerWeek: 4 },
      { name: "Urdu Literature", code: "URD-HSEC", department: "Urdu", periodsPerWeek: 3 },
      { name: "Biology", code: "BIO-HSEC", department: "Biology", periodsPerWeek: 6 },
      { name: "Chemistry", code: "CHEM-HSEC", department: "Chemistry", periodsPerWeek: 6 },
      { name: "Physics", code: "PHY-HSEC", department: "Physics", periodsPerWeek: 6 },
      { name: "Islamiat & Ethics", code: "ISL-HSEC", department: "Islamiat", periodsPerWeek: 2 },
    ],
  },
  "Section B": {
    groupName: "Pre-Engineering",
    subjects: [
      { name: "English Language", code: "ENG-HSEC", department: "English", periodsPerWeek: 4 },
      { name: "Urdu Literature", code: "URD-HSEC", department: "Urdu", periodsPerWeek: 3 },
      { name: "Mathematics", code: "MATH-HSEC", department: "Mathematics", periodsPerWeek: 6 },
      { name: "Chemistry", code: "CHEM-HSEC", department: "Chemistry", periodsPerWeek: 6 },
      { name: "Physics", code: "PHY-HSEC", department: "Physics", periodsPerWeek: 6 },
      { name: "Islamiat & Ethics", code: "ISL-HSEC", department: "Islamiat", periodsPerWeek: 2 },
    ],
  },
  "Section C": {
    groupName: "ICS",
    subjects: [
      { name: "English Language", code: "ENG-HSEC", department: "English", periodsPerWeek: 4 },
      { name: "Urdu Literature", code: "URD-HSEC", department: "Urdu", periodsPerWeek: 3 },
      { name: "Mathematics", code: "MATH-HSEC", department: "Mathematics", periodsPerWeek: 5 },
      { name: "Computer Science", code: "CS-HSEC", department: "Computer Science", periodsPerWeek: 7 },
      { name: "Physics", code: "PHY-HSEC", department: "Physics", periodsPerWeek: 5 },
      { name: "Islamiat & Ethics", code: "ISL-HSEC", department: "Islamiat", periodsPerWeek: 2 },
    ],
  },
  "Section D": {
    groupName: "Commerce",
    subjects: [
      { name: "English Language", code: "ENG-HSEC", department: "English", periodsPerWeek: 4 },
      { name: "Urdu Literature", code: "URD-HSEC", department: "Urdu", periodsPerWeek: 3 },
      { name: "Accounting", code: "ACC-HSEC", department: "Commerce", periodsPerWeek: 5 },
      { name: "Business Studies", code: "BUS-HSEC", department: "Commerce", periodsPerWeek: 5 },
      { name: "Economics", code: "ECO-HSEC", department: "Commerce", periodsPerWeek: 5 },
      { name: "Islamiat & Ethics", code: "ISL-HSEC", department: "Islamiat", periodsPerWeek: 2 },
    ],
  },
};

export function getSubjectsForGrade(gradeLevel, sectionName = "Section A") {
  const level = Number(gradeLevel) || 1;
  if (level <= 5) return PRIMARY_SUBJECTS;
  if (level <= 8) return MIDDLE_SUBJECTS;
  if (level <= 10) return SECONDARY_SUBJECTS;
  
  const group = HIGHER_SECONDARY_GROUPS[sectionName] || HIGHER_SECONDARY_GROUPS["Section A"];
  return group.subjects;
}

export const ALL_UNIQUE_SUBJECTS = [
  ...PRIMARY_SUBJECTS,
  ...MIDDLE_SUBJECTS,
  ...SECONDARY_SUBJECTS,
  ...HIGHER_SECONDARY_GROUPS["Section A"].subjects,
  ...HIGHER_SECONDARY_GROUPS["Section B"].subjects,
  ...HIGHER_SECONDARY_GROUPS["Section C"].subjects,
  ...HIGHER_SECONDARY_GROUPS["Section D"].subjects,
].filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));
