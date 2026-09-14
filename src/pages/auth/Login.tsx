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
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login, loginWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'skavinraj.dev@gmail.com',
      password: '',
    },
  })

  const formatError = (error: unknown, fallback: string) => {
    if (!(error instanceof Error)) return fallback
    const msg = error.message || ''
    if (
      msg.includes('auth/invalid-credential') ||
      msg.includes('auth/wrong-password') ||
      msg.includes('auth/user-not-found')
    ) {
      return 'Invalid email or password. Please verify your admin credentials.'
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in was closed before completing.'
    }
    if (msg.includes('auth/popup-blocked')) {
      return 'Sign-in popup was blocked by your browser. Please allow popups.'
    }
    if (msg.includes('auth/too-many-requests')) {
      return 'Too many attempts. Please wait a moment before trying again.'
    }
    if (msg.includes('auth/network-request-failed')) {
      return 'Network connection error. Please check your internet connection.'
    }
    return msg || fallback
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setLoginError(null)

    const normalizedEmail = data.email.trim().toLowerCase()
    const ALLOWED_ADMIN_EMAILS = ['sunbloomadornwork@gmail.com', 'skavinraj.dev@gmail.com']
    if (!ALLOWED_ADMIN_EMAILS.includes(normalizedEmail)) {
      const msg = 'Only authorized admin accounts are permitted to access this dashboard.'
      setLoginError(msg)
      toast.error(msg)
      setIsLoading(false)
      return
    }

    try {
      await login(data.email, data.password)
      toast.success('Admin login successful')
      navigate('/dashboard')
    } catch (error) {
      const message = formatError(error, 'Login failed')
      setLoginError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setLoginError(null)
    try {
      await loginWithGoogle()
      toast.success('Admin login successful with Google')
      navigate('/dashboard')
    } catch (error) {
      const message = formatError(error, 'Google login failed')
      setLoginError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4 sm:p-6 relative overflow-hidden">
      {/* Clean, Subtle Center Ambient Glow */}
      <div className="absolute w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Refined Minimalist Login Card */}
      <Card className="w-full max-w-md relative z-10 bg-white border border-stone-200/90 shadow-xl shadow-stone-200/40 rounded-2xl overflow-hidden">
        {/* Card Header */}
        <CardHeader className="space-y-2 text-center pt-8 pb-3 px-6 sm:px-8">
          {/* Crisp Centered Logo Emblem */}
          <div className="w-20 h-20 mx-auto rounded-full p-1 border border-stone-200 bg-white shadow-xs mb-1">
            <img
              src="/logo.png"
              alt="Sunbloom Adorn"
              className="w-full h-full rounded-full object-cover"
            />
          </div>

          <div>
            <CardTitle className="text-2xl font-serif font-bold tracking-tight text-stone-900">
              Sunbloom <span className="italic font-normal text-[#B8860B]">Adorn</span>
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 tracking-wide mt-1">
              Admin Management Portal
            </CardDescription>
          </div>
        </CardHeader>

        {/* Login Form */}
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 px-6 sm:px-8 pt-2">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-stone-700">
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="skavinraj.dev@gmail.com"
                  className="h-11 pl-9 pr-3 rounded-lg border-stone-200 focus:border-stone-800 focus:ring-1 focus:ring-stone-800 bg-stone-50/40 focus:bg-white text-stone-900 text-sm transition-all"
                  {...form.register('email')}
                  disabled={isLoading}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-stone-700">
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-11 pl-9 pr-10 rounded-lg border-stone-200 focus:border-stone-800 focus:ring-1 focus:ring-stone-800 bg-stone-50/40 focus:bg-white text-stone-900 text-sm transition-all tracking-wide"
                  {...form.register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 focus:outline-none transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 px-6 sm:px-8 pb-8 pt-2">
            {/* Primary Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In with Email'}
            </Button>

            {/* Clean Divider */}
            <div className="relative w-full my-0.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-stone-400 text-xs">
                  or
                </span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium text-sm flex items-center justify-center gap-2.5 shadow-xs transition-colors cursor-pointer"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign In with Google</span>
            </Button>

            {/* Error Message Display */}
            {loginError && (
              <div className="w-full p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {loginError}
              </div>
            )}

            {/* Subtle Security Footnote */}
            <p className="text-[11px] text-stone-400 text-center pt-1">
              Authorized Personnel Only
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

