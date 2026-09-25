/**
 * Seed Data - Realistic Pakistani Names & Generators
 */

export const MALE_FIRST_NAMES = [
  "Ahmed", "Muhammad", "Ali", "Usman", "Bilal", "Hamza", "Hassan", "Zain",
  "Adeel", "Saad", "Fahad", "Junaid", "Owais", "Umair", "Danish", "Noman",
  "Kamran", "Imran", "Tariq", "Shahid", "Kashif", "Waqar", "Rashid", "Faisal",
  "Babar", "Asad", "Haris", "Farhan", "Rizwan", "Rehman", "Zubair", "Nasir",
  "Shoaib", "Arsalan", "Zeeshan", "Waleed", "Shahrukh", "Shahzaib", "Taimoor", "Adnan"
];

export const FEMALE_FIRST_NAMES = [
  "Fatima", "Ayesha", "Zainab", "Maryam", "Sana", "Hira", "Sadaf", "Nida",
  "Rabia", "Uzma", "Sidra", "Noor", "Iqra", "Mehwish", "Zara", "Anam",
  "Sara", "Mahnoor", "Kinza", "Laiba", "Rida", "Areeba", "Bushra", "Khadija",
  "Amna", "Samina", "Shazia", "Sumera", "Farah", "Natasha", "Madiha", "Javerya",
  "Humaira", "Kiran", "Sobia", "Tahira", "Zunaira", "Haleema", "Kainat", "Sundas"
];

export const LAST_NAMES = [
  "Khan", "Raza", "Malik", "Sheikh", "Ahmed", "Tariq", "Abbas", "Iqbal",
  "Akram", "Ali", "Bashir", "Zahra", "Fatima", "Noor", "Riaz", "Hussain",
  "Nawaz", "Aslam", "Jameel", "Anwar", "Mehmood", "Younis", "Minhas", "Muntaha",
  "Aziz", "Hayat", "Tanoli", "Qureshi", "Siddiqui", "Chaudhry", "Butt", "Ansari",
  "Farooq", "Rehman", "Shah", "Mirza", "Baig", "Lodhi", "Hashmi", "Bhatti"
];

export const GUARDIAN_RELATIONS = ["Father", "Mother", "Guardian", "Uncle"];

export function generatePerson(gender = "random") {
  let isMale = gender === "male";
  if (gender === "random" || (gender !== "male" && gender !== "female")) {
    isMale = Math.random() > 0.5;
  }
  const firstPool = isMale ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
  const firstName = firstPool[Math.floor(Math.random() * firstPool.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return {
    fullName: `${firstName} ${lastName}`,
    firstName,
    lastName,
    gender: isMale ? "male" : "female",
  };
}

export function generateRandomName(genderOrRole = "random", maybeGender = null) {
  const targetGender = maybeGender || (genderOrRole === "male" || genderOrRole === "female" ? genderOrRole : "random");
  const p = generatePerson(targetGender);
  return p.fullName;
}

export function generateRandomEmail(nameOrFirst, role = "user", suffix = "") {
  const clean = String(nameOrFirst)
    .toLowerCase()
    .replace(/prof\.?|dr\.?|sir|miss|madam/gi, "")
    .replace(/[^a-z0-9]/g, "");
  const rand = suffix || Math.floor(1000 + Math.random() * 9000);
  return `${clean || "user"}${rand}@eduhub.test`;
}

export function generateRandomPhone() {
  const prefixes = ["0300", "0301", "0302", "0312", "0321", "0333", "0345"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}-${num}`;
}

export function generateGuardianInfo(studentName = "") {
  const fatherFirst = MALE_FIRST_NAMES[Math.floor(Math.random() * MALE_FIRST_NAMES.length)];
  const lastName = studentName.split(" ").slice(-1)[0] || "Khan";
  return {
    name: `${fatherFirst} ${lastName}`,
    phone: generateRandomPhone(),
    relation: "Father",
  };
}

export const CURATED_TEACHERS = [
  {
    name: "Prof. Dr. Tariq Mehmood",
    email: "tariq.mehmood@eduhub.test",
    phone: "0300-9281742",
    department: "Mathematics",
    designation: "HOD",
    qualification: "PhD in Mathematics",
    subjects: "Mathematics",
    baseSalary: 110000,
    allowance: 25000,
    medical: 15000,
  },
  {
    name: "Madam Ayesha Siddiqui",
    email: "ayesha.siddiqui@eduhub.test",
    phone: "0321-4829105",
    department: "English",
    designation: "Senior Lecturer",
    qualification: "M.Phil English Literature",
    subjects: "English Language",
    baseSalary: 85000,
    allowance: 18000,
    medical: 10000,
  },
  {
    name: "Sir Muhammad Usman",
    email: "muhammad.usman@eduhub.test",
    phone: "0333-5192837",
    department: "Physics",
    designation: "Senior Lecturer",
    qualification: "M.Sc Physics",
    subjects: "Physics",
    baseSalary: 82000,
    allowance: 16000,
    medical: 10000,
  },
  {
    name: "Sir Abdul Rehman",
    email: "abdul.rehman@eduhub.test",
    phone: "0345-6718293",
    department: "Chemistry",
    designation: "Senior Lecturer",
    qualification: "M.Sc Chemistry",
    subjects: "Chemistry",
    baseSalary: 80000,
    allowance: 15000,
    medical: 10000,
  },
  {
    name: "Sir Farhan Ali",
    email: "farhan.ali@eduhub.test",
    phone: "0301-8392018",
    department: "Computer Science",
    designation: "Lecturer",
    qualification: "MS Computer Science",
    subjects: "Computer Science",
    baseSalary: 68000,
    allowance: 12000,
    medical: 8000,
  },
  {
    name: "Madam Fatima Zahra",
    email: "fatima.zahra@eduhub.test",
    phone: "0312-7492019",
    department: "Urdu",
    designation: "Lecturer",
    qualification: "M.A Urdu",
    subjects: "Urdu Literature",
    baseSalary: 65000,
    allowance: 10000,
    medical: 8000,
  },
  {
    name: "Sir Bilal Ahmed",
    email: "bilal.ahmed@eduhub.test",
    phone: "0302-3928174",
    department: "Biology",
    designation: "Lecturer",
    qualification: "M.Sc Zoology",
    subjects: "Biology",
    baseSalary: 64000,
    allowance: 10000,
    medical: 8000,
  },
  {
    name: "Sir Hamza Tariq",
    email: "hamza.tariq@eduhub.test",
    phone: "0300-1928374",
    department: "Social Studies",
    designation: "Lecturer",
    qualification: "M.A Pakistan Studies",
    subjects: "Pakistan Studies",
    baseSalary: 62000,
    allowance: 10000,
    medical: 8000,
  },
  {
    name: "Madam Zainab Bibi",
    email: "zainab.bibi@eduhub.test",
    phone: "0321-8291048",
    department: "Islamiat",
    designation: "Lecturer",
    qualification: "M.A Islamic Studies",
    subjects: "Islamiat & Ethics",
    baseSalary: 62000,
    allowance: 10000,
    medical: 8000,
  },
  {
    name: "Sir Kamran Shah",
    email: "kamran.shah@eduhub.test",
    phone: "0333-9182736",
    department: "Science",
    designation: "Lecturer",
    qualification: "M.Sc Applied Sciences",
    subjects: "General Science",
    baseSalary: 60000,
    allowance: 10000,
    medical: 8000,
  },
];

export default {
  CURATED_TEACHERS,
  generatePerson,
  generateRandomName,
  generateRandomEmail,
  generateRandomPhone,
  generateGuardianInfo,
};
