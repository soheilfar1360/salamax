import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-[rgba(95,221,218,0.14)] bg-[#061923]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-[#F4F7F8]">
          SALAMAX
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[#9FB3B7] md:flex">
          <Link href="/" className="hover:text-[#F4F7F8]">
            خانه
          </Link>

          <Link href="/intake" className="hover:text-[#F4F7F8]">
            شروع پیش‌ویزیت
          </Link>

          <Link href="/doctor-match" className="hover:text-[#F4F7F8]">
            پزشکان
          </Link>

          <Link href="/summary" className="hover:text-[#F4F7F8]">
            خلاصه دمو
          </Link>
        </nav>

        <Link
          href="/intake"
          className="rounded-xl bg-[#27D6D0] px-4 py-2 text-sm font-bold text-[#061923] hover:bg-[#0EA7A3]"
        >
          شروع پیش‌ویزیت
        </Link>
      </div>
    </header>
  );
}
