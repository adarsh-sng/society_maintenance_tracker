'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Image, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Input, Textarea, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { ResidentLayout } from '@/components/layout/ResidentLayout'
import { useCreateComplaint } from '@/hooks/useComplaints'
import { useAuth } from '@/hooks'

const complaintSchema = z.object({
  category: z.string().min(2, 'Category is required').max(128),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
})

type ComplaintForm = z.infer<typeof complaintSchema>

const categoryOptions = [
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Carpentry', label: 'Carpentry' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'Cleaning', label: 'Cleaning' },
  { value: 'Security', label: 'Security' },
  { value: 'Other', label: 'Other' },
]

export default function NewComplaintPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { createComplaint } = useCreateComplaint()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ComplaintForm>({
    resolver: zodResolver(complaintSchema),
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const removePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
  }

  const onSubmit = async (data: ComplaintForm) => {
    setIsSubmitting(true)
    try {
      await createComplaint({ ...data, photo: photo || undefined })
      toast.success('Complaint submitted successfully!')
      router.push('/complaints')
      router.refresh()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to submit complaint. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResidentLayout user={user!} onLogout={() => {}}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">New Complaint</h1>
          <p className="text-[var(--color-text-secondary)]">Submit a maintenance request for your unit</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complaint Details</CardTitle>
            <CardDescription>Fields marked with * are required</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-medium)] bg-white text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent"
                  aria-invalid={errors.category ? 'true' : 'false'}
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1.5 text-sm text-[var(--color-accent-danger)]">{errors.category.message}</p>
                )}
              </div>

              <Textarea
                {...register('description')}
                label="Description *"
                placeholder="Describe the issue in detail... (minimum 10 characters)"
                error={errors.description?.message}
                rows={5}
              />

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Photo (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="sr-only"
                    id="photo-upload"
                    disabled={isSubmitting}
                  />
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer',
                      photoPreview
                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary-light)]'
                        : 'border-[var(--color-border-medium)] hover:border-[var(--color-accent-primary)]'
                    )}
                    onClick={() => !isSubmitting && document.getElementById('photo-upload')?.click()}
                  >
                    {photoPreview ? (
                      <div className="relative max-w-xs mx-auto">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); removePhoto(); }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                          aria-label="Remove photo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Image className="h-10 w-10 text-[var(--color-text-tertiary)]" />
                        <p className="text-[var(--color-text-secondary)]">Click to upload or drag and drop</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">PNG, JPG, GIF, WebP up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--color-border-light)]">
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" loading={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4" /> : 'Submit Complaint'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ResidentLayout>
  )
}