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

export default {
  generatePerson,
  generateRandomName,
  generateRandomEmail,
  generateRandomPhone,
  generateGuardianInfo,
};
