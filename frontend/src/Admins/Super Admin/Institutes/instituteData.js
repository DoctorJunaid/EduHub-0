export const instituteRecords = [
  {
    id: "nust",
    name: "NUST (National University of Sciences and Technology)",
    added: "2023-01-15",
    type: "University",
    board: "Federal",
    status: "Active",
    rating: 4.9,
    campuses: 2,
    campusDetails: [
      {
        name: "NUST Main Campus (H-12)",
        location: "Islamabad, Federal",
        status: "Active",
      },
      {
        name: "Risale Campus",
        location: "Rawalpindi, Punjab",
        status: "Active",
      },
    ],
    studentCount: "1200 Students",
    studentRecords: [
      {
        name: "Ali Raza",
        program: "BS Computer Science",
        status: "Active",
        roll: "NUST-CS-2023-042",
        campus: "NUST Main Campus (H-12)",
      },
      {
        name: "Maryam Ahmed",
        program: "BS Software Engineering",
        status: "Active",
        roll: "NUST-SE-2023-110",
        campus: "NUST Main Campus (H-12)",
      },
    ],
    email: "admissions@nust.edu.pk",
    phone: "+92 51 9085 1000",
    headOfficeAddress: "H-12 Sector, Islamabad",
    image:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=80&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "nca",
    name: "National College of Arts (NCA)",
    added: "2023-02-23",
    type: "College",
    board: "Punjab Board",
    status: "Active",
    rating: 4.8,
    campuses: 3,
    campusDetails: [
      { name: "NCA Main Campus", location: "Lahore, Punjab", status: "Active" },
      {
        name: "NCA Heritage Wing",
        location: "Lahore, Punjab",
        status: "Pending",
      },
      {
        name: "NCA Multimedia Wing",
        location: "Karachi, Sindh",
        status: "Active",
      },
    ],
    studentCount: "1700 Students",
    studentRecords: [
      {
        name: "Areeba Khan",
        program: "Fine Arts",
        status: "Active",
        roll: "NCA-FA-2023-018",
        campus: "NCA Main Campus",
      },
      {
        name: "Hafsa Tariq",
        program: "Design",
        status: "Pending",
        roll: "NCA-DES-2023-089",
        campus: "NCA Heritage Wing",
      },
    ],
    email: "info@nca.edu.pk",
    phone: "+92 42 9921 2000",
    headOfficeAddress: "Lahore, Punjab",
    image:
      "https://www.nca.edu.pk/images/home_banner/6_sm.jpg?time=1788912000151",
    coverImageUrl:
      "https://www.nca.edu.pk/images/home_banner/6_sm.jpg?time=1788912000151",
  },
  {
    id: "lums",
    name: "LUMS (Lahore University of Management Sciences)",
    added: "2023-10-16",
    type: "University",
    board: "HEC",
    status: "Active",
    rating: 4.9,
    campuses: 4,
    campusDetails: [
      {
        name: "LUMS Main Campus",
        location: "Lahore, Punjab",
        status: "Active",
      },
      { name: "SDSB Campus", location: "Lahore, Punjab", status: "Active" },
      {
        name: "LUMS Executive Campus",
        location: "Faisalabad, Punjab",
        status: "Suspended",
      },
      {
        name: "LUMS Digital Campus",
        location: "Islamabad, Federal",
        status: "Active",
      },
    ],
    studentCount: "2200 Students",
    studentRecords: [
      {
        name: "Sana Javed",
        program: "MBA",
        status: "Active",
        roll: "LUMS-MBA-2023-223",
        campus: "LUMS Main Campus",
      },
      {
        name: "Bilal Iqbal",
        program: "Economics",
        status: "Active",
        roll: "LUMS-ECO-2023-101",
        campus: "SDSB Campus",
      },
    ],
    email: "admissions@lums.edu.pk",
    phone: "+92 42 3560 8000",
    headOfficeAddress: "Lahore, Punjab",
    image:
      "https://www.lums.edu.pk/sites/default/files/styles/416x396/public/2022-10/thumb_school_SDSB.jpg",
    coverImageUrl:
      "https://www.lums.edu.pk/sites/default/files/styles/416x396/public/2022-10/thumb_school_SDSB.jpg",
  },
  {
    id: "aku",
    name: "Aga Khan University",
    added: "2023-08-05",
    type: "University",
    board: "Sindh Board",
    status: "Active",
    rating: 5,
    campuses: 5,
    campusDetails: [
      {
        name: "Aga Khan University Medical Campus",
        location: "Karachi, Sindh",
        status: "Active",
      },
      {
        name: "AKU Campus Nairobi",
        location: "Nairobi, Kenya",
        status: "Active",
      },
      {
        name: "AKU Campus Kampala",
        location: "Kampala, Uganda",
        status: "Pending",
      },
      {
        name: "AKU Campus Dhaka",
        location: "Dhaka, Bangladesh",
        status: "Active",
      },
      {
        name: "AKU Rural Campus",
        location: "Gilgit, Gilgit-Baltistan",
        status: "Active",
      },
    ],
    studentCount: "2700 Students",
    studentRecords: [
      {
        name: "Amina Karim",
        program: "MBBS",
        status: "Active",
        roll: "AKU-MBBS-2023-014",
        campus: "Aga Khan University Medical Campus",
      },
      {
        name: "Hamza Noor",
        program: "Nursing",
        status: "Active",
        roll: "AKU-NUR-2023-205",
        campus: "Aga Khan University Medical Campus",
      },
    ],
    email: "info@aku.edu",
    phone: "+92 21 3486 4500",
    headOfficeAddress: "Karachi, Sindh",
    image: "https://www.aku.edu/about/PublishingImages/campuses.jpg",
    coverImageUrl: "https://www.aku.edu/about/PublishingImages/campuses.jpg",
  },
];

export const instituteStorageKey = "eduhub_super_admin_institutes";

export function loadInstitutes(
  storage = typeof window === "undefined" ? null : window.localStorage,
) {
  try {
    const saved = storage?.getItem(instituteStorageKey);
    if (!saved) return instituteRecords;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    return instituteRecords;
  }
  return instituteRecords;
}

export function saveInstitutes(
  institutes,
  storage = typeof window === "undefined" ? null : window.localStorage,
) {
  try {
    storage?.setItem(instituteStorageKey, JSON.stringify(institutes));
  } catch {
    // Storage can be unavailable, but the returned in-memory data still flows through the router.
  }
}
