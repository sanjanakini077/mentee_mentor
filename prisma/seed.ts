import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Create or update HOD: Dr. Ashwini B
  const hodProfile = await prisma.profile.upsert({
    where: { email: 'hod@demo.com' },
    update: {
      full_name: 'Dr. Ashwini B',
      role: 'administrator',
      department: 'Information Science & Engineering',
      phone_number: '+91 98452 34567',
      password: 'demo123',
    },
    create: {
      email: 'hod@demo.com',
      full_name: 'Dr. Ashwini B',
      role: 'administrator',
      department: 'Information Science & Engineering',
      phone_number: '+91 98452 34567',
      password: 'demo123',
    },
  })
  // Ensure user_id matches id
  await prisma.profile.update({
    where: { id: hodProfile.id },
    data: { user_id: hodProfile.id },
  })

  // 2. Create or update Faculty Mentor: Dr. Jason Elroy Martis
  const mentorProfile = await prisma.profile.upsert({
    where: { email: 'mentor@demo.com' },
    update: {
      full_name: 'Dr. Jason Elroy Martis',
      role: 'mentor',
      department: 'Information Science & Engineering',
      phone_number: '+91 98451 23456',
      password: 'demo123',
    },
    create: {
      email: 'mentor@demo.com',
      full_name: 'Dr. Jason Elroy Martis',
      role: 'mentor',
      department: 'Information Science & Engineering',
      phone_number: '+91 98451 23456',
      password: 'demo123',
    },
  })
  await prisma.profile.update({
    where: { id: mentorProfile.id },
    data: { user_id: mentorProfile.id },
  })

  // Additional faculty mentor
  const mentor2Profile = await prisma.profile.upsert({
    where: { email: 'faculty2@demo.com' },
    update: {
      full_name: 'Prof. Sudarshan Kumar',
      role: 'mentor',
      department: 'Information Science & Engineering',
      phone_number: '+91 98451 77889',
      password: 'demo123',
    },
    create: {
      email: 'faculty2@demo.com',
      full_name: 'Prof. Sudarshan Kumar',
      role: 'mentor',
      department: 'Information Science & Engineering',
      phone_number: '+91 98451 77889',
      password: 'demo123',
    },
  })
  await prisma.profile.update({
    where: { id: mentor2Profile.id },
    data: { user_id: mentor2Profile.id },
  })

  // 3. Create or update Student: Sanjana Kini
  const studentProfile = await prisma.profile.upsert({
    where: { email: 'student@demo.com' },
    update: {
      full_name: 'Sanjana Kini',
      role: 'mentee',
      department: 'Information Science & Engineering',
      phone_number: '+91 98450 12345',
      password: 'demo123',
    },
    create: {
      email: 'student@demo.com',
      full_name: 'Sanjana Kini',
      role: 'mentee',
      department: 'Information Science & Engineering',
      phone_number: '+91 98450 12345',
      password: 'demo123',
    },
  })
  await prisma.profile.update({
    where: { id: studentProfile.id },
    data: { user_id: studentProfile.id },
  })

  const sanjanaStudent = await prisma.studentProfile.upsert({
    where: { profile_id: studentProfile.id },
    update: {
      usn: '4NM21IS042',
      department: 'Information Science & Engineering',
      semester: 6,
      academic_batch: '2021-2025',
      section: 'A',
      phone: '+91 98450 12345',
      blood_group: 'O+',
      address: 'Nitte, Karkala Taluk, Udupi District, Karnataka 574110',
      parent_name: 'B. Suresh Shet',
      parent_phone: '+91 98450 99887',
      verification_status: 'submitted',
    },
    create: {
      profile_id: studentProfile.id,
      usn: '4NM21IS042',
      department: 'Information Science & Engineering',
      semester: 6,
      academic_batch: '2021-2025',
      section: 'A',
      phone: '+91 98450 12345',
      blood_group: 'O+',
      address: 'Nitte, Karkala Taluk, Udupi District, Karnataka 574110',
      parent_name: 'B. Suresh Shet',
      parent_phone: '+91 98450 99887',
      verification_status: 'submitted',
    },
  })

  // 4. Additional demo students
  // Student 2: Rohit Rao
  const student2 = await prisma.profile.upsert({
    where: { email: 'rohit@demo.com' },
    update: {
      full_name: 'Rohit Rao',
      role: 'mentee',
      department: 'Information Science & Engineering',
      phone_number: '+91 98450 67890',
      password: 'demo123',
    },
    create: {
      email: 'rohit@demo.com',
      full_name: 'Rohit Rao',
      role: 'mentee',
      department: 'Information Science & Engineering',
      phone_number: '+91 98450 67890',
      password: 'demo123',
    },
  })
  await prisma.profile.update({
    where: { id: student2.id },
    data: { user_id: student2.id },
  })
  const rohitStudent = await prisma.studentProfile.upsert({
    where: { profile_id: student2.id },
    update: {
      usn: '4NM21IS078',
      department: 'Information Science & Engineering',
      semester: 6,
      academic_batch: '2021-2025',
      section: 'B',
      phone: '+91 98450 67890',
      blood_group: 'B+',
      address: 'Udupi, Karnataka 576101',
      parent_name: 'K. Ramachandra Rao',
      parent_phone: '+91 98450 11223',
      verification_status: 'approved',
      reviewer_profile_id: hodProfile.id,
      review_comment: 'Profile verified and approved for academic session 2024-25.',
      reviewed_at: new Date(),
    },
    create: {
      profile_id: student2.id,
      usn: '4NM21IS078',
      department: 'Information Science & Engineering',
      semester: 6,
      academic_batch: '2021-2025',
      section: 'B',
      phone: '+91 98450 67890',
      blood_group: 'B+',
      address: 'Udupi, Karnataka 576101',
      parent_name: 'K. Ramachandra Rao',
      parent_phone: '+91 98450 11223',
      verification_status: 'approved',
      reviewer_profile_id: hodProfile.id,
      review_comment: 'Profile verified and approved for academic session 2024-25.',
      reviewed_at: new Date(),
    },
  })

  // Student 3: Ananya Pai
  const student3 = await prisma.profile.upsert({
    where: { email: 'ananya@demo.com' },
    update: {
      full_name: 'Ananya Pai',
      role: 'mentee',
      department: 'Information Science & Engineering',
      phone_number: '+91 98450 55443',
      password: 'demo123',
    },
    create: {
      email: 'ananya@demo.com',
      full_name: 'Ananya Pai',
      role: 'mentee',
      department: 'Information Science & Engineering',
      phone_number: '+91 98450 55443',
      password: 'demo123',
    },
  })
  await prisma.profile.update({
    where: { id: student3.id },
    data: { user_id: student3.id },
  })
  const ananyaStudent = await prisma.studentProfile.upsert({
    where: { profile_id: student3.id },
    update: {
      usn: '4NM21IS015',
      department: 'Information Science & Engineering',
      semester: 6,
      academic_batch: '2021-2025',
      section: 'A',
      phone: '+91 98450 55443',
      blood_group: 'A+',
      address: 'Mangalore, Karnataka 575001',
      parent_name: 'Dr. Ganapathi Pai',
      parent_phone: '+91 98450 44332',
      verification_status: 'correction_requested',
      reviewer_profile_id: hodProfile.id,
      review_comment: 'Please upload the semester 5 grade sheet copy and verify guardian contact.',
      reviewed_at: new Date(),
    },
    create: {
      profile_id: student3.id,
      usn: '4NM21IS015',
      department: 'Information Science & Engineering',
      semester: 6,
      academic_batch: '2021-2025',
      section: 'A',
      phone: '+91 98450 55443',
      blood_group: 'A+',
      address: 'Mangalore, Karnataka 575001',
      parent_name: 'Dr. Ganapathi Pai',
      parent_phone: '+91 98450 44332',
      verification_status: 'correction_requested',
      reviewer_profile_id: hodProfile.id,
      review_comment: 'Please upload the semester 5 grade sheet copy and verify guardian contact.',
      reviewed_at: new Date(),
    },
  })

  // 5. Mentor Assignments: Assign Sanjana, Rohit, and Ananya to Dr. Jason Elroy Martis
  const existingAssign1 = await prisma.mentorAssignment.findFirst({
    where: {
      student_profile_id: sanjanaStudent.id,
      mentor_profile_id: mentorProfile.id,
    },
  })
  if (!existingAssign1) {
    await prisma.mentorAssignment.create({
      data: {
        student_profile_id: sanjanaStudent.id,
        mentor_profile_id: mentorProfile.id,
        assigned_by_profile_id: hodProfile.id,
        is_active: true,
        notes: 'Department mentor allotment for Academic Session 2024-25.',
      },
    })
  }

  const existingAssign2 = await prisma.mentorAssignment.findFirst({
    where: {
      student_profile_id: rohitStudent.id,
      mentor_profile_id: mentorProfile.id,
    },
  })
  if (!existingAssign2) {
    await prisma.mentorAssignment.create({
      data: {
        student_profile_id: rohitStudent.id,
        mentor_profile_id: mentorProfile.id,
        assigned_by_profile_id: hodProfile.id,
        is_active: true,
        notes: 'Department mentor allotment for Academic Session 2024-25.',
      },
    })
  }

  const existingAssign3 = await prisma.mentorAssignment.findFirst({
    where: {
      student_profile_id: ananyaStudent.id,
      mentor_profile_id: mentorProfile.id,
    },
  })
  if (!existingAssign3) {
    await prisma.mentorAssignment.create({
      data: {
        student_profile_id: ananyaStudent.id,
        mentor_profile_id: mentorProfile.id,
        assigned_by_profile_id: hodProfile.id,
        is_active: true,
        notes: 'Department mentor allotment for Academic Session 2024-25.',
      },
    })
  }

  // 6. Academic Records for Sanjana Kini
  const courses = [
    { code: '21IS61', name: 'Software Engineering & Architecture', credits: 4, marks: 88, grade: 'A+', gp: 9, att: 94 },
    { code: '21IS62', name: 'Full-Stack Web Development', credits: 4, marks: 92, grade: 'O', gp: 10, att: 96 },
    { code: '21IS63', name: 'Machine Learning & Applications', credits: 4, marks: 85, grade: 'A', gp: 8, att: 90 },
    { code: '21IS64', name: 'Cloud Computing & Virtualization', credits: 3, marks: 90, grade: 'A+', gp: 9, att: 92 },
    { code: '21IS65', name: 'Information Security & Cryptography', credits: 3, marks: 86, grade: 'A', gp: 8, att: 88 },
    { code: '21ISL66', name: 'Web Development Laboratory', credits: 1.5, marks: 95, grade: 'O', gp: 10, att: 100 },
  ]

  for (const c of courses) {
    await prisma.academicRecord.upsert({
      where: {
        student_profile_id_semester_course_code_academic_year: {
          student_profile_id: sanjanaStudent.id,
          semester: 6,
          course_code: c.code,
          academic_year: '2024-2025',
        },
      },
      update: {
        course_name: c.name,
        credits: Math.round(c.credits),
        marks_obtained: c.marks,
        grade: c.grade,
        grade_points: c.gp,
        attendance_percentage: c.att,
        sgpa: 8.85,
        cgpa: 8.92,
        backlogs: 0,
      },
      create: {
        student_profile_id: sanjanaStudent.id,
        semester: 6,
        academic_year: '2024-2025',
        course_code: c.code,
        course_name: c.name,
        credits: Math.round(c.credits),
        marks_obtained: c.marks,
        grade: c.grade,
        grade_points: c.gp,
        attendance_percentage: c.att,
        sgpa: 8.85,
        cgpa: 8.92,
        backlogs: 0,
      },
    })
  }

  // 7. Mentor Notes for Sanjana Kini
  const existingNote = await prisma.mentorNote.findFirst({
    where: {
      student_profile_id: sanjanaStudent.id,
      mentor_profile_id: mentorProfile.id,
    },
  })
  if (!existingNote) {
    await prisma.mentorNote.create({
      data: {
        student_profile_id: sanjanaStudent.id,
        mentor_profile_id: mentorProfile.id,
        note_date: '2025-02-15',
        content:
          'Mid-semester mentoring review: Sanjana has maintained consistent performance across all core subjects. Capstone proposal on Distributed Healthcare Monitoring was approved. Recommended for industrial internship.',
        visibility: 'shared_with_mentee',
      },
    })
  }

  // 8. Mentor Recommendations
  const existingRec = await prisma.mentorRecommendation.findFirst({
    where: {
      student_profile_id: sanjanaStudent.id,
      mentor_profile_id: mentorProfile.id,
    },
  })
  if (!existingRec) {
    await prisma.mentorRecommendation.create({
      data: {
        student_profile_id: sanjanaStudent.id,
        mentor_profile_id: mentorProfile.id,
        category: 'internship',
        details:
          'Recommendation for semester-long industrial internship at Robert Bosch Engineering. Sanjana has exemplary academic standing (CGPA 8.92) with zero backlogs and outstanding coursework marks in Cloud Computing and Web Engineering.',
        status: 'pending',
      },
    })
  }

  // 9. Notifications
  await prisma.notification.createMany({
    data: [
      {
        recipient_profile_id: studentProfile.id,
        title: 'Profile Submitted',
        message: 'Your semester 6 profile has been queued for verification by the department HOD.',
        type: 'info',
        related_entity_type: 'verification',
      },
      {
        recipient_profile_id: mentorProfile.id,
        title: 'New Mentee Allotment',
        message: 'Sanjana Kini (4NM21IS042) has been assigned under your mentorship for session 2024-25.',
        type: 'success',
        related_entity_type: 'mentee',
      },
      {
        recipient_profile_id: hodProfile.id,
        title: 'Profile Verification Queue',
        message: 'Sanjana Kini has submitted her semester 6 profile for departmental endorsement.',
        type: 'warning',
        related_entity_type: 'verification',
      },
    ],
  })

  // 10. Audit log
  await prisma.auditLog.create({
    data: {
      actor_profile_id: hodProfile.id,
      action: 'ASSIGN_MENTOR',
      target_type: 'student_profile',
      target_id: sanjanaStudent.id,
      metadata: JSON.stringify({ mentor: 'Dr. Jason Elroy Martis', mentee: 'Sanjana Kini' }),
    },
  })

  console.log('✅ Database seeding complete!')
  console.log('Demo accounts ready:')
  console.log('  Student: student@demo.com (Sanjana Kini) / demo123')
  console.log('  Mentor:  mentor@demo.com (Dr. Jason Elroy Martis) / demo123')
  console.log('  HOD:     hod@demo.com (Dr. Ashwini B) / demo123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

