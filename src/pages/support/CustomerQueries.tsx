import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { customerQueryApi } from '@/lib/api';
import type {
  AdminCustomerQueryListItem,
  AdminCustomerQueryDetail,
  AdminCustomerQueryStats,
} from '@/lib/api';
import {
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Lock,
  User,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Inbox,
} from 'lucide-react';

const CATEGORIES = ['ALL', 'Order', 'Payment', 'Delivery', 'Product', 'Return / Refund', 'Other'];
const STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['ALL', 'LOW', 'NORMAL', 'HIGH', 'URGENT'];

export default function CustomerQueries() {
  const [queries, setQueries] = useState<AdminCustomerQueryListItem[]>([]);
  const [stats, setStats] = useState<AdminCustomerQueryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queryDetail, setQueryDetail] = useState<AdminCustomerQueryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');

  // Reply / Note Form State
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyStatus, setReplyStatus] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadQueries = async () => {
    setLoading(true);
    try {
      const [queriesRes, statsRes] = await Promise.all([
        customerQueryApi.getAll({
          search,
          category,
          status,
          priority,
        }),
        customerQueryApi.getStats(),
      ]);
      setQueries(queriesRes.queries || []);
      setStats(statsRes);
    } catch (err: any) {
      console.error('Failed to load customer queries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, [category, status, priority]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadQueries();
  };

  // Load single query details when selected
  const openQueryDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setActionSuccess(null);
    setActionError(null);
    setReplyText('');
    setIsInternalNote(false);
    setReplyStatus('');

    try {
      const detail = await customerQueryApi.getById(id);
      setQueryDetail(detail);
      setReplyStatus(
        detail.status === 'OPEN' || detail.status === 'IN_PROGRESS'
          ? 'WAITING_FOR_CUSTOMER'
          : detail.status
      );
    } catch (err: any) {
      console.error('Failed to fetch query detail:', err);
      setActionError('Could not load query conversation.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setQueryDetail(null);
  };

  // Send Reply or Add Note
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !replyText.trim()) return;

    setSubmittingReply(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await customerQueryApi.sendMessage(selectedId, {
        message: replyText.trim(),
        isInternal: isInternalNote,
        status: isInternalNote ? undefined : replyStatus || undefined,
      });

      setReplyText('');
      setActionSuccess(
        isInternalNote
          ? 'Internal note saved (only visible to staff).'
          : 'Reply sent to customer successfully.'
      );

      // Refresh detail
      const refreshed = await customerQueryApi.getById(selectedId);
      setQueryDetail(refreshed);

      // Refresh list in background
      loadQueries();
    } catch (err: any) {
      setActionError(err.message || 'Failed to send message.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Quick Status or Priority Change
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedId || !queryDetail) return;
    try {
      await customerQueryApi.update(selectedId, { status: newStatus });
      setQueryDetail({ ...queryDetail, status: newStatus as any });
      loadQueries();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedId || !queryDetail) return;
    try {
      await customerQueryApi.update(selectedId, { priority: newPriority });
      setQueryDetail({ ...queryDetail, priority: newPriority as any });
      loadQueries();
    } catch (err: any) {
      alert('Failed to update priority: ' + err.message);
    }
  };

  // Status Badge Colors
  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'OPEN':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200">Open</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200">In Progress</Badge>;
      case 'WAITING_FOR_CUSTOMER':
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200">Waiting for Customer</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200">Resolved</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  // Priority Badge Colors
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return <Badge className="bg-red-600 text-white hover:bg-red-700">Urgent</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-200">High</Badge>;
      case 'NORMAL':
        return <Badge variant="outline">Normal</Badge>;
      case 'LOW':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{p}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customer Queries</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dedicated customer support ticket management, conversation threads, and internal staff notes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadQueries}
          disabled={loading}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase">Total</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Open</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.open}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">In Progress</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">Waiting</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{stats.waitingForCustomer}</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase">Resolved</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{stats.resolved}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase">Closed</p>
              <p className="text-2xl font-bold mt-1">{stats.closed}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ticket #, subject, customer name/email, order #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 px-3 rounded-md border bg-background text-xs font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    Category: {cat}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 px-3 rounded-md border bg-background text-xs font-medium"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    Status: {st}
                  </option>
                ))}
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-9 px-3 rounded-md border bg-background text-xs font-medium"
              >
                {PRIORITIES.map((pr) => (
                  <option key={pr} value={pr}>
                    Priority: {pr}
                  </option>
                ))}
              </select>

              <Button type="submit" size="sm" variant="secondary">
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Queries List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-[#C5A059]" />
            <p className="text-sm">Loading customer queries...</p>
          </div>
        ) : queries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <Inbox className="h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium text-foreground">No customer queries found</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                No tickets match your filter criteria or no support queries have been submitted yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          queries.map((q) => (
            <Card
              key={q.id}
              onClick={() => openQueryDetail(q.id)}
              className="hover:border-[#C5A059]/60 hover:shadow-sm transition-all cursor-pointer group"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded">
                      {q.queryNumber}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {q.category}
                    </Badge>
                    {getStatusBadge(q.status)}
                    {getPriorityBadge(q.priority)}
                    {q.order && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                        #{q.order.orderNumber}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-base text-foreground group-hover:text-[#C5A059] transition-colors truncate">
                    {q.subject}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground/80">
                      <User className="h-3.5 w-3.5" />
                      {q.customer.name}
                    </span>
                    <span>{q.customer.email}</span>
                    {q.customer.phone && <span>· {q.customer.phone}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated {new Date(q.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {q._count?.messages || 1} messages
                  </span>
                  <Button size="sm" variant="ghost" className="text-xs gap-1 group-hover:bg-[#C5A059]/10 group-hover:text-[#C5A059]">
                    Manage
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Query Detail Modal / Slide-over Drawer */}
      {selectedId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-4xl rounded-2xl border shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b flex items-start justify-between gap-4 bg-muted/20">
              {detailLoading || !queryDetail ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-[#C5A059]" />
                  <span className="text-sm font-medium">Loading ticket conversation...</span>
                </div>
              ) : (
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#C5A059] bg-[#C5A059]/15 px-2.5 py-0.5 rounded-md">
                      {queryDetail.queryNumber}
                    </span>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {queryDetail.category}
                    </Badge>
                    {getStatusBadge(queryDetail.status)}
                    {getPriorityBadge(queryDetail.priority)}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    {queryDetail.subject}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Created on {new Date(queryDetail.createdAt).toLocaleString('en-IN')}
                    {queryDetail.resolvedAt && ` · Resolved on ${new Date(queryDetail.resolvedAt).toLocaleString('en-IN')}`}
                  </p>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={closeDetail}
                className="rounded-full h-8 w-8 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Body: Scrollable */}
            {queryDetail && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Information Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Card */}
                  <Card className="bg-muted/30 border-border/80">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#C5A059]" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 space-y-1 text-xs">
                      <p className="font-medium text-foreground text-sm">{queryDetail.customer.name}</p>
                      <p className="text-muted-foreground">{queryDetail.customer.email}</p>
                      {queryDetail.customer.phone && (
                        <p className="text-muted-foreground">Phone: {queryDetail.customer.phone}</p>
                      )}
                      {queryDetail.customer.whatsappNumber && (
                        <p className="text-muted-foreground">WhatsApp: {queryDetail.customer.whatsappNumber}</p>
                      )}
                      {queryDetail.customer.city && (
                        <p className="text-muted-foreground">
                          Location: {queryDetail.customer.city}, {queryDetail.customer.state || ''} {queryDetail.customer.pincode || ''}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Order Card & Status Controls */}
                  <Card className="bg-muted/30 border-border/80 flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-[#C5A059]" />
                          Linked Order
                        </span>
                        {queryDetail.order && (
                          <Link
                            to={`/orders/${queryDetail.order.id}`}
                            className="text-[11px] text-[#C5A059] hover:underline flex items-center gap-0.5"
                          >
                            Open Order <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 space-y-2 text-xs">
                      {queryDetail.order ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">
                            #{queryDetail.order.orderNumber}
                          </p>
                          <p className="text-muted-foreground">
                            Amount: ₹{queryDetail.order.totalAmount} · Status: {queryDetail.order.status}
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No specific order linked to this query.</p>
                      )}

                      {/* Status / Priority Inline Selectors */}
                      <div className="pt-2 border-t flex flex-wrap gap-2 items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-muted-foreground">Status:</span>
                          <select
                            value={queryDetail.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="h-8 text-xs rounded-md border bg-background px-2 font-medium"
                          >
                            {STATUSES.filter((s) => s !== 'ALL').map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-muted-foreground">Priority:</span>
                          <select
                            value={queryDetail.priority}
                            onChange={(e) => handlePriorityChange(e.target.value)}
                            className="h-8 text-xs rounded-md border bg-background px-2 font-medium"
                          >
                            {PRIORITIES.filter((p) => p !== 'ALL').map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Conversation Thread */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#C5A059]" />
                    Conversation History & Notes ({queryDetail.messages.length})
                  </h3>

                  <div className="space-y-3">
                    {queryDetail.messages.map((msg) => {
                      if (msg.isInternal) {
                        return (
                          /* Internal Staff Note */
                          <div
                            key={msg.id}
                            className="p-4 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[10px]">
                                <Lock className="h-3 w-3" />
                                Internal Staff Note (Never visible to customer)
                              </span>
                              <span className="font-normal opacity-80 text-[11px]">
                                {new Date(msg.createdAt).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            <p className="text-[11px] opacity-75 italic">By: {msg.senderName || 'Admin'}</p>
                          </div>
                        );
                      }

                      if (msg.senderType === 'ADMIN') {
                        return (
                          /* Admin Public Reply */
                          <div
                            key={msg.id}
                            className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 ml-4 sm:ml-8 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Concierge Team ({msg.senderName || 'Sunbloom Support'})
                              </span>
                              <span className="font-normal text-muted-foreground text-[11px]">
                                {new Date(msg.createdAt).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        );
                      }

                      /* Customer Message */
                      return (
                        <div
                          key={msg.id}
                          className="p-4 rounded-xl bg-card border mr-4 sm:mr-8 space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-foreground flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-[#C5A059]" />
                              {msg.senderName || queryDetail.customer.name} (Customer)
                            </span>
                            <span className="font-normal text-muted-foreground text-[11px]">
                              {new Date(msg.createdAt).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                            {msg.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reply / Internal Note Action Box */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex rounded-lg border bg-muted p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(false)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          !isInternalNote
                            ? 'bg-background shadow-xs text-foreground font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Reply to Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(true)}
                        className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${
                          isInternalNote
                            ? 'bg-amber-500 text-white shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Lock className="h-3 w-3" />
                        Internal Staff Note
                      </button>
                    </div>

                    {!isInternalNote && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>Set Status to:</span>
                        <select
                          value={replyStatus}
                          onChange={(e) => setReplyStatus(e.target.value)}
                          className="h-7 text-xs rounded border bg-background px-2"
                        >
                          <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {actionSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {actionSuccess}
                    </div>
                  )}

                  {actionError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      {actionError}
                    </div>
                  )}

                  <form onSubmit={handleSendReply} className="space-y-3">
                    <Textarea
                      placeholder={
                        isInternalNote
                          ? 'Add a private note regarding this ticket (strictly hidden from customer)...'
                          : 'Type your reply to the customer...'
                      }
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className={`text-sm ${
                        isInternalNote
                          ? 'border-amber-400 focus-visible:ring-amber-400 bg-amber-50/30'
                          : ''
                      }`}
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {queryDetail.status !== 'RESOLVED' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange('RESOLVED')}
                            className="text-xs gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark as Resolved
                          </Button>
                        )}
                        {queryDetail.status !== 'CLOSED' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange('CLOSED')}
                            className="text-xs text-muted-foreground"
                          >
                            Close Query
                          </Button>
                        )}
                      </div>

                      <Button
                        type="submit"
                        size="sm"
                        disabled={submittingReply || !replyText.trim()}
                        className={`gap-1.5 ${
                          isInternalNote
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-[#C5A059] hover:bg-[#b08e4c] text-[#1C1612]'
                        }`}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {submittingReply
                          ? 'Saving...'
                          : isInternalNote
                          ? 'Save Internal Note'
                          : 'Send Customer Reply'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
