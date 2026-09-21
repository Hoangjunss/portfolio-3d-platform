const NAV_LINKS = [
  { label: 'Listings', href: '#listings' },
  { label: 'Saved', href: '#saved-listings' },
  { label: 'Contact', href: '#contact' },
];

export function SiteNav({ wordmark }: { wordmark: string }) {
  return (
    <header className="realestate-nav">
      <a className="realestate-nav-wordmark" href="#top">
        {wordmark}
      </a>
      <nav aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
