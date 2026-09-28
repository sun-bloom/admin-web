import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ordersApi } from '@/lib/api'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Truck,
  Package,
  CreditCard,
  User,
  MapPin,
  Calendar,
  ExternalLink,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  MessageSquare
} from 'lucide-react'
import type { Order } from '@/types'

// Authoritative Sunbloom Adorn 3-Stage Delivery Workflow (+ Cancelled)
const deliveryStatuses = [
  { value: 'confirmed', label: 'ORDER PLACED', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' },
  { value: 'shipped', label: 'OUT FOR DELIVERY', badgeColor: 'bg-blue-100 text-blue-900 border-blue-300' },
  { value: 'delivered', label: 'DELIVERED', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { value: 'cancelled', label: 'CANCELLED', badgeColor: 'bg-rose-100 text-rose-900 border-rose-300' },
]

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [trackingCarrier, setTrackingCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [urlError, setUrlError] = useState('')

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        toast.error('Order ID not found')
        navigate('/orders')
        return
      }

      try {
        const orderData = await ordersApi.getById(id)
        if (!orderData) {
          toast.error('Order not found')
          navigate('/orders')
          return
        }
        setOrder(orderData)
        setTrackingCarrier(orderData.trackingCarrier || '')
        setTrackingNumber(orderData.trackingNumber || '')
        setTrackingUrl(orderData.trackingUrl || '')
      } catch (error) {
        toast.error('Failed to load order')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrder()
  }, [id, navigate])

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('')
      return true
    }
    try {
      const parsed = new URL(url.trim())
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        setUrlError('')
        return true
      }
      setUrlError('Tracking URL must start with http:// or https://')
      return false
    } catch {
      setUrlError('Please enter a valid URL (e.g., https://track.courier.com/12345)')
      return false
    }
  }

  const handleSaveTracking = async () => {
    if (!order) return
    
    if (trackingUrl && !validateUrl(trackingUrl)) {
      toast.error('Please provide a valid courier tracking URL')
      return
    }

    setIsSaving(true)
    try {
      const updateData: Partial<Order> = {
        trackingCarrier: trackingCarrier.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        trackingUrl: trackingUrl.trim() || undefined,
      }

      const updated = await ordersApi.update(order.id, updateData)
      toast.success('Tracking details saved successfully')

      if (updated?.notificationResult) {
        if (updated.notificationResult.sent) {
          toast.success('WhatsApp notification sent to customer!')
        } else if (updated.notificationResult.reason === 'PROVIDER_NOT_CONFIGURED') {
          toast.info('WhatsApp notification logged (Meta API provider credentials not configured in .env)')
        }
      }
      
      const refreshedOrder = await ordersApi.getById(order.id)
      if (refreshedOrder) {
        setOrder(refreshedOrder)
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error.message || 'Failed to update tracking')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    
    setIsSaving(true)
    try {
      const updateData: Partial<Order> = {
        orderStatus: newStatus as Order['orderStatus'],
      }

      if (newStatus === 'shipped') {
        updateData.shippedAt = new Date().toISOString()
      } else if (newStatus === 'delivered') {
        updateData.deliveredAt = new Date().toISOString()
      }

      const updated = await ordersApi.update(order.id, updateData)
      const label = deliveryStatuses.find(s => s.value === newStatus)?.label || newStatus
      toast.success(`Delivery status updated to ${label}`)

      if (updated?.notificationResult) {
        if (updated.notificationResult.sent) {
          toast.success('WhatsApp notification sent to customer!')
        } else if (updated.notificationResult.reason === 'PROVIDER_NOT_CONFIGURED') {
          toast.info('WhatsApp notification logged (Meta API provider credentials not configured in .env)')
        }
      }
      
      const refreshedOrder = await ordersApi.getById(order.id)
      if (refreshedOrder) {
        setOrder(refreshedOrder)
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error.message || 'Failed to update status')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const getDeliveryStatusLabel = (status: string) => {
    if (status === 'shipped') return 'OUT FOR DELIVERY'
    if (status === 'delivered') return 'DELIVERED'
    if (status === 'cancelled') return 'CANCELLED'
    return 'ORDER PLACED'
  }

  const getStatusBadge = (status: string) => {
    const config = deliveryStatuses.find(s => s.value === status) || deliveryStatuses[0]
    return (
      <Badge variant="outline" className={`px-3 py-1 font-semibold text-xs tracking-wider uppercase ${config.badgeColor}`}>
        {getDeliveryStatusLabel(status)}
      </Badge>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Pending'
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0">
          <Button variant="outline" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground break-words">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {getStatusBadge(order.orderStatus)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-[9rem]">
                      <p className="font-medium break-words">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.color}{item.pattern ? ` / ${item.pattern}` : ''} × {item.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Product Number: {item.productNumber || '—'} · Variant: {item.variantNumber || '—'}
                      </p>
                    </div>
                    <div className="text-right ml-auto">
                      <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.unitPrice)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.shippingCharge === 0 ? 'FREE' : formatPrice(order.shippingCharge)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Customer Name</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Authenticated Email</p>
                  <p className="font-medium">{order.customerEmail || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mobile Number</p>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                    WhatsApp Number
                  </p>
                  <p className="font-medium">{order.whatsappNumber || order.customerPhone || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Delivery Address
                  </p>
                  <p className="font-medium">{order.deliveryAddress}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.city}, {order.state} - {order.pincode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Payment Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                <p className="font-medium capitalize">{order.paymentMethod || 'Online'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                <Badge className={order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                  {order.paymentStatus?.toUpperCase()}
                </Badge>
              </div>
              {order.upiTransactionId && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">UPI / Gateway Ref</p>
                  <p className="font-medium font-mono text-sm">{order.upiTransactionId}</p>
                </div>
              )}
              {order.paidAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Paid On</p>
                  <p className="font-medium">{formatDate(order.paidAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Status Management */}
          <Card className="border-amber-200 shadow-sm">
            <CardHeader className="bg-amber-50/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Calendar className="h-5 w-5 text-amber-700" />
                Delivery Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Update Delivery Stage
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    variant={order.orderStatus === 'confirmed' || order.orderStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    className="justify-start font-medium"
                    onClick={() => handleStatusChange('confirmed')}
                    disabled={isSaving}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    ORDER PLACED
                  </Button>
                  <Button
                    type="button"
                    variant={order.orderStatus === 'shipped' ? 'default' : 'outline'}
                    size="sm"
                    className="justify-start font-medium"
                    onClick={() => handleStatusChange('shipped')}
                    disabled={isSaving}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    OUT FOR DELIVERY
                  </Button>
                  <Button
                    type="button"
                    variant={order.orderStatus === 'delivered' ? 'default' : 'outline'}
                    size="sm"
                    className="justify-start font-medium"
                    onClick={() => handleStatusChange('delivered')}
                    disabled={isSaving}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    DELIVERED
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Order Placed:</span>
                  <span className="font-medium text-foreground">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Out for Delivery:</span>
                  <span className="font-medium text-foreground">{order.shippedAt ? formatDate(order.shippedAt) : 'Pending'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivered:</span>
                  <span className="font-medium text-foreground">{order.deliveredAt ? formatDate(order.deliveredAt) : 'Pending'}</span>
                </div>
                {order.whatsappNotifiedAt && (
                  <div className="flex justify-between pt-1 border-t text-emerald-700">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> WhatsApp Notified:
                    </span>
                    <span className="font-medium">{formatDate(order.whatsappNotifiedAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Courier Tracking URL & Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Courier Tracking URL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="trackingUrl" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Courier Tracking URL
                </Label>
                <Input
                  id="trackingUrl"
                  value={trackingUrl}
                  onChange={(e) => {
                    setTrackingUrl(e.target.value)
                    validateUrl(e.target.value)
                  }}
                  placeholder="https://track.courier.com/shipment/..."
                  className={urlError ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
                />
                {urlError && <p className="text-xs text-rose-600 mt-1 font-medium">{urlError}</p>}
                <p className="text-xs text-muted-foreground mt-1.5">
                  Paste the authoritative courier tracking link provided by the logistics partner.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="trackingCarrier" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Courier Name (Optional)
                  </Label>
                  <Input
                    id="trackingCarrier"
                    value={trackingCarrier}
                    onChange={(e) => setTrackingCarrier(e.target.value)}
                    placeholder="e.g. Blue Dart, Delhivery"
                  />
                </div>
                <div>
                  <Label htmlFor="trackingNumber" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    AWB / Tracking # (Optional)
                  </Label>
                  <Input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. 1234567890"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveTracking}
                disabled={isSaving || Boolean(urlError)}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    SAVE TRACKING DETAILS
                  </>
                )}
              </Button>

              {order.trackingUrl && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">Active Customer Tracking Link:</p>
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200 hover:underline break-all"
                  >
                    <span>Test Courier Link</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
