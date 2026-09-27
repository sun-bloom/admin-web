import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { cn } from '@/lib/utils'
import { dashboardApi } from '@/lib/api'
import type { AdminDashboardStats, Order } from '@/types'
import {
  Package,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Users,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Clock,
  MessageSquare,
  Headphones,
  Sliders,
  CreditCard,
  RefreshCw,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

export default function Dashboard() {
  const [data, setData] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const stats = await dashboardApi.getStats()
      setData(stats)
    } catch (err: any) {
      console.error('Failed to load dashboard operational statistics:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#7A223B]" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Loading Atelier Operations…
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Breadcrumb className="mb-4" />
        <Card className="border-destructive/30 bg-destructive/5 p-8 text-center max-w-lg mx-auto">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-bold text-destructive">Unable to Load Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">{error}</p>
          <Button onClick={loadDashboardData} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  const primaryStats = [
    {
      name: 'Total Orders',
      value: String(data.orders.total),
      subtitle: `${data.orders.today} placed today`,
      icon: ShoppingCart,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200',
      href: '/orders',
    },
    {
      name: 'Total Revenue',
      value: formatPrice(data.revenue.total),
      subtitle: `${formatPrice(data.revenue.today)} today (AOV: ${formatPrice(data.revenue.averageOrderValue)})`,
      icon: IndianRupee,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200',
      href: '/orders',
    },
    {
      name: 'Active Catalog',
      value: `${data.products.active} / ${data.products.total}`,
      subtitle: data.products.lowStock > 0 ? `${data.products.lowStock} variants low in stock` : 'Stock levels healthy',
      icon: Package,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200',
      href: '/products',
    },
    {
      name: 'Registered Patrons',
      value: String(data.customers.total),
      subtitle: `${data.customers.today} new registrations today`,
      icon: Users,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200',
      href: '/customers',
    },
  ]

  const quickActions = [
    {
      name: 'Add New Creation',
      description: 'Create and publish jewellery piece',
      href: '/products/add',
      icon: Package,
      badge: null,
      badgeColor: '',
    },
    {
      name: 'Process Orders',
      description: 'View orders & update courier tracking',
      href: '/orders',
      icon: ShoppingCart,
      badge: data.orders.pending > 0 ? `${data.orders.pending} pending` : null,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      name: 'Customer Support Queries',
      description: 'Review and resolve support tickets',
      href: '/customer-queries',
      icon: Headphones,
      badge: data.enquiries.openSupportQueries > 0 ? `${data.enquiries.openSupportQueries} open` : null,
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    },
    {
      name: 'Delivery Enquiries',
      description: 'Consultations for custom pincodes',
      href: '/order-consultants',
      icon: MessageSquare,
      badge: data.enquiries.pendingConsultations > 0 ? `${data.enquiries.pendingConsultations} new` : null,
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    },
    {
      name: 'Customer Directory',
      description: 'View profiles, spend & addresses',
      href: '/customers',
      icon: Users,
      badge: null,
      badgeColor: '',
    },
    {
      name: 'Delivery Configuration',
      description: 'Manage pincodes, charges & regions',
      href: '/settings/delivery',
      icon: Truck,
      badge: null,
      badgeColor: '',
    },
    {
      name: 'Payment Gateway Status',
      description: 'PayU production gateway integration',
      href: '/settings/payment',
      icon: CreditCard,
      badge: null,
      badgeColor: '',
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <Breadcrumb className="mb-4" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Atelier Control Centre
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Live operational statistics, customer orders, shipment tracking, and stock management
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={loading}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button asChild size="sm" className="text-xs btn-rose-primary">
            <Link to="/products/add">
              <Package className="h-3.5 w-3.5 mr-1.5 text-[#DFC598]" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((stat) => (
          <Link key={stat.name} to={stat.href} className="block group">
            <Card className="hover:shadow-md hover:border-[#DFC598] transition-all border-border shadow-xs h-full">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {stat.name}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-[#7A223B] transition-colors">
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn('p-2.5 rounded-xl border', stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 pt-2.5 border-t border-border/60">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Operational Attention Alerts (Low stock, awaiting tracking, support queries) */}
      {(data.orders.awaitingTracking > 0 ||
        data.products.lowStock > 0 ||
        data.products.outOfStock > 0 ||
        data.enquiries.openSupportQueries > 0 ||
        data.enquiries.pendingConsultations > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {data.orders.awaitingTracking > 0 && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    {data.orders.awaitingTracking} Orders Awaiting Shipment Tracking
                  </p>
                  <p className="text-amber-700/80 dark:text-amber-400/80 text-[11px]">
                    Enter courier tracking URL to notify customers
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-amber-900 hover:bg-amber-100">
                <Link to="/orders">Fulfill →</Link>
              </Button>
            </div>
          )}

          {(data.products.lowStock > 0 || data.products.outOfStock > 0) && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
                <div>
                  <p className="font-semibold text-rose-900 dark:text-rose-200">
                    {data.products.lowStock + data.products.outOfStock} Low / Out-of-Stock Variants
                  </p>
                  <p className="text-rose-700/80 dark:text-rose-400/80 text-[11px]">
                    {data.products.outOfStock} out-of-stock, {data.products.lowStock} low inventory
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-rose-900 hover:bg-rose-100">
                <Link to="/products">Manage →</Link>
              </Button>
            </div>
          )}

          {(data.enquiries.openSupportQueries > 0 || data.enquiries.pendingConsultations > 0) && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200">
                    {data.enquiries.openSupportQueries} Support / {data.enquiries.pendingConsultations} Delivery Enquiries
                  </p>
                  <p className="text-blue-700/80 dark:text-blue-400/80 text-[11px]">
                    Customer requests requiring attention
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-blue-900 hover:bg-blue-100">
                <Link to="/customer-queries">Respond →</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Order Status Breakdown Bar */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm sm:text-base font-semibold">
            Delivery &amp; Order Pipeline Status
          </CardTitle>
          <CardDescription className="text-xs">
            Authoritative lifecycle distribution across all customer consignments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-muted/40 p-3 rounded-xl text-center border border-border">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Order Placed (Pending)
              </span>
              <span className="text-xl font-bold text-amber-600 mt-1 block">
                {data.orders.pending + data.orders.confirmed}
              </span>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl text-center border border-border">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Out for Delivery
              </span>
              <span className="text-xl font-bold text-blue-600 mt-1 block">
                {data.orders.shipped}
              </span>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl text-center border border-border">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Delivered
              </span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">
                {data.orders.delivered}
              </span>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl text-center border border-border">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Cancelled
              </span>
              <span className="text-xl font-bold text-rose-600 mt-1 block">
                {data.orders.cancelled}
              </span>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl text-center border border-border">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Open Support Tickets
              </span>
              <span className="text-xl font-bold text-[#7A223B] mt-1 block">
                {data.enquiries.openSupportQueries}
              </span>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl text-center border border-border">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Delivery Enquiries
              </span>
              <span className="text-xl font-bold text-[#9E7B31] mt-1 block">
                {data.enquiries.pendingConsultations}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout: Recent Orders & Quick Management Links */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left (8 Cols): Recent Orders */}
        <Card className="lg:col-span-8 border-border shadow-xs">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Recent Customer Orders</CardTitle>
              <CardDescription className="text-xs">
                Real-time stream of latest purchases from the customer web
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5">
              <Link to="/orders">
                <span>All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm">No orders recorded yet</p>
                <p className="text-xs mt-0.5">Purchases placed on the customer store will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-x-auto">
                {data.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-muted/30 transition-colors block"
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs sm:text-sm text-foreground">
                          {order.orderNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] uppercase font-semibold',
                            order.orderStatus === 'shipped' && 'bg-blue-50 text-blue-900 border-blue-200',
                            order.orderStatus === 'delivered' && 'bg-emerald-50 text-emerald-900 border-emerald-200',
                            order.orderStatus === 'cancelled' && 'bg-rose-50 text-rose-900 border-rose-200'
                          )}
                        >
                          {order.orderStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.customerName} • {order.items?.length || 0} items • {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-xs sm:text-sm text-foreground">
                        {formatPrice(order.totalAmount)}
                      </p>
                      <span
                        className={cn(
                          'text-[10px] uppercase font-semibold',
                          order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                        )}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right (4 Cols): Quick Actions */}
        <Card className="lg:col-span-4 border-border shadow-xs flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base sm:text-lg">Atelier Operations</CardTitle>
            <CardDescription className="text-xs">Direct navigation to active administrative modules</CardDescription>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 flex-1 space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.name}
                variant="outline"
                className="w-full justify-start h-auto p-3 text-left hover:border-[#DFC598] hover:bg-muted/30 transition-all cursor-pointer"
                asChild
              >
                <Link to={action.href} className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-[#FAF0F4] border border-[#DFC598]/50 flex items-center justify-center shrink-0 text-[#7A223B]">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{action.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{action.description}</p>
                    </div>
                  </div>
                  {action.badge && (
                    <Badge variant="outline" className={cn('text-[10px] shrink-0 font-semibold', action.badgeColor)}>
                      {action.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
