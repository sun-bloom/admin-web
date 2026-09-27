import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { consultantApi } from '@/lib/api'
import { MapPin, Phone, Mail, Clock, ShoppingBag, Truck, CheckCircle2, AlertCircle } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Delivery Enquiries &amp; Consultations</h1>
          <p className="text-muted-foreground mt-1">
            Customer delivery enquiries for unconfigured delivery regions. Confirm availability to allow checkout.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="border-border shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold">{request.name}</CardTitle>
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
                    {request.phone} {request.whatsappNumber && `(WA: ${request.whatsappNumber})`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(request.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Status:</span>
                <select
                  value={request.status === 'NEW' ? 'PENDING' : request.status}
                  onChange={async (e) => {
                    await consultantApi.updateStatus(request.id, e.target.value)
                    load()
                  }}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
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
                  <p className="font-semibold text-foreground mb-0.5">Location Hierarchy:</p>
                  <p className="text-muted-foreground">
                    City/District: <span className="font-medium text-foreground">{request.city}</span> | State: <span className="font-medium text-foreground">{request.state}</span> | Pincode: <span className="font-medium text-foreground">{request.pincode}</span>
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
                    Estimated Subtotal: ₹{request.subtotal != null ? Number(request.subtotal).toLocaleString('en-IN') : '—'}
                  </span>
                </div>

                {Array.isArray(request.cartItems) && request.cartItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {request.cartItems.map((item: any, idx: number) => (
                      <div key={item.variantId || idx} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/20 border border-border/40">
                        <span className="font-medium text-foreground truncate max-w-[200px]">{item.productName}</span>
                        <span className="text-muted-foreground font-mono">Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2 italic">No cart items attached.</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && requests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No delivery enquiries found.</p>
              <p className="text-xs mt-0.5">When customers request delivery for unconfigured regions, they will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
