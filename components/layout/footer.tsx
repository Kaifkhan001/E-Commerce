import Link from "next/link";
import { footerNav, siteConfig } from "@/config/site";
import { NewsletterForm } from "@/components/home/newsletter-form";

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-charcoal-soft">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-charcoal-soft transition-colors hover:text-charcoal">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-ivory-deep">
      <div className="container-brand py-14">
        <div className="mb-12 grid gap-8 md:grid-cols-2">
          <div>
            <span className="font-display text-xl">{siteConfig.name}</span>
            <p className="mt-3 max-w-sm text-sm text-charcoal-soft">{siteConfig.description}</p>
          </div>
          <div className="md:justify-self-end md:max-w-sm">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-charcoal-soft">Stay in touch</h3>
            <p className="mb-4 text-sm text-charcoal-soft">New arrivals, restocks, and the occasional discount — no spam.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <FooterColumn title="Shop" links={footerNav.shop} />
          <FooterColumn title="Help" links={footerNav.help} />
          <FooterColumn title="About" links={footerNav.about} />
          <FooterColumn title="Policies" links={footerNav.policies} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-charcoal-soft sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex gap-4">
            {footerNav.social.map((s) => (
              <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-charcoal">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
