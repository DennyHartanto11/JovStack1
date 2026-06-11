export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden flex-1 flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] font-bold">
            J
          </span>
          <span className="text-xl font-semibold">JovStack</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Build your business website in minutes.
          </h2>
          <p className="mt-4 max-w-md text-slate-400">
            No coding required. Create websites, manage products, receive orders, and publish to
            your own JovStack subdomain.
          </p>
        </div>
        <p className="text-sm text-slate-500">© 2026 JovStack. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
