import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/common/EmptyState'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { ordersApi } from '@/lib/api'
import {
  ShoppingCart,
  Eye,
  Loader2,
  Search,
  RefreshCw,
  X,
  Filter,
} from 'lucide-react'
import type { Order } from '@/types'

const orderStatuses = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 hover:bg-yellow-100' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 hover:bg-green-100' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100' },
]

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentFilter, setPaymentFilter] = useState('ALL')

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await ordersApi.getAll()
      setOrders(data || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  // Calculate live statistics
  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.orderStatus?.toLowerCase() === 'pending').length
    const confirmed = orders.filter((o) => o.orderStatus?.toLowerCase() === 'confirmed').length
    const shipped = orders.filter((o) => o.orderStatus?.toLowerCase() === 'shipped').length
    const delivered = orders.filter((o) => o.orderStatus?.toLowerCase() === 'delivered').length
    const cancelled = orders.filter((o) => o.orderStatus?.toLowerCase() === 'cancelled').length
    return { total, pending, confirmed, shipped, delivered, cancelled }
  }, [orders])

  // Filter orders by search, status, and payment status
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (order.orderStatus?.toLowerCase() !== statusFilter.toLowerCase()) {
          return false
        }
      }

      // Payment Status filter
      if (paymentFilter !== 'ALL') {
        if (order.paymentStatus?.toLowerCase() !== paymentFilter.toLowerCase()) {
          return false
        }
      }

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchNumber = order.orderNumber?.toLowerCase().includes(q)
        const matchCustomer = order.customerName?.toLowerCase().includes(q)
        const matchPhone = order.customerPhone?.includes(q) || order.whatsappNumber?.includes(q)
        const matchEmail = order.customerEmail?.toLowerCase().includes(q)
        const matchCity = order.city?.toLowerCase().includes(q)
        const matchState = order.state?.toLowerCase().includes(q)
        const matchPincode = order.pincode?.includes(q)
        const matchItems = Array.isArray(order.items) && order.items.some((i) => i.productName?.toLowerCase().includes(q))
        return matchNumber || matchCustomer || matchPhone || matchEmail || matchCity || matchState || matchPincode || matchItems
      }

      return true
    })
  }, [orders, statusFilter, paymentFilter, searchTerm])

  const handleCardFilterClick = (st: string) => {
    if (statusFilter === st) {
      setStatusFilter('ALL')
    } else {
      setStatusFilter(st)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPaymentFilter('ALL')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = orderStatuses.find(
      (s) => s.value.toLowerCase() === (status || '').toLowerCase()
    )
    return statusConfig ? (
      <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
    ) : (
      <Badge variant="outline">{status}</Badge>
    )
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

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-4" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage customer orders ({orders.length} total)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadOrders}
          disabled={loading}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Statistics Cards (Clickable for quick filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer transition-all hover:border-primary/50 ${
            statusFilter === 'ALL'
              ? 'ring-2 ring-primary border-transparent shadow-sm'
              : 'bg-card/50'
          }`}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total
            </p>
            <p className="text-2xl font-bold mt-1 text-foreground">
              {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardFilterClick('pending')}
          className={`cursor-pointer transition-all hover:border-amber-400 ${
            statusFilter === 'pending'
              ? 'ring-2 ring-amber-500 border-transparent shadow-sm bg-amber-50/80 dark:bg-amber-950/40'
              : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/50'
          }`}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Pending
            </p>
            <p className="text-2xl font-bold mt-1 text-amber-800 dark:text-amber-300">
              {stats.pending}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardFilterClick('confirmed')}
          className={`cursor-pointer transition-all hover:border-blue-400 ${
            statusFilter === 'confirmed'
              ? 'ring-2 ring-blue-500 border-transparent shadow-sm bg-blue-50/80 dark:bg-blue-950/40'
              : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/50'
          }`}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Confirmed
            </p>
            <p className="text-2xl font-bold mt-1 text-blue-800 dark:text-blue-300">
              {stats.confirmed}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardFilterClick('shipped')}
          className={`cursor-pointer transition-all hover:border-purple-400 ${
            statusFilter === 'shipped'
              ? 'ring-2 ring-purple-500 border-transparent shadow-sm bg-purple-50/80 dark:bg-purple-950/40'
              : 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/50'
          }`}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              Shipped
            </p>
            <p className="text-2xl font-bold mt-1 text-purple-800 dark:text-purple-300">
              {stats.shipped}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardFilterClick('delivered')}
          className={`cursor-pointer transition-all hover:border-emerald-400 ${
            statusFilter === 'delivered'
              ? 'ring-2 ring-emerald-500 border-transparent shadow-sm bg-emerald-50/80 dark:bg-emerald-950/40'
              : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50'
          }`}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Delivered
            </p>
            <p className="text-2xl font-bold mt-1 text-emerald-800 dark:text-emerald-300">
              {stats.delivered}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardFilterClick('cancelled')}
          className={`cursor-pointer transition-all hover:border-red-400 ${
            statusFilter === 'cancelled'
              ? 'ring-2 ring-red-500 border-transparent shadow-sm bg-red-50/80 dark:bg-red-950/40'
              : 'bg-red-50/40 dark:bg-red-950/20 border-red-200/50'
          }`}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
              Cancelled
            </p>
            <p className="text-2xl font-bold mt-1 text-red-800 dark:text-red-300">
              {stats.cancelled}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order #, customer name, phone, email, city, pincode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="flex items-center gap-1.5 border rounded-md px-2.5 py-1 bg-background">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-7 bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Status: ALL</option>
                  {orderStatuses.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Status: {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 border rounded-md px-2.5 py-1 bg-background">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="h-7 bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Payment: ALL</option>
                  <option value="paid">Payment: Paid</option>
                  <option value="pending">Payment: Pending</option>
                  <option value="failed">Payment: Failed</option>
                </select>
              </div>

              {(statusFilter !== 'ALL' || paymentFilter !== 'ALL' || searchTerm.trim()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground h-9"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {(statusFilter !== 'ALL' || paymentFilter !== 'ALL' || searchTerm.trim()) && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
              <span>
                Showing <strong>{filteredOrders.length}</strong> of{' '}
                <strong>{orders.length}</strong> orders
              </span>
              <button
                onClick={clearFilters}
                className="text-primary hover:underline text-xs"
              >
                Reset filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
              {orders.length === 0 ? (
                <>
                  <p className="font-medium text-foreground">No orders yet</p>
                  <p className="text-xs mt-1">
                    Orders will appear here automatically when customers make purchases.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">No matching orders found</p>
                  <p className="text-xs mt-1">
                    Try adjusting your search query or status filter.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-3"
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
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
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items?.length || 0} items
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customerPhone}
                          </p>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
