import test, { describe, it } from 'node:test'
import assert from 'node:assert'

// 1. Open-Redirect Vulnerability Defense Test
function getSafeRedirectUrl(target: string | null, fallback: string): string {
  if (!target) return fallback
  if (target.startsWith('/') && !target.startsWith('//') && !target.includes('://')) {
    return target
  }
  return fallback
}

// 2. State Machine: Student Profile Verification Status Transitions
type VerificationStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'correction_requested'

function canMenteeEditProfile(status: VerificationStatus): boolean {
  return status === 'draft' || status === 'correction_requested'
}

function canTransitionStatus(
  currentStatus: VerificationStatus,
  targetStatus: VerificationStatus,
  userRole: 'mentee' | 'mentor' | 'administrator'
): { allowed: boolean; reason?: string } {
  if (userRole === 'mentee') {
    if (currentStatus === 'draft' && targetStatus === 'submitted') {
      return { allowed: true }
    }
    if (currentStatus === 'correction_requested' && targetStatus === 'submitted') {
      return { allowed: true }
    }
    return {
      allowed: false,
      reason: 'Students can only submit drafts or resubmit after correction requests.',
    }
  }

  if (userRole === 'administrator') {
    if (currentStatus === 'submitted') {
      if (['approved', 'rejected', 'correction_requested'].includes(targetStatus)) {
        return { allowed: true }
      }
    }
    return {
      allowed: false,
      reason: 'Administrator can only review submitted profiles.',
    }
  }

  return {
    allowed: false,
    reason: 'Mentors do not have verification authority.',
  }
}

// 3. Recommendation Approval Invariant
function canApproveRecommendation(
  userRole: 'mentee' | 'mentor' | 'administrator',
  mentorId: string,
  reviewerId: string
): boolean {
  if (userRole !== 'administrator') return false
  if (mentorId === reviewerId) return false // HOD cannot approve if they authored it as a mentor
  return true
}

// 4. Data Validation Helpers
function isValidUSN(usn: string): boolean {
  const trimmed = usn.trim()
  return trimmed.length >= 6 && /^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/i.test(trimmed)
}

function isValidAttendance(percentage: number): boolean {
  return typeof percentage === 'number' && !isNaN(percentage) && percentage >= 0 && percentage <= 100
}

function isValidMarks(marks: number, maxMarks: number = 100): boolean {
  return typeof marks === 'number' && !isNaN(marks) && marks >= 0 && marks <= maxMarks
}

describe('Security & Authorization Tests', () => {
  it('prevents open redirect attacks via manipulated parameters', () => {
    const fallback = '/mentee/dashboard'
    assert.strictEqual(getSafeRedirectUrl('/mentee/academics', fallback), '/mentee/academics')
    assert.strictEqual(getSafeRedirectUrl('//malicious.com', fallback), fallback)
    assert.strictEqual(getSafeRedirectUrl('https://evil.attacker.com', fallback), fallback)
    assert.strictEqual(getSafeRedirectUrl('javascript:alert(1)', fallback), fallback)
    assert.strictEqual(getSafeRedirectUrl(null, fallback), fallback)
  })

  it('prohibits mentors from approving their own recommendations', () => {
    const mentorId = 'mentor-uuid-1'
    const hodId = 'hod-uuid-1'

    // Mentor tries to self-approve
    assert.strictEqual(canApproveRecommendation('mentor', mentorId, mentorId), false)

    // Mentee tries to approve
    assert.strictEqual(canApproveRecommendation('mentee', mentorId, 'mentee-uuid-1'), false)

    // HOD approves mentor's recommendation
    assert.strictEqual(canApproveRecommendation('administrator', mentorId, hodId), true)

    // If HOD themselves authored the recommendation as faculty, they must have another admin review
    assert.strictEqual(canApproveRecommendation('administrator', hodId, hodId), false)
  })
})

describe('Workflow & Verification State Machine Tests', () => {
  it('enforces student profile edit lock rules based on status', () => {
    assert.strictEqual(canMenteeEditProfile('draft'), true)
    assert.strictEqual(canMenteeEditProfile('correction_requested'), true)
    assert.strictEqual(canMenteeEditProfile('submitted'), false)
    assert.strictEqual(canMenteeEditProfile('approved'), false)
    assert.strictEqual(canMenteeEditProfile('rejected'), false)
  })

  it('allows valid submission and review transitions', () => {
    // Mentee submits draft
    const submitDraft = canTransitionStatus('draft', 'submitted', 'mentee')
    assert.strictEqual(submitDraft.allowed, true)

    // Mentee resubmits after correction request
    const resubmit = canTransitionStatus('correction_requested', 'submitted', 'mentee')
    assert.strictEqual(resubmit.allowed, true)

    // Admin reviews submitted profile
    assert.strictEqual(canTransitionStatus('submitted', 'approved', 'administrator').allowed, true)
    assert.strictEqual(canTransitionStatus('submitted', 'rejected', 'administrator').allowed, true)
    assert.strictEqual(canTransitionStatus('submitted', 'correction_requested', 'administrator').allowed, true)
  })

  it('rejects illegal status transitions and unauthorized actor roles', () => {
    // Mentee attempts to self-approve
    const selfApprove = canTransitionStatus('submitted', 'approved', 'mentee')
    assert.strictEqual(selfApprove.allowed, false)

    // Mentor attempts to approve verification
    const mentorApprove = canTransitionStatus('submitted', 'approved', 'mentor')
    assert.strictEqual(mentorApprove.allowed, false)

    // Admin attempts to approve an unsubmitted draft
    const adminDraftApprove = canTransitionStatus('draft', 'approved', 'administrator')
    assert.strictEqual(adminDraftApprove.allowed, false)
  })
})

describe('Academic & Student Data Validation Tests', () => {
  it('validates university USN format', () => {
    assert.strictEqual(isValidUSN('1MS21CS042'), true)
    assert.strictEqual(isValidUSN('1ms21cs042'), true)
    assert.strictEqual(isValidUSN('1MS21IS100'), true)
    assert.strictEqual(isValidUSN(''), false)
    assert.strictEqual(isValidUSN('INVALID'), false)
    assert.strictEqual(isValidUSN('1MS21'), false)
  })

  it('validates attendance percentages within range [0, 100]', () => {
    assert.strictEqual(isValidAttendance(0), true)
    assert.strictEqual(isValidAttendance(85.5), true)
    assert.strictEqual(isValidAttendance(100), true)
    assert.strictEqual(isValidAttendance(-5), false)
    assert.strictEqual(isValidAttendance(105), false)
    assert.strictEqual(isValidAttendance(NaN), false)
  })

  it('validates course marks within range [0, max_marks]', () => {
    assert.strictEqual(isValidMarks(0, 100), true)
    assert.strictEqual(isValidMarks(92.5, 100), true)
    assert.strictEqual(isValidMarks(100, 100), true)
    assert.strictEqual(isValidMarks(48, 50), true)
    assert.strictEqual(isValidMarks(-1, 100), false)
    assert.strictEqual(isValidMarks(101, 100), false)
    assert.strictEqual(isValidMarks(55, 50), false)
  })
})

