import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { ordersApi } from '@/lib/api'
import { ShoppingCart, Eye, Loader2 } from 'lucide-react'
import type { Order } from '@/types'

const orderStatuses = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800 hover:bg-green-100' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 hover:bg-red-100' },
]

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true)
        const data = await ordersApi.getAll()
        setOrders(data)
      } catch (error) {
        console.error('Failed to load orders:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = orderStatuses.find(s => s.value === status)
    return statusConfig ? (
      <Badge className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    ) : <Badge>{status}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb className="mb-4" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage customer orders
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <Breadcrumb className="mb-4" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage customer orders
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={ShoppingCart}
              title="No orders yet"
              description="Orders will appear here automatically when customers make purchases"
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-4" />
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Orders
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage customer orders ({orders.length} total)
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{order.items.length} items</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(order.orderStatus)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-medium">{formatPrice(order.totalAmount)}</p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/orders/${order.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
