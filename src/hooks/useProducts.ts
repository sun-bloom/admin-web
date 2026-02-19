import { useState, useEffect, useCallback } from 'react'
import type { Product } from '@/types'
import { productsApi } from '@/lib/api'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await productsApi.getAll()
      setProducts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct = await productsApi.create(product)
    setProducts(prev => [...prev, newProduct])
    return newProduct
  }

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const updated = await productsApi.update(id, data)
    if (updated) {
      setProducts(prev => prev.map(p => p.id === id ? updated : p))
    }
    return updated
  }

  const deleteProduct = async (id: string) => {
    const success = await productsApi.delete(id)
    if (success) {
      setProducts(prev => prev.filter(p => p.id !== id))
    }
    return success
  }

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
