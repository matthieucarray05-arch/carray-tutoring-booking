export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">Carray Tutoring — Admin</span>
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
