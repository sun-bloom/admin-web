import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function AdminUsers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
        <p className="text-muted-foreground">Manage admin user accounts</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Admin Users</CardTitle>
          <CardDescription>Manage admin access and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Admin users will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
