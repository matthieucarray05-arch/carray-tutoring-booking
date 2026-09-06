import Link from "next/link";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold tracking-tight">Carray Tutoring — Admin</span>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin/availability" className="text-muted-foreground transition-colors hover:text-accent">
                Availability
              </Link>
              <Link href="/admin/bookings" className="text-muted-foreground transition-colors hover:text-accent">
                Bookings &amp; Customers
              </Link>
            </nav>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-muted-foreground transition-colors hover:text-accent"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
