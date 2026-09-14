import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deliveryApi } from '@/lib/api'
import type { DeliveryRegion } from '@/types'

const blank = { regionName: '', city: '', state: '', pincodeStart: '', pincodeEnd: '', deliveryCharge: 0, isEnabled: true }

export default function DeliverySettings() {
  const [regions, setRegions] = useState<DeliveryRegion[]>([])
  const [form, setForm] = useState<any>(blank)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const load = async () => { try { setRegions((await deliveryApi.getAll()).regions || []) } catch (e: any) { setError(e.message) } }
  useEffect(() => { load() }, [])
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); try { if (editing) await deliveryApi.updateManagedRegion(editing, form); else await deliveryApi.createManagedRegion(form); setForm(blank); setEditing(null); await load() } catch (e: any) { setError(e.message) } }
  const edit = (region: DeliveryRegion) => { setEditing(region.id); setForm({ regionName: region.regionName, city: (region as any).city || '', state: (region as any).state || '', pincodeStart: region.pincodeStart, pincodeEnd: region.pincodeEnd, deliveryCharge: region.deliveryCharge, isEnabled: region.isEnabled }) }
  return <div className="space-y-6">
    <div><h1 className="text-2xl sm:text-3xl font-bold">Delivery Regions</h1><p className="text-muted-foreground mt-1">Configure supported locations and authoritative delivery charges.</p></div>
    <Card><CardHeader><CardTitle>{editing ? 'Edit Region' : 'Add Delivery Region'}</CardTitle></CardHeader><CardContent>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input required placeholder="Region name" value={form.regionName} onChange={e=>setForm({...form,regionName:e.target.value})}/><Input required placeholder="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/><Input placeholder="State" value={form.state} onChange={e=>setForm({...form,state:e.target.value})}/><Input required maxLength={6} placeholder="Pincode start" value={form.pincodeStart} onChange={e=>setForm({...form,pincodeStart:e.target.value})}/><Input required maxLength={6} placeholder="Pincode end" value={form.pincodeEnd} onChange={e=>setForm({...form,pincodeEnd:e.target.value})}/><Input required type="number" min="0" placeholder="Delivery charge" value={form.deliveryCharge} onChange={e=>setForm({...form,deliveryCharge:Number(e.target.value)})}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isEnabled} onChange={e=>setForm({...form,isEnabled:e.target.checked})}/> Enabled</label><div className="flex gap-2"><Button type="submit">{editing ? 'Save' : 'Add Region'}</Button>{editing && <Button type="button" variant="outline" onClick={()=>{setEditing(null);setForm(blank)}}>Cancel</Button>}</div>
      </form>{error && <p className="text-sm text-destructive mt-3">{error}</p>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Configured Regions</CardTitle></CardHeader><CardContent><div className="space-y-3">{regions.map(region=><div key={region.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-lg p-4"><div><p className="font-semibold">{region.regionName} <span className="text-muted-foreground font-normal">({region.pincodeStart}-{region.pincodeEnd})</span></p><p className="text-sm text-muted-foreground">{(region as any).city}, {(region as any).state || ''} · ₹{region.deliveryCharge} · {region.isEnabled ? 'Enabled' : 'Disabled'}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>edit(region)}>Edit</Button><Button size="sm" variant="outline" onClick={async()=>{try{await deliveryApi.updateManagedRegion(region.id,{isActive:!region.isEnabled} as any);await load()}catch(e:any){setError(e.message)}}}>{region.isEnabled?'Disable':'Enable'}</Button><Button size="sm" variant="destructive" onClick={async()=>{if(confirm('Delete this region?')){try{await deliveryApi.deleteManagedRegion(region.id);await load()}catch(e:any){setError(e.message)}}}}>Delete</Button></div></div>)}</div></CardContent></Card>
  </div>
}
