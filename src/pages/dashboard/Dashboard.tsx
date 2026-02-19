import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { cn } from '@/lib/utils'
import { ordersApi, productsApi, customersApi } from '@/lib/api'
import { Package, ShoppingCart, DollarSign, TrendingUp, ArrowRight, Users, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Order } from '@/types'

interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  todayOrders: number
  todayRevenue: number
  totalRevenue: number
  ordersChange: number
  revenueChange: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)

        const [ordersStats, recentOrdersData, lowStockProducts] = await Promise.all([
          ordersApi.getStats(),
          ordersApi.getRecentOrders(5),
          productsApi.getLowStock(5),
        ])

        const lowStockCount = lowStockProducts.length

        setStats({
          totalOrders: ordersStats.totalOrders,
          pendingOrders: ordersStats.pendingOrders,
          todayOrders: ordersStats.todayOrders,
          todayRevenue: ordersStats.todayRevenue,
          totalRevenue: ordersStats.totalRevenue,
          ordersChange: ordersStats.todayOrders,
          revenueChange: Math.round((ordersStats.todayRevenue / Math.max(ordersStats.totalRevenue, 1)) * 100),
        })

        setRecentOrders(recentOrdersData)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const quickActions = [
    { name: 'Add Product', description: 'Create new product', href: '/products/add', icon: Package, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    { name: 'View Orders', description: 'Manage orders', href: '/orders', icon: ShoppingCart, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    { name: 'Customers', description: 'View all customers', href: '/customers', icon: Users, color: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
    { name: 'Analytics', description: 'View reports', href: '/settings/general', icon: TrendingUp, color: 'bg-muted', iconColor: 'text-muted-foreground' },
  ]

  const getChangeType = (value: number): 'positive' | 'negative' | 'neutral' => {
    if (value > 0) return 'positive'
    if (value < 0) return 'negative'
    return 'neutral'
  }

  const statCards = stats
    ? [
        {
          name: 'Total Orders',
          value: String(stats.totalOrders),
          change: `+${stats.ordersChange}`,
          changeType: getChangeType(stats.ordersChange),
          icon: ShoppingCart,
          color: 'bg-blue-500',
          href: '/orders',
        },
        {
          name: 'Revenue',
          value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
          change: `+${stats.revenueChange}%`,
          changeType: getChangeType(stats.revenueChange),
          icon: DollarSign,
          color: 'bg-emerald-500',
          href: '/orders',
        },
        {
          name: 'Today Orders',
          value: String(stats.todayOrders),
          change: stats.todayOrders > 0 ? 'From today' : 'No orders yet',
          changeType: stats.todayOrders > 0 ? 'positive' : 'neutral',
          icon: ShoppingCart,
          color: 'bg-amber-500',
          href: '/orders',
        },
        {
          name: 'Pending Orders',
          value: String(stats.pendingOrders),
          change: 'Needs attention',
          changeType: stats.pendingOrders > 0 ? 'negative' : 'neutral',
          icon: Package,
          color: 'bg-red-500',
          href: '/orders',
        },
      ]
    : []

  return (
    <div className="space-y-8">
      <Breadcrumb className="mb-4" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        <Button asChild>
          <Link to="/products/add">
            <Package className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p
                    className={cn(
                      'text-xs font-medium',
                      stat.changeType === 'positive' && 'text-emerald-600 dark:text-emerald-400',
                      stat.changeType === 'negative' && 'text-red-600 dark:text-red-400',
                      stat.changeType === 'neutral' && 'text-muted-foreground'
                    )}
                  >
                    {stat.change}
                  </p>
                </div>
                <div className={cn('p-3 rounded-xl', stat.color)}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-foreground">
                  Recent Orders
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {recentOrders.length === 0
                    ? 'No recent orders'
                    : `Showing ${recentOrders.length} recent orders`
                  }
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/orders" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>No recent orders to display</p>
                <p className="text-sm text-muted-foreground mt-1">
                  New orders will appear here automatically
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </p>
                      <p
                        className={cn(
                          'text-xs',
                          order.orderStatus === 'pending' && 'text-amber-600 dark:text-amber-400',
                          order.orderStatus === 'confirmed' && 'text-blue-600 dark:text-blue-400',
                          order.orderStatus === 'shipped' && 'text-purple-600 dark:text-purple-400',
                          order.orderStatus === 'delivered' && 'text-emerald-600 dark:text-emerald-400',
                          order.orderStatus === 'cancelled' && 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {order.orderStatus}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-foreground">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {quickActions.map((action) => (
                <Button
                  key={action.name}
                  variant="outline"
                  className="justify-start h-auto py-4 px-4"
                  asChild
                >
                  <Link to={action.href} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        action.color
                      )}
                    >
                      <action.icon
                        className={cn('h-5 w-5', action.iconColor)}
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{action.name}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
