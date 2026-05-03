import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Edit, Loader2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/common/ImageUpload'
import { toast } from '@/lib/hooks/useToast'
import { productsApi } from '@/lib/api'
import type { Category, Subcategory } from '@/types'

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
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

export default function CategoryList() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image: '',
      subcategoriesInput: '',
      subcategoryName: '',
      subcategorySlug: '',
    },
  })

  const imageValue = form.watch('image')

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCategories = async () => {
    try {
      const data = await productsApi.getCategories()
      setCategories(data)
    } catch {
      toast({ title: 'Failed to load categories', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

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
    if (editingId) return updateCategory(editingId, data)
    return addCategory(data)
  }

  const addCategory = async (data: CategoryFormValues) => {
    try {
      const createdCategory = await productsApi.createCategory({
        name: data.name,
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

      await loadCategories()
      form.reset()
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Failed to create category',
        variant: 'destructive',
      })
    }
  }

  const updateCategory = async (id: string, data: CategoryFormValues) => {
    try {
      await productsApi.updateCategory(id, {
        name: data.name,
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
            categoryId: id,
          })
        }
        toast({
          title: 'Category and subcategory updated',
          description: 'The category and selected subcategory have been successfully updated.',
        })
      } else {
        const subcategoryNames = parseSubcategoryNames(data.subcategoriesInput || '')

        if (subcategoryNames.length > 0) {
          const existingCategory = categories.find((category) => category.id === id)
          const existingNames = new Set(
            (existingCategory?.subcategories || []).map((subcategory) => subcategory.name.trim().toLowerCase())
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
        }

        const { created, failed } = await createSubcategoriesForCategory(id, subcategoryNames)

        toast({
          title: failed > 0 ? 'Category updated (partial)' : 'Category updated',
          description:
            subcategoryNames.length > 0
              ? `Added ${created}/${subcategoryNames.length} new subcategories.`
              : 'The category has been successfully updated.',
        })
      }

      await loadCategories()
      setEditingId(null)
      setEditingSubcategory(null)
      form.reset()
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Failed to update category',
        variant: 'destructive',
      })
    }
  }

  const deleteCategory = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this category? This will also remove its products and subcategories.'
      )
    )
      return

    const success = await productsApi.deleteCategory(id)
    if (success) {
      toast({
        title: 'Category deleted',
        description: 'The category, its subcategories, and its products have been successfully deleted.',
      })
      await loadCategories()
    } else {
      toast({ title: 'Failed to delete category', variant: 'destructive' })
    }
  }

  const startEdit = (category: Category) => {
    form.reset({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      subcategoriesInput: '',
      subcategoryName: '',
      subcategorySlug: '',
    })
    setEditingId(category.id)
    setEditingSubcategory(null)
  }

  const startSubcategoryEdit = (category: Category, subcategory: Subcategory) => {
    form.reset({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      subcategoriesInput: '',
      subcategoryName: subcategory.name,
      subcategorySlug: subcategory.slug,
    })
    setEditingId(category.id)
    setEditingSubcategory(subcategory)
  }

  const deleteSubcategory = async (subcategoryId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory? Products will keep working without it.'))
      return

    const success = await productsApi.deleteSubcategory(subcategoryId)
    if (success) {
      toast({
        title: 'Subcategory deleted',
        description: 'The subcategory has been successfully deleted.',
      })
      if (editingSubcategory?.id === subcategoryId) {
        setEditingSubcategory(null)
        form.setValue('subcategoryName', '')
        form.setValue('subcategorySlug', '')
      }
      await loadCategories()
    } else {
      toast({ title: 'Failed to delete subcategory', variant: 'destructive' })
    }
  }

  const cancelEdit = () => {
    form.reset()
    setEditingId(null)
    setEditingSubcategory(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage your product categories</p>
        </div>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {editingSubcategory ? 'Edit Category & Subcategory' : editingId ? 'Edit Category' : 'Add Category'}
            </CardTitle>
            <CardDescription>
              {editingSubcategory
                ? 'Update category details and the selected subcategory'
                : editingId
                  ? 'Update category details'
                  : 'Create a new product category'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                placeholder="Crop Tops"
                {...form.register('name')}
                disabled={form.formState.isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                placeholder="crop-tops"
                {...form.register('slug')}
                disabled={form.formState.isSubmitting}
              />
              {form.formState.errors.slug && (
                <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="A trendy collection of crop tops..."
                {...form.register('description')}
                disabled={form.formState.isSubmitting}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL *</Label>
              <Input
                id="image"
                placeholder="https://example.com/category-image.jpg"
                {...form.register('image')}
                disabled={form.formState.isSubmitting}
              />
              {form.formState.errors.image && (
                <p className="text-sm text-destructive">{form.formState.errors.image.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Upload Image</Label>
              <ImageUpload
                value={imageValue ? [imageValue] : []}
                onChange={(urls) => {
                  form.setValue('image', urls[0] || '', { shouldDirty: true, shouldValidate: true })
                }}
                maxImages={1}
                folder="categories"
              />
              <p className="text-xs text-muted-foreground">Upload sets the Image URL automatically.</p>
            </div>

            {editingSubcategory ? (
              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <h3 className="font-medium">Edit Subcategory</h3>
                  <p className="text-sm text-muted-foreground">Update the selected subcategory here.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subcategoryName">Subcategory Name</Label>
                    <Input
                      id="subcategoryName"
                      placeholder="Summer Collection"
                      {...form.register('subcategoryName')}
                      disabled={form.formState.isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategorySlug">Subcategory Slug</Label>
                    <Input
                      id="subcategorySlug"
                      placeholder="summer-collection"
                      {...form.register('subcategorySlug')}
                      disabled={form.formState.isSubmitting}
                    />
                    {form.formState.errors.subcategorySlug && (
                      <p className="text-sm text-destructive">{form.formState.errors.subcategorySlug.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="subcategoriesInput">{editingId ? 'Add Subcategories' : 'Subcategories'}</Label>
                <Textarea
                  id="subcategoriesInput"
                  placeholder={'Summer Collection\nParty Wear\nFestive Picks'}
                  className="min-h-[120px]"
                  {...form.register('subcategoriesInput')}
                  disabled={form.formState.isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Enter one subcategory per line or separate them with commas.
                  {editingId
                    ? ' Existing subcategories stay unchanged; only new ones will be added.'
                    : ' These will be created immediately after the category is created.'}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {editingSubcategory
                  ? 'Update Category & Subcategory'
                  : editingId
                    ? 'Update Category'
                    : 'Create Category'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{category.slug}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(category.subcategories || []).length} subcategories
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 rounded-md border bg-popover p-1 shadow-md">
                    <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">
                      Category Actions
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1 h-px bg-border" />
                    <DropdownMenuItem
                      onClick={() => startEdit(category)}
                      className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted"
                    >
                      <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 h-px bg-border" />
                    <DropdownMenuItem
                      onClick={() => deleteCategory(category.id)}
                      className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.image && (
                <img src={category.image} alt={category.name} className="w-full h-40 object-cover rounded-md" />
              )}
              <p className="text-sm text-muted-foreground">{category.description}</p>

              {category.subcategories && category.subcategories.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subcategories</p>
                  <div className="mt-2 space-y-2">
                    {category.subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{subcategory.name}</p>
                          <p className="text-xs text-muted-foreground">{subcategory.slug}</p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-md border bg-popover p-1 shadow-md">
                            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">
                              Subcategory Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="my-1 h-px bg-border" />
                            <DropdownMenuItem
                              onClick={() => startSubcategoryEdit(category, subcategory)}
                              className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted"
                            >
                              <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 h-px bg-border" />
                            <DropdownMenuItem
                              onClick={() => deleteSubcategory(subcategory.id)}
                              className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
