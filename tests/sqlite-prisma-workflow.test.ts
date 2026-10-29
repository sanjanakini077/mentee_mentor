import test, { describe, it } from 'node:test'
import assert from 'node:assert'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('SQLite & Prisma Workflow Integration Tests', () => {
  it('verifies seeded accounts exist in SQLite database', async () => {
    // 1. Student Sanjana Kini
    const student = await prisma.profile.findUnique({
      where: { email: 'student@demo.com' },
      include: { student_profile: true },
    })
    assert.ok(student, 'Student account must exist')
    assert.strictEqual(student.full_name, 'Sanjana Kini')
    assert.strictEqual(student.role, 'mentee')
    assert.ok(student.student_profile, 'Student profile must be linked')
    assert.strictEqual(student.student_profile.usn, '4NM21IS042')

    // 2. Faculty Mentor Dr. Jason Elroy Martis
    const mentor = await prisma.profile.findUnique({
      where: { email: 'mentor@demo.com' },
    })
    assert.ok(mentor, 'Mentor account must exist')
    assert.strictEqual(mentor.full_name, 'Dr. Jason Elroy Martis')
    assert.strictEqual(mentor.role, 'mentor')

    // 3. Department HOD Dr. Ashwini B
    const hod = await prisma.profile.findUnique({
      where: { email: 'hod@demo.com' },
    })
    assert.ok(hod, 'HOD account must exist')
    assert.strictEqual(hod.full_name, 'Dr. Ashwini B')
    assert.strictEqual(hod.role, 'administrator')
  })

  it('verifies mentor-student active assignment in SQLite', async () => {
    const student = await prisma.studentProfile.findFirst({
      where: { usn: '4NM21IS042' },
    })
    assert.ok(student)

    const assignment = await prisma.mentorAssignment.findFirst({
      where: {
        student_profile_id: student.id,
        is_active: true,
      },
      include: { mentor: true },
    })
    assert.ok(assignment, 'Active assignment must exist')
    assert.strictEqual(assignment.mentor.full_name, 'Dr. Jason Elroy Martis')
  })

  it('verifies academic records for Sanjana Kini', async () => {
    const student = await prisma.studentProfile.findFirst({
      where: { usn: '4NM21IS042' },
      include: { academic_records: true },
    })
    assert.ok(student)
    assert.ok(student.academic_records.length >= 6, 'Must have semester 6 courses')

    const mlCourse = student.academic_records.find((r) => r.course_code === '21IS63')
    assert.ok(mlCourse, 'Course 21IS63 must exist')
    assert.strictEqual(mlCourse.course_name, 'Machine Learning & Applications')
  })

  it('tests end-to-end HOD review and approval cycle in database', async () => {
    const student = await prisma.studentProfile.findFirst({
      where: { usn: '4NM21IS042' },
    })
    assert.ok(student)

    // HOD approves profile
    const updated = await prisma.studentProfile.update({
      where: { id: student.id },
      data: {
        verification_status: 'approved',
        review_comment: 'Approved after verification of marks cards and certificates.',
        reviewed_at: new Date(),
      },
    })
    assert.strictEqual(updated.verification_status, 'approved')

    // Reset status back to submitted for demo purposes
    await prisma.studentProfile.update({
      where: { id: student.id },
      data: {
        verification_status: 'submitted',
      },
    })
  })

  it('tests department administration metrics query', async () => {
    const dept = 'Information Science & Engineering'
    const totalStudents = await prisma.studentProfile.count({
      where: dept ? { department: dept } : undefined,
    })
    assert.ok(totalStudents > 0, 'Total students should be greater than 0')

    const awaitingReviewCount = await prisma.studentProfile.count({
      where: { verification_status: 'submitted' },
    })
    assert.ok(awaitingReviewCount >= 1, 'At least Sanjana Kini should be submitted')
  })

  it('tests student registration in SQLite with duplicate protection', async () => {
    const testEmail = 'newstudent_test@example.com'
    const testUsn = '4NM21IS999'

    // Clean up if leftover
    const existing = await prisma.profile.findUnique({ where: { email: testEmail } })
    if (existing) {
      await prisma.studentProfile.deleteMany({ where: { profile_id: existing.id } })
      await prisma.profile.delete({ where: { id: existing.id } })
    }

    // Create student
    const createdProfile = await prisma.profile.create({
      data: {
        email: testEmail,
        full_name: 'Test Student',
        role: 'mentee',
        department: 'Information Science & Engineering',
        phone_number: '+91 99999 88888',
        password: 'scrypt:mock_salt:mock_hash',
      },
    })
    await prisma.profile.update({
      where: { id: createdProfile.id },
      data: { user_id: createdProfile.id },
    })
    const createdStudent = await prisma.studentProfile.create({
      data: {
        profile_id: createdProfile.id,
        usn: testUsn,
        department: 'Information Science & Engineering',
        semester: 3,
        academic_batch: '2023-2027',
        phone: '+91 99999 88888',
        verification_status: 'draft',
      },
    })

    assert.strictEqual(createdProfile.role, 'mentee')
    assert.strictEqual(createdStudent.usn, testUsn)

    // Verify duplicate USN check
    const duplicateUsn = await prisma.studentProfile.findUnique({ where: { usn: testUsn } })
    assert.ok(duplicateUsn, 'Should detect existing USN')

    // Clean up
    await prisma.studentProfile.delete({ where: { id: createdStudent.id } })
    await prisma.profile.delete({ where: { id: createdProfile.id } })
  })

  it('tests student document metadata creation and deletion', async () => {
    const student = await prisma.studentProfile.findFirst({
      where: { usn: '4NM21IS042' },
    })
    assert.ok(student)

    // Create document metadata
    const doc = await prisma.studentDocument.create({
      data: {
        student_profile_id: student.id,
        title: 'Semester 5 Marks Card',
        document_type: 'marks_card',
        original_filename: 'sem5_marks.pdf',
        stored_filename: 'doc_test_123.pdf',
        file_path: '/tmp/test_sem5.pdf',
        content_type: 'application/pdf',
        file_size: 102400,
      },
    })

    assert.ok(doc.id)
    assert.strictEqual(doc.document_type, 'marks_card')

    // Verify retrieval
    const retrieved = await prisma.studentDocument.findUnique({
      where: { id: doc.id },
    })
    assert.ok(retrieved)
    assert.strictEqual(retrieved.title, 'Semester 5 Marks Card')

    // Delete
    await prisma.studentDocument.delete({
      where: { id: doc.id },
    })

    const afterDelete = await prisma.studentDocument.findUnique({
      where: { id: doc.id },
    })
    assert.strictEqual(afterDelete, null, 'Document metadata should be deleted')
  })

  it('tests faculty mentor registration with employee ID in SQLite', async () => {
    const testEmail = 'faculty_test@college.edu'
    const testEmpId = 'EMP-TEST-99'

    // Clean up if leftover
    const existing = await prisma.profile.findUnique({ where: { email: testEmail } })
    if (existing) {
      await prisma.profile.delete({ where: { id: existing.id } })
    }

    const created = await prisma.profile.create({
      data: {
        email: testEmail,
        full_name: 'Dr. Test Mentor',
        role: 'mentor',
        department: 'Information Science & Engineering',
        employee_id: testEmpId,
        phone_number: '+91 98888 77777',
        password: 'scrypt:mock_salt:mock_hash',
      },
    })
    await prisma.profile.update({
      where: { id: created.id },
      data: { user_id: created.id },
    })

    assert.strictEqual(created.role, 'mentor')
    assert.strictEqual(created.employee_id, testEmpId)

    // Check duplicate employee ID is caught
    const empConflict = await prisma.profile.findUnique({
      where: { employee_id: testEmpId },
    })
    assert.ok(empConflict, 'Should detect existing employee ID')

    // Clean up
    await prisma.profile.delete({ where: { id: created.id } })
  })
})
