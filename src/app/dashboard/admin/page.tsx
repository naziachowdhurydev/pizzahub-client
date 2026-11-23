"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BarChart3, Bell, ClipboardList, LifeBuoy, Package, RefreshCw, Store, Users } from "lucide-react";
import { toast } from "sonner";
import { DashboardAccess } from "@/components/dashboard-access";
import { DashboardSkeleton, ListSkeleton } from "@/components/skeletons";
import { apiFetch } from "@/lib/api";
import { formatOrderStatus } from "@/lib/order-status";
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
  userId?: string;
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
  userId: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  deliveryDate?: string;
  deliveryAddress: string;
  notes?: string;
  status: string;
  createdAt?: string;
  subtotal?: number;
  deliveryFee?: number;
  total: number;
  items: Array<{
    itemId: string;
    productId: string;
    vendorId?: string | null;
    vendorName?: string | null;
    name: string;
    size: string;
    quantity: number;
    price: number;
    subtotal: number;
    status: string;
    rejectionReason?: string;
  }>;
};

type AdminNotification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  orderId?: string;
  issueId?: string;
  isRead: boolean;
  createdAt: string;
};

type AdminOrderIssue = {
  _id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  type: "complaint" | "cancellation" | "refund";
  message: string;
  itemId?: string;
  orderTotal: number;
  status: "open" | "in_review" | "resolved" | "rejected";
  adminNote?: string;
  createdAt: string;
};

type OrderIssueStatus = AdminOrderIssue["status"];

const orderStatuses = [
  "pending",
  "accepted",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
] as const;

const sections = [
  { id: "users", label: "Users", icon: Users },
  { id: "vendors", label: "Vendors", icon: Store },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "issues", label: "Order issues", icon: LifeBuoy },
  { id: "notifications", label: "Notifications", icon: Bell },
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
  const [orderIssues, setOrderIssues] = useState<AdminOrderIssue[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [savingUserId, setSavingUserId] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [selectedDetails, setSelectedDetails] = useState<UserDetails | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderVendorFilter, setOrderVendorFilter] = useState("all");
  const [orderCustomerSearch, setOrderCustomerSearch] = useState("");
  const [orderFromDate, setOrderFromDate] = useState("");
  const [orderToDate, setOrderToDate] = useState("");
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issueStatusFilter, setIssueStatusFilter] = useState("open");
  const [issueStatusDrafts, setIssueStatusDrafts] = useState<Record<string, OrderIssueStatus>>({});
  const [issueNoteDrafts, setIssueNoteDrafts] = useState<Record<string, string>>({});
  const [savingIssueId, setSavingIssueId] = useState("");
  const notificationIds = useRef(new Set<string>());
  const notificationHistoryLoaded = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<UserAccount[]>("/admin/users"),
      apiFetch<VendorApplication[]>("/admin/vendors/pending"),
      apiFetch<Analytics>("/admin/analytics"),
      apiFetch<AdminOrder[]>("/admin/orders"),
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

  useEffect(() => {
    let active = true;
    apiFetch<AdminOrderIssue[]>("/admin/order-issues")
      .then((issues) => {
        if (active) setOrderIssues(issues);
      })
      .catch((cause: unknown) => {
        if (active) {
          toast.error(
            cause instanceof Error ? cause.message : "Could not load order issues.",
          );
        }
      })
      .finally(() => {
        if (active) setIssuesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshNotifications = async () => {
      try {
        const latest = await apiFetch<AdminNotification[]>("/admin/notifications");
        if (!active) return;
        if (notificationHistoryLoaded.current) {
          const newNotifications = latest.filter(
            (notification) => !notificationIds.current.has(notification._id),
          );
          newNotifications.forEach((notification) =>
            toast.info(notification.title, { description: notification.message }),
          );
          if (newNotifications.length > 0) {
            const latestIssues = await apiFetch<AdminOrderIssue[]>("/admin/order-issues");
            if (active) setOrderIssues(latestIssues);
          }
        }
        notificationIds.current = new Set(latest.map((notification) => notification._id));
        notificationHistoryLoaded.current = true;
        setNotifications(latest);
      } catch (cause) {
        if (active && !notificationHistoryLoaded.current) {
          toast.error(
            cause instanceof Error ? cause.message : "Could not load admin notifications.",
          );
        }
      }
    };
    void refreshNotifications();
    const timer = window.setInterval(() => void refreshNotifications(), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
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

  async function refreshOrders() {
    setRefreshingOrders(true);
    try {
      setOrders(await apiFetch<AdminOrder[]>("/admin/orders"));
      toast.success("Order list is up to date.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not refresh orders.");
    } finally {
      setRefreshingOrders(false);
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
      const updated = await apiFetch<AdminOrder>(`/admin/orders/${order._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) =>
        current.map((item) => (item._id === order._id ? updated : item)),
      );
      toast.success(`Order #${order._id.slice(-6)} updated.`);
      void refreshAnalytics();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update order status.");
    }
  }

  async function updateOrderIssue(
    issue: AdminOrderIssue,
    status: OrderIssueStatus,
    orderAction?: "cancel",
  ) {
    setSavingIssueId(issue._id);
    try {
      const updated = await apiFetch<AdminOrderIssue>(
        `/admin/order-issues/${issue._id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            adminNote: issueNoteDrafts[issue._id] ?? issue.adminNote ?? "",
            ...(orderAction ? { orderAction } : {}),
          }),
        },
      );
      setOrderIssues((current) =>
        current.map((item) => (item._id === updated._id ? updated : item)),
      );
      toast.success(
        orderAction === "cancel"
          ? `Order #${issue.orderId.slice(-6)} cancelled and request resolved.`
          : "Order request updated.",
      );
      if (orderAction === "cancel") void refreshOrders();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update order request.");
    } finally {
      setSavingIssueId("");
    }
  }

  async function markAdminNotificationRead(notification: AdminNotification) {
    try {
      await apiFetch<void>(`/admin/notifications/${notification._id}/read`, {
        method: "PATCH",
      });
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, isRead: true } : item,
        ),
      );
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not update notification.",
      );
    }
  }

  const vendorNames = new Map<string, string>();
  const vendorOptions = Array.from(
    new Set(
      orders.flatMap((order) =>
        order.items.map((item) => {
          const id = item.vendorId ?? "platform";
          if (item.vendorId) vendorNames.set(item.vendorId, item.vendorName || item.vendorId);
          return id;
        }),
      ),
    ),
  );
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      orderStatusFilter === "all" ||
      order.status === orderStatusFilter ||
      order.items.some((item) => item.status === orderStatusFilter);
    const matchesVendor =
      orderVendorFilter === "all" ||
      order.items.some((item) => (item.vendorId ?? "platform") === orderVendorFilter);
    const query = orderCustomerSearch.trim().toLowerCase();
    const matchesCustomer =
      !query ||
      [order.customerName, order.customerEmail, order.phone, order.userId, order._id]
        .some((value) => value?.toLowerCase().includes(query));
    const orderDate = order.createdAt?.slice(0, 10) ?? "";
    const matchesFrom = !orderFromDate || orderDate >= orderFromDate;
    const matchesTo = !orderToDate || orderDate <= orderToDate;
    return matchesStatus && matchesVendor && matchesCustomer && matchesFrom && matchesTo;
  });
  const filteredOrderIssues = orderIssues.filter(
    (issue) => issueStatusFilter === "all" || issue.status === issueStatusFilter,
  );

  if (loading) {
    return <DashboardSkeleton label="Loading platform dashboard..." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
      <aside className="h-fit rounded-2xl border border-border bg-card p-2 lg:p-3">
        <nav
          aria-label="Admin dashboard sections"
          className="flex gap-1 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0"
        >
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSection(id);
                if (id === "analytics") void refreshAnalytics();
              }}
              aria-current={section === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition lg:shrink lg:gap-3 lg:px-4 lg:py-3 ${
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">All orders</h2>
                <p className="mt-1 text-muted-foreground">
                  Monitor customer orders, vendor items, and fulfillment status.
                </p>
              </div>
              <button
                type="button"
                disabled={refreshingOrders}
                onClick={() => void refreshOrders()}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-[#F26B4F] disabled:opacity-60"
              >
                <RefreshCw size={16} className={refreshingOrders ? "animate-spin" : ""} />
                {refreshingOrders ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {orders.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="mt-6 grid gap-4">
                <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-5">
                  <label className="grid gap-1.5 text-sm font-semibold">
                    Status
                    <select
                      value={orderStatusFilter}
                      onChange={(event) => setOrderStatusFilter(event.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 font-normal capitalize"
                    >
                      <option value="all">All statuses</option>
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>{formatOrderStatus(status)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold">
                    Vendor
                    <select
                      value={orderVendorFilter}
                      onChange={(event) => setOrderVendorFilter(event.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 font-normal"
                    >
                      <option value="all">All vendors</option>
                      {vendorOptions.map((vendorId) => (
                        <option key={vendorId} value={vendorId}>
                          {vendorId === "platform" ? "PizzaHub platform" : vendorNames.get(vendorId) ?? vendorId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold">
                    Customer
                    <input
                      value={orderCustomerSearch}
                      onChange={(event) => setOrderCustomerSearch(event.target.value)}
                      placeholder="Name, email or phone"
                      className="rounded-lg border border-border bg-background px-3 py-2 font-normal"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold">
                    From
                    <input
                      type="date"
                      value={orderFromDate}
                      onChange={(event) => setOrderFromDate(event.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 font-normal"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold">
                    To
                    <input
                      type="date"
                      value={orderToDate}
                      onChange={(event) => setOrderToDate(event.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 font-normal"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderStatusFilter("all");
                      setOrderVendorFilter("all");
                      setOrderCustomerSearch("");
                      setOrderFromDate("");
                      setOrderToDate("");
                    }}
                    className="w-fit rounded-lg px-2 py-1 text-sm font-semibold text-[#F26B4F] hover:underline sm:col-span-2 xl:col-span-5"
                  >
                    Clear filters
                  </button>
                </div>
                {filteredOrders.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    No orders match these filters.
                  </p>
                ) : (
                  filteredOrders.map((order) => (
                    <article key={order._id} className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold">Order #{order._id.slice(-6)} · {order.customerName}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Date unavailable"}
                            {order.customerEmail ? ` · ${order.customerEmail}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.items.length} item{order.items.length === 1 ? "" : "s"} · Order status:
                            <span className="ml-1 font-semibold capitalize text-foreground">
                              {formatOrderStatus(order.status)}
                            </span>
                          </p>
                        </div>
                        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                          Admin status
                          <select
                            value={order.status}
                            onChange={(event) => void changeOrderStatus(order, event.target.value)}
                            aria-label={`Order status for ${order._id}`}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize text-foreground"
                          >
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>{formatOrderStatus(status)}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <details className="mt-4 rounded-xl border border-border">
                        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold hover:text-[#F26B4F]">
                          View full order details
                        </summary>
                        <div className="grid gap-4 border-t border-border p-4">
                          <div className="grid gap-2 text-sm sm:grid-cols-2">
                            <p><span className="text-muted-foreground">Customer: </span>{order.customerName}</p>
                            <p><span className="text-muted-foreground">Delivery date: </span>{order.deliveryDate || "Not provided"}</p>
                            <p><span className="text-muted-foreground">Phone: </span>{order.phone || "Not provided"}</p>
                            <p className="sm:col-span-2"><span className="text-muted-foreground">Delivery address: </span>{order.deliveryAddress || "Not provided"}</p>
                            {order.notes && <p className="sm:col-span-2"><span className="text-muted-foreground">Notes: </span>{order.notes}</p>}
                          </div>
                          <div className="grid gap-2">
                            {order.items.map((item) => (
                              <div key={item.itemId} className="grid gap-2 rounded-xl bg-muted/50 p-3 text-sm sm:grid-cols-[1fr_auto]">
                                <div>
                                  <p className="font-semibold">{item.name} · {item.size} × {item.quantity}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Vendor: {item.vendorName ?? (item.vendorId ? item.vendorId : "PizzaHub platform")} · Item status: {formatOrderStatus(item.status)}
                                  </p>
                                  {item.rejectionReason && (
                                    <p className="mt-2 text-xs text-red-600">
                                      Rejection reason: {item.rejectionReason}
                                    </p>
                                  )}
                                </div>
                                <p className="font-bold">৳{item.subtotal}</p>
                              </div>
                            ))}
                          </div>
                          <div className="grid gap-1 border-t border-border pt-3 text-right text-sm">
                            {order.subtotal !== undefined && <p>Subtotal · ৳{order.subtotal}</p>}
                            {order.deliveryFee !== undefined && <p>Delivery · ৳{order.deliveryFee}</p>}
                            <p className="font-black">Total · ৳{order.total}</p>
                          </div>
                        </div>
                      </details>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        )}

        {section === "issues" && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">Order issues</h2>
                <p className="mt-1 text-muted-foreground">
                  Review complaints, cancellations and refund requests.
                </p>
              </div>
              <label className="grid gap-1 text-sm font-semibold">
                Status
                <select
                  value={issueStatusFilter}
                  onChange={(event) => setIssueStatusFilter(event.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 font-normal capitalize"
                >
                  <option value="all">All requests</option>
                  {(["open", "in_review", "resolved", "rejected"] as const).map((status) => (
                    <option key={status} value={status}>{formatOrderStatus(status)}</option>
                  ))}
                </select>
              </label>
            </div>
            {issuesLoading ? (
              <ListSkeleton label="Loading order issues..." />
            ) : filteredOrderIssues.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No order requests match this filter.
              </p>
            ) : (
              <div className="mt-6 grid gap-4">
                {filteredOrderIssues.map((issue) => (
                  <article key={issue._id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold capitalize">
                          {issue.type} · Order #{issue.orderId.slice(-6)}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {issue.customerName} · {new Date(issue.createdAt).toLocaleString()} · ৳{issue.orderTotal}
                        </p>
                      </div>
                      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold capitalize text-[#F26B4F]">
                        {formatOrderStatus(issue.status)}
                      </span>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm">{issue.message}</p>
                    {issue.type === "refund" && (
                      <p className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        Record the payment-provider refund in the admin note before marking this request resolved.
                      </p>
                    )}
                    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                      <label className="grid gap-1 text-sm font-semibold">
                        Admin note
                        <textarea
                          rows={2}
                          maxLength={1000}
                          value={issueNoteDrafts[issue._id] ?? issue.adminNote ?? ""}
                          onChange={(event) =>
                            setIssueNoteDrafts((current) => ({
                              ...current,
                              [issue._id]: event.target.value,
                            }))
                          }
                          className="resize-y rounded-lg border border-border bg-background px-3 py-2 font-normal"
                          placeholder="Explain the action taken or what happens next."
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-semibold">
                        Request status
                        <select
                          value={issueStatusDrafts[issue._id] ?? issue.status}
                          onChange={(event) =>
                            setIssueStatusDrafts((current) => ({
                              ...current,
                              [issue._id]: event.target.value as OrderIssueStatus,
                            }))
                          }
                          className="rounded-lg border border-border bg-background px-3 py-2 font-normal capitalize"
                        >
                          {(["open", "in_review", "resolved", "rejected"] as const).map((status) => (
                            <option key={status} value={status}>{formatOrderStatus(status)}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={savingIssueId === issue._id}
                        onClick={() =>
                          void updateOrderIssue(
                            issue,
                            issueStatusDrafts[issue._id] ?? issue.status,
                          )
                        }
                        className="self-end rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60"
                      >
                        Save request
                      </button>
                    </div>
                    {issue.type === "cancellation" && issue.status !== "resolved" && issue.status !== "rejected" && (
                      <button
                        type="button"
                        disabled={savingIssueId === issue._id}
                        onClick={() => void updateOrderIssue(issue, "resolved", "cancel")}
                        className="mt-3 rounded-lg bg-[#F26B4F] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                      >
                        {savingIssueId === issue._id ? "Applying..." : "Approve cancellation and cancel order"}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "notifications" && (
          <section>
            <h2 className="text-2xl font-black">Admin notifications</h2>
            <p className="mt-1 text-muted-foreground">
              Vendor response alerts and customer order requests.
            </p>
            {notifications.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No admin notifications.
              </p>
            ) : (
              <div className="mt-6 grid gap-3">
                {notifications.map((notification) => (
                  <article
                    key={notification._id}
                    className={`rounded-2xl border border-border bg-card p-5 ${notification.isRead ? "opacity-70" : ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{notification.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={() => void markAdminNotificationRead(notification)}
                          className="text-sm font-semibold text-[#F26B4F] hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                    <p className="mt-3 text-sm">{notification.message}</p>
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
                      {formatOrderStatus(status)}: {count}
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
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Admin dashboard</h1>
        <div className="mt-8">
          <AdminDashboardContent />
        </div>
      </main>
    </DashboardAccess>
  );
}
