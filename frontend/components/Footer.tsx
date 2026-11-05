import Link from "next/link";

const links = [
  { name: "Find a partner", href: "/partners" },
  { name: "Venue", href: "/venue" },
  { name: "Register", href: "/register" },
  { name: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-gray-300 text-sm">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 text-white font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-7 w-7" />
          Tower Swing · 3.7.2027 · Floor 33, REDI Helsinki
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white">
              {l.name}
            </Link>
          ))}
          <a href="https://www.instagram.com/haiphan_wcs/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            Instagram
          </a>
        </nav>
      </div>
    </footer>
  );
}
