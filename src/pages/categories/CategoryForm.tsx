import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Save, Trash2, Plus, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { ImageUpload } from '@/components/common/ImageUpload'
import { toast } from '@/lib/hooks/useToast'
import { productsApi } from '@/lib/api'
import type { Category, Subcategory } from '@/types'

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  categoryNumber: z.string().regex(/^\d{3}$/, 'Category Number must be exactly 3 digits'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  image: z.string().url('Must be a valid URL'),
  subcategoriesInput: z.string().optional(),
  subcategoryName: z.string().optional(),
  subcategorySlug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Subcategory slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const parseSubcategoryNames = (value: string) => {
  const uniqueNames = new Map<string, string>()

  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((name) => {
      const normalized = name.toLowerCase()
      if (!uniqueNames.has(normalized)) uniqueNames.set(normalized, name)
    })

  return [...uniqueNames.values()]
}

export default function CategoryForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)

  const [isLoadingCategory, setIsLoadingCategory] = useState(isEditMode)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      categoryNumber: '',
      slug: '',
      description: '',
      image: '',
      subcategoriesInput: '',
      subcategoryName: '',
      subcategorySlug: '',
    },
  })

  const nameValue = form.watch('name')
  const slugValue = form.watch('slug')
  const imageValue = form.watch('image')

  // Auto-generate slug from name in create mode if slug has not been manually customized
  useEffect(() => {
    if (!isEditMode && nameValue && !form.getFieldState('slug').isDirty) {
      form.setValue('slug', toSlug(nameValue), { shouldValidate: true })
    }
  }, [nameValue, isEditMode, form])

  // Load category details if editing
  useEffect(() => {
    if (!isEditMode || !id) return

    const loadCategory = async () => {
      try {
        setIsLoadingCategory(true)
        const categories = await productsApi.getCategories()
        const found = categories.find((c) => c.id === id)
        if (!found) {
          toast({ title: 'Category not found', variant: 'destructive' })
          navigate('/categories')
          return
        }

        setCurrentCategory(found)
        form.reset({
          id: found.id,
          name: found.name,
          categoryNumber: found.categoryNumber,
          slug: found.slug,
          description: found.description,
          image: found.image,
          subcategoriesInput: '',
          subcategoryName: '',
          subcategorySlug: '',
        })
      } catch (err) {
        toast({ title: 'Failed to load category details', variant: 'destructive' })
        navigate('/categories')
      } finally {
        setIsLoadingCategory(false)
      }
    }

    loadCategory()
  }, [id, isEditMode, navigate, form])

  const createSubcategoriesForCategory = async (categoryId: string, names: string[]) => {
    if (names.length === 0) return { created: 0, failed: 0 }

    const results = await Promise.allSettled(
      names.map((name) =>
        productsApi.createSubcategory({
          name,
          slug: toSlug(name),
          categoryId,
        })
      )
    )

    const failed = results.filter((result) => result.status === 'rejected').length

    return {
      created: results.length - failed,
      failed,
    }
  }

  const onSubmit = async (data: CategoryFormValues) => {
    if (isEditMode && id) {
      await updateCategory(id, data)
    } else {
      await addCategory(data)
    }
  }

  const addCategory = async (data: CategoryFormValues) => {
    try {
      const createdCategory = await productsApi.createCategory({
        name: data.name,
        categoryNumber: data.categoryNumber,
        slug: data.slug,
        description: data.description,
        image: data.image,
      })

      const subcategoryNames = parseSubcategoryNames(data.subcategoriesInput || '')
      const { created, failed } = await createSubcategoriesForCategory(createdCategory.id, subcategoryNames)

      toast({
        title: failed > 0 ? 'Category created (partial)' : 'Category created',
        description:
          subcategoryNames.length > 0
            ? `Added ${created}/${subcategoryNames.length} subcategories.`
            : 'The category has been successfully created.',
      })

      navigate('/categories')
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Failed to create category',
        variant: 'destructive',
      })
    }
  }

  const updateCategory = async (catId: string, data: CategoryFormValues) => {
    try {
      await productsApi.updateCategory(catId, {
        name: data.name,
        categoryNumber: data.categoryNumber,
        slug: data.slug,
        description: data.description,
        image: data.image,
      })

      if (editingSubcategory) {
        const subcategoryName = data.subcategoryName?.trim()
        if (subcategoryName) {
          await productsApi.updateSubcategory(editingSubcategory.id, {
            name: subcategoryName,
            slug: data.subcategorySlug?.trim() || undefined,
            categoryId: catId,
          })
        }
        toast({
          title: 'Category and subcategory updated',
          description: 'The category and selected subcategory have been successfully updated.',
        })
      } else {
        const subcategoryNames = parseSubcategoryNames(data.subcategoriesInput || '')

        if (subcategoryNames.length > 0 && currentCategory) {
          const existingNames = new Set(
            (currentCategory.subcategories || []).map((s) => s.name.trim().toLowerCase())
          )
          const duplicateNames = subcategoryNames.filter((name) => existingNames.has(name.toLowerCase()))
          if (duplicateNames.length > 0) {
            toast({
              title: 'Duplicate subcategories',
              description: `Already exist: ${duplicateNames.join(', ')}`,
              variant: 'destructive',
            })
            return
          }

          const { created, failed } = await createSubcategoriesForCategory(catId, subcategoryNames)

          toast({
            title: failed > 0 ? 'Category updated (partial)' : 'Category updated',
            description:
              subcategoryNames.length > 0
                ? `Added ${created}/${subcategoryNames.length} new subcategories.`
                : 'The category has been successfully updated.',
          })
        } else {
          toast({
            title: 'Category updated',
            description: 'The category details have been successfully updated.',
          })
        }
      }

      navigate('/categories')
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Failed to update category',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory? Products will keep working without it.'))
      return

    const success = await productsApi.deleteSubcategory(subcategoryId)
    if (success) {
      toast({
        title: 'Subcategory deleted',
        description: 'The subcategory has been successfully deleted.',
      })
      if (currentCategory) {
        setCurrentCategory({
          ...currentCategory,
          subcategories: (currentCategory.subcategories || []).filter((s) => s.id !== subcategoryId),
        })
      }
      if (editingSubcategory?.id === subcategoryId) {
        setEditingSubcategory(null)
        form.setValue('subcategoryName', '')
        form.setValue('subcategorySlug', '')
      }
    } else {
      toast({ title: 'Failed to delete subcategory', variant: 'destructive' })
    }
  }

  const startSubcategoryEdit = (sub: Subcategory) => {
    setEditingSubcategory(sub)
    form.setValue('subcategoryName', sub.name)
    form.setValue('subcategorySlug', sub.slug)
  }

  const cancelSubcategoryEdit = () => {
    setEditingSubcategory(null)
    form.setValue('subcategoryName', '')
    form.setValue('subcategorySlug', '')
  }

  if (isLoadingCategory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-[#C5A059] mb-4" />
        <p className="text-muted-foreground text-sm">Loading category details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <Breadcrumb className="mb-2" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border"
              onClick={() => navigate('/categories')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {isEditMode ? 'Edit Category' : 'Add Category'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isEditMode
                  ? 'Update category details, images, and subcategories'
                  : 'Create a new product category for your store catalog'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/categories')}
            disabled={form.formState.isSubmitting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
            className="rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-white font-medium shadow-xs"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? 'Save Changes' : 'Create Category'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="rounded-2xl border border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <Tag className="h-5 w-5 text-[#C5A059]" />
              Category Information
            </CardTitle>
            <CardDescription>
              Basic identifiers and descriptive copy for this category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Necklaces, Earrings, Crop Tops"
                  className="rounded-xl h-11"
                  {...form.register('name')}
                  disabled={form.formState.isSubmitting}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryNumber" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category Number *
                </Label>
                <Input
                  id="categoryNumber"
                  placeholder="e.g. 101"
                  inputMode="numeric"
                  maxLength={3}
                  className="rounded-xl h-11 font-mono text-sm"
                  {...form.register('categoryNumber')}
                  disabled={form.formState.isSubmitting}
                />
                {form.formState.errors.categoryNumber && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.categoryNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  URL Slug *
                </Label>
                <Input
                  id="slug"
                  placeholder="e.g. necklaces, earrings"
                  className="rounded-xl h-11 font-mono text-sm"
                  {...form.register('slug')}
                  disabled={form.formState.isSubmitting}
                />
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="A curated collection of handcrafted artisan pieces..."
                rows={3}
                className="rounded-xl resize-none"
                {...form.register('description')}
                disabled={form.formState.isSubmitting}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive font-medium">{form.formState.errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Media / Image */}
        <Card className="rounded-2xl border border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Category Image</CardTitle>
            <CardDescription>
              Upload an image or specify a direct image URL for the storefront header & catalog cards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Image URL *
              </Label>
              <Input
                id="image"
                placeholder="https://res.cloudinary.com/.../category.jpg"
                className="rounded-xl h-11"
                {...form.register('image')}
                disabled={form.formState.isSubmitting}
              />
              {form.formState.errors.image && (
                <p className="text-xs text-destructive font-medium">{form.formState.errors.image.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cloudinary Upload
              </Label>
              <ImageUpload
                value={imageValue ? [imageValue] : []}
                onChange={(urls) => {
                  form.setValue('image', urls[0] || '', { shouldDirty: true, shouldValidate: true })
                }}
                maxImages={1}
                folder="categories"
              />
              <p className="text-xs text-muted-foreground">
                Uploading sets the Image URL automatically into your Cloudinary cloud store.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subcategories */}
        <Card className="rounded-2xl border border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Subcategories</CardTitle>
            <CardDescription>
              Organize products under this category into granular sub-classifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Existing Subcategories (Edit Mode) */}
            {isEditMode && currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Subcategories ({currentCategory.subcategories.length})
                </Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {currentCategory.subcategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/30"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-medium text-foreground truncate">{sub.name}</p>
                        <p className="text-xs font-mono text-muted-foreground truncate">{sub.slug}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => startSubcategoryEdit(sub)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteSubcategory(sub.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editing a single subcategory */}
            {editingSubcategory ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Editing Subcategory: {editingSubcategory.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">Modify the name and slug for this subcategory.</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={cancelSubcategoryEdit}
                  >
                    Cancel Edit
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="subcategoryName" className="text-xs">Subcategory Name</Label>
                    <Input
                      id="subcategoryName"
                      className="rounded-lg h-9"
                      {...form.register('subcategoryName')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subcategorySlug" className="text-xs">Subcategory Slug</Label>
                    <Input
                      id="subcategorySlug"
                      className="rounded-lg h-9 font-mono text-xs"
                      {...form.register('subcategorySlug')}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="subcategoriesInput" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {isEditMode ? 'Add New Subcategories' : 'Initial Subcategories'}
                </Label>
                <Textarea
                  id="subcategoriesInput"
                  placeholder={'Summer Collection\nFestive Picks\nBridal Couture'}
                  rows={4}
                  className="rounded-xl font-sans"
                  {...form.register('subcategoriesInput')}
                  disabled={form.formState.isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Enter one subcategory per line or separate them with commas.
                  {isEditMode
                    ? ' Existing subcategories will remain unchanged; newly entered subcategories will be created.'
                    : ' These subcategories will be automatically created alongside the category.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/categories')}
            disabled={form.formState.isSubmitting}
            className="rounded-xl px-5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-white font-medium px-6 shadow-xs"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? 'Save Changes' : 'Create Category'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
