import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CreditCard,
  ShieldCheck,
  Smartphone,
  QrCode,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { paymentSettingsApi, type PaymentGatewayStatus } from '@/lib/api'

export default function PaymentSettings() {
  const [status, setStatus] = useState<PaymentGatewayStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await paymentSettingsApi.getStatus()
      setStatus(data)
    } catch (err: any) {
      console.error('Failed to load payment status:', err)
      setError(err.message || 'Unable to retrieve payment gateway status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const copyWebhookUrl = () => {
    if (!status?.webhookUrl) return
    navigator.clipboard.writeText(status.webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Payment Gateway Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Cashfree Payment Gateway integration &amp; webhook monitoring
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStatus}
          disabled={loading}
          className="self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Connection Check Failed</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={loadStatus} className="mt-3">
                  Retry Check
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && status && (
        <>
          {/* Status Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gateway</p>
                    <p className="text-xl font-bold mt-1 text-foreground">{status.gateway}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <Badge variant="outline" className="text-xs">v2023-08-01 API</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Environment</p>
                    <p className="text-xl font-bold mt-1 capitalize text-foreground">{status.environment}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${status.environment === 'production' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <Badge className={status.environment === 'production' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                    {status.environment === 'production' ? 'Live Production Mode' : 'Sandbox Test Mode'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">API Credentials</p>
                    <p className="text-xl font-bold mt-1 text-foreground">
                      {status.isConfigured ? 'Connected' : 'Action Required'}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${status.isConfigured ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                    {status.isConfigured ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                </div>
                <div className="mt-3">
                  <Badge className={status.isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                    {status.isConfigured ? 'App ID & Secret Key Set' : 'Credentials Missing in .env'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Webhook Security</p>
                    <p className="text-xl font-bold mt-1 text-foreground">
                      {status.webhookConfigured ? 'HMAC Active' : 'Pending'}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${status.webhookConfigured ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <Badge className={status.webhookConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                    SHA-256 Signature Check
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Webhook Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Production Webhook Configuration
              </CardTitle>
              <CardDescription>
                Cashfree fires real-time payment notifications to this endpoint. Register this URL in your Cashfree Merchant Dashboard under Developers &gt; Webhooks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-muted/60 border rounded-lg px-4 py-2.5 font-mono text-xs text-foreground overflow-x-auto select-all">
                  {status.webhookUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyWebhookUrl}
                  className="shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy URL
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Subscribed to event: <code>PAYMENT_SUCCESS_WEBHOOK</code></span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Subscribed to event: <code>PAYMENT_FAILED_WEBHOOK</code></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supported Payment Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Supported Customer Payment Channels
              </CardTitle>
              <CardDescription>
                Payment options rendered dynamically by Cashfree JS SDK v3 during customer checkout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile UPI Intent</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Automatically opens customer's installed UPI app (Google Pay, PhonePe, Paytm, BHIM, CRED) via device-aware direct redirect on mobile devices.
                  </p>
                </div>

                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <QrCode className="h-4 w-4" />
                    <span>Desktop Dynamic UPI QR</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Presents an order-specific dynamic QR code in an in-page modal. Customer scans from any UPI app; Cashfree automatically confirms without page reload.
                  </p>
                </div>

                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Building2 className="h-4 w-4" />
                    <span>Cards &amp; Net Banking</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Visa, MasterCard, RuPay, Maestro debit &amp; credit cards with 3D Secure OTP verification, plus 50+ Indian commercial banks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Merchant Settlement Notice */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-semibold text-foreground text-sm">Merchant Settlement Architecture</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    All customer payments are automatically collected and verified by Cashfree under RBI payment aggregator regulations. Funds settle directly to your designated business bank account / VPA configured in the Cashfree Merchant Dashboard. No customer financial data or merchant private keys are stored on the storefront.
                  </p>
                  <div className="pt-2">
                    <a
                      href="https://merchant.cashfree.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Open Cashfree Merchant Dashboard
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
