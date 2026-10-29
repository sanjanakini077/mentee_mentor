'use client'

import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { PREVIEW_CURRENT_STUDENT } from '@/lib/preview-data'

export default function MenteeProfilePage() {
  const { success } = useToast()
  const student = PREVIEW_CURRENT_STUDENT

  const [formData, setFormData] = useState({
    fullName: student.profiles?.full_name || '',
    usn: student.usn,
    department: student.profiles?.department || 'Computer Science and Engineering',
    semester: student.semester,
    email: student.profiles?.email || '',
    phone: student.phone,
    bloodGroup: student.blood_group || '',
    address: student.address || '',
    parentName: student.parent_name || '',
    parentPhone: student.parent_phone || '',
  })

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setIsConfirmOpen(false)
      success('Profile details updated successfully. Pending HOD review.')
    }, 600)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile"
        description="Official student demographic and institutional record details."
        breadcrumbs={[
          { label: 'Student Portal', href: '/mentee' },
          { label: 'My Profile' },
        ]}
        badge={<StatusBadge status={student.verification_status} />}
        actions={
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsConfirmOpen(true)}
          >
            Save Changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Institutional / Academic Details */}
          <Card
            title="Institutional Information"
            description="Official enrollment data registered with the university."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" required htmlFor="fullName">
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </FormField>

              <FormField label="University Seat Number (USN)" required htmlFor="usn">
                <Input
                  id="usn"
                  value={formData.usn}
                  disabled
                  className="font-mono bg-slate-50"
                  helperText="Contact Exam Cell for USN corrections"
                />
              </FormField>

              <FormField label="Department" required htmlFor="department">
                <Input
                  id="department"
                  value={formData.department}
                  disabled
                  className="bg-slate-50"
                />
              </FormField>

              <FormField label="Current Semester" required htmlFor="semester">
                <Input
                  id="semester"
                  type="number"
                  min={1}
                  max={8}
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      semester: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </FormField>
            </div>
          </Card>

          {/* Contact Details */}
          <Card
            title="Contact & Residential Information"
            description="Approved contact information for departmental communications."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Institutional Email" required htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="font-mono bg-slate-50"
                />
              </FormField>

              <FormField label="Primary Mobile Phone" required htmlFor="phone">
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </FormField>

              <FormField label="Blood Group" htmlFor="bloodGroup">
                <Input
                  id="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={(e) =>
                    setFormData({ ...formData, bloodGroup: e.target.value })
                  }
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Residential Address" htmlFor="address">
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </FormField>
              </div>
            </div>
          </Card>

          {/* Parent / Guardian Information */}
          <Card
            title="Parent / Guardian Details"
            description="Required for institutional correspondence and emergency contact."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Parent / Guardian Name" required htmlFor="parentName">
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) =>
                    setFormData({ ...formData, parentName: e.target.value })
                  }
                />
              </FormField>

              <FormField label="Parent Phone Number" required htmlFor="parentPhone">
                <Input
                  id="parentPhone"
                  value={formData.parentPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, parentPhone: e.target.value })
                  }
                />
              </FormField>
            </div>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card title="Verification Notice">
            <div className="text-xs text-slate-600 space-y-3">
              <p>
                Any changes made to student identity, phone number, or residential
                address must be submitted for HOD verification.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px]">
                <strong>Rule:</strong> Academic records must match the University
                Student Database records before semester exam endorsement.
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSave}
        title="Update Profile Information"
        message="Are you sure you want to save these profile changes? This will submit a revised profile for verification."
        confirmText="Confirm & Save"
        isLoading={isSaving}
      />
    </div>
  )
}

