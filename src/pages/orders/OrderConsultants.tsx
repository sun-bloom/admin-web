import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { consultantApi } from '@/lib/api'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShoppingBag,
  Truck,
  Search,
  RefreshCw,
  X,
  Filter,
} from 'lucide-react'

const STATUS_OPTIONS = [
  'PENDING',
  'CONTACTED',
  'DELIVERY_AVAILABLE',
  'DELIVERY_UNAVAILABLE',
  'CONVERTED_TO_ORDER',
  'CLOSED',
]

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'DELIVERY_AVAILABLE':
    case 'CONVERTED_TO_ORDER':
      return 'default'
    case 'CONTACTED':
      return 'secondary'
    case 'DELIVERY_UNAVAILABLE':
      return 'destructive'
    case 'PENDING':
    case 'NEW':
      return 'outline'
    default:
      return 'secondary'
  }
}

export default function OrderConsultants() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = async () => {
    setLoading(true)
    try {
      const data = await consultantApi.getAll()
      setRequests(data || [])
    } catch (err) {
      console.error('Failed to load delivery enquiries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Calculate live statistics
  const stats = useMemo(() => {
    const total = requests.length
    const pending = requests.filter(
      (r) => r.status === 'PENDING' || r.status === 'NEW'
    ).length
    const contacted = requests.filter((r) => r.status === 'CONTACTED').length
    const available = requests.filter(
      (r) => r.status === 'DELIVERY_AVAILABLE'
    ).length
    const unavailable = requests.filter(
      (r) => r.status === 'DELIVERY_UNAVAILABLE'
    ).length
    const converted = requests.filter(
      (r) => r.status === 'CONVERTED_TO_ORDER'
    ).length
    const closed = requests.filter((r) => r.status === 'CLOSED').length
    return {
      total,
      pending,
      contacted,
      available,
      unavailable,
      converted,
      closed,
    }
  }, [requests])

  // Filter requests based on status and search query
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Status match
      if (statusFilter !== 'ALL') {
        const normalized = r.status === 'NEW' ? 'PENDING' : r.status
        if (normalized !== statusFilter) return false
      }

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchName = r.name?.toLowerCase().includes(q)
        const matchEmail = r.email?.toLowerCase().includes(q)
        const matchPhone =
          r.phone?.includes(q) || r.whatsappNumber?.includes(q)
        const matchCity = r.city?.toLowerCase().includes(q)
        const matchState = r.state?.toLowerCase().includes(q)
        const matchPincode = r.pincode?.includes(q)
        const matchAddress = r.address?.toLowerCase().includes(q)
        const matchProducts =
          Array.isArray(r.cartItems) &&
          r.cartItems.some((ci: any) =>
            ci.productName?.toLowerCase().includes(q)
          )
        return (
          matchName ||
          matchEmail ||
          matchPhone ||
          matchCity ||
          matchState ||
          matchPincode ||
          matchAddress ||
          matchProducts
        )
      }

      return true
    })
  }, [requests, statusFilter, searchTerm])

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
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Delivery Enquiries &amp; Consultations
          </h1>
          <p className="text-muted-foreground mt-1">
            Customer delivery enquiries for unconfigured delivery regions. Confirm availability to allow checkout.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Statistics Cards (Clickable for quick filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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
          onClick={() => handleCardFilterClick('PENDING')}
          className={`cursor-pointer transition-all hover:border-amber-400 ${
            statusFilter === 'PENDING'
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
          onClick={() => handleCardFilterClick('CONTACTED')}
          className={`cursor-pointer transition-all hover:border-blue-400 ${
            statusFilter === 'CONTACTED'
              ? 'ring-2 ring-blue-500 border-transparent shadow-sm bg-blue-50/80 dark:bg-blue-950/40'
              : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/50'
          }`}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Contacted
            </p>
            <p className="text-2xl font-bold mt-1 text-blue-800 dark:text-blue-300">
              {stats.contacted}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardFilterClick('DELIVERY_AVAILABLE')}
          className={`cursor-pointer transition-all hover:border-emerald-400 ${
            statusFilter === 'DELIVERY_AVAILABLE'
              ? 'ring-2 ring-emerald-500 border-transparent shadow-sm bg-emerald-50/80 dark:bg-emerald-950/40'
              : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50'
          }`}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Available
            </p>
            <p className="text-2xl font-bold mt-1 text-emerald-800 dark:text-emerald-300">
              {stats.available}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardFilterClick('DELIVERY_UNAVAILABLE')}
          className={`cursor-pointer transition-all hover:border-red-400 ${
            statusFilter === 'DELIVERY_UNAVAILABLE'
              ? 'ring-2 ring-red-500 border-transparent shadow-sm bg-red-50/80 dark:bg-red-950/40'
              : 'bg-red-50/40 dark:bg-red-950/20 border-red-200/50'
          }`}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
              Unavailable
            </p>
            <p className="text-2xl font-bold mt-1 text-red-800 dark:text-red-300">
              {stats.unavailable}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardFilterClick('CONVERTED_TO_ORDER')}
          className={`cursor-pointer transition-all hover:border-purple-400 ${
            statusFilter === 'CONVERTED_TO_ORDER'
              ? 'ring-2 ring-purple-500 border-transparent shadow-sm bg-purple-50/80 dark:bg-purple-950/40'
              : 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/50'
          }`}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              Converted
            </p>
            <p className="text-2xl font-bold mt-1 text-purple-800 dark:text-purple-300">
              {stats.converted}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardFilterClick('CLOSED')}
          className={`cursor-pointer transition-all hover:border-slate-400 ${
            statusFilter === 'CLOSED'
              ? 'ring-2 ring-slate-500 border-transparent shadow-sm bg-slate-100 dark:bg-slate-900'
              : 'bg-muted/40 border-border/50'
          }`}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Closed
            </p>
            <p className="text-2xl font-bold mt-1 text-foreground">
              {stats.closed}
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
                placeholder="Search by customer name, phone, email, pincode, city, products..."
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

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 border rounded-md px-2.5 py-1 bg-background">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-7 bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Status: ALL</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      Status: {opt.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {(statusFilter !== 'ALL' || searchTerm.trim()) && (
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

          {(statusFilter !== 'ALL' || searchTerm.trim()) && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
              <span>
                Showing <strong>{filteredRequests.length}</strong> of{' '}
                <strong>{requests.length}</strong> enquiries
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

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="border-border shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold">
                    {request.name}
                  </CardTitle>
                  <Badge variant={getStatusBadgeVariant(request.status)}>
                    {request.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {request.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {request.phone}{' '}
                    {request.whatsappNumber && `(WA: ${request.whatsappNumber})`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(request.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Status:
                </span>
                <select
                  value={request.status === 'NEW' ? 'PENDING' : request.status}
                  onChange={async (e) => {
                    await consultantApi.updateStatus(request.id, e.target.value)
                    load()
                  }}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-lg border border-border/50">
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Full Delivery Address:
                  </p>
                  <p className="text-muted-foreground">{request.address}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">
                    Location Hierarchy:
                  </p>
                  <p className="text-muted-foreground">
                    City/District:{' '}
                    <span className="font-medium text-foreground">
                      {request.city}
                    </span>{' '}
                    | State:{' '}
                    <span className="font-medium text-foreground">
                      {request.state}
                    </span>{' '}
                    | Pincode:{' '}
                    <span className="font-medium text-foreground">
                      {request.pincode}
                    </span>
                  </p>
                </div>
              </div>

              {/* Requested Products & Estimated Order Value */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs font-semibold pb-1.5 border-b border-border/40">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <ShoppingBag className="w-3.5 h-3.5" /> Requested Products &amp; Quantities
                  </span>
                  <span className="text-foreground">
                    Estimated Subtotal: ₹
                    {request.subtotal != null
                      ? Number(request.subtotal).toLocaleString('en-IN')
                      : '—'}
                  </span>
                </div>

                {Array.isArray(request.cartItems) && request.cartItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {request.cartItems.map((item: any, idx: number) => (
                      <div
                        key={item.variantId || idx}
                        className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/20 border border-border/40"
                      >
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {item.productName}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    No cart items attached.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && filteredRequests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {requests.length === 0 ? (
                <>
                  <p className="font-medium">No delivery enquiries found.</p>
                  <p className="text-xs mt-0.5">
                    When customers request delivery for unconfigured regions, they will appear here.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">No matching enquiries found.</p>
                  <p className="text-xs mt-0.5">
                    Try adjusting your status filter or search term.
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
