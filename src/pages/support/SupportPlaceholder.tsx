import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SupportPlaceholder() {
  return <div className="space-y-6"><div><h1 className="text-2xl sm:text-3xl font-bold">Support</h1><p className="text-muted-foreground mt-1">Customer support queries remain available through the existing support workflow.</p></div><Card><CardHeader><CardTitle>Support Queries</CardTitle></CardHeader><CardContent className="text-muted-foreground">Use the existing customer Support flow to receive and manage requests.</CardContent></Card></div>
}
