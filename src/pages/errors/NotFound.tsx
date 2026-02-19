import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link to="/">Go back home</Link>
      </Button>
    </div>
  )
}
