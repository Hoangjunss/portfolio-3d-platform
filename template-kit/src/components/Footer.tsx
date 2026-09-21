export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps {
  links: FooterLink[];
  showSocial: boolean;
}

export function Footer({ links, showSocial }: FooterProps) {
  return (
    <footer className="tk-footer">
      <nav>
        {links.map((link) => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
      </nav>
      {showSocial ? <div className="tk-footer-social" aria-label="Social links" /> : null}
    </footer>
  );
}
