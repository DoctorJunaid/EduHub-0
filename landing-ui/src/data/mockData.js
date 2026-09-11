// mockData.js - Relational Schema Mock Database
// Built to mirror the exact ER diagram relationships with a Pakistani context

// --- 1. Base Entities ---

export let institutes = [
  { 
    id: 'inst_1', 
    name: 'NUST (National University of Sciences and Technology)', 
    shortName: 'NUST',
    fullName: 'National University of Sciences & Technology',
    motto: 'Defining Futures Through Science & Innovation',
    rank: 1,
    globalRank: 'QS #334',
    nationalRank: '#01 National Rank',
    placementRate: '98.4%',
    establishedYear: '1991',
    campusArea: '350 Acres Eco Smart Campus',
    studentEnrollment: '18,500+ Scholars',
    facultyCount: '1,250+ (85% PhDs)',
    acceptanceRate: '8.2%',
    board: 'Federal HEC', 
    type: 'Public Research University', 
    createdAt: '2023-01-15', 
    rating: 4.9, 
    reviewsCount: '1.8k reviews',
    sector: 'Engineering & Technology',
    image: '/universities/nust.jpg', 
    logo: '/logos/nust.png',
    email: 'admissions@nust.edu.pk', 
    phone: '+92 51 9085 1000', 
    address: 'Sector H-12, Islamabad, Pakistan', 
    status: 'Active',
    accreditation: 'HEC "W4" Tier • Washington Accord (PEC Level II) • NBEAC Accredited',
    overview: 'The National University of Sciences and Technology (NUST) is Pakistan’s flagship STEM institution. Ranked #334 globally in QS World University Rankings, NUST combines cutting-edge engineering laboratories, artificial intelligence research centers, and a thriving entrepreneurial ecosystem spanning over 350 acres in Islamabad.',
    admissions: {
      cycle: 'Fall 2026 Admissions Open',
      deadline: 'July 15, 2026',
      entryTest: 'NUST Entry Test (NET-4) / SAT / ACT',
      testDate: 'July 22 – 28, 2026',
      feeRange: 'PKR 185,000 – 215,000 / Semester',
      financialAid: 'Over PKR 450 Million in Need-Based & Merit Endowments'
    },
    departments: [
      'School of Electrical Engineering & Computer Science (SEECS)',
      'NUST Business School (NBS)',
      'School of Mechanical & Manufacturing Engineering (SMME)',
      'School of Chemical & Materials Engineering (SCME)',
      'Atta-ur-Rahman School of Applied Biosciences (ASAB)'
    ],
    researchCenters: [
      'National Center of Artificial Intelligence (NCAI)',
      'US-Pakistan Center for Advanced Studies in Energy',
      'Technology Incubation Center (TICE)',
      'Robotics and Autonomous Systems Research Group'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
      'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80',
      'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80'
    ]
  },
  { 
    id: 'inst_3', 
    name: 'LUMS (Lahore University of Management Sciences)', 
    shortName: 'LUMS',
    fullName: 'Lahore University of Management Sciences',
    motto: 'Learning Without Borders',
    rank: 2,
    globalRank: 'QS #540',
    nationalRank: '#02 National Rank',
    placementRate: '97.8%',
    establishedYear: '1985',
    campusArea: '100 Acres Suburban Park Campus',
    studentEnrollment: '5,400+ Scholars',
    facultyCount: '420+ (90% PhDs)',
    acceptanceRate: '7.5%',
    board: 'HEC', 
    type: 'Private Research University', 
    createdAt: '2023-06-10', 
    rating: 4.9, 
    reviewsCount: '1.5k reviews',
    sector: 'Business & Management',
    image: '/universities/lums.jpg', 
    logo: '/logos/lums.png',
    email: 'admissions@lums.edu.pk', 
    phone: '+92 42 3560 8000', 
    address: 'D.H.A. Phase 5, Lahore, Pakistan', 
    status: 'Active',
    accreditation: 'AACSB Accredited • HEC "W4" Tier • SAQS Recognized',
    overview: 'Lahore University of Management Sciences (LUMS) is one of South Asia’s most prestigious liberal arts and business universities. Internationally recognized for case-study pedagogy, world-class economics research, and the National Outreach Programme (NOP) providing 100% full-ride scholarships to talented students.',
    admissions: {
      cycle: 'Fall 2026 Admissions Open',
      deadline: 'April 30, 2026',
      entryTest: 'LCAT / SAT / GRE / GMAT',
      testDate: 'May 14, 2026',
      feeRange: 'PKR 340,000 – 420,000 / Semester',
      financialAid: '1 in 3 Students Receives 30% to 100% Financial Assistance'
    },
    departments: [
      'Suleman Dawood School of Business (SDSB)',
      'Syed Babar Ali School of Science & Engineering (SBASSE)',
      'Mushtaq Ahmad Gurmani School of Humanities & Social Sciences (MGSHSS)',
      'Shaikh Ahmad Hassan School of Law (SAHSL)'
    ],
    researchCenters: [
      'Rausing Executive Development Centre (REDC)',
      'Centre for Water Informatics & Technology (WIT)',
      'National Incubation Center Lahore (NIC)',
      'LUMS Energy Institute (LEI)'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
      'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'
    ]
  },
  { 
    id: 'inst_5', 
    name: 'GIKI (Ghulam Ishaq Khan Institute)', 
    shortName: 'GIKI',
    fullName: 'Ghulam Ishaq Khan Institute of Engineering Sciences & Tech',
    motto: 'Advancing Science, Engineering & Modern Industry',
    rank: 3,
    globalRank: 'QS #650',
    nationalRank: '#03 National Rank',
    placementRate: '99.1%',
    establishedYear: '1993',
    campusArea: '400 Acres Foothill Residential Campus',
    studentEnrollment: '2,800+ Scholars',
    facultyCount: '190+ (95% PhDs)',
    acceptanceRate: '11.4%',
    board: 'KPK', 
    type: 'Private Engineering Institute', 
    createdAt: '2023-04-12', 
    rating: 4.8, 
    reviewsCount: '940 reviews',
    sector: 'Engineering & Computing',
    image: '/universities/giki.jpg', 
    logo: '/logos/giki.png',
    email: 'info@giki.edu.pk', 
    phone: '+92 938 271858', 
    address: 'Topi, KPK, Pakistan', 
    status: 'Active',
    accreditation: 'Washington Accord (PEC Level II) • HEC Ranked Top Engineering Institute',
    overview: 'Nestled beside the Tarbela Dam foothills in Topi, GIKI is renowned for intensive engineering rigor, 100% residential campus culture, and pioneering student rocketry and autonomous formula racing teams representing Pakistan internationally.',
    admissions: {
      cycle: 'Fall 2026 Admissions Open',
      deadline: 'June 25, 2026',
      entryTest: 'GIK Admission Test / SAT Subject Tests',
      testDate: 'July 8 – 12, 2026',
      feeRange: 'PKR 240,000 – 290,000 / Semester',
      financialAid: 'Over 80 Need-Based Full Tuition Waivers via Alumni Endowment'
    },
    departments: [
      'Faculty of Computer Science & Engineering (FCSE)',
      'Faculty of Mechanical Engineering (FME)',
      'Faculty of Electrical Engineering (FEE)',
      'Faculty of Materials & Chemical Engineering (FMCE)',
      'Faculty of Engineering Sciences (FES)'
    ],
    researchCenters: [
      'Artificial Intelligence & High Performance Computing Lab',
      'Advanced Materials & Nanotechnology Center',
      'Tarbela Renewable Fluid Dynamics Testing Facility',
      'Aero-Design and Robotics Laboratory'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80'
    ]
  },
  { 
    id: 'inst_6', 
    name: 'FAST (National University of Computer and Emerging Sciences)', 
    shortName: 'FAST',
    fullName: 'National University of Computer & Emerging Sciences',
    motto: 'Pioneers of Computing & Digital Innovation',
    rank: 4,
    globalRank: 'QS Asia #350',
    nationalRank: '#04 National Rank',
    placementRate: '98.9%',
    establishedYear: '2000',
    campusArea: '5 Multi-City Tech Campuses',
    studentEnrollment: '15,000+ Enrolled Techies',
    facultyCount: '650+ Computer Scientists',
    acceptanceRate: '9.8%',
    board: 'Federal', 
    type: 'Multi-Campus Tech University', 
    createdAt: '2023-02-18', 
    rating: 4.8, 
    reviewsCount: '1.2k reviews',
    sector: 'Computer Science & AI',
    image: '/universities/fast.jpg', 
    logo: '/logos/fast.png',
    email: 'admissions@nu.edu.pk', 
    phone: '+92 51 111 128 128', 
    address: 'Islamabad, Lahore, Karachi, Peshawar, CFD', 
    status: 'Active',
    accreditation: 'National Computing Education Accreditation Council (NCEAC Tier-1)',
    overview: 'FAST-NUCES is widely regarded as Pakistan’s software engineering powerhouse. Educating the developers, system architects, and technical founders behind top international tech unicorns, FAST is synonymous with programming mastery and demanding algorithmic curricula.',
    admissions: {
      cycle: 'Fall 2026 Admissions Open',
      deadline: 'July 5, 2026',
      entryTest: 'NU Online Computer-Based Test (NU CBT)',
      testDate: 'July 10 – 20, 2026',
      feeRange: 'PKR 185,000 – 210,000 / Semester',
      financialAid: 'Full Merit Scholarships for Top 3 Students in Every Department'
    },
    departments: [
      'Department of Computer Science',
      'Department of Software Engineering',
      'Department of Artificial Intelligence & Data Science',
      'Department of Cyber Security',
      'Department of Electrical Engineering & IoT'
    ],
    researchCenters: [
      'Center of Software Verification & Automated Testing',
      'Khyber Data Science & Big Data Lab',
      'National Center for Cyber Security (NCCS Affiliated Lab)',
      'Embedded IoT Systems Research Group'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80'
    ]
  },
  { 
    id: 'inst_7', 
    name: 'IBA (Institute of Business Administration)', 
    shortName: 'IBA',
    fullName: 'Institute of Business Administration Karachi',
    motto: 'Ideas for Tomorrow // Leadership Through Integrity',
    rank: 5,
    globalRank: 'QS Asia #450',
    nationalRank: '#05 National Rank',
    placementRate: '96.5%',
    establishedYear: '1955',
    campusArea: 'Dual Campuses (City & Main University Road)',
    studentEnrollment: '6,200+ Leaders',
    facultyCount: '310+ Distinguished Scholars',
    acceptanceRate: '12.0%',
    board: 'Sindh Board', 
    type: 'Chartered Business & Tech Institute', 
    createdAt: '2023-05-20', 
    rating: 4.8, 
    reviewsCount: '870 reviews',
    sector: 'Finance, Analytics & Management',
    image: '/universities/iba.jpg', 
    logo: '/logos/iba.png',
    email: 'info@iba.edu.pk', 
    phone: '+92 21 3810 4700', 
    address: 'University Road, Karachi, Pakistan', 
    status: 'Active',
    accreditation: 'AACSB Accredited • AMBA Member • HEC "W4" Highest Category',
    overview: 'Established in 1955 in collaboration with the Wharton School of the University of Pennsylvania, IBA is the oldest and most revered business school in Pakistan. IBA blends quantitative rigor, fintech analytics, and corporate leadership across its state-of-the-art dual campuses.',
    admissions: {
      cycle: 'Fall 2026 Admissions Open',
      deadline: 'June 18, 2026',
      entryTest: 'IBA Aptitude Test / SAT / GMAT',
      testDate: 'July 03, 2026',
      feeRange: 'PKR 260,000 – 320,000 / Semester',
      financialAid: '100% Need-Blind Admissions via IBA National Talent Hunt Program (NTHP)'
    },
    departments: [
      'School of Business Studies (SBS)',
      'School of Economics and Social Sciences (SESS)',
      'School of Mathematics and Computer Science (SMCS)'
    ],
    researchCenters: [
      'Center for Executive Education (CEE)',
      'Center for Excellence in Islamic Finance (CEIF)',
      'IBA Center for Business & Economic Research (CBER)',
      'IBA Aman Center for Entrepreneurial Development'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&q=80',
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80'
    ]
  },
  { 
    id: 'inst_2', 
    name: 'National College of Arts (NCA)', 
    shortName: 'NCA',
    fullName: 'National College of Arts Lahore & Rawalpindi',
    motto: 'Crafting Heritage, Designing Modernity',
    rank: 6,
    globalRank: 'QS Art & Design Top 200',
    nationalRank: '#06 National Rank',
    placementRate: '94.2%',
    establishedYear: '1875',
    campusArea: 'Historic Mall Road Heritage Campus',
    studentEnrollment: '2,100+ Creative Scholars',
    facultyCount: '160+ Master Artists & Architects',
    acceptanceRate: '5.8%',
    board: 'Punjab Board', 
    type: 'Federal Arts University', 
    createdAt: '2023-03-22', 
    rating: 4.8, 
    reviewsCount: '620 reviews',
    sector: 'Arts, Design & Architecture',
    image: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=800&q=80', 
    logo: '/logos/nca.svg',
    email: 'info@nca.edu.pk', 
    phone: '+92 42 9921 1622', 
    address: '4-Shahrah-e-Quaid-e-Azam, Lahore, Pakistan', 
    status: 'Active',
    accreditation: 'PCATP Accredited (Architecture) • HEC Recognized Federal Degree Awarding',
    overview: 'Originally founded in 1875 as the Mayo School of Industrial Arts by John Lockwood Kipling, NCA is South Asia’s historic sanctuary of fine arts, architectural conservation, visual communication, and cultural preservation.',
    admissions: {
      cycle: 'Fall 2026 Admissions Open',
      deadline: 'August 10, 2026',
      entryTest: 'NCA Studio Drawing & Aptitude Test',
      testDate: 'August 20 – 24, 2026',
      feeRange: 'PKR 140,000 – 175,000 / Semester',
      financialAid: 'Provincial Quota & Ministry of Culture Stipends Available'
    },
    departments: [
      'Department of Architecture & Urban Design',
      'Department of Fine Arts & Sculpture',
      'Department of Visual Communication Design',
      'Department of Film, TV & Multimedia Arts'
    ],
    researchCenters: [
      'Lockwood Kipling Heritage Archives',
      'Center for Architectural Conservation & Traditional Crafts',
      'NCA Digital Animation & VR Studio'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=800&q=80',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
      'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=800&q=80',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80'
    ]
  },
  { 
    id: 'inst_4', 
    name: 'Aga Khan University', 
    shortName: 'AKU',
    fullName: 'The Aga Khan University Medical & Health Sciences',
    motto: 'Impact in Health, Excellence in Human Well-being',
    rank: 7,
    globalRank: 'QS Clinical Medicine Top 150',
    nationalRank: '#07 National Rank',
    placementRate: '99.8%',
    establishedYear: '1983',
    campusArea: '85 Acres Health Sciences Campus',
    studentEnrollment: '3,200+ Medical Scholars',
    facultyCount: '580+ Clinicians & Scientists',
    acceptanceRate: '4.2%',
    board: 'Sindh Board', 
    type: 'International Medical University', 
    createdAt: '2023-08-05', 
    rating: 5.0, 
    reviewsCount: '2.1k reviews',
    sector: 'Health Sciences & Medicine',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80', 
    logo: '/logos/aku.svg',
    email: 'aku.karachi@aku.edu', 
    phone: '+92 21 3493 0051', 
    address: 'Stadium Road, Karachi, Pakistan', 
    status: 'Active',
    accreditation: 'PM&DC Accredited • Joint Commission International (JCI) Certified',
    overview: 'Aga Khan University (AKU) is an international institution renowned for transformative medical care, global clinical trials, and training the highest echelon of surgeons, biomedical researchers, and global healthcare leaders across Africa and Asia.',
    admissions: {
      cycle: 'Fall 2026 Admissions Open',
      deadline: 'May 31, 2026',
      entryTest: 'AKU Medical College Admission Test & MMI Interview',
      testDate: 'June 20, 2026',
      feeRange: 'Subsidized Medical Tuition + Full Need-Blind Support',
      financialAid: 'Over 75% of Medical Students Receive Generous Endowed Aid'
    },
    departments: [
      'Medical College & Surgical Sciences',
      'School of Nursing & Midwifery',
      'Institute for Educational Development (IED)',
      'Centre of Excellence in Women & Child Health'
    ],
    researchCenters: [
      'Clinical Research Unit & Vaccine Trials Center',
      'Stem Cell and Regenerative Medicine Facility',
      'Center of Excellence in Trauma & Emergency Care'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80',
      'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=800&q=80'
    ]
  }
];

export const addInstitute = (inst) => {
  institutes = [...institutes, { ...inst, id: 'inst_' + Date.now() }];
};

export const updateInstitute = (id, updates) => {
  institutes = institutes.map(i => i.id === id ? { ...i, ...updates } : i);
};

export const deleteInstitute = (id) => {
  institutes = institutes.filter(i => i.id !== id);
};

export let campus_branches = [
  { id: 'camp_1', instituteId: 'inst_1', name: 'NUST Main Campus (H-12)', address: 'Sector H-12, Islamabad', deletedAt: null },
  { id: 'camp_2', instituteId: 'inst_1', name: 'EME College Campus', address: 'Peshawar Road, Rawalpindi', deletedAt: null },
  { id: 'camp_3', instituteId: 'inst_2', name: 'NCA Lahore Campus', address: '4-Shahrah-e-Quaid-e-Azam, Lahore', deletedAt: null },
  { id: 'camp_4', instituteId: 'inst_3', name: 'LUMS Business Block', address: 'D.H.A. Phase 5, Lahore', deletedAt: null },
  { id: 'camp_5', instituteId: 'inst_4', name: 'AKUH Main Campus', address: 'Stadium Road, Karachi', deletedAt: null },
];

export const addCampus = (campus) => {
  campus_branches = [...campus_branches, { ...campus, id: 'camp_' + Date.now(), deletedAt: null }];
};

export const updateCampus = (id, updates) => {
  campus_branches = campus_branches.map(c => c.id === id ? { ...c, ...updates } : c);
};

export const deleteCampus = (id) => {
  campus_branches = campus_branches.filter(c => c.id !== id);
};

export let users = [
  // Super Admin
  { id: 'u_super1', email: 'super@eduhub.pk', passwordHash: 'hashed', role: 'super_admin', createdAt: '2023-01-01', updatedAt: '2024-01-01', name: 'System Admin', avatar: 'https://ui-avatars.com/api/?name=System+Admin' },
  // Institute Admins (Using a custom profile structure or just linking to campus/institute)
  { id: 'u_admin1', email: 'admin@nust.edu.pk', passwordHash: 'hashed', role: 'institute_admin', createdAt: '2023-01-16', updatedAt: '2024-01-01', name: 'Ahmed Ali', avatar: 'https://ui-avatars.com/api/?name=Ahmed+Ali' },
  // Campus Manager
  { id: 'u_manager1', email: 'manager.h12@nust.edu.pk', passwordHash: 'hashed', role: 'campus_manager', createdAt: '2023-02-15', updatedAt: '2024-01-01', name: 'Bilal Tariq', avatar: 'https://ui-avatars.com/api/?name=Bilal+Tariq' },
  // Teachers
  { id: 'u_teach1', email: 'dr.usman@nust.edu.pk', passwordHash: 'hashed', role: 'teacher', createdAt: '2023-02-01', updatedAt: '2024-01-01', name: 'Dr. Usman Khan', avatar: 'https://ui-avatars.com/api/?name=Usman+Khan' },
  { id: 'u_teach2', email: 'fatima@nca.edu.pk', passwordHash: 'hashed', role: 'teacher', createdAt: '2023-03-25', updatedAt: '2024-01-01', name: 'Fatima Tariq', avatar: 'https://ui-avatars.com/api/?name=Fatima+Tariq' },
  // Students
  { id: 'u_stud1', email: 'ali.raza@nust.edu.pk', passwordHash: 'hashed', role: 'student', createdAt: '2023-08-01', updatedAt: '2024-01-01', name: 'Ali Raza', avatar: 'https://ui-avatars.com/api/?name=Ali+Raza' },
  { id: 'u_stud2', email: 'zainab.b@nust.edu.pk', passwordHash: 'hashed', role: 'student', createdAt: '2023-08-02', updatedAt: '2024-01-01', name: 'Zainab Bilal', avatar: 'https://ui-avatars.com/api/?name=Zainab+Bilal' },
];

// --- 2. Profile Entities (Foreign Keys to Users & Campuses) ---

export const super_admins = [
  { id: 'sa_1', userId: 'u_super1', createdAt: '2023-01-01' }
];

export const institute_admins = [
  // Not explicitly in ER diagram, but necessary for the UI flow to know which inst they manage
  { id: 'ia_1', userId: 'u_admin1', instituteId: 'inst_1' }
];

export const campus_managers = [
  { id: 'cm_1', userId: 'u_manager1', campusId: 'camp_1', instituteId: 'inst_1' }
];

export let teacher_profiles = [
  { id: 'tp_1', userId: 'u_teach1', campusId: 'camp_1', department: 'Computer Science', designation: 'Associate Professor', qualification: 'Ph.D. Computer Science', phone: '+92 300 1234567', subjects: 'Advanced Web Design, Data Structures', joinDate: '2023-02-01', status: 'Active' },
  { id: 'tp_2', userId: 'u_teach2', campusId: 'camp_3', department: 'Fine Arts', designation: 'Senior Lecturer', qualification: 'M.F.A. Fine Arts', phone: '+92 321 9876543', subjects: 'Fine Arts Studio & Sculpting', joinDate: '2023-03-25', status: 'Active' },
];

export const addTeacher = ({ name, email, phone, department, designation, qualification, campusId, subjects, status = 'Active' }) => {
  const userId = 'u_' + Date.now();
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
  users = [...users, { id: userId, name, email, role: 'teacher', avatar, passwordHash: 'hashed', createdAt: new Date().toISOString().split('T')[0] }];
  teacher_profiles = [...teacher_profiles, {
    id: 'tp_' + Date.now(),
    userId,
    campusId,
    department: department || 'General',
    designation: designation || 'Instructor',
    qualification: qualification || 'Masters',
    phone: phone || '+92 300 0000000',
    subjects: subjects || 'General',
    joinDate: new Date().toISOString().split('T')[0],
    status
  }];
};

export const updateTeacher = (teacherProfileId, updates) => {
  const tp = teacher_profiles.find(t => t.id === teacherProfileId);
  if (tp && (updates.name || updates.email)) {
    users = users.map(u => u.id === tp.userId ? {
      ...u,
      name: updates.name || u.name,
      email: updates.email || u.email,
      avatar: updates.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(updates.name)}` : u.avatar
    } : u);
  }
  teacher_profiles = teacher_profiles.map(t => t.id === teacherProfileId ? { ...t, ...updates } : t);
};

export const deleteTeacher = (teacherProfileId) => {
  const tp = teacher_profiles.find(t => t.id === teacherProfileId);
  if (tp) {
    users = users.filter(u => u.id !== tp.userId);
  }
  teacher_profiles = teacher_profiles.filter(t => t.id !== teacherProfileId);
};

export let student_profiles = [
  { id: 'sp_1', userId: 'u_stud1', campusId: 'camp_1', rollNo: 'NUST-CS-2023-042', program: 'BS Computer Science', section: 'CS-4A', semester: '4th Semester', subjects: 'Advanced Web Design, Data Structures, AI', phone: '+92 333 5551234', guardianName: 'Muhammad Raza', guardianPhone: '+92 300 9998877', enrollmentStatus: 'Active', admissionDate: '2023-08-01' },
  { id: 'sp_2', userId: 'u_stud2', campusId: 'camp_1', rollNo: 'NUST-CS-2023-088', program: 'BS Computer Science', section: 'CS-4B', semester: '4th Semester', subjects: 'Advanced Web Design, Data Structures', phone: '+92 334 7776655', guardianName: 'Bilal Ahmed', guardianPhone: '+92 301 4443322', enrollmentStatus: 'Pending', admissionDate: '2023-08-02' },
];

export const addStudent = ({ name, email, phone, rollNo, program, section, semester, subjects, campusId, guardianName, guardianPhone, enrollmentStatus = 'Active' }) => {
  const userId = 'u_' + Date.now();
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
  users = [...users, { id: userId, name, email, role: 'student', avatar, passwordHash: 'hashed', createdAt: new Date().toISOString().split('T')[0] }];
  student_profiles = [...student_profiles, {
    id: 'sp_' + Date.now(),
    userId,
    campusId,
    rollNo: rollNo || ('NUST-' + Math.floor(1000 + Math.random() * 9000)),
    program: program || 'BS Computer Science',
    section: section || 'A',
    semester: semester || '1st Semester',
    subjects: subjects || 'General Core',
    phone: phone || '+92 333 0000000',
    guardianName: guardianName || 'Guardian',
    guardianPhone: guardianPhone || '+92 300 0000000',
    enrollmentStatus,
    admissionDate: new Date().toISOString().split('T')[0]
  }];
};

export const updateStudent = (studentProfileId, updates) => {
  const sp = student_profiles.find(s => s.id === studentProfileId);
  if (sp && (updates.name || updates.email)) {
    users = users.map(u => u.id === sp.userId ? {
      ...u,
      name: updates.name || u.name,
      email: updates.email || u.email,
      avatar: updates.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(updates.name)}` : u.avatar
    } : u);
  }
  student_profiles = student_profiles.map(s => s.id === studentProfileId ? { ...s, ...updates } : s);
};

export const deleteStudent = (studentProfileId) => {
  const sp = student_profiles.find(s => s.id === studentProfileId);
  if (sp) {
    users = users.filter(u => u.id !== sp.userId);
  }
  student_profiles = student_profiles.filter(s => s.id !== studentProfileId);
};

// --- 3. Activity Entities (Foreign Keys to Profiles) ---

export let class_schedules = [
  { id: 'cs_1', campusId: 'camp_1', teacherProfileId: 'tp_1', subject: 'Advanced Web Design', dayOfWeek: 'Monday & Wednesday', startTime: '10:00 AM', endTime: '12:00 PM', room: 'Lab 302', section: 'CS-4A' },
  { id: 'cs_2', campusId: 'camp_1', teacherProfileId: 'tp_1', subject: 'Data Structures & Algorithms', dayOfWeek: 'Tuesday & Thursday', startTime: '02:00 PM', endTime: '03:30 PM', room: 'Hall B', section: 'CS-3B' },
  { id: 'cs_3', campusId: 'camp_1', teacherProfileId: 'tp_1', subject: 'Artificial Intelligence', dayOfWeek: 'Friday', startTime: '09:00 AM', endTime: '12:00 PM', room: 'AI Research Lab', section: 'CS-4B' },
  { id: 'cs_4', campusId: 'camp_3', teacherProfileId: 'tp_2', subject: 'Fine Arts Studio & Sculpting', dayOfWeek: 'Mon, Wed, Fri', startTime: '09:00 AM', endTime: '01:00 PM', room: 'Studio 12', section: 'FA-2' },
];

export const addClassSchedule = (cls) => {
  class_schedules = [...class_schedules, { ...cls, id: 'cs_' + Date.now() }];
};

export const deleteClassSchedule = (id) => {
  class_schedules = class_schedules.filter(c => c.id !== id);
};

export let exam_schedules = [
  { id: 'ex_1', campusId: 'camp_1', subject: 'Advanced Web Design', examType: 'Midterm Exam', date: '2025-03-15', time: '10:00 AM - 01:00 PM', room: 'Examination Hall 1', invigilator: 'Dr. Usman Khan', totalMarks: 100 },
  { id: 'ex_2', campusId: 'camp_1', subject: 'Data Structures & Algorithms', examType: 'Midterm Exam', date: '2025-03-18', time: '02:00 PM - 05:00 PM', room: 'Auditorium A', invigilator: 'Dr. Pervez Hoodbhoy', totalMarks: 100 },
  { id: 'ex_3', campusId: 'camp_1', subject: 'Artificial Intelligence', examType: 'Final Exam', date: '2025-04-10', time: '09:00 AM - 12:00 PM', room: 'Computing Wing 4', invigilator: 'Dr. Usman Khan', totalMarks: 100 },
];

export const addExamSchedule = (exam) => {
  exam_schedules = [...exam_schedules, { ...exam, id: 'ex_' + Date.now() }];
};

export const deleteExamSchedule = (id) => {
  exam_schedules = exam_schedules.filter(e => e.id !== id);
};

export let teacher_attendance = [
  { id: 'ta_1', campusId: 'camp_1', teacherProfileId: 'tp_1', date: '2026-09-02', status: 'Present', checkInTime: '08:45 AM' },
  { id: 'ta_2', campusId: 'camp_3', teacherProfileId: 'tp_2', date: '2026-09-02', status: 'Present', checkInTime: '08:55 AM' },
];

export const updateTeacherAttendance = (teacherProfileId, campusId, status) => {
  const today = '2026-09-02';
  const existing = teacher_attendance.find(t => t.teacherProfileId === teacherProfileId && t.date === today);
  if (existing) {
    teacher_attendance = teacher_attendance.map(t => t.id === existing.id ? { ...t, status } : t);
  } else {
    teacher_attendance = [...teacher_attendance, { id: 'ta_' + Date.now(), campusId, teacherProfileId, date: today, status, checkInTime: '09:00 AM' }];
  }
};

export let attendance = [
  { id: 'att_1', campusId: 'camp_1', studentProfileId: 'sp_1', date: '2026-09-02', subject: 'Advanced Web Design', status: 'Present' },
  { id: 'att_2', campusId: 'camp_1', studentProfileId: 'sp_2', date: '2026-09-02', subject: 'Advanced Web Design', status: 'Absent' },
  { id: 'att_3', campusId: 'camp_1', studentProfileId: 'sp_1', date: '2026-09-01', subject: 'Data Structures', status: 'Present' },
  { id: 'att_4', campusId: 'camp_1', studentProfileId: 'sp_2', date: '2026-09-01', subject: 'Data Structures', status: 'Present' },
];

export const updateStudentAttendance = (studentProfileId, campusId, subject, status) => {
  const today = '2026-09-02';
  const existing = attendance.find(a => a.studentProfileId === studentProfileId && a.subject === subject && a.date === today);
  if (existing) {
    attendance = attendance.map(a => a.id === existing.id ? { ...a, status } : a);
  } else {
    attendance = [...attendance, { id: 'att_' + Date.now(), campusId, studentProfileId, date: today, subject, status }];
  }
};

export let student_performance = [
  { id: 'pf_1', campusId: 'camp_1', studentProfileId: 'sp_1', subject: 'Advanced Web Design', marks: 92, totalMarks: 100, grade: 'A+', gpa: 4.0, semester: 'Fall 2025', remarks: 'Exceptional UI/UX portfolio & project work' },
  { id: 'pf_2', campusId: 'camp_1', studentProfileId: 'sp_1', subject: 'Data Structures', marks: 88, totalMarks: 100, grade: 'A', gpa: 3.8, semester: 'Fall 2025', remarks: 'Strong algorithmic efficiency' },
  { id: 'pf_3', campusId: 'camp_1', studentProfileId: 'sp_2', subject: 'Advanced Web Design', marks: 74, totalMarks: 100, grade: 'B', gpa: 3.0, semester: 'Fall 2025', remarks: 'Good frontend code, needs backend polish' },
  { id: 'pf_4', campusId: 'camp_1', studentProfileId: 'sp_2', subject: 'Data Structures', marks: 68, totalMarks: 100, grade: 'C+', gpa: 2.7, semester: 'Fall 2025', remarks: 'Needs revision in dynamic programming' },
];

export let fee_records = [
  { id: 'fee_1', campusId: 'camp_1', studentProfileId: 'sp_1', voucherNo: 'VCH-9821', feeType: 'Semester Tuition Fee', amount: 85000, month: 'Fall 2025', dueDate: '2025-09-15', paidDate: '2025-09-10', status: 'Paid', paymentMethod: '1Link Online Bank Transfer' },
  { id: 'fee_2', campusId: 'camp_1', studentProfileId: 'sp_2', voucherNo: 'VCH-9822', feeType: 'Semester Tuition Fee', amount: 85000, month: 'Fall 2025', dueDate: '2025-09-15', paidDate: null, status: 'Pending', paymentMethod: 'Pending Payment' },
  { id: 'fee_3', campusId: 'camp_1', studentProfileId: 'sp_1', voucherNo: 'VCH-9940', feeType: 'Exam & Lab Access Fee', amount: 15000, month: 'Spring 2026', dueDate: '2026-03-01', paidDate: '2026-02-28', status: 'Paid', paymentMethod: 'KuickPay' },
  { id: 'fee_4', campusId: 'camp_1', studentProfileId: 'sp_2', voucherNo: 'VCH-9941', feeType: 'Exam & Lab Access Fee', amount: 15000, month: 'Spring 2026', dueDate: '2026-03-01', paidDate: null, status: 'Overdue', paymentMethod: 'Unpaid' },
];

export const markFeeAsPaid = (feeId, paymentMethod = '1Link Online') => {
  fee_records = fee_records.map(f => f.id === feeId ? { ...f, status: 'Paid', paidDate: '2026-09-02', paymentMethod } : f);
};

export const addFeeRecord = (fee) => {
  fee_records = [...fee_records, { ...fee, id: 'fee_' + Date.now(), voucherNo: 'VCH-' + Math.floor(1000 + Math.random() * 9000) }];
};

// --- 3. Academic & Classroom Entities (Assignments, Submissions, Diary) ---

export let assignments = [
  {
    id: 'asg_1',
    teacherProfileId: 'tp_1',
    subject: 'Advanced Web Design',
    section: 'CS-4A',
    campusId: 'camp_1',
    title: 'Responsive Dashboard Design & State Architecture',
    description: 'Implement a React dashboard with state synchronization, responsive grid, and clean typography tokens.',
    totalMarks: 50,
    dueDate: '2026-09-10',
    createdAt: '2026-09-01',
    status: 'Active'
  },
  {
    id: 'asg_2',
    teacherProfileId: 'tp_1',
    subject: 'Data Structures & Algorithms',
    section: 'CS-4A',
    campusId: 'camp_1',
    title: 'Balanced Binary Search Tree & Graph Traversal',
    description: 'Write an AVL tree implementation with automated rotations and Dijkstra shortest path algorithm.',
    totalMarks: 50,
    dueDate: '2026-09-15',
    createdAt: '2026-09-02',
    status: 'Active'
  },
  {
    id: 'asg_3',
    teacherProfileId: 'tp_1',
    subject: 'Advanced Web Design',
    section: 'CS-4A',
    campusId: 'camp_1',
    title: 'REST API Integration & JWT Auth Flow',
    description: 'Build robust token refresh, role guards, and Axios interceptors for client side requests.',
    totalMarks: 40,
    dueDate: '2026-08-25',
    createdAt: '2026-08-15',
    status: 'Completed'
  }
];

export const createAssignment = (asg) => {
  assignments = [{ ...asg, id: 'asg_' + Date.now(), createdAt: '2026-09-02', status: 'Active' }, ...assignments];
};

export const deleteAssignment = (id) => {
  assignments = assignments.filter(a => a.id !== id);
  submissions = submissions.filter(s => s.assignmentId !== id);
};

export let submissions = [
  {
    id: 'sub_1',
    assignmentId: 'asg_1',
    studentProfileId: 'sp_1',
    submittedAt: '2026-09-02 11:30 AM',
    submissionText: 'GitHub repo: github.com/ali-raza/eduhub-dashboard - Implemented role-based routing and live state mutators.',
    fileUrl: 'https://example.com/downloads/ali_raza_web_assignment.zip',
    marksObtained: null,
    status: 'Submitted',
    feedback: '',
    gradedAt: null
  },
  {
    id: 'sub_2',
    assignmentId: 'asg_3',
    studentProfileId: 'sp_1',
    submittedAt: '2026-08-24 04:15 PM',
    submissionText: 'Implemented JWT auth with secure HTTP cookies and bearer tokens.',
    fileUrl: 'https://example.com/downloads/ali_jwt_auth.zip',
    marksObtained: 38,
    status: 'Graded',
    feedback: 'Excellent clean architecture and proper error boundary handling!',
    gradedAt: '2026-08-26'
  },
  {
    id: 'sub_3',
    assignmentId: 'asg_1',
    studentProfileId: 'sp_2',
    submittedAt: '2026-09-02 01:20 PM',
    submissionText: 'Figma wireframes and initial React prototype attached.',
    fileUrl: 'https://example.com/downloads/zainab_dashboard_v1.zip',
    marksObtained: null,
    status: 'Submitted',
    feedback: '',
    gradedAt: null
  }
];

export const submitAssignment = ({ assignmentId, studentProfileId, submissionText, fileUrl }) => {
  const existing = submissions.find(s => s.assignmentId === assignmentId && s.studentProfileId === studentProfileId);
  if (existing) {
    submissions = submissions.map(s => s.id === existing.id ? {
      ...s,
      submittedAt: '2026-09-02 ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      submissionText,
      fileUrl: fileUrl || s.fileUrl,
      status: 'Submitted'
    } : s);
  } else {
    submissions = [{
      id: 'sub_' + Date.now(),
      assignmentId,
      studentProfileId,
      submittedAt: '2026-09-02 ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      submissionText,
      fileUrl: fileUrl || 'https://example.com/downloads/student_submission.pdf',
      marksObtained: null,
      status: 'Submitted',
      feedback: '',
      gradedAt: null
    }, ...submissions];
  }
};

export const gradeSubmission = (submissionId, marksObtained, feedback) => {
  submissions = submissions.map(s => s.id === submissionId ? {
    ...s,
    marksObtained: Number(marksObtained),
    feedback: feedback || 'Graded by instructor',
    status: 'Graded',
    gradedAt: '2026-09-02'
  } : s);
};

export let daily_diary = [
  {
    id: 'diary_1',
    teacherProfileId: 'tp_1',
    subject: 'Advanced Web Design',
    section: 'CS-4A',
    campusId: 'camp_1',
    date: '2026-09-02',
    topic: 'React 19 Hooks, Context API & Enterprise Architecture',
    summary: 'Discussed clean separation of concerns, global CSS tokens, and responsive dashboards.',
    homework: 'Complete Assignment 1 wireframe implementation and push code to Git repository.',
    resources: 'Read React Docs (Beta) on useActionState and Vite Rolldown build configurations.'
  },
  {
    id: 'diary_2',
    teacherProfileId: 'tp_1',
    subject: 'Data Structures & Algorithms',
    section: 'CS-4A',
    campusId: 'camp_1',
    date: '2026-09-01',
    topic: 'Graph Theory & Dijkstra Shortest Path Algorithm',
    summary: 'Analyzed adjacency lists, priority queues, and time complexity in sparse graphs.',
    homework: 'Solve LeetCode problem 743 (Network Delay Time) and submit solution in C++ or Python.',
    resources: 'GeeksforGeeks Dijkstra tutorial & MIT 6.006 Lecture 16 notes.'
  }
];

export const addDailyDiary = (entry) => {
  daily_diary = [{ ...entry, id: 'diary_' + Date.now(), date: entry.date || '2026-09-02' }, ...daily_diary];
};

export const deleteDailyDiary = (id) => {
  daily_diary = daily_diary.filter(d => d.id !== id);
};

export const recordStudentGrade = ({ studentProfileId, campusId, subject, marks, totalMarks = 100, remarks = '', semester = 'Fall 2025' }) => {
  const score = Number(marks);
  let grade = 'F';
  let gpa = 0.0;
  if (score >= 90) { grade = 'A+'; gpa = 4.0; }
  else if (score >= 85) { grade = 'A'; gpa = 3.8; }
  else if (score >= 80) { grade = 'B+'; gpa = 3.4; }
  else if (score >= 70) { grade = 'B'; gpa = 3.0; }
  else if (score >= 60) { grade = 'C'; gpa = 2.4; }
  else if (score >= 50) { grade = 'D'; gpa = 2.0; }

  const existing = student_performance.find(p => p.studentProfileId === studentProfileId && p.subject === subject && p.semester === semester);
  if (existing) {
    student_performance = student_performance.map(p => p.id === existing.id ? { ...p, marks: score, totalMarks, grade, gpa, remarks } : p);
  } else {
    student_performance = [...student_performance, {
      id: 'pf_' + Date.now(),
      campusId,
      studentProfileId,
      subject,
      marks: score,
      totalMarks,
      grade,
      gpa,
      semester,
      remarks: remarks || 'Recorded by instructor'
    }];
  }
};

export function getCampusFees(campusId) {
  return fee_records
    .filter(f => f.campusId === campusId)
    .map(f => {
      const sp = student_profiles.find(s => s.id === f.studentProfileId);
      const studentUser = sp ? users.find(u => u.id === sp.userId) : null;
      return { ...f, studentName: studentUser?.name || 'Student', studentEmail: studentUser?.email, avatar: studentUser?.avatar };
    });
}

// --- Helper functions to simulate backend JOIN queries ---

export function getFullUserRecord(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  let profile = null;
  if (user.role === 'super_admin') profile = super_admins.find(p => p.userId === userId);
  if (user.role === 'institute_admin') profile = institute_admins.find(p => p.userId === userId);
  if (user.role === 'campus_manager') profile = campus_managers.find(p => p.userId === userId);
  if (user.role === 'teacher') profile = teacher_profiles.find(p => p.userId === userId);
  if (user.role === 'student') profile = student_profiles.find(p => p.userId === userId);

  return { ...user, profile };
}

export const academic_programs = [
  // NUST (inst_1)
  { id: 'prog_nust_1', instituteId: 'inst_1', name: 'BS Computer Science', degree: 'Undergraduate', department: 'School of Electrical Engineering & Computer Science (SEECS)', duration: '4 Years (8 Semesters)', creditHours: 134, feePerSemester: 'PKR 195,000', seats: 120, accreditation: 'NCEAC Tier-1 • HEC Approved', eligibility: 'Min 60% in HSSC (Pre-Eng / ICS) + NET Score', description: 'Advanced curriculum focusing on distributed systems, AI architectures, operating systems, and scalable cloud computing.' },
  { id: 'prog_nust_2', instituteId: 'inst_1', name: 'BS Software Engineering', degree: 'Undergraduate', department: 'SEECS', duration: '4 Years (8 Semesters)', creditHours: 136, feePerSemester: 'PKR 195,000', seats: 100, accreditation: 'NCEAC Tier-1 • PEC Washington Accord', eligibility: 'Min 60% in HSSC + NET Score', description: 'Rigorous software development lifecycle, microservices architecture, automated CI/CD pipelines, and enterprise engineering.' },
  { id: 'prog_nust_3', instituteId: 'inst_1', name: 'BS Artificial Intelligence', degree: 'Undergraduate', department: 'SEECS', duration: '4 Years (8 Semesters)', creditHours: 132, feePerSemester: 'PKR 205,000', seats: 60, accreditation: 'HEC & NCEAC Certified', eligibility: 'Min 60% in HSSC with Mathematics', description: 'Deep learning, neural networks, computer vision, natural language processing, and autonomous decision systems.' },
  { id: 'prog_nust_4', instituteId: 'inst_1', name: 'BE Electrical Engineering', degree: 'Undergraduate', department: 'SEECS / CEME', duration: '4 Years (8 Semesters)', creditHours: 138, feePerSemester: 'PKR 185,000', seats: 150, accreditation: 'PEC Level-II (Washington Accord)', eligibility: 'Min 60% in HSSC Pre-Engineering', description: 'Embedded robotics, telecom signal processing, RF design, and next-gen smart power grid architectures.' },
  { id: 'prog_nust_5', instituteId: 'inst_1', name: 'Bachelor of Business Admin (BBA)', degree: 'Undergraduate', department: 'NUST Business School (NBS)', duration: '4 Years (8 Semesters)', creditHours: 132, feePerSemester: 'PKR 210,000', seats: 140, accreditation: 'NBEAC "W" Category', eligibility: 'Min 60% in FA/FSc/A-Levels', description: 'Corporate finance, global marketing analytics, strategic innovation, and venture incubation.' },
  { id: 'prog_nust_6', instituteId: 'inst_1', name: 'MS Data Science & Big Data', degree: 'Graduate', department: 'SEECS', duration: '2 Years (4 Semesters)', creditHours: 33, feePerSemester: 'PKR 165,000', seats: 45, accreditation: 'HEC Approved Postgrad', eligibility: '16 Years Education in CS/SE/EE with min 2.5 CGPA', description: 'Advanced statistical modeling, big data pipeline clustering, and large language model engineering.' },
  { id: 'prog_nust_7', instituteId: 'inst_1', name: 'PhD Computer Science', degree: 'Postgraduate', department: 'SEECS', duration: '3 – 5 Years', creditHours: 48, feePerSemester: 'Full Research Fellowship', seats: 15, accreditation: 'HEC Recognized Doctorate', eligibility: 'MS/MPhil with 3.0+ CGPA + GAT Subject', description: 'Cutting-edge theoretical and applied research in cybersecurity, computer vision, and distributed ledger protocols.' },

  // LUMS (inst_3)
  { id: 'prog_lums_1', instituteId: 'inst_3', name: 'BSc (Honours) Computer Science', degree: 'Undergraduate', department: 'Syed Babar Ali School of Science & Engineering (SBASSE)', duration: '4 Years (8 Semesters)', creditHours: 130, feePerSemester: 'PKR 380,000', seats: 130, accreditation: 'NCEAC Tier-1 • HEC Recognized', eligibility: 'Top Percentile in LCAT / SAT + Inter/A-Levels', description: 'World-class computer science curriculum rooted in algorithmic foundations, systems research, and human-computer interaction.' },
  { id: 'prog_lums_2', instituteId: 'inst_3', name: 'BSc (Honours) Economics & Math', degree: 'Undergraduate', department: 'Mushtaq Ahmad Gurmani School (MGSHSS)', duration: '4 Years (8 Semesters)', creditHours: 130, feePerSemester: 'PKR 360,000', seats: 90, accreditation: 'HEC Premier Category', eligibility: 'High SAT score + Analytical Aptitude', description: 'Rigorous quantitative macroeconomics, econometric modeling, behavioral economics, and financial game theory.' },
  { id: 'prog_lums_3', instituteId: 'inst_3', name: 'BSc Accounting & Finance', degree: 'Undergraduate', department: 'Suleman Dawood School of Business (SDSB)', duration: '4 Years (8 Semesters)', creditHours: 132, feePerSemester: 'PKR 390,000', seats: 120, accreditation: 'AACSB Accredited', eligibility: 'LCAT / SAT + Comprehensive Interview', description: 'Investment banking, valuation analysis, corporate restructuring, and global capital markets.' },
  { id: 'prog_lums_4', instituteId: 'inst_3', name: 'Master of Business Admin (MBA)', degree: 'Graduate', department: 'SDSB', duration: '2 Years (Full Time)', creditHours: 66, feePerSemester: 'PKR 480,000', seats: 75, accreditation: 'AACSB Accredited', eligibility: 'Undergraduate Degree + 2+ Yrs Experience + GMAT/GRE/LMAT', description: 'Harvard-pioneered case-method instruction cultivating visionary corporate leaders and entrepreneurs.' },
  { id: 'prog_lums_5', instituteId: 'inst_3', name: 'MS Technology Management & AI', degree: 'Graduate', department: 'SBASSE', duration: '2 Years', creditHours: 36, feePerSemester: 'PKR 320,000', seats: 40, accreditation: 'HEC Certified Graduate Degree', eligibility: 'BS in STEM field with 2.8+ CGPA', description: 'Bridging frontier artificial intelligence research with high-growth technology enterprise governance.' },

  // GIKI (inst_5)
  { id: 'prog_giki_1', instituteId: 'inst_5', name: 'BS Computer Science', degree: 'Undergraduate', department: 'Faculty of Computer Science & Engineering (FCSE)', duration: '4 Years (8 Semesters)', creditHours: 134, feePerSemester: 'PKR 250,000', seats: 90, accreditation: 'NCEAC Tier-1 • HEC Approved', eligibility: 'GIKI Entry Test / SAT Mathematics', description: 'Intensive computational theory, high-performance computing clusters, parallel algorithms, and compilers.' },
  { id: 'prog_giki_2', instituteId: 'inst_5', name: 'BS Cyber Security', degree: 'Undergraduate', department: 'FCSE', duration: '4 Years (8 Semesters)', creditHours: 134, feePerSemester: 'PKR 250,000', seats: 50, accreditation: 'NCEAC Certified', eligibility: 'GIKI Entry Test (Top Rank)', description: 'Offensive security, cryptographic systems, reverse engineering, cloud security, and digital forensics.' },
  { id: 'prog_giki_3', instituteId: 'inst_5', name: 'BS Mechanical Engineering', degree: 'Undergraduate', department: 'Faculty of Mechanical Engineering (FME)', duration: '4 Years (8 Semesters)', creditHours: 138, feePerSemester: 'PKR 230,000', seats: 100, accreditation: 'PEC Level-II (Washington Accord)', eligibility: 'FSc Pre-Engineering with 60%+', description: 'Computational thermodynamics, aerodynamics, CAD/CAM manufacturing, and autonomous vehicle prototyping.' },
  { id: 'prog_giki_4', instituteId: 'inst_5', name: 'BS Materials & Chemical Engineering', degree: 'Undergraduate', department: 'FMCE', duration: '4 Years (8 Semesters)', creditHours: 136, feePerSemester: 'PKR 220,000', seats: 60, accreditation: 'PEC Washington Accord Certified', eligibility: 'FSc Pre-Engineering', description: 'Polymer science, semiconductor fabrication, nanotechnology, and advanced metallurgical testing.' },

  // FAST (inst_6)
  { id: 'prog_fast_1', instituteId: 'inst_6', name: 'BS Computer Science', degree: 'Undergraduate', department: 'Department of Computer Science', duration: '4 Years (8 Semesters)', creditHours: 130, feePerSemester: 'PKR 190,000', seats: 250, accreditation: 'NCEAC Tier-1 (W Category)', eligibility: 'NU CBT / SAT (Min 60% in Intermediate)', description: 'The gold standard of programming curricula in Pakistan. Deep mastery of data structures, algorithms, and low-level systems.' },
  { id: 'prog_fast_2', instituteId: 'inst_6', name: 'BS Software Engineering', degree: 'Undergraduate', department: 'Department of Software Engineering', duration: '4 Years (8 Semesters)', creditHours: 130, feePerSemester: 'PKR 190,000', seats: 180, accreditation: 'NCEAC Tier-1 Accredited', eligibility: 'NU CBT Entrance Exam', description: 'Enterprise software architecture, test-driven engineering, distributed microservices, and Agile scaling.' },
  { id: 'prog_fast_3', instituteId: 'inst_6', name: 'BS Artificial Intelligence', degree: 'Undergraduate', department: 'School of Computing', duration: '4 Years (8 Semesters)', creditHours: 130, feePerSemester: 'PKR 195,000', seats: 120, accreditation: 'HEC & NCEAC Certified', eligibility: 'NU CBT Entrance Exam', description: 'Machine learning, predictive models, reinforcement learning, computer vision, and neural reasoning.' },
  { id: 'prog_fast_4', instituteId: 'inst_6', name: 'BS Data Science', degree: 'Undergraduate', department: 'School of Computing', duration: '4 Years (8 Semesters)', creditHours: 130, feePerSemester: 'PKR 190,000', seats: 90, accreditation: 'NCEAC Approved', eligibility: 'NU CBT Entrance Exam', description: 'Data wrangling, modern distributed databases, statistical inference, and automated ML pipelines.' },

  // IBA (inst_7)
  { id: 'prog_iba_1', instituteId: 'inst_7', name: 'Bachelor of Business Admin (BBA)', degree: 'Undergraduate', department: 'School of Business Studies (SBS)', duration: '4 Years (8 Semesters)', creditHours: 144, feePerSemester: 'PKR 285,000', seats: 180, accreditation: 'AACSB Accredited • HEC Premier', eligibility: 'IBA Aptitude Test / SAT 1270+', description: 'Pakistan’s premier corporate leadership curriculum. Comprehensive case studies, live company audits, and managerial finance.' },
  { id: 'prog_iba_2', instituteId: 'inst_7', name: 'BS Computer Science', degree: 'Undergraduate', department: 'School of Mathematics and Computer Science (SMCS)', duration: '4 Years (8 Semesters)', creditHours: 132, feePerSemester: 'PKR 250,000', seats: 100, accreditation: 'NCEAC Tier-1 Accredited', eligibility: 'IBA CS Aptitude Test / SAT', description: 'Interdisciplinary computing with a strong fintech and business analytics orientation.' },
  { id: 'prog_iba_3', instituteId: 'inst_7', name: 'BS Economics & Mathematics', degree: 'Undergraduate', department: 'School of Economics and Social Sciences (SESS)', duration: '4 Years (8 Semesters)', creditHours: 132, feePerSemester: 'PKR 245,000', seats: 80, accreditation: 'HEC Recognized', eligibility: 'IBA Aptitude Test with high Math score', description: 'Quantitative macroeconomic policy, sovereign debt research, and financial risk modeling.' },
  { id: 'prog_iba_4', instituteId: 'inst_7', name: 'Master of Business Admin (MBA)', degree: 'Graduate', department: 'SBS', duration: '2 Years (Morning / Evening)', creditHours: 66, feePerSemester: 'PKR 340,000', seats: 90, accreditation: 'AACSB Accredited', eligibility: 'Bachelors + 2+ Yrs Work Experience + IBA Test', description: 'Executive leadership, strategic turnaround, venture capital investment, and emerging market governance.' },

  // NCA (inst_2)
  { id: 'prog_nca_1', instituteId: 'inst_2', name: 'Bachelor of Architecture (B.Arch)', degree: 'Undergraduate', department: 'Department of Architecture', duration: '5 Years (10 Semesters)', creditHours: 172, feePerSemester: 'PKR 165,000', seats: 65, accreditation: 'PCATP Accredited Level-1', eligibility: 'NCA Studio Drawing Test & Portfolio Review', description: 'Mastery of urban design, parametric architecture, heritage conservation, and environmental construction.' },
  { id: 'prog_nca_2', instituteId: 'inst_2', name: 'Bachelor of Fine Arts (BFA)', degree: 'Undergraduate', department: 'Department of Fine Arts', duration: '4 Years (8 Semesters)', creditHours: 136, feePerSemester: 'PKR 145,000', seats: 50, accreditation: 'HEC Recognized Professional Degree', eligibility: 'Studio Drawing & Visual Aptitude Test', description: 'Contemporary painting, sculpture, installation arts, printmaking, and South Asian miniature painting.' },
  { id: 'prog_nca_3', instituteId: 'inst_2', name: 'Bachelor of Visual Communication Design', degree: 'Undergraduate', department: 'Department of Design', duration: '4 Years (8 Semesters)', creditHours: 134, feePerSemester: 'PKR 155,000', seats: 55, accreditation: 'HEC Recognized', eligibility: 'Aptitude Test + Creative Portfolio', description: 'Digital product design, brand identity systems, motion graphics, and interactive user experiences.' },

  // AKU (inst_4)
  { id: 'prog_aku_1', instituteId: 'inst_4', name: 'Bachelor of Medicine & Surgery (MBBS)', degree: 'Undergraduate', department: 'Medical College', duration: '5 Years (Professional)', creditHours: 240, feePerSemester: 'Subsidized Merit Tuition', seats: 100, accreditation: 'PM&DC Accredited • WHO Recognized • JCI Certified', eligibility: 'AKU Medical College Test + MMI Interviews (Top 3%)', description: 'World-renowned medical training integrating international clinical rotations, bioethics, and patient-centered diagnostics.' },
  { id: 'prog_aku_2', instituteId: 'inst_4', name: 'BSc in Nursing (BScN)', degree: 'Undergraduate', department: 'School of Nursing & Midwifery', duration: '4 Years (8 Semesters)', creditHours: 136, feePerSemester: 'Generously Endowed', seats: 120, accreditation: 'PNC Certified • Global Health Alliance', eligibility: 'Inter Pre-Medical with 50%+ & AKU Test', description: 'Critical care, pediatric intensive care, oncology nursing, and global clinical epidemiology.' },
  { id: 'prog_aku_3', instituteId: 'inst_4', name: 'Master of Health Policy & Management', degree: 'Graduate', department: 'Community Health Sciences', duration: '2 Years', creditHours: 42, feePerSemester: 'PKR 280,000', seats: 25, accreditation: 'HEC & PM&DC Approved', eligibility: 'MBBS / Health Science Degree + Clinical Exp', description: 'Healthcare system economics, hospital administration, epidemic surveillance, and public health policy.' }
];

export function getInstituteData(instituteId) {
  if (!instituteId) return null;
  const target = String(instituteId).toLowerCase().trim();

  // Smart resolver: matches id, shortName, numeric string, or aliases
  const inst = institutes.find(i => 
    i.id.toLowerCase() === target ||
    i.shortName.toLowerCase() === target ||
    i.id.toLowerCase() === `inst_${target}` ||
    (target === '1' && i.id === 'inst_1') ||
    (target === '2' && i.id === 'inst_2') ||
    (target === '3' && i.id === 'inst_3') ||
    (target === '4' && i.id === 'inst_4') ||
    (target === '5' && i.id === 'inst_5') ||
    (target === '6' && i.id === 'inst_6') ||
    (target === '7' && i.id === 'inst_7')
  ) || institutes[0];

  const branches = campus_branches.filter(cb => cb.instituteId === inst.id);
  const branchIds = branches.map(b => b.id);
  const students = student_profiles.filter(sp => branchIds.includes(sp.campusId));
  const teachers = teacher_profiles.filter(tp => branchIds.includes(tp.campusId));

  const instPrograms = academic_programs.filter(p => p.instituteId === inst.id);
  const instFaculty = trainers.filter(t => t.instituteId === inst.id);
  const instAlumni = top_alumni.filter(a => a.instituteId === inst.id);
  const instFacilities = facilities.filter(f => f.instituteId === inst.id);
  const instEvents = events.filter(e => e.instituteId === inst.id);

  return { 
    ...inst, 
    branches, 
    totalStudents: students.length, 
    totalTeachers: teachers.length, 
    students, 
    teachers,
    programs: instPrograms,
    facultyList: instFaculty,
    alumniList: instAlumni,
    facilitiesList: instFacilities,
    eventsList: instEvents
  };
}

export function getAlumniData(alumniId) {
  if (!alumniId) return null;
  const target = String(alumniId).toLowerCase().trim();

  const alumnus = top_alumni.find(a => 
    a.id.toLowerCase() === target ||
    a.id.toLowerCase() === `al_${target}` ||
    (target === '1' && a.id === 'al_1') ||
    a.name.toLowerCase().replace(/\s+/g, '-').includes(target)
  ) || top_alumni[0];

  const institute = institutes.find(i => i.id === alumnus.instituteId) || institutes[0];
  const peerAlumni = top_alumni.filter(a => a.id !== alumnus.id && (a.instituteId === alumnus.instituteId || a.category === alumnus.category)).slice(0, 3);

  return {
    ...alumnus,
    institute,
    peerAlumni
  };
}


export function getCampusFullData(campusId) {
  const campus = campus_branches.find(c => c.id === campusId);
  if (!campus) return null;

  const parentInstitute = institutes.find(i => i.id === campus.instituteId);
  
  const teachers = teacher_profiles
    .filter(tp => tp.campusId === campusId)
    .map(tp => ({ ...tp, user: users.find(u => u.id === tp.userId) }));

  const students = student_profiles
    .filter(sp => sp.campusId === campusId)
    .map(sp => ({ ...sp, user: users.find(u => u.id === sp.userId) }));

  const classes = class_schedules
    .filter(cs => cs.campusId === campusId)
    .map(cs => {
      const tp = teacher_profiles.find(t => t.id === cs.teacherProfileId);
      const teacherUser = tp ? users.find(u => u.id === tp.userId) : null;
      return { ...cs, teacherName: teacherUser?.name || 'Assigned Instructor' };
    });

  const exams = exam_schedules.filter(ex => ex.campusId === campusId);

  const teacherAttendanceToday = teachers.map(t => {
    const record = teacher_attendance.find(ta => ta.teacherProfileId === t.id && ta.date === '2026-09-02');
    return {
      teacher: t,
      status: record?.status || 'Present',
      checkInTime: record?.checkInTime || '09:00 AM'
    };
  });

  const studentAttendanceRecords = attendance
    .filter(a => a.campusId === campusId)
    .map(a => {
      const sp = student_profiles.find(s => s.id === a.studentProfileId);
      const studentUser = sp ? users.find(u => u.id === sp.userId) : null;
      return { ...a, studentName: studentUser?.name || 'Student', email: studentUser?.email };
    });

  const performanceRecords = student_performance
    .filter(p => p.campusId === campusId)
    .map(p => {
      const sp = student_profiles.find(s => s.id === p.studentProfileId);
      const studentUser = sp ? users.find(u => u.id === sp.userId) : null;
      return { ...p, studentName: studentUser?.name || 'Student', avatar: studentUser?.avatar };
    });

  return {
    campus,
    parentInstitute,
    teachers,
    students,
    classes,
    exams,
    teacherAttendanceToday,
    studentAttendanceRecords,
    performanceRecords
  };
}

// --- 4. Public Page Entities ---

export const top_alumni = [
  // NUST (inst_1)
  { 
    id: 'al_1', 
    name: 'Sadia Hassan', 
    role: 'Staff Software Engineer', 
    company: 'Google', 
    location: 'Mountain View, CA', 
    badge: 'Distributed Systems', 
    year: 'Class of 2018', 
    degree: 'BS Computer Science',
    department: 'School of Electrical Engineering & Computer Science (SEECS)',
    campus: 'Sector H-12 Main Campus, Islamabad',
    cgpa: '3.94 / 4.00',
    honors: 'Rector’s Gold Medal • Summa Cum Laude',
    thesis: 'High-Throughput Byzantine Fault-Tolerant Consensus in Sharded Distributed Systems',
    category: 'Tech & AI',
    skills: ['Distributed Systems', 'Go / C++', 'Kubernetes', 'Cloud Infrastructure', 'RPC Microservices'],
    verifiedId: 'EDU-PK-2018-SEECS-0492',
    picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', 
    successStory: 'Secured a core distributed systems role at Google after building her undergraduate AI thesis at SEECS.',
    advice: 'NUST taught me that world-class engineering is about relentless curiosity and mathematical foundation. If you want to solve planetary-scale problems, SEECS is second to none.',
    careerJourney: [
      { year: '2014 - 2018', role: 'Undergraduate Scholar', org: 'NUST SEECS', desc: 'Conducted high-performance networking research, President ACM Student Chapter.' },
      { year: '2018 - 2020', role: 'Software Engineer', org: 'Systems Ltd', desc: 'Engineered cloud messaging pipelines for fintech clients.' },
      { year: '2020 - 2023', role: 'Senior Systems Engineer', org: 'Google Cloud', desc: 'Maintained global storage cluster coordination protocols.' },
      { year: '2023 - Present', role: 'Staff Software Engineer', org: 'Google Core Infra', desc: 'Leading next-generation data routing architecture in Silicon Valley.' }
    ],
    instituteId: 'inst_1' 
  },
  { 
    id: 'al_3', 
    name: 'Dr. Ayesha Khan', 
    role: 'Lead AI Scientist', 
    company: 'Google DeepMind', 
    location: 'London, UK', 
    badge: 'AI & Neural Systems', 
    year: 'Class of 2016', 
    degree: 'BS Software Engineering',
    department: 'School of Electrical Engineering & Computer Science (SEECS)',
    campus: 'Sector H-12 Main Campus, Islamabad',
    cgpa: '3.98 / 4.00',
    honors: 'President’s Gold Medal • Chancellor’s Citation',
    thesis: 'Attention-based Multi-modal Representation Learning for Cross-lingual Understanding',
    category: 'Tech & AI',
    skills: ['Deep Learning', 'PyTorch', 'Transformer Architectures', 'Multimodal LLMs', 'Reinforcement Learning'],
    verifiedId: 'EDU-PK-2016-SEECS-0108',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', 
    successStory: 'Published 14+ top tier NeurIPS & CVPR papers on multimodal neural systems and low-resource NLP.',
    advice: 'Don’t treat coursework as just exams—dive into the research labs at NUST early. The mentors at NCAI and SEECS opened doors that led directly to Oxford and DeepMind.',
    careerJourney: [
      { year: '2012 - 2016', role: 'BS Software Engineering', org: 'NUST SEECS', desc: 'Published 2 undergraduate IEEE conference papers on neural speech parsing.' },
      { year: '2016 - 2020', role: 'DPhil in Machine Learning', org: 'University of Oxford', desc: 'Clarendon Scholar, doctoral research on attention mechanisms.' },
      { year: '2020 - Present', role: 'Lead AI Scientist', org: 'Google DeepMind', desc: 'Spearheading frontier multimodal model alignment and reasoning.' }
    ],
    instituteId: 'inst_1' 
  },
  { 
    id: 'al_6', 
    name: 'Zain Ul Abideen', 
    role: 'Founder & CEO', 
    company: 'Orbit EdTech', 
    location: 'San Francisco, CA', 
    badge: 'Unicorn Founder', 
    year: 'Class of 2020', 
    degree: 'BS Electrical Engineering',
    department: 'School of Mechanical & Manufacturing Engineering (SMME)',
    campus: 'Sector H-12 Main Campus, Islamabad',
    cgpa: '3.82 / 4.00',
    honors: 'Technology Incubation Center (TICE) Innovator of the Year',
    thesis: 'Low-cost 3D Spatial Audio & Haptic Tele-education Interfaces for Remote Classrooms',
    category: 'Tech & AI',
    skills: ['Product Strategy', 'Venture Capital', '3D Graphics', 'EdTech Scale', 'Hardware-Software Co-Design'],
    verifiedId: 'EDU-PK-2020-SMME-0784',
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', 
    successStory: 'Raised $2.4M seed round from Silicon Valley VCs to revolutionize 3D gamified STEM learning across developing nations.',
    advice: 'NUST provides a startup launchpad that is unmatched in South Asia. Take full advantage of TICE and build real hardware prototypes before you graduate.',
    careerJourney: [
      { year: '2016 - 2020', role: 'BS Electrical Engineering', org: 'NUST', desc: 'Won National Startup Cup at NUST TICE incubation wing.' },
      { year: '2020 - 2021', role: 'Y Combinator Fellow', org: 'Y Combinator (W21)', desc: 'Accelerated Orbit from Islamabad into a global SaaS platform.' },
      { year: '2021 - Present', role: 'CEO & Founder', org: 'Orbit EdTech', desc: 'Serving 450,000+ students across 12 countries with 3D interactive learning.' }
    ],
    instituteId: 'inst_1' 
  },

  // LUMS (inst_3)
  { 
    id: 'al_4', 
    name: 'Fahad Mustafa', 
    role: 'Co-Founder & CPO', 
    company: 'FinPulse', 
    location: 'Dubai, UAE', 
    badge: 'FinTech Leadership', 
    year: 'Class of 2017', 
    degree: 'BSc (Hons) Management Science',
    department: 'Suleman Dawood School of Business (SDSB)',
    campus: 'D.H.A. Phase 5, Lahore',
    cgpa: '3.89 / 4.00',
    honors: 'Dean’s Honor Roll • Best Business Plan Award',
    thesis: 'Democratizing Cross-Border Peer-to-Peer Settlement Rails in MENA',
    category: 'Business & Finance',
    skills: ['FinTech Infrastructure', 'Product Management', 'Cross-Border Payments', 'MENA Regulatory Affairs', 'Scale-up Growth'],
    verifiedId: 'EDU-PK-2017-LUMS-0912',
    picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', 
    successStory: 'Built one of the fastest growing digital payment gateways processing $80M+ annually across MENA.',
    advice: 'LUMS gave me a worldview where ambiguity is an opportunity, not a roadblock. The case-study method in SDSB directly prepared me for the chaos of scaling a multi-million-dollar fintech.',
    careerJourney: [
      { year: '2013 - 2017', role: 'BSc Management Science', org: 'LUMS SDSB', desc: 'President LUMS Entrepreneurial Society (LES).' },
      { year: '2017 - 2019', role: 'Product Manager', org: 'Careem Pay', desc: 'Built wallet infrastructure for 10M+ riders across UAE & Pakistan.' },
      { year: '2019 - Present', role: 'Co-Founder & Chief Product Officer', org: 'FinPulse', desc: 'Scaled gateway to 14,000 active enterprise merchants in GCC.' }
    ],
    instituteId: 'inst_3' 
  },
  { 
    id: 'al_7', 
    name: 'Mahnoor Tariq', 
    role: 'Engagement Manager', 
    company: 'McKinsey & Company', 
    location: 'Riyadh, KSA', 
    badge: 'Global Strategy', 
    year: 'Class of 2019', 
    degree: 'BSc (Hons) Economics & Mathematics',
    department: 'Mushtaq Ahmad Gurmani School of Humanities & Social Sciences (MGSHSS)',
    campus: 'D.H.A. Phase 5, Lahore',
    cgpa: '3.96 / 4.00',
    honors: 'Valedictorian • Highest Academic Standing Award',
    thesis: 'Empirical Assessment of Macro-Fiscal Transfer Mechanisms on Household Capital Formation',
    category: 'Business & Finance',
    skills: ['Strategic Transformation', 'Sovereign Advisory', 'Macroeconomic Modeling', 'Public Sector Reform', 'Executive Communication'],
    verifiedId: 'EDU-PK-2019-LUMS-0331',
    picture: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', 
    successStory: 'Advising sovereign wealth funds and Fortune 500 tech enterprises on emerging market expansion and digital governance.',
    advice: 'The interdisciplinary curriculum at LUMS gives you intellectual flexibility. You learn to connect quantitative economics with human behavior—the exact skill needed in top tier consulting.',
    careerJourney: [
      { year: '2015 - 2019', role: 'BSc Economics & Mathematics', org: 'LUMS', desc: 'Research assistant to Dr. Ali Cheema at IDEAS research lab.' },
      { year: '2019 - 2021', role: 'Business Analyst', org: 'McKinsey & Company Dubai', desc: 'Conducted commercial due diligence for regional sovereign entities.' },
      { year: '2021 - Present', role: 'Engagement Manager', org: 'McKinsey Riyadh', desc: 'Leading national digital strategy and economic development programs.' }
    ],
    instituteId: 'inst_3' 
  },
  { 
    id: 'al_16', 
    name: 'Ali Raza Khan', 
    role: 'Partner & Private Equity Lead', 
    company: 'Indus Capital', 
    location: 'Singapore', 
    badge: 'Venture Capital', 
    year: 'Class of 2015', 
    degree: 'BSc (Hons) Accounting & Finance',
    department: 'Suleman Dawood School of Business (SDSB)',
    campus: 'D.H.A. Phase 5, Lahore',
    cgpa: '3.91 / 4.00',
    honors: 'CFA Charterholder • Dean’s Medal for Outstanding Leadership',
    thesis: 'Private Equity Value Creation Metrics in Frontier Emerging Markets',
    category: 'Business & Finance',
    skills: ['LBO Financial Modeling', 'Mergers & Acquisitions', 'Syndicated Debt', 'Portfolio Value Creation', 'Emerging Markets'],
    verifiedId: 'EDU-PK-2015-LUMS-0619',
    picture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', 
    successStory: 'Orchestrating multi-million dollar venture syndications and early-stage capital deployment across high-growth frontier tech startups.',
    advice: 'LUMS alumni network in Dubai, Singapore, and London is like a global brotherhood. No matter where you land, you will find senior leaders ready to mentor you.',
    careerJourney: [
      { year: '2011 - 2015', role: 'BSc Accounting & Finance', org: 'LUMS', desc: 'Captain of LUMS Finance Olympiad team.' },
      { year: '2015 - 2018', role: 'Investment Banking Associate', org: 'Credit Suisse Singapore', desc: 'Cross-border M&A in Southeast Asian tech and renewables.' },
      { year: '2018 - Present', role: 'Partner', org: 'Indus Capital', desc: 'Directing $250M Southeast Asia Frontier Growth Fund.' }
    ],
    instituteId: 'inst_3' 
  },

  // GIKI (inst_5)
  { 
    id: 'al_8', 
    name: 'Hamza Farooq', 
    role: 'Autonomous Flight Engineer', 
    company: 'Airbus', 
    location: 'Toulouse, France', 
    badge: 'Aerospace Engineering', 
    year: 'Class of 2015', 
    degree: 'BSc Mechanical Engineering',
    department: 'Faculty of Mechanical Engineering (FME)',
    campus: 'Topi, Swabi, Khyber Pakhtunkhwa',
    cgpa: '3.87 / 4.00',
    honors: 'AIAA Design-Build-Fly Global Top 5 • GIKI Gold Medal',
    thesis: 'Computational Aerodynamic Drag Minimization on Composite UAV Airframes',
    category: 'Engineering & Aerospace',
    skills: ['Computational Fluid Dynamics (CFD)', 'Aerodynamic Modeling', 'Autopilot Control Systems', 'Composite Structures', 'Avionics'],
    verifiedId: 'EDU-PK-2015-GIKI-0245',
    picture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', 
    successStory: 'Led the GIKI Team Invictus to win top international honors in the prestigious AIAA Design-Build-Fly contest in Wichita.',
    advice: 'Living on GIKI’s 400-acre residential campus in Topi cuts off all distractions. You live, breathe, and build engineering 24/7 with teammates who become your lifelong brothers.',
    careerJourney: [
      { year: '2011 - 2015', role: 'BSc Mechanical Engineering', org: 'GIKI', desc: 'Team Lead Invictus UAV, designed composite autonomous gliders.' },
      { year: '2015 - 2017', role: 'MSc Aerospace Dynamics', org: 'Cranfield University UK', desc: 'Autonomous flight control modeling.' },
      { year: '2017 - Present', role: 'Autonomous Flight Engineer', org: 'Airbus R&D', desc: 'Developing next-generation zero-emission autonomous commercial aircraft.' }
    ],
    instituteId: 'inst_5' 
  },
  { 
    id: 'al_9', 
    name: 'Sarah Bilal', 
    role: 'Senior Hardware Architect', 
    company: 'NVIDIA', 
    location: 'Santa Clara, CA', 
    badge: 'Silicon Architecture', 
    year: 'Class of 2018', 
    degree: 'BSc Computer Engineering',
    department: 'Faculty of Computer Sciences and Engineering (FCSE)',
    campus: 'Topi, Swabi, Khyber Pakhtunkhwa',
    cgpa: '3.95 / 4.00',
    honors: 'Valedictorian • IEEE Women in Engineering Champion',
    thesis: 'Low-Power Hardware Accelerators for Quantized Deep Neural Inference on FPGAs',
    category: 'Engineering & Aerospace',
    skills: ['VLSI Silicon Design', 'Verilog / SystemVerilog', 'GPU Microarchitecture', 'High-Speed Interconnects', 'ASIC Verification'],
    verifiedId: 'EDU-PK-2018-GIKI-0129',
    picture: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&q=80', 
    successStory: 'Designing next-generation tensor cores and ultra-high-throughput interconnect fabrics for hyperscale AI computing clusters.',
    advice: 'GIKI’s computer engineering program demands uncompromising hardware discipline. If you want to understand how bits move through silicon, GIKI is world-class.',
    careerJourney: [
      { year: '2014 - 2018', role: 'BSc Computer Engineering', org: 'GIKI', desc: 'Conducted FPGA acceleration research in collaboration with CERN.' },
      { year: '2018 - 2020', role: 'MS Electrical & Computer Eng', org: 'Purdue University', desc: 'High-performance silicon computing systems.' },
      { year: '2020 - Present', role: 'Senior Hardware Architect', org: 'NVIDIA Silicon Valley', desc: 'Designing Tensor Core interconnects for Blackwell and future AI GPUs.' }
    ],
    instituteId: 'inst_5' 
  },
  { 
    id: 'al_17', 
    name: 'Danish Qureshi', 
    role: 'Propulsion Systems Specialist', 
    company: 'Rolls-Royce', 
    location: 'Derby, UK', 
    badge: 'Thermal Dynamics', 
    year: 'Class of 2016', 
    degree: 'BSc Materials & Chemical Engineering',
    department: 'Faculty of Materials Science and Chemical Engineering',
    campus: 'Topi, Swabi, Khyber Pakhtunkhwa',
    cgpa: '3.88 / 4.00',
    honors: 'PEC Gold Medal for Metallurgy & Material Innovation',
    thesis: 'High-Temperature Nickel-Based Superalloy Fatigue Analysis in High-Pressure Turbines',
    category: 'Engineering & Aerospace',
    skills: ['Superalloy Metallurgy', 'Combustion Modeling', 'FEA Structural Stress', 'Thermal Barrier Coatings', 'Gas Turbine Engines'],
    verifiedId: 'EDU-PK-2016-GIKI-0330',
    picture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', 
    successStory: 'Key engineer developing computational thermal models and aerodynamic durability simulations for next-generation civil aviation turbines.',
    advice: 'The materials research laboratories at GIKI rival top European universities. Don’t hesitate to get your hands dirty in the high-temperature foundry labs.',
    careerJourney: [
      { year: '2012 - 2016', role: 'BSc Materials Engineering', org: 'GIKI', desc: 'Best Senior Design Project in composite alloy stress modeling.' },
      { year: '2016 - 2018', role: 'MSc Advanced Materials', org: 'University of Sheffield', desc: 'Additive manufacturing of aerospace components.' },
      { year: '2018 - Present', role: 'Propulsion Systems Specialist', org: 'Rolls-Royce Civil Aerospace', desc: 'Designing thermal barrier coatings for UltraFan jet engines.' }
    ],
    instituteId: 'inst_5' 
  },

  // FAST (inst_6)
  { 
    id: 'al_10', 
    name: 'Osman Butt', 
    role: 'VP of Engineering', 
    company: 'Careem / Uber', 
    location: 'Dubai, UAE', 
    badge: 'Platform Architecture', 
    year: 'Class of 2012', 
    degree: 'BS Computer Science',
    department: 'Department of Computer Science',
    campus: 'H-11 Campus, Islamabad',
    cgpa: '3.86 / 4.00',
    honors: 'FAST Speed Programming National Champion',
    thesis: 'Low-Latency Geospatial Indexing and Dynamic Dispatch Algorithms for Ride-Hailing Fleets',
    category: 'Tech & AI',
    skills: ['Distributed Microservices', 'High-Concurrency Systems', 'Kafka / Redis', 'Geo-spatial Indexing', 'Engineering Leadership'],
    verifiedId: 'EDU-PK-2012-FAST-0511',
    picture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', 
    successStory: 'Engineered the high-concurrency real-time dispatch and routing engines that scaled Careem to Middle East unicorn status.',
    advice: 'FAST code discipline is brutal, and that’s precisely why companies hire FASTians on day one. When millions of users are waiting for an instant response, that discipline pays off.',
    careerJourney: [
      { year: '2008 - 2012', role: 'BS Computer Science', org: 'FAST NUCES', desc: 'Lead algorithmist, ICPC World Finals regional qualifier.' },
      { year: '2012 - 2016', role: 'Senior Lead Architect', org: 'Careem Karachi/Dubai', desc: 'Built first dispatch core handling 100k rides per day.' },
      { year: '2016 - Present', role: 'VP of Engineering', org: 'Careem / Uber MENA', desc: 'Leading 350+ engineers across 12 countries.' }
    ],
    instituteId: 'inst_6' 
  },
  { 
    id: 'al_11', 
    name: 'Nimra Saeed', 
    role: 'Principal Security Architect', 
    company: 'Cloudflare', 
    location: 'San Francisco, CA', 
    badge: 'Cyber Security', 
    year: 'Class of 2019', 
    degree: 'BS Cyber Security & Computer Science',
    department: 'Faculty of Computing & Cyber Security',
    campus: 'Main Faisal Town Campus, Lahore',
    cgpa: '3.97 / 4.00',
    honors: 'National Cyber Security Hackathon Winner • Rector’s List',
    thesis: 'Kernel eBPF Packet Filtering for High-Volume DDoS Mitigation at Edge Gateways',
    category: 'Tech & AI',
    skills: ['eBPF / Linux Kernel', 'Zero-Trust Architecture', 'DDoS Mitigation', 'Rust / C', 'Cryptographic Protocols'],
    verifiedId: 'EDU-PK-2019-FAST-0994',
    picture: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80', 
    successStory: 'Specializes in terabit-scale DDoS defense, zero-trust edge networks, and ultra-fast kernel packet filtering algorithms.',
    advice: 'FAST pushes you to write code from first principles. When you understand the Linux network stack at byte level, cybersecurity becomes second nature.',
    careerJourney: [
      { year: '2015 - 2019', role: 'BS Computer Science', org: 'FAST NUCES Lahore', desc: 'Head of FAST Cyber Defense Society.' },
      { year: '2019 - 2021', role: 'Security Engineer', org: 'FireEye / Mandiant', desc: 'Threat intelligence analysis on APT infrastructure.' },
      { year: '2021 - Present', role: 'Principal Security Architect', org: 'Cloudflare', desc: 'Defending 20% of global internet traffic from volumetric attacks.' }
    ],
    instituteId: 'inst_6' 
  },
  { 
    id: 'al_18', 
    name: 'Bilal Ahmed', 
    role: 'Staff Systems Engineer', 
    company: 'Stripe', 
    location: 'Seattle, WA', 
    badge: 'Distributed Ledgers', 
    year: 'Class of 2017', 
    degree: 'BS Computer Science',
    department: 'Department of Computer Science',
    campus: 'Malir City Campus, Karachi',
    cgpa: '3.92 / 4.00',
    honors: 'ACM ICPC Regional Silver Medalist',
    thesis: 'Fault-Tolerant Distributed Financial Ledgers with Multi-Region Synchronous Replication',
    category: 'Tech & AI',
    skills: ['Distributed Databases', 'Raft Consensus', 'Zero-Downtime Migration', 'Java / Rust', 'Transaction Semantics'],
    verifiedId: 'EDU-PK-2017-FAST-0210',
    picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', 
    successStory: 'Spearheading ultra-low-latency financial ledger synchronization and fault-tolerant consensus systems across global multi-region clusters.',
    advice: 'Code every day. FAST gave me an appetite for hard software problems. Don’t chase buzzwords—master algorithms, databases, and network fundamentals.',
    careerJourney: [
      { year: '2013 - 2017', role: 'BS Computer Science', org: 'FAST NUCES Karachi', desc: 'Graduated top 1% of cohort.' },
      { year: '2017 - 2020', role: 'Infrastructure Engineer', org: 'Amazon AWS', desc: 'DynamoDB partition routing team in Seattle.' },
      { year: '2020 - Present', role: 'Staff Systems Engineer', org: 'Stripe', desc: 'Architecting core multi-region ledger for Stripe Billing and Payments.' }
    ],
    instituteId: 'inst_6' 
  },

  // IBA (inst_7)
  { 
    id: 'al_12', 
    name: 'Asad Umar Qureshi', 
    role: 'Head of Investment Banking', 
    company: 'Standard Chartered', 
    location: 'Karachi, Pakistan', 
    badge: 'Corporate Finance', 
    year: 'Class of 2014', 
    degree: 'BBA (Hons) Corporate Finance',
    department: 'School of Business Studies (SBS)',
    campus: 'Main Campus, University Road, Karachi',
    cgpa: '3.88 / 4.00',
    honors: 'Dean’s Honor Roll • CFA Society Pakistan Outstanding Student',
    thesis: 'Syndicated Green Sukuk Debt Structuring for South Asian Renewable Energy Mega-Projects',
    category: 'Business & Finance',
    skills: ['Syndicated Lending', 'Sukuk Structuring', 'Project Finance', 'M&A Advisory', 'Debt Capital Markets'],
    verifiedId: 'EDU-PK-2014-IBA-0721',
    picture: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80', 
    successStory: 'Structured landmark multi-billion rupee syndicated sovereign sukuks and mega-scale green energy infrastructure funds.',
    advice: 'IBA Karachi is the historic cradle of Pakistan’s financial leadership. The rigor of corporate finance here prepares you to sit across boardroom tables with utter confidence.',
    careerJourney: [
      { year: '2010 - 2014', role: 'BBA (Hons)', org: 'IBA Karachi', desc: 'Finance Society President, winner of National Investment Banking Challenge.' },
      { year: '2014 - 2018', role: 'VP Corporate Banking', org: 'Habib Bank Limited', desc: 'Structured PKR 40B CPEC power projects.' },
      { year: '2018 - Present', role: 'Head of Investment Banking', org: 'Standard Chartered Pakistan', desc: 'Overseeing sovereign advisory and infrastructure syndications.' }
    ],
    instituteId: 'inst_7' 
  },
  { 
    id: 'al_13', 
    name: 'Hira Siddiqui', 
    role: 'Director of Brand Strategy', 
    company: 'Unilever', 
    location: 'Singapore', 
    badge: 'Consumer Marketing', 
    year: 'Class of 2018', 
    degree: 'BBA (Hons) Marketing & Brand Management',
    department: 'School of Business Studies (SBS)',
    campus: 'City Campus, Garden Road, Karachi',
    cgpa: '3.92 / 4.00',
    honors: 'Gold Medalist in Strategic Marketing • Best Female Leader Award',
    thesis: 'Omnichannel Digital Consumer Journey Mapping across Emerging E-Commerce Ecosystems',
    category: 'Business & Finance',
    skills: ['Brand Architecture', 'Omnichannel Strategy', 'Consumer Insights', 'Digital Media Planning', 'P&L Management'],
    verifiedId: 'EDU-PK-2018-IBA-0348',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', 
    successStory: 'Spearheading regional omnichannel campaigns with 40M+ reach across South Asian consumer brands and digital ecosystems.',
    advice: 'IBA taught me that marketing without financial discipline is vanity. Knowing how to read a balance sheet while creating emotional brand loyalty is a superpower.',
    careerJourney: [
      { year: '2014 - 2018', role: 'BBA Marketing', org: 'IBA Karachi', desc: 'President IBA Marketing Club, L’Oreal Brandstorm National Winner.' },
      { year: '2018 - 2021', role: 'Brand Manager', org: 'Unilever Pakistan', desc: 'Led Sunsilk campaign reaching 25M households.' },
      { year: '2021 - Present', role: 'Director Brand Strategy', org: 'Unilever Global HQ Singapore', desc: 'Overseeing beauty & personal care brand growth across Asia-Pacific.' }
    ],
    instituteId: 'inst_7' 
  },
  { 
    id: 'al_19', 
    name: 'Omair Mansoor', 
    role: 'Managing Director', 
    company: 'Goldman Sachs MENA', 
    location: 'Doha, Qatar', 
    badge: 'Global Banking', 
    year: 'Class of 2013', 
    degree: 'MBA (Executive) Finance & Strategy',
    department: 'School of Business Studies (SBS)',
    campus: 'Main Campus, University Road, Karachi',
    cgpa: '3.90 / 4.00',
    honors: 'IBA Distinguished Alumni Citation for International Finance',
    thesis: 'Cross-Border Capital Arbitrage and Sovereign Wealth Allocation Frameworks',
    category: 'Business & Finance',
    skills: ['Sovereign Wealth Advisory', 'Cross-Border M&A', 'Derivatives Structuring', 'Private Markets', 'Macro Liquidity'],
    verifiedId: 'EDU-PK-2013-IBA-0112',
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', 
    successStory: 'Directs cross-border structured debt advisory and sovereign wealth syndication across the Gulf Cooperation Council.',
    advice: 'The discipline instilled by IBA faculty remains unmatched. We were held to Wall Street standards from our very first case presentation.',
    careerJourney: [
      { year: '2011 - 2013', role: 'MBA Finance', org: 'IBA Karachi', desc: 'Executive cohort, focused on cross-border debt syndication.' },
      { year: '2013 - 2018', role: 'VP Investment Banking', org: 'J.P. Morgan Dubai', desc: 'GCC energy bond issuances totaling $12B+.' },
      { year: '2018 - Present', role: 'Managing Director', org: 'Goldman Sachs MENA', desc: 'Directing sovereign advisory and sovereign wealth partnerships in Qatar & UAE.' }
    ],
    instituteId: 'inst_7' 
  },

  // NCA (inst_2)
  { 
    id: 'al_2', 
    name: 'Zohaib Sheikh', 
    role: 'Principal Architectural Designer', 
    company: 'MorphStudio', 
    location: 'Lahore, Pakistan', 
    badge: 'Sustainable Architecture', 
    year: 'Class of 2015', 
    degree: 'B.Arch (Bachelor of Architecture)',
    department: 'Department of Architecture',
    campus: 'Mall Road Historic Campus, Lahore',
    cgpa: '3.89 / 4.00',
    honors: 'Aga Khan Award for Architecture Nominee Citation • Sir Percy Brown Award',
    thesis: 'Thermal Vernacularism: Modern Rammed-Earth High-Density Urban Courtyard Housing',
    category: 'Design & Architecture',
    skills: ['Vernacular Architecture', 'Parametric Design', 'Sustainable Materials', 'Heritage Conservation', 'Bioclimatic Engineering'],
    verifiedId: 'EDU-PK-2015-NCA-0043',
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', 
    successStory: 'Recipient of the Aga Khan Award for Architecture nominee citation for vernacular rammed-earth environmental design.',
    advice: 'NCA Mall Road is an institution with a soul. It forces you to question why you build before you touch a pencil. That cultural consciousness is what sets NCA architects apart globally.',
    careerJourney: [
      { year: '2010 - 2015', role: 'B.Arch', org: 'NCA Lahore', desc: 'Awarded highest distinction in architectural design studio.' },
      { year: '2015 - 2018', role: 'Senior Designer', org: 'Nayyar Ali Dada & Associates', desc: 'Worked on Lahore Arts Council and historic civic centers.' },
      { year: '2018 - Present', role: 'Founder & Principal', org: 'MorphStudio', desc: 'Pioneering carbon-negative rammed-earth architecture across Pakistan.' }
    ],
    instituteId: 'inst_2' 
  },
  { 
    id: 'al_14', 
    name: 'Fatima Jamil', 
    role: 'Lead Production Designer', 
    company: 'BBC & HBO Series', 
    location: 'London, UK', 
    badge: 'Cinematic Design', 
    year: 'Class of 2017', 
    degree: 'B.Des (Film & Television Production Design)',
    department: 'Department of Film and Television',
    campus: 'Mall Road Historic Campus, Lahore',
    cgpa: '3.94 / 4.00',
    honors: 'BAFTA Nominated Production Designer • NCA Gold Medal',
    thesis: 'Temporal Spatial Construction in South Asian Period Cinema',
    category: 'Design & Architecture',
    skills: ['Production Design', 'Art Direction', 'Period Set Construction', 'Cinematic World-Building', 'Costume History'],
    verifiedId: 'EDU-PK-2017-NCA-0088',
    picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', 
    successStory: 'BAFTA-nominated art director renowned for intricate historical heritage sets and immersive architectural cinematic conservation.',
    advice: 'NCA teaches you that every visual detail has a story. Whether designing a 16th-century Mughal fort or a futuristic dystopia, the historical research skills from NCA stay with you.',
    careerJourney: [
      { year: '2013 - 2017', role: 'B.Des Film & TV', org: 'NCA Lahore', desc: 'Designed 6 award-winning short films screened at Clermont-Ferrand.' },
      { year: '2017 - 2020', role: 'Art Director', org: 'BBC Drama UK', desc: 'Lead set designer for historical drama productions.' },
      { year: '2020 - Present', role: 'Lead Production Designer', org: 'HBO Max Originals', desc: 'Directing global art crews on landmark period television series.' }
    ],
    instituteId: 'inst_2' 
  },
  { 
    id: 'al_20', 
    name: 'Sheroz Gill', 
    role: 'Creative Director', 
    company: 'Pentagram', 
    location: 'London, UK', 
    badge: 'Visual Identity', 
    year: 'Class of 2016', 
    degree: 'B.Des (Visual Communication Design)',
    department: 'Department of Visual Communication Design',
    campus: 'Mall Road Historic Campus, Lahore',
    cgpa: '3.91 / 4.00',
    honors: 'D&AD Yellow Pencil Award • Shakir Ali Excellence in Design',
    thesis: 'Typographic Heritage & Decolonized Identity Systems for Digital Museums',
    category: 'Design & Architecture',
    skills: ['Brand Identity Systems', 'Custom Typography', 'Editorial Design', 'Museum Signage', 'Creative Direction'],
    verifiedId: 'EDU-PK-2016-NCA-0019',
    picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', 
    successStory: 'Crafting identity systems and museum visual guidelines for major European cultural foundations and galleries.',
    advice: 'Surround yourself with poets, sculptors, and printmakers. NCA’s greatest gift is that you don’t just study graphic design in isolation—you breathe art in every courtyard.',
    careerJourney: [
      { year: '2012 - 2016', role: 'B.Des Visual Communication', org: 'NCA Lahore', desc: 'Designed Lahore Biennale visual identity as student scholar.' },
      { year: '2016 - 2019', role: 'Senior Identity Designer', org: 'Wolff Olins London', desc: 'Rebranded global cultural institutions.' },
      { year: '2019 - Present', role: 'Creative Director', org: 'Pentagram London', desc: 'Partnering with world-renowned galleries, publishing houses, and luxury brands.' }
    ],
    instituteId: 'inst_2' 
  },

  // AKU (inst_4)
  { 
    id: 'al_5', 
    name: 'Dr. Yasmin Rashid', 
    role: 'Chief of Pediatric Surgery', 
    company: 'Johns Hopkins Hospital', 
    location: 'Baltimore, MD', 
    badge: 'Pediatric Surgery', 
    year: 'Class of 2011', 
    degree: 'MBBS (Bachelor of Medicine & Surgery)',
    department: 'Medical College & Hospital',
    campus: 'Stadium Road Main Campus, Karachi',
    cgpa: '3.98 / 4.00',
    honors: 'Best Graduate Gold Medal • American College of Surgeons International Fellow',
    thesis: 'Minimally Invasive Thoracoscopic Correction of Congenital Diaphragmatic Hernia in Neonates',
    category: 'Medicine & Healthcare',
    skills: ['Neonatal Surgery', 'Thoracoscopic Surgery', 'Congenital Cardiac Repair', 'Pediatric Trauma', 'Clinical Protocol Research'],
    verifiedId: 'EDU-PK-2011-AKU-0012',
    picture: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80', 
    successStory: 'Pioneering minimally invasive fetal cardiac surgeries with worldwide clinical research and surgical accolades.',
    advice: 'Aga Khan University instills a culture of clinical perfection and boundless compassion from your first year on wards. You learn that a doctor’s greatest virtue is meticulous discipline.',
    careerJourney: [
      { year: '2006 - 2011', role: 'MBBS', org: 'Aga Khan University', desc: 'Ranked 1st in all professional examinations, Chief Surgical Intern.' },
      { year: '2011 - 2017', role: 'Surgical Residency', org: 'Massachusetts General Hospital / Harvard', desc: 'General Surgery & Pediatric Fellowship.' },
      { year: '2017 - Present', role: 'Chief of Pediatric Surgery', org: 'Johns Hopkins Hospital', desc: 'Pioneering minimally invasive neonatal procedures worldwide.' }
    ],
    instituteId: 'inst_4' 
  },
  { 
    id: 'al_15', 
    name: 'Dr. Bilawal Shah', 
    role: 'Director of Global Health', 
    company: 'WHO Geneva', 
    location: 'Geneva, Switzerland', 
    badge: 'Epidemiology', 
    year: 'Class of 2014', 
    degree: 'MBBS & MSc Clinical Research',
    department: 'Community Health Sciences & Medical College',
    campus: 'Stadium Road Main Campus, Karachi',
    cgpa: '3.91 / 4.00',
    honors: 'Distinction in Community Medicine • WHO Emerging Health Leader',
    thesis: 'Surveillance Strategies for Poliomyelitis and Water-Borne Pathogens in Dense Urban Settlements',
    category: 'Medicine & Healthcare',
    skills: ['Epidemiological Surveillance', 'Vaccine Distribution Logistics', 'Global Health Policy', 'Infectious Disease Control', 'Biostatistics'],
    verifiedId: 'EDU-PK-2014-AKU-0067',
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', 
    successStory: 'Oversees regional disease surveillance protocols and emergency healthcare distribution in crisis-hit emerging nations.',
    advice: 'AKU’s emphasis on Community Health Sciences teaches you to look beyond hospital beds and understand social determinants of health. That community perspective is vital on the world stage.',
    careerJourney: [
      { year: '2009 - 2014', role: 'MBBS', org: 'Aga Khan University', desc: 'Conducted field epidemiology across interior Sindh and Balochistan.' },
      { year: '2014 - 2016', role: 'MPH Global Health', org: 'London School of Hygiene & Tropical Medicine', desc: 'Chevening Scholar.' },
      { year: '2016 - Present', role: 'Director of Global Health', org: 'World Health Organization (Geneva)', desc: 'Managing international epidemic response teams in vulnerable territories.' }
    ],
    instituteId: 'inst_4' 
  },
  { 
    id: 'al_21', 
    name: 'Dr. Mehreen Farooq', 
    role: 'Associate Professor of Neurosurgery', 
    company: 'Harvard Medical School', 
    location: 'Boston, MA', 
    badge: 'Neuro-Oncology', 
    year: 'Class of 2013', 
    degree: 'MBBS (Bachelor of Medicine & Surgery)',
    department: 'Department of Surgery & Neurosurgery Division',
    campus: 'Stadium Road Main Campus, Karachi',
    cgpa: '3.96 / 4.00',
    honors: 'Sir Frank Dobie Surgical Prize • Best Clinical Researcher',
    thesis: 'Immunotherapy Delivery Modalities Across the Blood-Brain Barrier for Glioblastoma Multiforme',
    category: 'Medicine & Healthcare',
    skills: ['Awake Craniotomy', 'Neuro-Oncology', 'Stereotactic Radiosurgery', 'Blood-Brain Drug Delivery', 'Clinical Trials'],
    verifiedId: 'EDU-PK-2013-AKU-0034',
    picture: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', 
    successStory: 'Groundbreaking research in neuro-oncology immunotherapy and targeted blood-brain barrier drug delivery models.',
    advice: 'AKU gives you the clinical confidence to stand as an equal in Harvard or Oxford rounds. Trust your training—the patient care ethics you learn in Karachi are world standard.',
    careerJourney: [
      { year: '2008 - 2013', role: 'MBBS', org: 'Aga Khan University', desc: 'Highest scores in Surgery and Pathology, Clinical Research Trainee.' },
      { year: '2013 - 2019', role: 'Neurosurgery Resident', org: 'Brigham and Women’s Hospital / Harvard', desc: 'Specialized in complex skull-base tumors.' },
      { year: '2019 - Present', role: 'Associate Professor of Neurosurgery', org: 'Harvard Medical School', desc: 'Leading glioblastoma clinical trial laboratories in Boston.' }
    ],
    instituteId: 'inst_4' 
  }
];

export const events = [
  // NUST (inst_1)
  { id: 'ev_1', title: 'Pakistan Tech Innovation Summit & Expo 2026', date: 'October 15, 2026', venue: 'Jinnah Auditorium, NUST H-12', category: 'Conference', instituteId: 'inst_1' },
  { id: 'ev_3', title: 'National Hackathon: Pakistan 2.0 (Generative AI)', date: 'December 10, 2026', venue: 'SEECS Computing Wing, NUST', category: 'Hackathon', instituteId: 'inst_1' },
  { id: 'ev_6', title: 'NUST Global Research & Patent Colloquium', date: 'November 20, 2026', venue: 'Center for Advanced Studies', category: 'Symposium', instituteId: 'inst_1' },

  // LUMS (inst_3)
  { id: 'ev_4', title: 'International Conference on Islamic Finance & FinTech', date: 'January 20, 2027', venue: 'Suleman Dawood School of Business', category: 'Finance', instituteId: 'inst_3' },
  { id: 'ev_7', title: 'LUMS Startup Village: Venture Pitch Day', date: 'November 12, 2026', venue: 'NIC Lahore Atrium', category: 'Entrepreneurship', instituteId: 'inst_3' },

  // GIKI (inst_5)
  { id: 'ev_8', title: 'All Pakistan Science Fair & Robotics Challenge', date: 'February 18, 2027', venue: 'Aero-Design Arena, Topi', category: 'Competition', instituteId: 'inst_5' },

  // FAST (inst_6)
  { id: 'ev_9', title: 'FAST CodeFest & Speed Programming Championship', date: 'March 05, 2027', venue: 'FAST Main Campus Islamabad', category: 'Competitive Code', instituteId: 'inst_6' },

  // IBA (inst_7)
  { id: 'ev_10', title: 'IBA Leaders Conference & CEO Roundtable', date: 'November 28, 2026', venue: 'Aman CED Auditorium, Karachi', category: 'Leadership', instituteId: 'inst_7' },

  // NCA (inst_2)
  { id: 'ev_2', title: 'Annual National Fine Arts & Architecture Thesis Exhibition', date: 'November 02, 2026', venue: 'Zahoor-ul-Akhlaq Gallery, Lahore', category: 'Exhibition', instituteId: 'inst_2' },

  // AKU (inst_4)
  { id: 'ev_5', title: 'International Biomedical Research & Clinical Care Symposium', date: 'February 14, 2027', venue: 'AKU Stadium Road Campus', category: 'Medical', instituteId: 'inst_4' }
];

export const trainers = [
  // NUST (inst_1)
  { id: 'tr_1', name: 'Dr. Pervez Hoodbhoy', position: 'Distinguished Professor of Physics & Computation', degrees: 'Ph.D. MIT, B.S. Mathematics MIT', experience: '35+ Years Research Experience', rating: 5.0, instituteId: 'inst_1', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', research: 'Quantum mechanics, theoretical physics, computational cosmology' },
  { id: 'tr_2', name: 'Dr. Atta-ur-Rahman', position: 'Professor Emeritus & Research Chair (UNESCO Laureate)', degrees: 'Ph.D. Cambridge University, Sc.D. Cambridge', experience: '40+ Years Global Leadership', rating: 4.9, instituteId: 'inst_1', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', research: 'Organic synthesis, structural chemistry, scientific innovation policy' },
  { id: 'tr_7', name: 'Dr. Ayesha Malik', position: 'Associate Dean of Computing & Informatics', degrees: 'Ph.D. Stanford University, MS CS UIUC', experience: '16+ Years Experience', rating: 4.9, instituteId: 'inst_1', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', research: 'Large-scale distributed systems, fault-tolerant consensus, privacy-preserving AI' },
  { id: 'tr_8', name: 'Dr. Tariq Mahmood', position: 'Head of Robotics & Autonomous Hardware', degrees: 'Ph.D. Imperial College London', experience: '20+ Years Experience', rating: 4.8, instituteId: 'inst_1', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', research: 'Unmanned aerial vehicles, autonomous LIDAR SLAM, micro-controller firmware' },

  // LUMS (inst_3)
  { id: 'tr_5', name: 'Dr. Atif Mian', position: 'Professor of Economics & Public Finance', degrees: 'Ph.D. MIT, B.S. Mathematics & CS MIT', experience: '22+ Years Academic Leadership', rating: 4.9, instituteId: 'inst_3', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80', research: 'Macro-financial linkages, credit markets, global debt dynamics' },
  { id: 'tr_9', name: 'Dr. Zartash Uzmi', position: 'Associate Professor of Computer Networks', degrees: 'Ph.D. Stanford University', experience: '24+ Years Experience', rating: 4.9, instituteId: 'inst_3', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', research: 'Internet architecture, programmable data planes, wireless communication' },
  { id: 'tr_10', name: 'Dr. Sarah Jenkins', position: 'Director of Case Research, SDSB', degrees: 'Ph.D. Harvard Business School', experience: '18+ Years Corporate Strategy', rating: 4.8, instituteId: 'inst_3', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', research: 'Corporate governance, venture capital ecosystems, family business continuity' },

  // GIKI (inst_5)
  { id: 'tr_11', name: 'Dr. Khalid Mahmood', position: 'Dean of Computer Science & Engineering', degrees: 'Ph.D. University of Manchester', experience: '26+ Years Experience', rating: 4.9, instituteId: 'inst_5', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', research: 'High performance computing, cryptographic algorithms, distributed systems' },
  { id: 'tr_12', name: 'Dr. Junaid Zaidi', position: 'Chair of Mechanical & Aerospace Studies', degrees: 'Ph.D. Birmingham University', experience: '28+ Years Experience', rating: 4.8, instituteId: 'inst_5', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', research: 'Computational fluid mechanics, rocket propulsion, hypersonic aerodynamics' },

  // FAST (inst_6)
  { id: 'tr_13', name: 'Dr. Zubair Shaikh', position: 'Head of Software Systems & AI', degrees: 'Ph.D. Wayne State University, USA', experience: '30+ Years Experience', rating: 5.0, instituteId: 'inst_6', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', research: 'Compiler design, algorithmic complexity, neural pattern classification' },
  { id: 'tr_14', name: 'Dr. Kashif Zafar', position: 'Professor of Artificial Intelligence & Evolutionary Computing', degrees: 'Ph.D. NUCES FAST', experience: '20+ Years Experience', rating: 4.9, instituteId: 'inst_6', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', research: 'Genetic algorithms, swarm intelligence, predictive machine learning models' },

  // IBA (inst_7)
  { id: 'tr_15', name: 'Dr. S Akbar Zaidi', position: 'Executive Director & Professor of Political Economy', degrees: 'Ph.D. Cambridge University', experience: '35+ Years Research Leadership', rating: 4.9, instituteId: 'inst_7', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80', research: 'South Asian political economy, urban fiscal reform, democratic institutions' },
  { id: 'tr_16', name: 'Dr. Asma Hyder', position: 'Dean of School of Economics and Social Sciences', degrees: 'Post-Doc University of Pennsylvania, Ph.D. NUST', experience: '22+ Years Academic Leadership', rating: 4.8, instituteId: 'inst_7', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', research: 'Labor economics, demographic shifts, socioeconomic mobility' },

  // NCA (inst_2)
  { id: 'tr_3', name: 'Salima Hashmi', position: 'Master Artist & Professor Emerita', degrees: 'M.A. Art Education, Rhode Island School of Design', experience: '35+ Years Master Artist', rating: 5.0, instituteId: 'inst_2', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', research: 'Contemporary South Asian painting, curatorial studies, visual resistance' },
  { id: 'tr_4', name: 'Rashid Rana', position: 'Chair of Contemporary Fine Arts & Digital Media', degrees: 'MFA Massachusetts College of Art & Design', experience: '25+ Years Global Artist', rating: 4.8, instituteId: 'inst_2', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', research: 'Photomosaic abstraction, architectural sculpture, conceptual installations' },

  // AKU (inst_4)
  { id: 'tr_6', name: 'Dr. Adeebul Hasan Rizvi', position: 'Distinguished Professor of Surgical Medicine', degrees: 'FRCS Royal College of Surgeons UK', experience: '45+ Years Clinical Surgery', rating: 5.0, instituteId: 'inst_4', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', research: 'Renal transplantation, global surgical healthcare ethics, clinical protocols' },
  { id: 'tr_17', name: 'Dr. Zulfiqar Bhutta', position: 'Founding Director, Centre of Excellence in Women & Child Health', degrees: 'Ph.D. Karolinska Institute Sweden', experience: '32+ Years Global Epidemiology', rating: 5.0, instituteId: 'inst_4', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', research: 'Maternal and newborn survival, nutritional interventions, global health metrics' }
];

export const facilities = [
  // NUST (inst_1)
  { id: 'fac_1', title: 'NVIDIA DGX Supercomputing Cluster', description: 'Enterprise-grade GPU compute clusters dedicated to neural model training, computer vision, and computational biology.', instituteId: 'inst_1', icon: 'Cpu', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80', tag: 'AI & Research' },
  { id: 'fac_2', title: 'Central High-Throughput Digital Library', description: '24/7 RFID automated library featuring over 250,000 academic titles, IEEE/ACM digital access, and silent research pods.', instituteId: 'inst_1', icon: 'BookOpen', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80', tag: 'Study Commons' },
  { id: 'fac_6', title: 'Robotics & Autonomous Hardware Prototyping Lab', description: 'Equipped with industrial 5-axis CNC mills, resin 3D printers, wind tunnels, and autonomous testing tracks.', instituteId: 'inst_1', icon: 'Wrench', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', tag: 'Hardware Labs' },
  { id: 'fac_7', title: 'Olympic Sports Arena & Aquatic Complex', description: 'Indoor heated Olympic swimming pool, synthetic badminton courts, FIFA-certified astroturf football stadium, and fitness gym.', instituteId: 'inst_1', icon: 'Trophy', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', tag: 'Athletics & Life' },

  // LUMS (inst_3)
  { id: 'fac_4', title: 'Bloomberg Financial Markets Trading Room', description: 'Real-time live terminals streaming global equity, foreign exchange, and commodities data for finance students.', instituteId: 'inst_3', icon: 'ChartLineUp', image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80', tag: 'FinTech' },
  { id: 'fac_8', title: 'Gadani Smart Amphitheaters', description: 'Acoustically tuned Harvard-style lecture halls with dual projection arrays, audience polling consoles, and digital capture.', instituteId: 'inst_3', icon: 'Monitor', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80', tag: 'Academic Class' },
  { id: 'fac_9', title: 'Syed Babar Ali Research & Cleanroom Labs', description: 'Class-1000 cleanroom facilities for semiconductor testing, biophysics analysis, and clean chemical synthesis.', instituteId: 'inst_3', icon: 'Flask', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80', tag: 'Cleanroom' },

  // GIKI (inst_5)
  { id: 'fac_10', title: 'Wind Tunnel & Aerodynamics Prototyping Tunnel', description: 'Subsonic aerodynamic tunnel with digital smoke visualization, force balance sensors, and telemetry logging.', instituteId: 'inst_5', icon: 'Wind', image: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&q=80', tag: 'Aerospace' },
  { id: 'fac_11', title: 'Residential Campus Sports & Rock-Climbing Wall', description: 'Sprawling outdoor football grounds, international squash courts, floodlit tennis courts, and mountaineering clubs.', instituteId: 'inst_5', icon: 'Trophy', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', tag: 'Residential' },

  // FAST (inst_6)
  { id: 'fac_12', title: 'High-Density Software Engineering Suites', description: 'Hundreds of dual-monitor high-spec workstations with gigabit intranet for 24-hour national hackathons.', instituteId: 'inst_6', icon: 'Terminal', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', tag: 'Dev Hub' },
  { id: 'fac_13', title: 'National Cyber Security Simulation Range', description: 'Isolated sandbox networks for real-time red team / blue team cyber defense drills, penetration testing, and forensics.', instituteId: 'inst_6', icon: 'ShieldCheck', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', tag: 'Cyber Range' },

  // IBA (inst_7)
  { id: 'fac_14', title: 'Aman Center for Entrepreneurial Incubation', description: 'Co-working launchpad with private venture pitch suites, seed funding advisory board, and corporate mentors.', instituteId: 'inst_7', icon: 'Lightbulb', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', tag: 'Startups' },
  { id: 'fac_15', title: 'Tabba Academic & Multipurpose Sports Complex', description: 'Full-court indoor basketball gymnasium, synthetic running tracks, digital recreation lounges, and cafeteria plazas.', instituteId: 'inst_7', icon: 'Trophy', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', tag: 'Student Life' },

  // NCA (inst_2)
  { id: 'fac_3', title: 'Kipling Memorial Art & Sculpture Studios', description: 'High-ceiling open daylight studios with stone carving bays, metal casting kilns, and darkroom photography suites.', instituteId: 'inst_2', icon: 'Palette', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80', tag: 'Fine Arts' },

  // AKU (inst_4)
  { id: 'fac_5', title: 'High-Fidelity Clinical Simulation Hospital', description: 'Fully instrumented emergency rooms, simulated operating theaters, and robotic patient mannequins for trauma training.', instituteId: 'inst_4', icon: 'Heartbeat', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80', tag: 'Clinical' }
];
