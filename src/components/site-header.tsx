import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand-mark" aria-label="Dertlyu home">
          Dertlyu
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link href="/">Generate</Link>
          <Link href="/history">History</Link>
        </nav>
      </div>
    </header>
  );
}
