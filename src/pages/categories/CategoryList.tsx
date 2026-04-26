import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { productsApi } from '@/lib/api'
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react'
import { ImageUpload } from '@/components/common/ImageUpload'
import type { Category } from '@/types'

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  image: z.string().url('Must be a valid URL'),
  subcategoriesInput: z.string().optional(),
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
      if (!uniqueNames.has(normalized)) {
        uniqueNames.set(normalized, name)
      }
    })

  return [...uniqueNames.values()]
}

export default function CategoryList() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image: '',
      subcategoriesInput: '',
    },
  })
  const imageValue = form.watch('image')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await productsApi.getCategories()
      setCategories(data)
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  const createSubcategoriesForCategory = async (categoryId: string, names: string[]) => {
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
    const { subcategoriesInput = '', ...categoryData } = data
    const subcategoryNames = parseSubcategoryNames(subcategoriesInput)

    if (editingId) {
      const existingCategory = categories.find((category) => category.id === editingId)
      const existingNames = new Set(
        (existingCategory?.subcategories || []).map((subcategory) =>
          subcategory.name.trim().toLowerCase()
        )
      )
      const duplicateNames = subcategoryNames.filter((name) => existingNames.has(name.toLowerCase()))

      if (duplicateNames.length > 0) {
        toast.error(`Subcategories already exist: ${duplicateNames.join(', ')}`)
        return
      }
    }

    if (editingId) {
      await updateCategory(editingId, categoryData, subcategoryNames)
    } else {
      await addCategory(categoryData, subcategoryNames)
    }
  }

  const addCategory = async (
    data: Omit<CategoryFormValues, 'id' | 'subcategoriesInput'>,
    subcategoryNames: string[]
  ) => {
    try {
      const category = await productsApi.createCategory(data)
      const { created, failed } = await createSubcategoriesForCategory(category.id, subcategoryNames)

      if (failed > 0) {
        toast.error(
          `Category created, but only ${created} of ${subcategoryNames.length} subcategories were added.`
        )
      } else if (created > 0) {
        toast.success(`Category and ${created} subcategories created successfully`)
      } else {
        toast.success('Category created successfully')
      }

      await loadCategories()
      form.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create category')
    }
  }

  const updateCategory = async (
    id: string,
    data: Omit<CategoryFormValues, 'id' | 'subcategoriesInput'>,
    subcategoryNames: string[]
  ) => {
    try {
      await productsApi.updateCategory(id, data)
      const { created, failed } = await createSubcategoriesForCategory(id, subcategoryNames)

      if (failed > 0) {
        toast.error(
          `Category updated, but only ${created} of ${subcategoryNames.length} new subcategories were added.`
        )
      } else if (created > 0) {
        toast.success(`Category updated and ${created} subcategories added successfully`)
      } else {
        toast.success('Category updated successfully')
      }

      await loadCategories()
      setEditingId(null)
      form.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update category')
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      await productsApi.deleteCategory(id)
      toast.success('Category deleted successfully')
      await loadCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category')
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
    })
    setEditingId(category.id)
  }

  const cancelEdit = () => {
    form.reset()
    setEditingId(null)
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
        <Button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Category' : 'Add Category'}
            </CardTitle>
            <CardDescription>
              {editingId ? 'Update category details' : 'Create a new product category'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                placeholder="Crop Tops"
                {...form.register('name')}
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
              <p className="text-xs text-muted-foreground">
                Upload sets the Image URL automatically.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategoriesInput">
                {editingId ? 'Add Subcategories' : 'Subcategories'}
              </Label>
              <Textarea
                id="subcategoriesInput"
                placeholder={'Summer Collection\nParty Wear\nFestive Picks'}
                className="min-h-[120px]"
                {...form.register('subcategoriesInput')}
              />
              <p className="text-xs text-muted-foreground">
                Enter one subcategory per line or separate them with commas.
                {editingId
                  ? ' Existing subcategories stay unchanged; only new ones will be added.'
                  : ' These will be created immediately after the category is created.'}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {editingId ? 'Update Category' : 'Create Category'}
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.image && (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-40 object-cover rounded-md"
                />
              )}
              <p className="text-sm text-muted-foreground">{category.description}</p>
              {(category.subcategories || []).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {(category.subcategories || []).map((subcategory) => (
                    <Badge key={subcategory.id} variant="secondary">
                      {subcategory.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => navigate('/products/add')}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Category (Quick)
      </Button>
    </div>
  )
}
