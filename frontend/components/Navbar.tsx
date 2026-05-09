import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-blue-900">
          SALAMAX
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
          <Link href="/" className="hover:text-blue-900">
            خانه
          </Link>

          <Link href="/intake" className="hover:text-blue-900">
            شروع پیش‌ویزیت
          </Link>

          <Link href="/doctor-match" className="hover:text-blue-900">
            پزشکان
          </Link>

          <Link href="/summary" className="hover:text-blue-900">
            خلاصه دمو
          </Link>
        </nav>

        <Link
          href="/intake"
          className="rounded-xl bg-blue-900 px-4 py-2 text-sm text-white hover:bg-blue-800"
        >
          شروع پیش‌ویزیت
        </Link>
      </div>
    </header>
  );
}
