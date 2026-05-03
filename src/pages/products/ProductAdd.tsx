import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, type ProductFormData } from '@/lib/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/common/ImageUpload'
import { toast } from 'sonner'
import { productsApi } from '@/lib/api'
import { Package, Plus, X, Save, ArrowLeft } from 'lucide-react'
import type { Category, Subcategory } from '@/types'

export default function ProductAdd() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [images, setImages] = useState<string[]>([])

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      categoryId: '',
      subcategoryId: '',
      description: '',
      basePrice: 0,
      images: [],
      variants: [],
      isActive: true,
    },
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const nameValue = form.watch('name')
  useEffect(() => {
    if (nameValue && !form.getValues('slug')) {
      form.setValue('slug', generateSlug(nameValue))
    }
  }, [nameValue, form])

  const variants = form.watch('variants')
  const selectedCategoryId = form.watch('categoryId')

  const availableSubcategories = useMemo<Subcategory[]>(() => {
    return categories.find((category) => category.id === selectedCategoryId)?.subcategories || []
  }, [categories, selectedCategoryId])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await productsApi.getCategories()
        setCategories(data)
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    const currentSubcategoryId = form.getValues('subcategoryId')
    if (!currentSubcategoryId) return

    const subcategoryExists = availableSubcategories.some(
      (subcategory) => subcategory.id === currentSubcategoryId
    )

    if (!subcategoryExists) {
      form.setValue('subcategoryId', '')
    }
  }, [availableSubcategories, form, selectedCategoryId])

  const addVariant = () => {
    const current = form.getValues('variants')
    form.setValue('variants', [
      ...current,
      { color: '', pattern: '', stock: 0, additionalPrice: 0, sku: '', isAvailable: true },
    ])
  }

  const removeVariant = (index: number) => {
    const current = form.getValues('variants')
    form.setValue('variants', current.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true)
    try {
      await productsApi.create({
        ...data,
        subcategoryId: data.subcategoryId || null,
      })
      toast.success('Product created successfully')
      navigate('/products')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Product</h1>
          <p className="text-muted-foreground">Create a new product in your catalog</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Basic information about the product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="Floral Print Crop Top"
                  {...form.register('name')}
                  disabled={isLoading}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  placeholder="floral-print-crop-top"
                  {...form.register('slug')}
                  onChange={(e) => {
                    const sanitized = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '')
                    form.setValue('slug', sanitized)
                  }}
                  disabled={isLoading}
                />
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  {...form.register('categoryId', {
                    onChange: () => form.setValue('subcategoryId', ''),
                  })}
                  disabled={isLoading}
                >
                  <option value="">Select category</option>
                  {categoriesLoading ? (
                    <option>Loading...</option>
                  ) : (
                    categories.map((cat: Category) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-destructive">{form.formState.errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <select
                  id="subcategory"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  {...form.register('subcategoryId')}
                  disabled={isLoading || !selectedCategoryId || categoriesLoading}
                >
                  <option value="">No subcategory</option>
                  {availableSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Optional. Select a category first to see its subcategories.
                </p>
                {form.formState.errors.subcategoryId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.subcategoryId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price (₹) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  placeholder="899"
                  {...form.register('basePrice', { valueAsNumber: true })}
                  disabled={isLoading}
                />
                {form.formState.errors.basePrice && (
                  <p className="text-sm text-destructive">{form.formState.errors.basePrice.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                placeholder="Describe the product..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                {...form.register('description')}
                disabled={isLoading}
              />
              {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

            <div className="space-y-2">
              <Label>Product Images *</Label>
              <ImageUpload
                value={images}
                onChange={(urls) => {
                  setImages(urls)
                  form.setValue('images', urls)
                }}
                maxImages={5}
              />
              {form.formState.errors.images && (
                <p className="text-sm text-destructive">{form.formState.errors.images.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4"
                {...form.register('isActive')}
                disabled={isLoading}
              />
              <Label htmlFor="isActive" className="font-normal">
                Product is active
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Variants</CardTitle>
              <CardDescription>Add product variations (colors, sizes, patterns)</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addVariant} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {variants.map((_: ProductFormData['variants'][number], index: number) => (
                <Card key={index} className="p-4 border">
                  <div className="grid gap-4 md:grid-cols-2 mb-3">
                    <div className="space-y-2">
                      <Label>Color *</Label>
                      <Input
                        placeholder="Red"
                        {...form.register(`variants.${index}.color`)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pattern *</Label>
                      <Input
                        placeholder="Solid"
                        {...form.register(`variants.${index}.pattern`)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Stock *</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        {...form.register(`variants.${index}.stock`, { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Price (₹)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        {...form.register(`variants.${index}.additionalPrice`, { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU *</Label>
                      <Input
                        placeholder="CT001-RED-01"
                        {...form.register(`variants.${index}.sku`)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form.register(`variants.${index}.isAvailable`)}
                      disabled={isLoading}
                    />
                    <Label>Available for sale</Label>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeVariant(index)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              {variants.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No variants added yet. Click "Add Variant" to get started.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <CardFooter className="flex justify-between px-6 py-4">
          <Button type="submit" disabled={isLoading || variants.length === 0}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Product
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </div>
  )
}
