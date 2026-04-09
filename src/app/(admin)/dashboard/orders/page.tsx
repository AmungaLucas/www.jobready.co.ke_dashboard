"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const paymentStatusColors: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  UNPAID: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
}

const orderStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount)
}

interface OrderItem {
  id: string
  serviceName: string
  tierName: string
  price: number
  quantity: number
  subtotal: number
}

interface Payment {
  id: string
  amount: number
  status: string
  mpesaReceiptNumber: string | null
  createdAt: string
}

interface Order {
  id: string
  orderNumber: string
  fullName: string
  totalAmount: number
  paidAmount: number
  balanceDue: number
  status: string
  paymentStatus: string
  createdAt: string
  items: OrderItem[]
  payments: Payment[]
  _count: { items: number; payments: number; activities: number }
}

export default function OrdersPage() {
  const [items, setItems] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (status && status !== "ALL") params.set("status", status)
      if (paymentStatus && paymentStatus !== "ALL") params.set("paymentStatus", paymentStatus)

      const res = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      setItems(data.items)
      setTotalPages(data.totalPages)
    } catch {
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [page, search, status, paymentStatus])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders & Payments</h1>
        <p className="text-slate-500 mt-1">Track orders and payment transactions</p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-white"
            />
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Order Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(""); setStatus(""); setPaymentStatus(""); setPage(1) }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">No orders found</TableCell>
                  </TableRow>
                ) : (
                  items.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <TableCell className="font-mono text-sm font-medium">{order.orderNumber}</TableCell>
                      <TableCell className="text-sm">{order.fullName}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                        {order.items?.[0]?.serviceName || "—"} {order._count.items > 1 ? `+${order._count.items - 1}` : ""}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{formatKES(order.totalAmount)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className={`text-xs ${paymentStatusColors[order.paymentStatus] || ""}`}>
                          {order.paymentStatus?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className={`text-xs ${orderStatusColors[order.status] || ""}`}>
                          {order.status?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Customer</p>
                  <p className="text-sm font-medium">{selectedOrder.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleString("en-KE")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Amount</p>
                  <p className="text-sm font-bold text-emerald-700">{formatKES(selectedOrder.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Paid / Balance</p>
                  <p className="text-sm">
                    <span className="text-emerald-600">{formatKES(selectedOrder.paidAmount)}</span>
                    {" / "}
                    <span className={selectedOrder.balanceDue > 0 ? "text-red-600" : "text-slate-500"}>
                      {formatKES(selectedOrder.balanceDue)}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded">
                      <div>
                        <p className="font-medium">{item.serviceName}</p>
                        <p className="text-xs text-slate-400">{item.tierName} × {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatKES(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Payment History</p>
                <div className="space-y-2">
                  {selectedOrder.payments?.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded">
                      <div>
                        <p className="font-medium">{formatKES(payment.amount)}</p>
                        <p className="text-xs text-slate-400">
                          {payment.mpesaReceiptNumber || "No receipt"} — {new Date(payment.createdAt).toLocaleDateString("en-KE")}
                        </p>
                      </div>
                      <Badge variant="secondary" className={`text-xs ${paymentStatusColors[payment.status] || ""}`}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                  {(!selectedOrder.payments || selectedOrder.payments.length === 0) && (
                    <p className="text-sm text-slate-400">No payments recorded</p>
                  )}
                </div>
              </div>

              {/* Update Order Status */}
              <div className="flex gap-2 pt-2">
                {selectedOrder.status !== "COMPLETED" && selectedOrder.status !== "CANCELLED" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        fetch("/api/admin/orders", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: selectedOrder.id, status: "CONFIRMED" }),
                        }).then(() => { toast.success("Order confirmed"); setSelectedOrder(null); fetchItems() })
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        fetch("/api/admin/orders", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: selectedOrder.id, status: "CANCELLED" }),
                        }).then(() => { toast.success("Order cancelled"); setSelectedOrder(null); fetchItems() })
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
