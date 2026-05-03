import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductsTable } from '@/components/data-table/ProductsTable';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useProducts } from '@/hooks/useProducts';
import { toast } from '@/lib/hooks/useToast';

export default function ProductList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
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

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const query = search.toLowerCase();
    return products.filter(
      (product) => {
        const categoryName = typeof product.category === 'string'
          ? product.category
          : product.category?.name || '';
        const subcategoryName = typeof product.subcategory === 'string'
          ? product.subcategory
          : product.subcategory?.name || '';

        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query) ||
          subcategoryName.toLowerCase().includes(query)
        );
      }
    );
  }, [products, search]);

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-4" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Products
        </h1>
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, description, category, or subcategory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{products.length} total products</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">All Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoader />
          ) : error ? (
            <EmptyState
              icon={Package}
              title="Error loading products"
              description={error}
              action={{
                label: 'Retry',
                onClick: () => refetch(),
              }}
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products found"
              description="Try adjusting your search or add a new product"
              action={{
                label: 'Add Product',
                to: '/products/add',
              }}
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
