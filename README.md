# WBS-Admin (Business Administration Panel)

Welcome to the **WBS-Admin**, the administrative dashboard for the WBS Menu Demo. This application is designed for business owners and staff to manage their digital menu, track orders, and monitor performance.

## Key Functionality

- **Menu Management:** Create, update, and organize menu items and categories with a user-friendly interface.
- **Drag & Drop Reordering:** Easily rearrange categories and items using `@dnd-kit`.
- **Order Tracking:** Monitor incoming orders and update their status in real-time.
- **Analytics & Dashboard:** Visual insights into business performance using `recharts`.
- **Push Notifications:** Stay updated with incoming orders via `web-push`.
- **Media Management:** Upload and manage images for menu items.

## Technology Stack & Tools

### Core

- **Framework:** [Next.js 14](https://nextjs.org/)
- **Language:** JavaScript / TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Package Manager:** NPM

### Database & Auth

- **Database:** Supabase
- **Authentication:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)

### UI & UX

- **Component Primitives:** Radix UI (`@radix-ui/react-*`)
- **Animations:** Framer Motion & `tailwindcss-animate`
- **Icons:** Lucide React
- **Forms:** React Hook Form (`react-hook-form`), Zod (`zod`), and Hookform Resolvers
- **Layout:** React Resizable Panels (`react-resizable-panels`)
- **Notifications:** Sonner (`sonner`) for toasts.

### Admin-Specific Tools

- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Charts:** Recharts (`recharts`)
- **Push Notifications:** `web-push`
- **Dates:** `date-fns` and `react-day-picker`
