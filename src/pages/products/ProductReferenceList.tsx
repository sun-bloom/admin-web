import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { productsApi } from '@/lib/api'
import type { Product } from '@/types'

export default function ProductReferenceList() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    productsApi.getAll().then(setProducts).catch(() => setProducts([]))
  }, [])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) => {
      const category = product.categoryDetails?.name || (typeof product.category === 'string' ? product.category : product.category.name)
      return [product.productNumber || '', product.name, category].some((value) => value.toLowerCase().includes(query))
    })
  }, [products, search])

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-4" />
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Product List</h1>
        <p className="text-muted-foreground mt-1">Reference list of business Product Numbers</p>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Products and Identifiers</CardTitle>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Product Number, name or category" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Product Number</th>
                  <th className="px-4 py-3 font-medium">Product Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold">{product.productNumber || '—'}</td>
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3">{product.categoryDetails?.name || (typeof product.category === 'string' ? product.category : product.category.name)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && <p className="py-8 text-center text-muted-foreground">No products found.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}