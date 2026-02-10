import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="border-b border-gray-100">
      <div className="flex items-center justify-between px-6 py-6 md:pl-36 md:pr-16 md:py-8">
        <Link href="/">
          <Image
            src="/scop-logo.svg"
            alt="ScOp Venture Capital"
            width={140}
            height={44}
            priority
          />
        </Link>
        <nav className="flex items-center gap-4 md:gap-8">
          <a
            href="https://scopvc.com/team/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-base text-gray-400 transition-colors duration-150 hover:text-black sm:inline"
          >
            Team
          </a>
          <a
            href="https://scopvc.com/companies/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-base text-gray-400 transition-colors duration-150 hover:text-black sm:inline"
          >
            Companies
          </a>
          <a
            href="https://scopvc.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-base text-gray-400 transition-colors duration-150 hover:text-black md:inline"
          >
            About
          </a>
          <Link
            href="/jobs"
            className="text-sm text-gray-400 transition-colors duration-150 hover:text-black md:text-base"
          >
            Careers
          </Link>
        </nav>
      </div>
    </header>
  );
}
