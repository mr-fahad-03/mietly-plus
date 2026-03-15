"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAdminOrders, updateAdminOrderFulfillmentStatus } from "@/lib/api";
import { Order } from "@/lib/types";

const WEBSITE_CURRENCY = "EUR";

function formatAmount(value: number) {
  return `${WEBSITE_CURRENCY} ${new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const FULFILLMENT_OPTIONS: Order["fulfillmentStatus"][] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export default function AdminOrdersPage() {
  const [adminToken] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : ""));
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(Boolean(adminToken));
  const [error, setError] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  useEffect(() => {
    if (!adminToken) return;

    fetchAdminOrders(adminToken)
      .then((data) => setOrders(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not fetch orders."))
      .finally(() => setLoading(false));
  }, [adminToken]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const onUpdateFulfillmentStatus = async (nextStatus: Order["fulfillmentStatus"]) => {
    if (!selectedOrder || !adminToken) return;
    setStatusSaving(true);
    setStatusError("");
    try {
      const payload = await updateAdminOrderFulfillmentStatus(adminToken, selectedOrder.id, nextStatus);
      setOrders((current) => current.map((order) => (order.id === selectedOrder.id ? payload.order : order)));
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Could not update fulfillment status.");
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-600">Loading orders...</div>;
  }

  if (!adminToken) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-700">Admin token not found.</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{error}</div>;
  }

  if (orders.length === 0) {
    return <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-600">No orders yet.</div>;
  }

  return (
    <>
      <section className="overflow-hidden rounded-[28px] border border-[rgba(73,153,173,0.22)] bg-white shadow-[0_24px_60px_-38px_rgba(73,153,173,0.7)]">
        <div className="bg-[linear-gradient(140deg,rgba(73,153,173,0.16),rgba(73,153,173,0.05))] px-5 py-5">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Orders</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Review customer orders, inspect line items, and update fulfillment status.
          </p>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_1.8fr_0.9fr_0.5fr] gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-700">
          <span>Customer Name</span>
          <span>Product Name</span>
          <span>Price</span>
          <span>View</span>
        </div>

        {orders.map((order) => {
          const customerName = order.customer?.name || "-";
          const productNames = order.items.map((item) => item.title).join(", ");
          return (
            <div
              key={order.id}
              className="grid grid-cols-[1.2fr_1.8fr_0.9fr_0.5fr] items-center gap-3 border-b border-zinc-100 px-4 py-3 text-sm text-zinc-700 last:border-b-0"
            >
              <div className="font-semibold text-zinc-900">{customerName}</div>
              <div className="line-clamp-1">{productNames || "-"}</div>
              <div className="font-bold text-zinc-900">{formatAmount(order.total)}</div>
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-2 py-1 text-zinc-700 hover:border-lime-500 hover:text-lime-700"
                  aria-label="View order details"
                >
                  <EyeIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-zinc-500">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderId("")}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <section className="rounded-xl border border-zinc-200 p-3">
                <h3 className="text-sm font-bold text-zinc-900">Customer</h3>
                <p className="mt-1 text-sm text-zinc-700">{selectedOrder.customer.name}</p>
                <p className="text-sm text-zinc-600">{selectedOrder.customer.email}</p>
                <p className="text-sm text-zinc-600">{selectedOrder.customer.phone}</p>
              </section>
              <section className="rounded-xl border border-zinc-200 p-3">
                <h3 className="text-sm font-bold text-zinc-900">Shipping address</h3>
                <p className="mt-1 text-sm text-zinc-700">{selectedOrder.shippingAddress.fullName}</p>
                <p className="text-sm text-zinc-600">{selectedOrder.shippingAddress.phone}</p>
                <p className="text-sm text-zinc-600">
                  {selectedOrder.shippingAddress.line1}
                  {selectedOrder.shippingAddress.line2 ? `, ${selectedOrder.shippingAddress.line2}` : ""}
                </p>
                <p className="text-sm text-zinc-600">
                  {selectedOrder.shippingAddress.city}
                  {selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ""}{" "}
                  {selectedOrder.shippingAddress.postalCode}
                </p>
                <p className="text-sm text-zinc-600">{selectedOrder.shippingAddress.country}</p>
              </section>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500">
                    <th className="py-2 font-semibold">Product</th>
                    <th className="py-2 font-semibold">Rental</th>
                    <th className="py-2 font-semibold">Qty</th>
                    <th className="py-2 font-semibold">Unit</th>
                    <th className="py-2 font-semibold">Deposit</th>
                    <th className="py-2 font-semibold">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, index) => (
                    <tr key={`${selectedOrder.id}-${index}`} className="border-b border-zinc-100 text-zinc-700">
                      <td className="py-2">{item.title}</td>
                      <td className="py-2">
                        {item.durationValue} {item.durationUnit}
                        {item.durationValue > 1 ? "s" : ""} | {item.startDate}
                      </td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2">{formatAmount(item.unitPrice)}</td>
                      <td className="py-2">{formatAmount(item.lineDeposit)}</td>
                      <td className="py-2 font-semibold">{formatAmount(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
              <span className="font-semibold text-zinc-700">
                Payment: {selectedOrder.paymentStatus} | Checkout: {selectedOrder.status}
              </span>
              <span className="text-lg font-bold text-zinc-900">{formatAmount(selectedOrder.total)}</span>
            </div>

            <div className="mt-3 rounded-lg border border-zinc-200 p-3">
              <p className="text-sm font-semibold text-zinc-800">Fulfillment Status</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={selectedOrder.fulfillmentStatus}
                  onChange={(event) =>
                    onUpdateFulfillmentStatus(event.target.value as Order["fulfillmentStatus"])
                  }
                  disabled={statusSaving}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800"
                >
                  {FULFILLMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-zinc-500">
                  Customer receives an email on every status change.
                </span>
              </div>
              {selectedOrder.rentalEndDate ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Rental ends: {new Date(selectedOrder.rentalEndDate).toLocaleDateString()}
                </p>
              ) : null}
              {statusSaving ? <p className="mt-2 text-xs text-zinc-500">Updating status...</p> : null}
              {statusError ? <p className="mt-2 text-xs text-rose-600">{statusError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
