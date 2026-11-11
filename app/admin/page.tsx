"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { products } from "@/lib/products";

const PAGE_SIZE = 50;

type CustomerSubmission = {
  id: string | number;
  name: string;
  email: string;
  phone: string | null;
  interests: string[];
  consent: boolean;
  createdAt: string;
};

type CustomerResponse = {
  customers: CustomerSubmission[];
  page: number;
  pageSize: number;
  total: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCustomerResponse(value: unknown): CustomerResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.customers) ||
    typeof value.page !== "number" ||
    typeof value.pageSize !== "number" ||
    typeof value.total !== "number"
  ) {
    throw new Error("The customer endpoint returned an unexpected response.");
  }

  const customers = value.customers.map((customer: unknown) => {
    if (!isRecord(customer)) {
      throw new Error("The customer endpoint returned an invalid customer record.");
    }

    const rawInterests = Array.isArray(customer.interests)
      ? customer.interests
      : typeof customer.interest === "string" && customer.interest
        ? [customer.interest]
        : [];
    const interests = rawInterests.map((interest: unknown) => {
      if (typeof interest !== "string") {
        throw new Error("The customer endpoint returned an invalid customer record.");
      }
      return interest;
    });
    const createdAt = customer.createdAt ?? customer.created_at;
    if (
      (typeof customer.id !== "string" && typeof customer.id !== "number") ||
      typeof customer.name !== "string" ||
      typeof customer.email !== "string" ||
      (customer.phone != null && typeof customer.phone !== "string") ||
      typeof customer.consent !== "boolean" ||
      typeof createdAt !== "string"
    ) {
      throw new Error("The customer endpoint returned an invalid customer record.");
    }

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: typeof customer.phone === "string" ? customer.phone : null,
      interests,
      consent: customer.consent,
      createdAt
    };
  });

  return {
    customers,
    page: value.page,
    pageSize: value.pageSize,
    total: value.total
  };
}

async function responseError(response: Response, fallback: string) {
  try {
    const body: unknown = await response.json();
    if (isRecord(body) && typeof body.error === "string") return body.error;
  } catch {
    // Keep the generic message when the server does not return JSON.
  }
  return fallback;
}

function formatSubmittedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminPage() {
  const [customers, setCustomers] = useState<CustomerSubmission[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCustomers() {
      setIsLoading(true);
      setError(null);
      setRequiresSignIn(false);

      try {
        const query = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE)
        });
        const response = await fetch(`/api/admin/customers?${query}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal
        });

        if (response.status === 401 || response.status === 403) {
          setCustomers([]);
          setRequiresSignIn(true);
          return;
        }
        if (!response.ok) {
          throw new Error(`The server returned ${response.status}.`);
        }

        const result = parseCustomerResponse(await response.json());
        setCustomers(result.customers);
        setPage(result.page);
        setPageSize(result.pageSize);
        setTotal(result.total);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        console.error("Could not load customer submissions:", requestError);
        setError("We couldn't load customer submissions. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadCustomers();
    return () => controller.abort();
  }, [page, refreshKey]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setIsSigningIn(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email: String(values.get("email") ?? "").trim(),
          password: String(values.get("password") ?? "")
        })
      });

      if (!response.ok) {
        setLoginError(await responseError(response, "Sign-in failed. Please try again."));
        return;
      }

      form.reset();
      setPage(1);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      console.error("Admin sign-in request failed:", requestError);
      setLoginError("Sign-in is unavailable right now. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    setIsSigningOut(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
      if (!response.ok) {
        setError(await responseError(response, "Couldn't sign out. Please try again."));
        return;
      }
      setCustomers([]);
      setTotal(0);
      setRequiresSignIn(true);
    } catch (requestError) {
      console.error("Admin sign-out request failed:", requestError);
      setError("Couldn't sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstSubmission = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastSubmission = Math.min(page * pageSize, total);

  return (
    <div className="shell admin-shell">
      <header className="topbar">
        <Link className="admin-brand" href="/">Jay Fanks <span>Admin</span></Link>
        <div className="admin-header-actions">
          {!isLoading && !requiresSignIn && (
            <button
              className="admin-back-link"
              type="button"
              onClick={signOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
          )}
          <Link className="admin-back-link" href="/">Back to kiosk</Link>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-content" aria-labelledby="admin-title" aria-busy={isLoading}>
          <div className="admin-heading">
            <div>
              <p className="eyebrow">Customer enquiries</p>
              <h1 id="admin-title">Submissions</h1>
              <p className="admin-intro">View customer details and the products they asked about.</p>
            </div>
            {!requiresSignIn && (
              <button
                className="refresh-button"
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                disabled={isLoading}
              >
                {isLoading ? "Loading…" : "Refresh"}
              </button>
            )}
          </div>

          {isLoading && <p className="admin-message" role="status">Loading submissions…</p>}

          {!isLoading && requiresSignIn && (
            <div className="admin-message admin-auth-message">
              <h2>Admin sign-in required</h2>
              <p>Sign in with the administrator account to view customer submissions.</p>
              <form className="admin-login-form" onSubmit={signIn}>
                <label className="field">
                  <span>Email address</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    maxLength={254}
                  />
                </label>
                <label className="field">
                  <span>Password</span>
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    maxLength={200}
                  />
                </label>
                {loginError && <p className="admin-login-error" role="alert">{loginError}</p>}
                <button className="primary-button" type="submit" disabled={isSigningIn}>
                  {isSigningIn ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </div>
          )}

          {!isLoading && error && (
            <div className="admin-message admin-error" role="alert">
              <p>{error}</p>
              {!requiresSignIn && (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setRefreshKey((key) => key + 1)}
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {!isLoading && !requiresSignIn && !error && (
            <>
              <p className="submission-count">
                {total} {total === 1 ? "submission" : "submissions"}
                {total > 0 && ` · Showing ${firstSubmission}–${lastSubmission}`}
              </p>
              {customers.length === 0 ? (
                <div className="admin-message">No customer submissions yet.</div>
              ) : (
                <div className="submission-table-wrap">
                  <table className="submission-table">
                    <thead>
                      <tr>
                        <th scope="col">Customer</th>
                        <th scope="col">Contact</th>
                        <th scope="col">Products of interest</th>
                        <th scope="col">Consent</th>
                        <th scope="col">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id}>
                          <th className="customer-name" scope="row">{customer.name}</th>
                          <td className="customer-contact">
                            <a href={`mailto:${customer.email}`}>{customer.email}</a>
                            {customer.phone && <a href={`tel:${customer.phone}`}>{customer.phone}</a>}
                          </td>
                          <td>
                            {customer.interests.length ? (
                              <ul className="interest-list">
                                {customer.interests.map((interest) => {
                                  const product = products.find((item) => item.interest === interest);
                                  return (
                                    <li key={interest}>
                                      {product ? `${product.name} ${product.size}` : interest}
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : "No products selected"}
                          </td>
                          <td>{customer.consent ? "Agreed" : "Not agreed"}</td>
                          <td className="submitted-at">{formatSubmittedAt(customer.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {pageCount > 1 && (
                <nav className="pagination" aria-label="Submission pages">
                  <button
                    className="refresh-button"
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || isLoading}
                  >
                    Previous
                  </button>
                  <span>Page {page} of {pageCount}</span>
                  <button
                    className="refresh-button"
                    type="button"
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    disabled={page >= pageCount || isLoading}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
