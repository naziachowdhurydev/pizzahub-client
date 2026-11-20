"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, ClipboardList, Package, RefreshCw, Store, Users } from "lucide-react";
import { toast } from "sonner";
import { DashboardAccess } from "@/components/dashboard-access";
import { apiFetch } from "@/lib/api";
import { useCurrentUser } from "@/lib/use-current-user";

type UserAccount = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: "customer" | "vendor" | "admin";
  vendorStatus?: "not_applied" | "pending" | "approved" | "rejected";
  status?: "active" | "suspended";
  createdAt?: string;
};

type UserDetails = {
  user: UserAccount;
  sessions: Array<{
    id: string;
    createdAt: string;
    updatedAt?: string;
    expiresAt: string;
  }>;
  linkedAccounts: Array<{
    providerId: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
};

type VendorApplication = {
  _id: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  storeName: string;
  description: string;
  status: "pending" | "approved" | "rejected";
};

type Analytics = {
  users: number;
  customers: number;
  vendors: number;
  pendingVendors: number;
  products: number;
  totalOrders: number;
  completedRevenue: number;
  ordersByStatus: Record<string, number>;
};

type AdminOrder = {
  _id: string;
  customerName: string;
  status: string;
  createdAt: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
};

const sections = [
  { id: "users", label: "Users", icon: Users },
  { id: "vendors", label: "Vendors", icon: Store },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "products", label: "All Products", icon: Package },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

type Section = (typeof sections)[number]["id"];

function AdminDashboardContent() {
  const { user: currentUser } = useCurrentUser();
  const [section, setSection] = useState<Section>("analytics");
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingUserId, setSavingUserId] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [selectedDetails, setSelectedDetails] = useState<UserDetails | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<UserAccount[]>("/admin/users"),
      apiFetch<VendorApplication[]>("/admin/vendors/pending"),
      apiFetch<Analytics>("/admin/analytics"),
      apiFetch<AdminOrder[]>("/orders/admin/all"),
    ])
      .then(([platformUsers, vendorApplications, platformAnalytics, platformOrders]) => {
        if (!active) return;
        setUsers(platformUsers);
        setApplications(vendorApplications);
        setAnalytics(platformAnalytics);
        setOrders(platformOrders);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message =
          cause instanceof Error ? cause.message : "Could not load admin dashboard.";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function refreshAnalytics() {
    setAnalyticsLoading(true);
    try {
      setAnalytics(await apiFetch<Analytics>("/admin/analytics"));
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not refresh platform analytics.",
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function changeRole(user: UserAccount, role: UserAccount["role"]) {
    const userId = user.id ?? user._id;
    if (!userId) {
      toast.error("This account has no usable ID.");
      return;
    }
    setSavingUserId(userId);
    try {
      const updated = await apiFetch<UserAccount>(
        `/admin/users/${encodeURIComponent(userId)}/role`,
        { method: "PATCH", body: JSON.stringify({ role }) },
      );
      setUsers((current) =>
        current.map((item) =>
          (item.id ?? item._id) === userId ? updated : item,
        ),
      );
      toast.success(`${user.name}'s role updated.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update role.");
    } finally {
      setSavingUserId("");
    }
  }

  async function loadUserDetails(user: UserAccount) {
    const userId = user.id ?? user._id;
    if (!userId) {
      toast.error("This account has no usable ID.");
      return;
    }
    setLoadingDetailsId(userId);
    try {
      const details = await apiFetch<UserDetails>(
        `/admin/users/${encodeURIComponent(userId)}/details`,
      );
      setSelectedDetails(details);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not load user details.",
      );
    } finally {
      setLoadingDetailsId("");
    }
  }

  async function reviewApplication(
    application: VendorApplication,
    status: "approved" | "rejected",
  ) {
    setReviewingId(application._id);
    try {
      const action = status === "approved" ? "approve" : "reject";
      const updated = await apiFetch<VendorApplication>(
        `/admin/vendors/${application._id}/${action}`,
        { method: "PATCH" },
      );
      setApplications((current) => current.filter((item) => item._id !== updated._id));
      setUsers((current) =>
        current.map((user) =>
          (user.id ?? user._id) === application.userId
            ? {
                ...user,
                role: status === "approved" ? "vendor" : user.role,
                vendorStatus: status,
              }
            : user,
        ),
      );
      toast.success(
        status === "approved"
          ? `${application.storeName} was approved.`
          : `${application.storeName} was rejected.`,
      );
      void refreshAnalytics();
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not review application.",
      );
    } finally {
      setReviewingId("");
    }
  }

  async function changeAccountStatus(
    user: UserAccount,
    status: "active" | "suspended",
  ) {
    const userId = user.id ?? user._id;
    if (!userId) {
      toast.error("This account has no usable ID.");
      return;
    }
    setSavingUserId(userId);
    try {
      const updated = await apiFetch<UserAccount>(
        `/admin/users/${encodeURIComponent(userId)}/status`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      setUsers((current) =>
        current.map((item) =>
          (item.id ?? item._id) === userId ? { ...item, ...updated } : item,
        ),
      );
      toast.success(`${user.name}'s account is ${status}.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update account status.");
    } finally {
      setSavingUserId("");
    }
  }

  async function changeOrderStatus(order: AdminOrder, status: string) {
    try {
      await apiFetch<void>(`/orders/admin/${order._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) =>
        current.map((item) => (item._id === order._id ? { ...item, status } : item)),
      );
      toast.success(`Order #${order._id.slice(-6)} updated.`);
      void refreshAnalytics();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update order status.");
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-muted-foreground">Loading platform dashboard...</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-2xl border border-border bg-card p-3">
        <nav aria-label="Admin dashboard sections" className="grid gap-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSection(id);
                if (id === "analytics") void refreshAnalytics();
              }}
              aria-current={section === id ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                section === id
                  ? "bg-orange-500/10 text-[#F26B4F]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">{error}</p>}

        {section === "users" && (
          <section>
            <h2 className="text-2xl font-black">Users</h2>
            <p className="mt-1 text-muted-foreground">Manage customer and vendor account roles.</p>
            {users.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No accounts found.</p>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Account status</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => {
                      const userId = user.id ?? user._id ?? "";
                      const isCurrentAdmin = userId === currentUser?.id;
                      return (
                        <tr key={userId || user.email}>
                          <td className="px-4 py-3 font-semibold">{user.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                          <td className="px-4 py-3">
                            <select
                              value={user.role}
                              disabled={!userId || savingUserId === userId || isCurrentAdmin}
                              onChange={(event) =>
                                void changeRole(user, event.target.value as UserAccount["role"])
                              }
                              aria-label={`Role for ${user.name}`}
                              className="rounded-lg border border-border bg-background px-3 py-2 capitalize outline-none focus:border-[#F26B4F] disabled:opacity-60"
                            >
                              <option value="customer">Customer</option>
                              {(user.role === "vendor" || user.vendorStatus === "approved") && (
                                <option value="vendor">Vendor</option>
                              )}
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={user.status ?? "active"}
                              disabled={!userId || savingUserId === userId || isCurrentAdmin}
                              onChange={(event) =>
                                void changeAccountStatus(
                                  user,
                                  event.target.value as "active" | "suspended",
                                )
                              }
                              aria-label={`Account status for ${user.name}`}
                              className="rounded-lg border border-border bg-background px-3 py-2 capitalize outline-none focus:border-[#F26B4F] disabled:opacity-60"
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              disabled={!userId || loadingDetailsId === userId}
                              onClick={() => void loadUserDetails(user)}
                              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:border-[#F26B4F] disabled:opacity-60"
                            >
                              {loadingDetailsId === userId ? "Loading..." : "View details"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {selectedDetails && (
              <section className="mt-5 grid gap-5 rounded-2xl border border-border bg-card p-5 md:grid-cols-3">
                <div>
                  <h3 className="font-bold">Account information</h3>
                  <p className="mt-3 font-semibold">{selectedDetails.user.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDetails.user.email}</p>
                  <p className="mt-2 text-sm capitalize">Role: {selectedDetails.user.role}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created {selectedDetails.user.createdAt
                      ? new Date(selectedDetails.user.createdAt).toLocaleDateString()
                      : "date unavailable"}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold">Sessions</h3>
                  {selectedDetails.sessions.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">No sessions recorded.</p>
                  ) : (
                    <ul className="mt-3 grid gap-3">
                      {selectedDetails.sessions.map((session) => (
                        <li key={session.id} className="text-sm">
                          <p className="font-medium">Session {session.id.slice(-8)}</p>
                          <p className="text-xs text-muted-foreground">
                            Expires {new Date(session.expiresAt).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Session tokens and credentials are not displayed.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold">Linked accounts</h3>
                  {selectedDetails.linkedAccounts.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">No linked accounts.</p>
                  ) : (
                    <ul className="mt-3 grid gap-2">
                      {selectedDetails.linkedAccounts.map((account, index) => (
                        <li key={`${account.providerId}-${index}`} className="text-sm capitalize">
                          {account.providerId}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}
          </section>
        )}

        {section === "vendors" && (
          <section>
            <h2 className="text-2xl font-black">Vendor applications</h2>
            <p className="mt-1 text-muted-foreground">Review applications before granting vendor access.</p>
            {applications.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No vendor applications yet.</p>
            ) : (
              <div className="mt-6 grid gap-4">
                {applications.map((application) => (
                  <article key={application._id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">{application.storeName}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {application.applicantName} · {application.applicantEmail}
                        </p>
                      </div>
                      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold capitalize text-[#F26B4F]">{application.status}</span>
                    </div>
                    <p className="mt-4 text-sm">{application.description}</p>
                    {application.status === "pending" && (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          disabled={reviewingId === application._id}
                          onClick={() => void reviewApplication(application, "approved")}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={reviewingId === application._id}
                          onClick={() => void reviewApplication(application, "rejected")}
                          className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-500 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "orders" && (
          <section>
            <h2 className="text-2xl font-black">All orders</h2>
            <p className="mt-1 text-muted-foreground">Review orders and update their overall fulfillment status.</p>
            {orders.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="mt-6 grid gap-4">
                {orders.map((order) => (
                  <article key={order._id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold">Order #{order._id.slice(-6)} · {order.customerName}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <select
                        value={order.status}
                        onChange={(event) => void changeOrderStatus(order, event.target.value)}
                        aria-label={`Order status for ${order._id}`}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize"
                      >
                        {["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"].map((status) => (
                          <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}
                    </p>
                    <p className="mt-3 font-bold">৳{order.total}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "products" && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-2xl font-black">All Products</h2>
            <p className="mt-2 text-muted-foreground">Manage the platform menu, prices and availability.</p>
            <Link href="/admin" className="mt-5 inline-flex rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white">
              Manage platform menu
            </Link>
          </section>
        )}

        {section === "analytics" && analytics && (
          <section>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">Platform analytics</h2>
                <p className="mt-1 text-muted-foreground">Revenue totals include delivered orders only.</p>
              </div>
              <button
                type="button"
                onClick={() => void refreshAnalytics()}
                disabled={analyticsLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-[#F26B4F] disabled:opacity-60"
              >
                <RefreshCw size={16} className={analyticsLoading ? "animate-spin" : ""} />
                {analyticsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["Users", analytics.users],
                ["Customers", analytics.customers],
                ["Vendors", analytics.vendors],
                ["Pending vendor applications", analytics.pendingVendors],
                ["Products", analytics.products],
                ["All orders", analytics.totalOrders],
                ["Completed revenue", `৳${analytics.completedRevenue}`],
              ].map(([label, value]) => (
                <article key={label} className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-3 text-2xl font-black">{value}</p>
                </article>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-border bg-card p-5">
              <h3 className="font-bold">Orders by status</h3>
              {Object.keys(analytics.ordersByStatus).length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No orders recorded yet.</p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                    <span key={status} className="rounded-full bg-muted px-3 py-1.5 text-sm capitalize">
                      {status.replaceAll("_", " ")}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <DashboardAccess role="admin">
      <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 md:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#F26B4F]">Platform control</p>
        <h1 className="mt-2 text-4xl font-black">Admin dashboard</h1>
        <div className="mt-8">
          <AdminDashboardContent />
        </div>
      </main>
    </DashboardAccess>
  );
}
