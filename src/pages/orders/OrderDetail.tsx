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
import { ArrowLeft, Truck, Package, CreditCard, User, MapPin, Calendar, ExternalLink, Save, Loader2 } from 'lucide-react'
import type { Order } from '@/types'

const orderStatuses = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
]

const carriers = [
  { value: 'delhivery', label: 'Delhivery' },
  { value: 'shiprocket', label: 'Shiprocket' },
  { value: 'bluedart', label: 'Blue Dart' },
  { value: 'dtdc', label: 'DTDC' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'india_post', label: 'India Post' },
  { value: 'other', label: 'Other' },
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

  const handleSaveTracking = async () => {
    if (!order) return
    
    setIsSaving(true)
    try {
      const updateData: Partial<Order> = {
        trackingCarrier: trackingCarrier || undefined,
        trackingNumber: trackingNumber || undefined,
        trackingUrl: trackingUrl || undefined,
      }

      if (trackingNumber && order.orderStatus === 'confirmed') {
        updateData.orderStatus = 'shipped'
        updateData.shippedAt = new Date().toISOString()
      }

      await ordersApi.update(order.id, updateData)
      toast.success('Tracking information updated')
      
      const updatedOrder = await ordersApi.getById(order.id)
      if (updatedOrder) {
        setOrder(updatedOrder)
      }
    } catch (error) {
      toast.error('Failed to update tracking')
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

      if (newStatus === 'delivered') {
        updateData.deliveredAt = new Date().toISOString()
      }

      await ordersApi.update(order.id, updateData)
      toast.success(`Order status updated to ${newStatus}`)
      
      const updatedOrder = await ordersApi.getById(order.id)
      if (updatedOrder) {
        setOrder(updatedOrder)
      }
    } catch (error) {
      toast.error('Failed to update status')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = orderStatuses.find(s => s.value === status)
    return statusConfig ? (
      <Badge className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    ) : <Badge>{status}</Badge>
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(order.orderStatus)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.color} / {item.pattern} × {item.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.variantId}
                      </p>
                    </div>
                    <div className="text-right">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{order.customerEmail}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                <p className="font-medium capitalize">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                <Badge className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.upiTransactionId && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Update Status</Label>
                <select
                  value={order.orderStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isSaving}
                  className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  {orderStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {order.shippedAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Shipped On</p>
                  <p className="font-medium">{formatDate(order.shippedAt)}</p>
                </div>
              )}
              
              {order.deliveredAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Delivered On</p>
                  <p className="font-medium">{formatDate(order.deliveredAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Tracking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="carrier" className="mb-2 block">Carrier</Label>
                <select
                  id="carrier"
                  value={trackingCarrier}
                  onChange={(e) => setTrackingCarrier(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">Select carrier</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.value} value={carrier.value}>
                      {carrier.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="trackingNumber" className="mb-2 block">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <Label htmlFor="trackingUrl" className="mb-2 block">Tracking URL (Optional)</Label>
                <Input
                  id="trackingUrl"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <Button
                onClick={handleSaveTracking}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Tracking Info
                  </>
                )}
              </Button>

              {order.trackingNumber && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Current Tracking</p>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {carriers.find(c => c.value === order.trackingCarrier)?.label || order.trackingCarrier}
                    </p>
                    <p className="font-mono text-sm">{order.trackingNumber}</p>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        Track Package
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
