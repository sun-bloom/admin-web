import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { Settings } from 'lucide-react'

export default function GeneralSettings() {
  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-4" />
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          General Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your site settings
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Site Information</CardTitle>
          <CardDescription>Update your site's basic information</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Settings}
            title="Settings coming soon"
            description="Site settings management will be available shortly"
          />
        </CardContent>
      </Card>
    </div>
  )
}
