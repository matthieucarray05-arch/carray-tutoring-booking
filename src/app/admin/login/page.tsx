export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-[0_1px_2px_rgba(21,17,15,0.03),0_16px_32px_-24px_rgba(21,17,15,0.18)]">
        <p className="kicker">Carray Tutoring</p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the admin password to manage availability.
        </p>

        <form action="/api/admin/login" method="POST" className="mt-6 space-y-4">
          <input type="hidden" name="from" value={from ?? "/admin/availability"} />
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          {error && (
            <p className="text-sm text-accent">Incorrect password. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
