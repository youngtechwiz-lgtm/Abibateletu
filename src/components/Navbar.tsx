import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Instagram, Menu, X } from 'lucide-react';
import { useCms } from '../context/CmsContext.tsx';

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Digitals', to: '/digitals' },
  { label: 'About', to: '/about' },
  { label: 'Experience', to: '/experience' },
  { label: 'Representation', to: '/representation' },
  { label: 'Contact', to: '/contact' },
];

export function Navbar() {
  const { state } = useCms();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const instagramUrl = `https://instagram.com/${(state.siteSettings.instagramPrimary || 'eletuabibat_').replace('@', '')}`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'bg-[#0C0C0C]/95 backdrop-blur-md border-b border-white/10'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 sm:h-20 max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-10 lg:px-14">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="font-serif text-xl sm:text-2xl font-normal tracking-[0.15em] text-[#F5F0E8] uppercase whitespace-nowrap shrink-0 hover:opacity-85 transition-opacity"
        >
          {state.homepage.wordmark || 'ABIBAT'}
        </Link>

        {/* Zone 2: Single-line Editorial Nav Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-7 xl:gap-8"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative py-1 text-[11px] font-normal tracking-[0.08em] whitespace-nowrap shrink-0 transition-colors duration-200 ${
                  active ? 'text-[#F5F0E8]' : 'text-[#F5F0E8]/70 hover:text-[#F5F0E8]'
                }`}
              >
                {item.label}
                <span
                  className={`absolute left-0 right-0 -bottom-0.5 h-px bg-[#F5F0E8] transition-transform duration-200 origin-left ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Social & Mobile Drawer Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="flex h-8 w-8 items-center justify-center text-[#F5F0E8]/80 hover:text-[#F5F0E8] transition-colors"
          >
            <Instagram className="h-4 w-4" strokeWidth={1.5} />
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="flex lg:hidden h-8 w-8 items-center justify-center text-[#F5F0E8] hover:opacity-75 transition-opacity"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0C0C0C] border-t border-white/10 px-6 py-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col gap-5" aria-label="Mobile Navigation">
            {NAV_ITEMS.map((item) => {
              const active =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-sm tracking-[0.1em] transition-colors ${
                    active ? 'text-[#F5F0E8] font-medium' : 'text-[#F5F0E8]/65 hover:text-[#F5F0E8]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs tracking-[0.1em] text-[#B89564] hover:text-[#F5F0E8] transition-colors flex items-center gap-2"
              >
                <Instagram className="h-3.5 w-3.5" />
                <span>Instagram</span>
              </a>
              <Link
                to="/admin"
                className="text-xs tracking-[0.1em] text-[#F5F0E8]/50 hover:text-[#F5F0E8] transition-colors"
              >
                Admin Studio
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
