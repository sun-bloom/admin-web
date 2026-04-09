import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { productsApi } from '@/lib/api'
import { Plus, Trash2, Edit, Loader2, MoreHorizontal } from 'lucide-react'
import { ImageUpload } from '@/components/common/ImageUpload'
import { toast } from '@/lib/hooks/useToast'
import type { Category, Subcategory } from '@/types'

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  image: z.string().url('Must be a valid URL'),
  subcategoryName: z.string().optional(),
  subcategorySlug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Subcategory slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
})

export default function CategoryList() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image: '',
      subcategoryName: '',
      subcategorySlug: '',
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
      toast({
        title: 'Failed to load categories',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: z.infer<typeof categorySchema>) => {
    if (editingId) {
      await updateCategory(editingId, data)
    } else {
      await addCategory(data)
    }
  }

  const createOptionalSubcategory = async (
    categoryId: string,
    data: Pick<z.infer<typeof categorySchema>, 'subcategoryName' | 'subcategorySlug'>
  ) => {
    const name = data.subcategoryName?.trim()
    if (!name) return

    await productsApi.createSubcategory({
      name,
      slug: data.subcategorySlug?.trim() || undefined,
      categoryId,
    })
  }

  const addCategory = async (data: z.infer<typeof categorySchema>) => {
    try {
      const createdCategory = await productsApi.createCategory({
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
      })
      await createOptionalSubcategory(createdCategory.id, data)
      toast({
        title: 'Category created',
        description: 'The category has been successfully created.',
      })
      await loadCategories()
      form.reset()
    } catch {
      toast({
        title: 'Failed to create category',
        variant: 'destructive',
      })
    }
  }

  const updateCategory = async (id: string, data: z.infer<typeof categorySchema>) => {
    try {
      await productsApi.updateCategory(id, {
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
      })

      const subcategoryName = data.subcategoryName?.trim()
      if (editingSubcategory && subcategoryName) {
        await productsApi.updateSubcategory(editingSubcategory.id, {
          name: subcategoryName,
          slug: data.subcategorySlug?.trim() || undefined,
          categoryId: id,
        })
      } else {
        await createOptionalSubcategory(id, data)
      }

      toast({
        title: editingSubcategory ? 'Category and subcategory updated' : 'Category updated',
        description: editingSubcategory
          ? 'The category and selected subcategory have been successfully updated.'
          : 'The category has been successfully updated.',
      })
      await loadCategories()
      setEditingId(null)
      setEditingSubcategory(null)
      form.reset()
    } catch {
      toast({
        title: 'Failed to update category',
        variant: 'destructive',
      })
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also remove its products and subcategories.')) return

    const success = await productsApi.deleteCategory(id)
    if (success) {
      toast({
        title: 'Category deleted',
        description: 'The category, its subcategories, and its products have been successfully deleted.',
      })
      await loadCategories()
    } else {
      toast({
        title: 'Failed to delete category',
        variant: 'destructive',
      })
    }
  }

  const startEdit = (category: Category) => {
    form.reset({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
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
      subcategoryName: subcategory.name,
      subcategorySlug: subcategory.slug,
    })
    setEditingId(category.id)
    setEditingSubcategory(subcategory)
  }

  const deleteSubcategory = async (subcategoryId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory? Products will keep working without it.')) return

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
      toast({
        title: 'Failed to delete subcategory',
        variant: 'destructive',
      })
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
        <Button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {editingSubcategory
                ? 'Edit Category & Subcategory'
                : editingId
                  ? 'Edit Category'
                  : 'Add Category'}
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
              <textarea
                id="description"
                placeholder="A trendy collection of crop tops..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
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

            <div className="rounded-lg border p-4 space-y-4">
              <div>
                <h3 className="font-medium">Optional Subcategory</h3>
                <p className="text-sm text-muted-foreground">
                  {editingSubcategory
                    ? 'Update the selected subcategory here, or cancel to stop editing it.'
                    : 'Add one subcategory along with this category. Leave blank to skip.'}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subcategoryName">Subcategory Name</Label>
                  <Input
                    id="subcategoryName"
                    placeholder="Summer Collection"
                    {...form.register('subcategoryName')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategorySlug">Subcategory Slug</Label>
                  <Input
                    id="subcategorySlug"
                    placeholder="summer-collection"
                    {...form.register('subcategorySlug')}
                  />
                  {form.formState.errors.subcategorySlug && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.subcategorySlug.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
              <Button type="submit">
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
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-muted"
                    >
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
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-40 object-cover rounded-md"
                />
              )}
              <p className="text-sm text-muted-foreground">{category.description}</p>
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Subcategories
                  </p>
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                            >
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
