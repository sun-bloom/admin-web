import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function PaymentSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
        <p className="text-muted-foreground">Manage payment methods and UPI</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment Configuration</CardTitle>
          <CardDescription>Configure UPI and payment settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Payment settings will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
