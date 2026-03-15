"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAdminOrders, fetchAdminProducts, fetchAdminSupportRequests } from "@/lib/api";
import { Order, Product, SupportRequest } from "@/lib/types";

const WEBSITE_CURRENCY = "EUR";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: WEBSITE_CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);
}

function dayLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(value);
}

function startOfDay(value: Date) {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildRecentDaySeries<T extends { createdAt: string }>(items: T[], totalDays: number) {
  const now = startOfDay(new Date());
  const labels = Array.from({ length: totalDays }).map((_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (totalDays - 1 - index));
    return date;
  });

  const counts = labels.map((labelDate) =>
    items.filter((item) => {
      const createdAt = new Date(item.createdAt);
      return (
        createdAt.getFullYear() === labelDate.getFullYear() &&
        createdAt.getMonth() === labelDate.getMonth() &&
        createdAt.getDate() === labelDate.getDate()
      );
    }).length
  );

  return labels.map((labelDate, index) => ({
    label: dayLabel(labelDate),
    value: counts[index] ?? 0,
  }));
}

function buildRecentWeekRevenue(orders: Order[], totalWeeks: number) {
  const now = new Date();
  const weeks = Array.from({ length: totalWeeks }).map((_, index) => {
    const end = new Date(now);
    end.setDate(now.getDate() - (totalWeeks - 1 - index) * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const weekOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= start && createdAt <= end && order.paymentStatus === "paid";
    });

    return {
      label: `${dayLabel(start)} - ${dayLabel(end)}`,
      value: weekOrders.reduce((sum, order) => sum + order.total, 0),
    };
  });

  return weeks;
}

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || "";
    if (!token) return;

    Promise.allSettled([
      fetchAdminProducts(token),
      fetchAdminOrders(token),
      fetchAdminSupportRequests(token),
    ])
      .then(([productResult, orderResult, requestResult]) => {
        const loadErrors: string[] = [];

        if (productResult.status === "fulfilled") {
          setProducts(productResult.value);
        } else {
          loadErrors.push("products");
        }

        if (orderResult.status === "fulfilled") {
          setOrders(orderResult.value);
        } else {
          loadErrors.push("orders");
        }

        if (requestResult.status === "fulfilled") {
          setSupportRequests(requestResult.value);
        } else {
          loadErrors.push("support requests");
        }

        if (loadErrors.length > 0) {
          setError(`Some analytics failed to load: ${loadErrors.join(", ")}.`);
        } else {
          setError("");
        }
      })
      .catch(() => setError("Could not load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const paidOrders = orders.filter((order) => order.paymentStatus === "paid");
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    const openRequests = supportRequests.filter((request) => request.status !== "resolved").length;
    const resolvedRequests = supportRequests.filter((request) => request.status === "resolved").length;
    const activeListings = products.filter((product) => product.isActive).length;
    const lowStockItems = products.filter(
      (product) =>
        product.stockStatus === "low_stock" ||
        product.stockStatus === "out_of_stock" ||
        product.stock <= Math.max(1, product.lowStockWarning || 0)
    ).length;

    return {
      totalProducts: products.length,
      activeListings,
      lowStockItems,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      averageOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
      totalRevenue,
      totalSupportRequests: supportRequests.length,
      openRequests,
      resolvedRate:
        supportRequests.length > 0 ? Math.round((resolvedRequests / supportRequests.length) * 100) : 0,
    };
  }, [orders, products, supportRequests]);

  const topProducts = useMemo(() => {
    const stats = new Map<string, { title: string; quantity: number; revenue: number }>();

    for (const order of orders) {
      for (const item of order.items) {
        const current = stats.get(item.productId) || {
          title: item.title,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += item.quantity;
        current.revenue += item.lineTotal;
        stats.set(item.productId, current);
      }
    }

    return Array.from(stats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const categoryMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const categoryName = product.category?.name?.en || "Uncategorized";
      counts.set(categoryName, (counts.get(categoryName) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  const supportTrend = useMemo(() => buildRecentDaySeries(supportRequests, 7), [supportRequests]);
  const orderTrend = useMemo(() => buildRecentDaySeries(orders, 7), [orders]);
  const revenueTrend = useMemo(() => buildRecentWeekRevenue(orders, 6), [orders]);

  const recentActivity = useMemo(() => {
    const fromOrders = orders.map((order) => ({
      id: order.id,
      title: `Order ${order.orderNumber}`,
      subtitle: `${order.customer.name} | ${formatMoney(order.total)}`,
      status: order.status,
      createdAt: order.createdAt,
      kind: "order" as const,
    }));

    const fromRequests = supportRequests.map((request) => ({
      id: request.id,
      title: `Support by ${request.name}`,
      subtitle: `${request.status.replace("_", " ")} | ${request.email}`,
      status: request.status,
      createdAt: request.createdAt,
      kind: "support" as const,
    }));

    return [...fromOrders, ...fromRequests]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [orders, supportRequests]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-3xl bg-zinc-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-zinc-200" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-zinc-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <section className="relative overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-r from-teal-900 via-emerald-900 to-cyan-900 p-6 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
              Admin Command Center
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
              Dashboard Performance Snapshot
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">
              Live platform health across inventory, sales, and support operations.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-wider text-emerald-100">Revenue</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(metrics.totalRevenue)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-wider text-emerald-100">Orders</p>
              <p className="mt-1 text-xl font-bold">{metrics.totalOrders}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-wider text-emerald-100">Resolved Support</p>
              <p className="mt-1 text-xl font-bold">{metrics.resolvedRate}%</p>
            </div>
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Inventory</p>
          <p className="mt-2 text-3xl font-black text-zinc-900">{metrics.totalProducts}</p>
          <p className="mt-2 text-sm text-zinc-600">{metrics.activeListings} active listings</p>
        </div>
        <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Paid Orders</p>
          <p className="mt-2 text-3xl font-black text-zinc-900">{metrics.paidOrders}</p>
          <p className="mt-2 text-sm text-zinc-600">
            Avg. order {formatMoney(metrics.averageOrderValue)}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Stock Risk</p>
          <p className="mt-2 text-3xl font-black text-zinc-900">{metrics.lowStockItems}</p>
          <p className="mt-2 text-sm text-zinc-600">Low or out-of-stock products</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Open Support</p>
          <p className="mt-2 text-3xl font-black text-zinc-900">{metrics.openRequests}</p>
          <p className="mt-2 text-sm text-zinc-600">{metrics.totalSupportRequests} total tickets</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-zinc-900">Revenue Trend (Last 6 Weeks)</h3>
            <p className="text-xs text-zinc-500">Paid orders only</p>
          </div>
          <div className="mt-6 space-y-4">
            {revenueTrend.map((bucket) => {
              const max = Math.max(1, ...revenueTrend.map((item) => item.value));
              const width = Math.max(6, Math.round((bucket.value / max) * 100));
              return (
                <div key={bucket.label}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500">{bucket.label}</p>
                    <p className="text-sm font-semibold text-zinc-800">
                      {formatMoney(bucket.value)}
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900">Demand by Product</h3>
          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No order activity yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topProducts.map((item) => (
                <div key={item.title} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="truncate text-sm font-semibold text-zinc-900">{item.title}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {item.quantity} units sold | {formatMoney(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900">Orders (7 Days)</h3>
          <div className="mt-4 flex items-end gap-2">
            {orderTrend.map((point) => {
              const max = Math.max(1, ...orderTrend.map((item) => item.value));
              const height = Math.max(8, Math.round((point.value / max) * 95));
              return (
                <div key={point.label} className="flex-1 text-center">
                  <div className="mx-auto w-full max-w-[36px] rounded-md bg-zinc-100 p-1">
                    <div
                      className="w-full rounded bg-cyan-500"
                      style={{ height: `${height}px` }}
                      title={`${point.value} orders`}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-zinc-500">{point.label}</p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900">Support Load (7 Days)</h3>
          <div className="mt-4 flex items-end gap-2">
            {supportTrend.map((point) => {
              const max = Math.max(1, ...supportTrend.map((item) => item.value));
              const height = Math.max(8, Math.round((point.value / max) * 95));
              return (
                <div key={point.label} className="flex-1 text-center">
                  <div className="mx-auto w-full max-w-[36px] rounded-md bg-zinc-100 p-1">
                    <div
                      className="w-full rounded bg-rose-500"
                      style={{ height: `${height}px` }}
                      title={`${point.value} requests`}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-zinc-500">{point.label}</p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900">Category Mix</h3>
          {categoryMix.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No products available yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {categoryMix.map((entry) => {
                const max = Math.max(1, ...categoryMix.map((item) => item.value));
                const width = Math.max(10, Math.round((entry.value / max) * 100));
                return (
                  <div key={entry.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate text-zinc-600">{entry.name}</span>
                      <span className="font-semibold text-zinc-800">{entry.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No activity yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentActivity.map((entry) => (
              <article
                key={`${entry.kind}-${entry.id}`}
                className="rounded-xl border border-zinc-100 bg-zinc-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-zinc-900">{entry.title}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      entry.kind === "order"
                        ? "bg-cyan-100 text-cyan-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{entry.subtitle}</p>
                <p className="mt-2 text-xs text-zinc-500">{formatDate(entry.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
