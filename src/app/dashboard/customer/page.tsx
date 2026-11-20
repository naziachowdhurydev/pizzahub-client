"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CircleX, Heart, LifeBuoy, MapPin, PackageCheck, RefreshCw, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DashboardAccess } from "@/components/dashboard-access";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Product } from "@/types";

type Order = {
  _id: string;
  status: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  deliveryAddress?: string;
  phone?: string;
  createdAt?: string;
  items: Array<{
    itemId: string;
    vendorId?: string | null;
    vendorName?: string | null;
    size: string;
    name: string;
    quantity: number;
    price: number;
    subtotal?: number;
    status?: string;
    rejectionReason?: string;
  }>;
};

type CustomerNotification = {
_id: string;
title: string;
message: string;
type: string;
orderId?: string;
issueId?: string;
isRead: boolean;
createdAt: string;
};

type OrderIssueType = "complaint" | "cancellation" | "refund";

type CustomerOrderIssue = {
_id: string;
orderId: string;
type: OrderIssueType;
message: string;
status: "open" | "in_review" | "resolved" | "rejected";
adminNote?: string;
createdAt: string;
updatedAt: string;
};

type Address = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
};

type VendorApplication = {
  _id: string;
  storeName: string;
  description: string;
  status: "pending" | "approved" | "rejected";
};

const emptyAddress: Address = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  postalCode: "",
};

const sections = [
  { id: "orders", label: "My Orders", icon: PackageCheck },
  { id: "wishlist", label: "My Wishlist", icon: Heart },
  { id: "address", label: "My Address", icon: MapPin },
  { id: "profile", label: "My Profile", icon: UserRound },
  { id: "support", label: "Support Requests", icon: LifeBuoy },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

type Section = (typeof sections)[number]["id"];

function groupItemsByVendor(items: Order["items"]) {
  const groups = new Map<
    string,
    { key: string; name: string; items: Order["items"] }
  >();
  items.forEach((item) => {
    const key = item.vendorId ?? "platform";
    const group = groups.get(key) ?? {
      key,
      name: item.vendorName || "PizzaHub platform",
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  });
  return [...groups.values()];
}

function CustomerDashboardContent() {
  const { data: session } = authClient.useSession();
  const [section, setSection] = useState<Section>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [application, setApplication] = useState<VendorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingApplication, setSavingApplication] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState("");
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [loadingOrderId, setLoadingOrderId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [supportRequests, setSupportRequests] = useState<CustomerOrderIssue[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [issueOrderId, setIssueOrderId] = useState("");
  const [issueType, setIssueType] = useState<OrderIssueType>("complaint");
  const [issueMessage, setIssueMessage] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const notificationIds = useRef(new Set<string>());
  const notificationHistoryLoaded = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<Order[]>("/orders/my"),
      apiFetch<Product[]>("/customer/wishlist"),
      apiFetch<Address | null>("/customer/address"),
      apiFetch<VendorApplication | null>("/customer/vendor-application"),
    ])
      .then(([myOrders, savedPizzas, savedAddress, vendorApplication]) => {
        if (!active) return;
        setOrders(myOrders);
        setWishlist(savedPizzas);
        setAddress(savedAddress ?? emptyAddress);
        setApplication(vendorApplication);
        if (vendorApplication) {
          setStoreName(vendorApplication.storeName);
          setStoreDescription(vendorApplication.description);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Could not load your dashboard.",
          );
        }
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
    const refreshNotifications = async () => {
      try {
        const latest = await apiFetch<CustomerNotification[]>("/orders/notifications");
        if (!active) return;
        if (notificationHistoryLoaded.current) {
          const newNotifications = latest.filter(
            (notification) => !notificationIds.current.has(notification._id),
          );
          newNotifications.forEach((notification) =>
            toast.info(notification.title, { description: notification.message }),
          );
          if (newNotifications.length > 0) {
            try {
              const [latestOrders, latestIssues] = await Promise.all([
                apiFetch<Order[]>("/orders/my"),
                apiFetch<CustomerOrderIssue[]>("/orders/issues/my"),
              ]);
              if (active) {
                setOrders(latestOrders);
                setSupportRequests(latestIssues);
              }
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Could not refresh order updates.",
              );
            }
          }
        }
        notificationIds.current = new Set(latest.map((notification) => notification._id));
        notificationHistoryLoaded.current = true;
        setNotifications(latest);
      } catch (error) {
        if (active && !notificationHistoryLoaded.current) {
          toast.error(
            error instanceof Error ? error.message : "Could not load notifications.",
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

  useEffect(() => {
    let active = true;
    apiFetch<CustomerOrderIssue[]>("/orders/issues/my")
      .then((issues) => {
        if (active) setSupportRequests(issues);
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Could not load support requests.");
        }
      })
      .finally(() => {
        if (active) setSupportLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function toggleOrderDetails(order: Order) {
    if (expandedOrderId === order._id) {
      setExpandedOrderId("");
      return;
    }

    setLoadingOrderId(order._id);
    try {
      const details = await apiFetch<Order>(`/orders/${order._id}`);
      setOrders((current) =>
        current.map((item) => (item._id === details._id ? details : item)),
      );
      setExpandedOrderId(order._id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load order details.");
    } finally {
      setLoadingOrderId("");
    }
  }

  async function refreshOrders() {
    setRefreshingOrders(true);
    try {
      setOrders(await apiFetch<Order[]>("/orders/my"));
      toast.success("Your orders are up to date.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not refresh orders.");
    } finally {
      setRefreshingOrders(false);
    }
  }

  async function cancelOrder() {
    const order = orderToCancel;
    if (!order) return;
    setCancellingOrderId(order._id);
    try {
      const updated = await apiFetch<Order>(`/orders/${order._id}/cancel`, {
        method: "PATCH",
      });
      setOrders((current) =>
        current.map((item) => (item._id === updated._id ? updated : item)),
      );
      setOrderToCancel(null);
      toast.success(`Order #${order._id.slice(-6)} was cancelled.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel this order.");
    } finally {
      setCancellingOrderId("");
    }
  }

  async function submitOrderIssue(
    event: React.FormEvent<HTMLFormElement>,
    order: Order,
  ) {
    event.preventDefault();
    const message = issueMessage.trim();
    if (message.length < 10) {
      toast.error("Please provide at least 10 characters of detail.");
      return;
    }
    setSubmittingIssue(true);
    try {
      const created = await apiFetch<CustomerOrderIssue>(
        `/orders/${order._id}/issues`,
        {
          method: "POST",
          body: JSON.stringify({ type: issueType, message }),
        },
      );
      setSupportRequests((current) => [created, ...current]);
      setIssueOrderId("");
      setIssueMessage("");
      toast.success("Your request was sent to PizzaHub support.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your request.");
    } finally {
      setSubmittingIssue(false);
    }
  }

  async function markNotificationRead(notification: CustomerNotification) {
    try {
      await apiFetch<void>(`/orders/notifications/${notification._id}/read`, {
        method: "PATCH",
      });
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update notification.");
    }
  }

  async function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAddress(true);
    try {
      const saved = await apiFetch<Address>("/customer/address", {
        method: "PUT",
        body: JSON.stringify(address),
      });
      setAddress(saved);
      toast.success("Delivery information saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your address.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function removeFromWishlist(product: Product) {
    try {
      await apiFetch<void>(`/customer/wishlist/${product._id}`, {
        method: "DELETE",
      });
      setWishlist((current) => current.filter((item) => item._id !== product._id));
      toast.success(`${product.name} removed from your wishlist.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update wishlist.");
    }
  }

  async function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingApplication(true);
    try {
      const submitted = await apiFetch<VendorApplication>(
        "/vendors/apply",
        {
          method: "POST",
          body: JSON.stringify({ storeName, description: storeDescription }),
        },
      );
      setApplication(submitted);
      toast.success("Vendor application submitted for review.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit the application.",
      );
    } finally {
      setSavingApplication(false);
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-muted-foreground">Loading your dashboard...</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-2xl border border-border bg-card p-3">
        <nav aria-label="Customer dashboard sections" className="grid gap-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
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
        {section === "orders" && (
          <section>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">My Orders</h2>
                <p className="mt-1 text-muted-foreground">Order history and current status.</p>
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
              <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="font-semibold">No orders yet</p>
                <Link href="/menu" className="mt-3 inline-block font-semibold text-[#F26B4F]">
                  Browse the menu
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {orders.map((order) => (
                  <article key={order._id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">Order #{order._id.slice(-6)}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Date unavailable"}
                        </p>
                      </div>
                      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold capitalize text-[#F26B4F]">
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="font-bold">Total · ৳{order.total}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={loadingOrderId === order._id}
                          onClick={() => void toggleOrderDetails(order)}
                          className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:border-[#F26B4F]"
                        >
                          {loadingOrderId === order._id
                            ? "Loading..."
                            : expandedOrderId === order._id
                              ? "Hide details"
                              : "Order details"}
                        </button>
                        {order.status === "pending" &&
                          order.items.every((item) => (item.status ?? "pending") === "pending") && (
                            <button
                              type="button"
                              onClick={() => setOrderToCancel(order)}
                              className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-500/10"
                            >
                              Cancel order
                            </button>
                          )}
                      </div>
                    </div>
                    {expandedOrderId === order._id && (
                      <div className="mt-5 grid gap-4 border-t border-border pt-4">
                        <div className="grid gap-1 text-sm sm:grid-cols-2">
                          <p><span className="text-muted-foreground">Delivery address: </span>{order.deliveryAddress || "Not provided"}</p>
                          <p><span className="text-muted-foreground">Phone: </span>{order.phone || "Not provided"}</p>
                        </div>
                        <div className="grid gap-3">
                          {groupItemsByVendor(order.items).map((group) => {
                            const statuses = [
                              ...new Set(group.items.map((item) => item.status ?? order.status)),
                            ];
                            return (
                              <section key={group.key} className="rounded-xl border border-border p-3">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="font-bold">{group.name}</h4>
                                  <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold capitalize text-[#F26B4F]">
                                    {statuses.length === 1 ? statuses[0].replaceAll("_", " ") : "Multiple statuses"}
                                  </span>
                                </div>
                                <div className="grid gap-2">
                                  {group.items.map((item) => (
                                    <div
                                      key={item.itemId}
                                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-3 text-sm"
                                    >
                                      <div>
                                        <p className="font-semibold">{item.name} · {item.size} × {item.quantity}</p>
                                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                                          Item status: {(item.status ?? order.status).replaceAll("_", " ")}
                                        </p>
                                        {item.status === "rejected" && item.rejectionReason && (
                                          <p className="mt-2 text-sm text-red-600">
                                            Vendor reason: {item.rejectionReason}
                                          </p>
                                        )}
                                      </div>
                                      <p className="font-bold">৳{item.subtotal ?? item.price * item.quantity}</p>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            );
                          })}
                        </div>
                        {issueOrderId === order._id ? (
                          <form
                            onSubmit={(event) => void submitOrderIssue(event, order)}
                            className="grid gap-3 rounded-xl border border-border bg-card p-4"
                          >
                            <h4 className="font-bold">Contact PizzaHub about this order</h4>
                            <label className="grid gap-1.5 text-sm font-semibold">
                              Request type
                              <select
                                value={issueType}
                                onChange={(event) => setIssueType(event.target.value as OrderIssueType)}
                                className="rounded-lg border border-border bg-background px-3 py-2 font-normal"
                              >
                                <option value="complaint">Complaint</option>
                                <option value="cancellation">Cancellation request</option>
                                <option value="refund">Refund request</option>
                              </select>
                            </label>
                            <label className="grid gap-1.5 text-sm font-semibold">
                              Details
                              <textarea
                                required
                                minLength={10}
                                maxLength={2000}
                                rows={3}
                                value={issueMessage}
                                onChange={(event) => setIssueMessage(event.target.value)}
                                className="resize-y rounded-lg border border-border bg-background px-3 py-2 font-normal"
                                placeholder="Describe the issue or request."
                              />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="submit"
                                disabled={submittingIssue}
                                className="rounded-lg bg-[#F26B4F] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                              >
                                {submittingIssue ? "Sending..." : "Send request"}
                              </button>
                              <button
                                type="button"
                                disabled={submittingIssue}
                                onClick={() => setIssueOrderId("")}
                                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIssueOrderId(order._id)}
                            className="w-fit rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:border-[#F26B4F]"
                          >
                            Request help, cancellation or refund
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "wishlist" && (
          <section>
            <h2 className="text-2xl font-black">My Wishlist</h2>
            <p className="mt-1 text-muted-foreground">Pizzas you’ve saved for later.</p>
            {wishlist.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="font-semibold">Your wishlist is empty</p>
                <p className="mt-2 text-sm text-muted-foreground">Save a pizza from the menu to find it here.</p>
                <Link href="/menu" className="mt-3 inline-block font-semibold text-[#F26B4F]">
                  Browse the menu
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {wishlist.map((product) => (
                  <article key={product._id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{product.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
                      </div>
                      <span className="font-bold text-[#F26B4F]">৳{product.price}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeFromWishlist(product)}
                      className="mt-4 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:border-red-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "address" && (
          <section>
            <h2 className="text-2xl font-black">My Address</h2>
            <p className="mt-1 text-muted-foreground">Delivery information for your orders.</p>
            <form onSubmit={saveAddress} className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
              {(
                [
                  ["fullName", "Full name"],
                  ["phone", "Phone"],
                  ["street", "Street address"],
                  ["city", "City"],
                  ["postalCode", "Postal code"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="grid gap-2 text-sm font-semibold">
                  {label}
                  <input
                    required
                    value={address[key]}
                    onChange={(event) =>
                      setAddress((current) => ({ ...current, [key]: event.target.value }))
                    }
                    className="rounded-xl border border-border bg-background px-3 py-2.5 font-normal outline-none focus:border-[#F26B4F]"
                  />
                </label>
              ))}
              <button
                disabled={savingAddress}
                className="w-fit rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white disabled:opacity-60 sm:col-span-2"
              >
                {savingAddress ? "Saving..." : "Save delivery information"}
              </button>
            </form>
          </section>
        )}

        {section === "profile" && (
          <section>
            <h2 className="text-2xl font-black">My Profile</h2>
            <p className="mt-1 text-muted-foreground">Account details and vendor application.</p>
            <div className="mt-6 rounded-2xl border border-border bg-card p-5">
              <p className="font-bold">{session?.user.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{session?.user.email}</p>
              <Link href="/profile" className="mt-4 inline-block text-sm font-semibold text-[#F26B4F]">
                View account details
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold">Want to sell on PizzaHub?</h3>
              {application && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Application status: <span className="font-bold capitalize text-foreground">{application.status}</span>
                </p>
              )}
              {application?.status === "approved" ? (
                <Link href="/dashboard/vendor" className="mt-4 inline-flex font-semibold text-[#F26B4F]">
                  Open vendor dashboard
                </Link>
              ) : (
                <form onSubmit={submitApplication} className="mt-4 grid gap-3">
                  <input
                    required
                    value={storeName}
                    onChange={(event) => setStoreName(event.target.value)}
                    placeholder="Store name"
                    className="rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]"
                  />
                  <textarea
                    required
                    rows={3}
                    value={storeDescription}
                    onChange={(event) => setStoreDescription(event.target.value)}
                    placeholder="Tell us about your store"
                    className="resize-y rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]"
                  />
                  <button
                    disabled={savingApplication || application?.status === "pending"}
                    className="w-fit rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-[#F26B4F] disabled:opacity-60"
                  >
                    {savingApplication
                      ? "Submitting..."
                      : application?.status === "pending"
                        ? "Awaiting review"
                        : application?.status === "rejected"
                          ? "Resubmit application"
                          : "Apply to become a vendor"}
                  </button>
                </form>
              )}
            </div>
          </section>
        )}

        {section === "support" && (
          <section>
            <h2 className="text-2xl font-black">Support requests</h2>
            <p className="mt-1 text-muted-foreground">
              Track complaints, cancellation requests and refund requests.
            </p>
            {supportLoading ? (
              <p className="mt-6 text-muted-foreground">Loading support requests...</p>
            ) : supportRequests.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                You have no support requests.
              </p>
            ) : (
              <div className="mt-6 grid gap-3">
                {supportRequests.map((request) => (
                  <article key={request._id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold capitalize">{request.type} · Order #{request.orderId.slice(-6)}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold capitalize text-[#F26B4F]">
                        {request.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm">{request.message}</p>
                    {request.adminNote && (
                      <p className="mt-3 rounded-lg bg-muted p-3 text-sm">
                        <span className="font-semibold">Admin response: </span>{request.adminNote}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "notifications" && (
          <section>
            <h2 className="text-2xl font-black">Notifications</h2>
            <p className="mt-1 text-muted-foreground">
              Order updates and support-request responses.
            </p>
            {notifications.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                You have no notifications.
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
                          onClick={() => void markNotificationRead(notification)}
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
      </div>
      <ConfirmDialog
        open={orderToCancel !== null}
        onOpenChange={(open) => {
          if (!open && !cancellingOrderId) setOrderToCancel(null);
        }}
        itemLabel="Order"
        itemName={orderToCancel ? `#${orderToCancel._id.slice(-6)}` : ""}
        title="Cancel this order?"
        description="You can cancel only while every item is still pending. Once a vendor accepts any item, cancellation is no longer available."
        confirmLabel="Cancel order"
        pendingLabel="Cancelling order..."
        icon={<CircleX aria-hidden="true" size={25} strokeWidth={2.2} />}
        pending={cancellingOrderId === orderToCancel?._id}
        onConfirm={() => void cancelOrder()}
      />
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <DashboardAccess role="customer">
      <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 md:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#F26B4F]">Your PizzaHub account</p>
        <h1 className="mt-2 text-4xl font-black">Customer dashboard</h1>
        <div className="mt-8">
          <CustomerDashboardContent />
        </div>
      </main>
    </DashboardAccess>
  );
}
