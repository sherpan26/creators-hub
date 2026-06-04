import Link from "next/link";

export function Header() {
  return (
    <header className="bg-gray-900 text-white">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link href="/" className="font-bold text-xl">
            Creator&apos;s Hub
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="hover:text-gray-300">
            Dashboard
          </Link>
          <Link href="/reports" className="hover:text-gray-300">
            Reports
          </Link>
        </div>
      </nav>
    </header>
  );
}
