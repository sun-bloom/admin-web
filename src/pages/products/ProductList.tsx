import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Package, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductsTable } from '@/components/data-table/ProductsTable';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useProducts } from '@/hooks/useProducts';
import { toast } from '@/lib/hooks/useToast';
import { cn } from '@/lib/utils';

export default function ProductList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { products, isLoading, error, refetch, deleteProduct } = useProducts();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
      toast({
        title: 'Product deleted',
        description: 'The product has been successfully deleted.',
      });
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/products/${id}`);
  };

  const getCategoryName = (product: (typeof products)[0]) =>
    typeof product.category === 'string'
      ? product.category
      : product.category?.name || 'Uncategorised';

  const categoryGroups = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const name = getCategoryName(p);
      map.set(name, (map.get(name) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryName = getCategoryName(product);
      const subcategoryName =
        typeof product.subcategory === 'string'
          ? product.subcategory
          : product.subcategory?.name || '';

      if (selectedCategory && categoryName !== selectedCategory) return false;

      if (search) {
        const query = search.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query) ||
          subcategoryName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-4" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog and inventory
          </p>
        </div>
        <Button asChild>
          <Link to="/products/add">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Category summary cards */}
      {!isLoading && !error && categoryGroups.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50',
              selectedCategory === null
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-card text-foreground'
            )}
          >
            <LayoutGrid className="h-5 w-5 shrink-0 opacity-70" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">All</p>
              <p className="text-lg font-bold leading-tight">{products.length}</p>
            </div>
          </button>

          {categoryGroups.map(({ name, count }) => (
            <button
              key={name}
              onClick={() =>
                setSelectedCategory(selectedCategory === name ? null : name)
              }
              className={cn(
                'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50',
                selectedCategory === name
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card text-foreground'
              )}
            >
              <Package className="h-5 w-5 shrink-0 opacity-70" />
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{name}</p>
                <p className="text-lg font-bold leading-tight">{count}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Search + count bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, description, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>
            {filteredProducts.length}
            {selectedCategory ? ` in "${selectedCategory}"` : ' total'} products
          </span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">
            {selectedCategory ? selectedCategory : 'All Products'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoader />
          ) : error ? (
            <EmptyState
              icon={Package}
              title="Error loading products"
              description={error}
              action={{ label: 'Retry', onClick: () => refetch() }}
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products found"
              description="Try adjusting your search or add a new product"
              action={{ label: 'Add Product', to: '/products/add' }}
            />
          ) : (
            <ProductsTable
              products={filteredProducts}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
