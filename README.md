# PizzaHub Client

The customer-facing frontend for **PizzaHub**, a dark-themed pizza ordering app. This Next.js app handles browsing the menu, cart and checkout, Stripe payments, user profiles, and role-based dashboards for customers, admins, and vendors.

> The API lives in the separate `PizzaHub-Server` project. See the root `README.md` in `PizzaHub-Starter` for full server setup and seeding instructions.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, `tw-animate-css` |
| UI components | Base UI, shadcn/ui-style local components, `class-variance-authority` |
| Icons | Lucide React |
| Animation | Motion (`motion/react`) |
| Auth | Better Auth (session cookies + JWT client plugin), Google sign-in |
| Payments | Stripe (`stripe`, `@stripe/stripe-js`) |
| Notifications | Sonner toasts |

## Getting started


## Main routes

- `/` — homepage with animated hero, marquee, and featured products
- `/menu`, `/menu/[slug]` — browse pizzas and view product details
- `/cart`, `/checkout`, `/payment`, `/payment/success` — ordering and payment flow
- `/login` — sign in with email/password or Google
- `/profile` — view and update account details (name and avatar URL)
- `/dashboard/customer` — orders, addresses, wishlist, and profile shortcuts
- `/dashboard/vendor` — store settings, products, and orders
- `/dashboard/admin`, `/admin` — admin overview and management
- `/api/auth/[...all]`, `/api/payment/checkout`, `/api/checkout_session` — server-side API routes

## Authentication and authorization

- Sign in at `/login`. Public sign-up is not offered; Google sign-in can create a new customer account.
- Better Auth session cookies keep the browser session; a JWT is requested via the JWT client plugin and sent to the Express API as `Authorization: Bearer <JWT>`.
- Roles are `customer`, `admin`, and `vendor`. Role checks are enforced on the server — never trust a role from the client.
- `src/middleware.ts` protects `/dashboard/*`, `/admin/*`, `/cart`, `/checkout`, `/payment/*`, and `/profile/*`, redirecting signed-out users to `/login` with a `callbackUrl`.

> Next.js 16 warns that the `middleware` file convention is deprecated in favour of `proxy`. The app still works; migrating `src/middleware.ts` is a future cleanup task.

## Notes

- The starter intentionally uses plain `<img>` tags in a few places; ESLint reports `no-img-element` warnings for them. There are no lint errors.
- Animation effects honour `prefers-reduced-motion`.
- This is a runnable foundation, not a finished commercial payment system. Image upload storage, production refresh-token strategy, and advanced order workflows should be added before launch.


Live link - https://pizzahub-client-ten-silk.vercel.app
