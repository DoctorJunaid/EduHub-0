/**
 * Seed Data - Academic Departments, Designations & Salary Bands
 */

export const DEPARTMENTS = [
  "Computer Science",
  "Mathematics",
  "English",
  "Science",
  "Urdu",
  "Islamiat",
  "Social Studies",
  "Physics",
  "Chemistry",
  "Biology",
  "Commerce",
  "Arts"
];

export const DESIGNATIONS = [
  { title: "Principal", minSalary: 80000, maxSalary: 120000, weight: 1 },
  { title: "Vice Principal", minSalary: 70000, maxSalary: 90000, weight: 1 },
  { title: "HOD", minSalary: 65000, maxSalary: 85000, weight: 2 },
  { title: "Senior Lecturer", minSalary: 55000, maxSalary: 75000, weight: 6 },
  { title: "Lecturer", minSalary: 40000, maxSalary: 60000, weight: 12 },
  { title: "Junior Lecturer", minSalary: 30000, maxSalary: 45000, weight: 8 }
];

export const QUALIFICATIONS = [
  "Ph.D.",
  "M.Phil",
  "M.Sc",
  "M.A.",
  "M.Ed",
  "B.Ed",
  "BS (Hons)"
];
