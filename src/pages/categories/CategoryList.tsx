import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Tag,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  FolderTree,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { toast } from '@/lib/hooks/useToast'
import { productsApi } from '@/lib/api'
import type { Category } from '@/types'

export default function CategoryList() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Category Deletion Modal State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await productsApi.getCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
      setError('Unable to load categories.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    try {
      setIsDeleting(true)
      const success = await productsApi.deleteCategory(categoryToDelete.id)
      if (success) {
        toast({
          title: 'Category deleted',
          description: `"${categoryToDelete.name}" and its subcategories were removed.`,
        })
        setCategoryToDelete(null)
        await loadCategories()
      } else {
        toast({
          title: 'Failed to delete category',
          description: 'The server rejected the delete request.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Error deleting category',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase()
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        cat.categoryNumber.includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q))
    )
  }, [categories, search])

  // Summary Metrics
  const totalSubcategories = useMemo(() => {
    return categories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0)
  }, [categories])

  if (isLoading) {
    return <PageLoader />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumb className="mb-4" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Categories</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your product categories</p>
          </div>
        </div>

        <Card className="max-w-md mx-auto my-12 rounded-2xl border-destructive/20 bg-destructive/5 text-center p-8">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">{error}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Failed to connect to the backend server. Please verify the API is running and try again.
          </p>
          <Button onClick={loadCategories} className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumb className="mb-2" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your product categories</p>
        </div>

        <Button asChild className="rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-white font-medium shadow-xs">
          <Link to="/categories/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Link>
        </Button>
      </div>

      {/* Stats and Search Bar (When categories exist) */}
      {categories.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/80 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories by name or slug..."
              className="pl-10 h-10 rounded-xl bg-background text-sm"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60">
              <Layers className="h-3.5 w-3.5 text-[#C5A059]" />
              <span className="font-semibold text-foreground">{categories.length}</span> Categories
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60">
              <FolderTree className="h-3.5 w-3.5 text-[#C5A059]" />
              <span className="font-semibold text-foreground">{totalSubcategories}</span> Subcategories
            </div>
          </div>
        </div>
      )}

      {/* Empty State: 0 categories total */}
      {categories.length === 0 && (
        <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-xs">
          <EmptyState
            icon={Tag}
            title="No categories found"
            description="Organize your store by adding your first product category."
            action={{
              label: '+ Add Category',
              to: '/categories/new',
            }}
          />
        </div>
      )}

      {/* Filtered Empty State (Search gave 0 results) */}
      {categories.length > 0 && filteredCategories.length === 0 && (
        <div className="bg-card rounded-2xl border border-border/80 p-12 text-center shadow-xs">
          <Search className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No matching categories</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            No categories matched "{search}". Try searching with a different keyword.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSearch('')} className="rounded-xl">
            Clear Search
          </Button>
        </div>
      )}

      {/* Category List / Grid */}
      {filteredCategories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const subCount = category.subcategories?.length || 0

            return (
              <Card
                key={category.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card hover:border-[#C5A059]/40 hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Category Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-muted/30 border-b border-border/60">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to stylized placeholder if image fails to load
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                    ) : null}

                    {/* Fallback placeholder element */}
                    <div
                      style={{ display: category.image ? 'none' : 'flex' }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-muted/60 to-muted/20 text-muted-foreground"
                    >
                      <Tag className="h-8 w-8 mb-2 opacity-40 text-[#C5A059]" />
                      <span className="text-xs font-medium uppercase tracking-wider opacity-60">No Image</span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide bg-background/90 text-foreground backdrop-blur-xs border border-border/60 shadow-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </div>

                    {/* Subcategories count badge */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide bg-background/90 text-muted-foreground backdrop-blur-xs border border-border/60 shadow-xs">
                        <FolderTree className="h-3 w-3 text-[#C5A059]" />
                        {subCount} {subCount === 1 ? 'sub' : 'subs'}
                      </span>
                    </div>
                  </div>

                  {/* Category Details */}
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-foreground tracking-tight truncate group-hover:text-[#C5A059] transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm font-semibold text-[#C5A059] mt-1">Category {category.categoryNumber}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5 tracking-tight truncate">
                          /{category.slug}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">
                      {category.description || 'No description provided.'}
                    </p>

                    {/* Subcategories Chips */}
                    {category.subcategories && category.subcategories.length > 0 ? (
                      <div className="pt-2 border-t border-border/40">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Subcategories
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
                          {category.subcategories.slice(0, 3).map((sub) => (
                            <span
                              key={sub.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/40 truncate max-w-[140px]"
                            >
                              {sub.name}
                            </span>
                          ))}
                          {category.subcategories.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/40 text-muted-foreground border border-border/40">
                              +{category.subcategories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-border/40">
                        <p className="text-[11px] text-muted-foreground/60 italic">No subcategories defined</p>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Category Actions Footer */}
                <div className="px-5 py-3.5 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl text-xs flex-1 hover:border-[#C5A059] hover:text-[#C5A059] transition-colors"
                    onClick={() => navigate(`/categories/${category.id}/edit`)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                    onClick={() => setCategoryToDelete(category)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Delete Category</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground font-semibold">"{categoryToDelete.name}"</strong>?
              This will also remove any associated subcategories and product category mappings.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-xs h-9 px-4"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl text-xs h-9 px-4"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Category'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
