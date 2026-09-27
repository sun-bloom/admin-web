import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { EmptyState } from '@/components/common/EmptyState'
import { customersApi } from '@/lib/api'
import type { Customer, Order } from '@/types'
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  ExternalLink,
  Eye,
  Loader2,
  X,
  CreditCard,
  Truck,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerDetail, setCustomerDetail] = useState<Customer | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadCustomers = async (searchQuery?: string) => {
    try {
      setLoading(true)
      const data = await customersApi.getAll(searchQuery)
      setCustomers(data)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const openCustomerDetail = async (id: string) => {
    setSelectedCustomerId(id)
    setDetailLoading(true)
    try {
      const detail = await customersApi.getById(id)
      setCustomerDetail(detail || null)
    } catch (err) {
      console.error('Failed to load customer detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setSelectedCustomerId(null)
    setCustomerDetail(null)
  }

  // Summary Metrics
  const totalCustomers = customers.length
  const activeCustomers = useMemo(() => customers.filter((c) => c.totalOrders > 0).length, [customers])
  const totalLifetimeValue = useMemo(
    () => customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    [customers]
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—'
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-4" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Customer Directory
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            View customer profiles, verified addresses, order history, and lifetime spending
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadCustomers(search)}
          disabled={loading}
          className="self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Customers
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalCustomers}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Buyers
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {activeCustomers}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Lifetime Order Value
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatPrice(totalLifetimeValue)}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="customer-search-input"
            name="customerSearch"
            placeholder="Search by name, email, phone, city, or pincode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card text-xs sm:text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline-block">
          Showing {customers.length} {customers.length === 1 ? 'customer' : 'customers'}
        </span>
      </div>

      {/* Main Table / Grid */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base sm:text-lg">Registered Patrons</CardTitle>
          <CardDescription>
            Authentic customer identities synchronized from web sessions and order submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No customers found"
                description={
                  search
                    ? `No customers match your search query "${search}"`
                    : 'Customer profiles will appear here automatically as users register or place orders.'
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full min-w-[750px] text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th className="text-left py-3 px-4 font-semibold">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold">Contact</th>
                      <th className="text-left py-3 px-4 font-semibold">Location</th>
                      <th className="text-center py-3 px-4 font-semibold">Orders</th>
                      <th className="text-right py-3 px-4 font-semibold">Total Spent</th>
                      <th className="text-left py-3 px-4 font-semibold">Joined</th>
                      <th className="text-center py-3 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#FAF0F4] border border-[#DFC598]/50 flex items-center justify-center text-[#7A223B] font-semibold text-xs shrink-0">
                              {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{c.name || 'Unnamed Customer'}</p>
                              {c.firebaseUid && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <ShieldCheck className="w-3 h-3" />
                                  Synced
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-foreground truncate max-w-[200px]">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{c.email}</span>
                          </div>
                          {c.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <span>{c.phone}</span>
                              {c.whatsappNumber && c.whatsappNumber !== c.phone && (
                                <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded font-medium">
                                  WA
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {c.city || c.state || c.pincode ? (
                            <div className="flex items-start gap-1.5 text-xs">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-foreground">
                                  {[c.city, c.state].filter(Boolean).join(', ')}
                                </p>
                                {c.pincode && <p className="text-muted-foreground text-[11px]">PIN: {c.pincode}</p>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">No address yet</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={c.totalOrders > 0 ? 'default' : 'secondary'}
                            className="text-xs font-semibold px-2.5 py-0.5"
                          >
                            {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-foreground">
                          {formatPrice(c.totalSpent)}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{formatDate(c.createdAt)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCustomerDetail(c.id)}
                            className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Profile</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="divide-y divide-border md:hidden">
                {customers.map((c) => (
                  <div key={c.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#FAF0F4] border border-[#DFC598]/50 flex items-center justify-center text-[#7A223B] font-semibold text-xs shrink-0">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{c.name || 'Unnamed Customer'}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                      <Badge variant={c.totalOrders > 0 ? 'default' : 'secondary'} className="text-xs">
                        {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-2.5 rounded-lg">
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase block">Total Spent</span>
                        <span className="font-semibold text-foreground">{formatPrice(c.totalSpent)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase block">Location</span>
                        <span className="font-medium text-foreground truncate block">
                          {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground">Joined: {formatDate(c.createdAt)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCustomerDetail(c.id)}
                        className="h-8 text-xs gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Modal / Drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-card border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 shrink-0 bg-muted/20">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <span>Customer Profile</span>
                  {customerDetail?.firebaseUid && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                      Verified Identity
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  ID: <span className="font-mono">{selectedCustomerId}</span>
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closeDetail} className="h-8 w-8 rounded-full cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {detailLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : customerDetail ? (
                <>
                  {/* Customer Information Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Contact & Personal Info */}
                    <div className="bg-muted/30 p-4 rounded-xl space-y-2.5 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Personal &amp; Contact
                      </p>
                      <div className="space-y-1.5 text-xs sm:text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Full Name:</span>
                          <span className="font-semibold text-foreground">{customerDetail.name || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium text-foreground truncate max-w-[180px]">
                            {customerDetail.email}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium text-foreground">{customerDetail.phone || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">WhatsApp:</span>
                          <span className="font-medium text-foreground">{customerDetail.whatsappNumber || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-muted/30 p-4 rounded-xl space-y-2.5 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Default Delivery Address
                      </p>
                      <div className="space-y-1 text-xs sm:text-sm">
                        {customerDetail.address ? (
                          <>
                            <p className="font-medium text-foreground">{customerDetail.address}</p>
                            <p className="text-muted-foreground">
                              {[customerDetail.city, customerDetail.state].filter(Boolean).join(', ')}
                            </p>
                            <p className="text-muted-foreground font-mono">PIN: {customerDetail.pincode}</p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground italic py-2">
                            No saved shipping address recorded yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lifetime Spending & Order Stats */}
                  <div className="grid grid-cols-3 gap-3 text-center bg-[#FAF6F0] dark:bg-muted/20 p-3.5 rounded-xl border border-[#DFC598]/40">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#7A223B] dark:text-[#DFC598] block">
                        Total Orders
                      </span>
                      <span className="text-lg font-bold text-foreground">{customerDetail.totalOrders}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#7A223B] dark:text-[#DFC598] block">
                        Lifetime Spend
                      </span>
                      <span className="text-lg font-bold text-[#7A223B] dark:text-[#E5C378]">
                        {formatPrice(customerDetail.totalSpent)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#7A223B] dark:text-[#DFC598] block">
                        Joined Date
                      </span>
                      <span className="text-xs font-medium text-foreground block mt-1">
                        {formatDate(customerDetail.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Order History Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#7A223B]" />
                        <span>Order History ({customerDetail.orders?.length || 0})</span>
                      </h3>
                    </div>

                    {!customerDetail.orders || customerDetail.orders.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic bg-muted/20 p-4 rounded-xl text-center">
                        This customer has not placed any orders yet.
                      </p>
                    ) : (
                      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                        {customerDetail.orders.map((order: any) => (
                          <div
                            key={order.id}
                            className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs sm:text-sm font-mono text-foreground">
                                  {order.orderNumber}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  {order.orderStatus}
                                </Badge>
                                <Badge
                                  variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                                  className="text-[10px]"
                                >
                                  {order.paymentStatus?.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {order.items?.length || 0} items • {formatDate(order.createdAt)}
                              </p>
                              {order.trackingUrl && (
                                <a
                                  href={order.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>Track: {order.trackingCarrier || 'Courier Link'}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3">
                              <span className="font-bold text-sm text-foreground">
                                {formatPrice(order.totalAmount)}
                              </span>
                              <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                                <a href={`/orders/${order.id}`}>View Order</a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">Unable to load customer details.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
