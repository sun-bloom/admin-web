import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/lib/api'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setLoginError(null)
    try {
      console.log('Attempting login with:', data.email)
      await login(data.email, data.password)
      console.log('Login successful, navigating to dashboard')
      toast.success('Login successful')
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
      const message = error instanceof Error ? error.message : 'Login failed'
      setLoginError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...form.register('email')}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register('password')}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </CardFooter>
        </form>
        {loginError && (
          <div className="px-6 pb-2">
            <p className="text-sm text-destructive break-words">
              {loginError}
            </p>
          </div>
        )}
        <div className="px-6 pb-2 text-center">
          <p className="text-[11px] text-muted-foreground break-words">
            API: <span className="font-mono">{API_BASE_URL || `${window.location.origin} (via /api proxy)`}</span>
          </p>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Demo credentials:
          </p>
          <p className="text-xs font-mono bg-muted p-2 rounded">
            Email: admin@example.com<br />
            Password: admin123
          </p>
        </div>
      </Card>
    </div>
  )
}
