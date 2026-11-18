import { Link } from 'react-router-dom';
import { Instagram, Mail } from 'lucide-react';
import { useCms } from '../context/CmsContext.tsx';

const FOOTER_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Digitals', to: '/digitals' },
  { label: 'About', to: '/about' },
  { label: 'Experience', to: '/experience' },
  { label: 'Representation', to: '/representation' },
  { label: 'Contact', to: '/contact' },
];

export function Footer() {
  const { state } = useCms();
  const { homepage, siteSettings } = state;

  return (
    <footer className="bg-[#0C0C0C] border-t border-white/10 text-[#F5F0E8]">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14 py-10 space-y-8">
        {/* Top Row: Brand Wordmark + 7 Public Routes + Social Icons */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <Link
              to="/"
              className="font-serif text-xl tracking-[0.14em] uppercase text-[#F5F0E8] hover:opacity-80 transition-opacity"
            >
              {homepage.wordmark || 'ABIBAT'}
              <sup className="text-[9px] ml-0.5 align-super">®</sup>
            </Link>
            <p className="text-[11px] text-[#F5F0E8]/55">International Fashion Model</p>
          </div>

          <nav
            aria-label="Footer Navigation"
            className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[11px] text-[#F5F0E8]/70"
          >
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="hover:text-[#F5F0E8] transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={`https://instagram.com/${siteSettings.instagramPrimary.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Instagram ${siteSettings.instagramPrimary}`}
              title={siteSettings.instagramPrimary}
              className="flex h-8 w-8 items-center justify-center border border-white/20 text-[#F5F0E8]/75 hover:border-white hover:text-white transition-colors"
            >
              <Instagram className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://x.com/_theeletuabibat"
              target="_blank"
              rel="noreferrer"
              aria-label="X (Twitter) @_theeletuabibat"
              title="@_theeletuabibat"
              className="flex h-8 w-8 items-center justify-center border border-white/20 text-[#F5F0E8]/75 hover:border-white hover:text-white transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href={`mailto:${siteSettings.email}`}
              aria-label={`Email ${siteSettings.email}`}
              title={siteSettings.email}
              className="flex h-8 w-8 items-center justify-center border border-white/20 text-[#F5F0E8]/75 hover:border-white hover:text-white transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Bottom Row: Copyright, Editorial Pillars, Regions & Private Admin Studio Link */}
        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-[#F5F0E8]/55">
          <span>{siteSettings.copyrightText}</span>

          <span className="hidden md:inline-block text-[9px] tracking-[0.26em] uppercase text-[#F5F0E8]/45">
            FASHION &nbsp;/&nbsp; CULTURE &nbsp;/&nbsp; OPPORTUNITY
          </span>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>{siteSettings.regionsLine}</span>
            <Link
              to="/admin"
              className="uppercase tracking-[0.18em] text-[10px] text-[#F5F0E8]/60 hover:text-[#F5F0E8] transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
