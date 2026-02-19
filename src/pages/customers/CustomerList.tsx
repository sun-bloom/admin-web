import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CustomerList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">Manage your customers</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Customers will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
