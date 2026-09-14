import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { consultantApi } from '@/lib/api'

export default function OrderConsultants() {
  const [requests, setRequests] = useState<any[]>([])
  const load = async () => setRequests(await consultantApi.getAll())
  useEffect(() => { load() }, [])
  return <div className="space-y-6">
    <div><h1 className="text-2xl sm:text-3xl font-bold">Order Consultants</h1><p className="text-muted-foreground mt-1">Unsupported delivery requests requiring customer assistance.</p></div>
    <div className="space-y-4">{requests.map(request => <Card key={request.id}><CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><CardTitle className="text-lg">{request.name} · {request.pincode}</CardTitle><p className="text-sm text-muted-foreground">{request.email} · {request.phone} · {request.city}, {request.state}</p></div><select value={request.status} onChange={async e=>{await consultantApi.updateStatus(request.id,e.target.value);load()}} className="h-9 rounded-md border bg-background px-2 text-sm"><option>NEW</option><option>CONTACTED</option><option>RESOLVED</option><option>CLOSED</option></select></CardHeader><CardContent className="space-y-2 text-sm"><p><strong>Address:</strong> {request.address}</p><p><strong>WhatsApp:</strong> {request.whatsappNumber || '—'}</p><p><strong>Requested region:</strong> {request.requestedRegion || '—'}</p><p><strong>Subtotal:</strong> {request.subtotal != null ? `₹${request.subtotal}` : '—'} · <strong>Created:</strong> {new Date(request.createdAt).toLocaleString('en-IN')}</p>{Array.isArray(request.cartItems) && <div><strong>Cart items:</strong> {request.cartItems.map((item:any)=><span key={item.variantId} className="inline-block mr-2 rounded bg-muted px-2 py-1">{item.productName} × {item.quantity}</span>)}</div>}<Badge variant="secondary">{request.status}</Badge></CardContent></Card>)}{requests.length===0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No consultant requests.</CardContent></Card>}</div>
  </div>
}
