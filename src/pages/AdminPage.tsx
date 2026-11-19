import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Briefcase,
  ChevronDown,
  FileText,
  FolderKanban,
  Home,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  Menu,
  PenLine,
  Play,
  Plus,
  Search,
  Settings,
  Star,
  Upload,
  UserSquare2,
  X,
} from 'lucide-react';
import { useCms } from '../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../components/EditorialMediaFrame.tsx';
import { MediaLibraryPanel } from '../components/admin/MediaLibraryPanel.tsx';
import { HeroSlideshowPanel } from '../components/admin/HeroSlideshowPanel.tsx';
import { HomepageEditorPanel } from '../components/admin/HomepageEditorPanel.tsx';
import { AboutEditorPanel } from '../components/admin/AboutEditorPanel.tsx';
import { PortfolioEditorPanel } from '../components/admin/PortfolioEditorPanel.tsx';
import { DigitalsEditorPanel } from '../components/admin/DigitalsEditorPanel.tsx';
import { ExperienceEditorPanel } from '../components/admin/ExperienceEditorPanel.tsx';
import { RepresentationEditorPanel } from '../components/admin/RepresentationEditorPanel.tsx';
import {
  ContactPageEditor,
  DigitalsPageEditor,
  ExperiencePageEditor,
  PortfolioPageEditor,
  RepresentationPageEditor,
} from '../components/admin/PageEditorsPanel.tsx';
import { InquiriesManagerPanel, SiteSettingsPanel } from '../components/admin/ContentManagers.tsx';

type AdminSectionId =
  | 'dashboard'
  | 'page-home'
  | 'page-portfolio'
  | 'page-digitals'
  | 'page-about'
  | 'page-experience'
  | 'page-representation'
  | 'page-contact'
  | 'heroes'
  | 'media'
  | 'portfolio-manager'
  | 'digitals-manager'
  | 'experience-manager'
  | 'representation-manager'
  | 'inquiries'
  | 'settings';

interface NavItem {
  id: AdminSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

function formatRelativeTime(isoDate: string): string {
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return 'Recently';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function resolveActivitySection(section: string): AdminSectionId {
  const valid: Record<string, AdminSectionId> = {
    dashboard: 'dashboard',
    media: 'media',
    heroes: 'heroes',
    inquiries: 'inquiries',
    'portfolio-manager': 'portfolio-manager',
    'experience-manager': 'experience-manager',
    'representation-manager': 'representation-manager',
    'digitals-manager': 'digitals-manager',
    settings: 'settings',
  };
  return valid[section] || 'dashboard';
}

const VALID_SECTIONS = new Set<AdminSectionId>([
  'dashboard',
  'page-home',
  'page-portfolio',
  'page-digitals',
  'page-about',
  'page-experience',
  'page-representation',
  'page-contact',
  'heroes',
  'media',
  'portfolio-manager',
  'digitals-manager',
  'experience-manager',
  'representation-manager',
  'inquiries',
  'settings',
]);

function getInitialAdminSection(): AdminSectionId {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const fromQuery = searchParams.get('section');
    if (fromQuery && VALID_SECTIONS.has(fromQuery as AdminSectionId)) {
      return fromQuery as AdminSectionId;
    }
    const path = window.location.pathname.replace(/^\/admin\/?/, '');
    if (path && VALID_SECTIONS.has(path as AdminSectionId)) {
      return path as AdminSectionId;
    }
  } catch {
    // Fall back to dashboard
  }
  return 'dashboard';
}

export function AdminPage() {
  const {
    state,
    getAssetById,
    isAuthenticated,
    authLoading,
    adminEmail,
    loginAdmin,
    logoutAdmin,
    saving,
    configStatus,
  } = useCms();

  const [activeSection, setActiveSection] = useState<AdminSectionId>(getInitialAdminSection);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => {
      setActiveSection(getInitialAdminSection());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Auth form state (Supabase Authentication)
  const [email, setEmail] = useState('eletuabibat12@gmail.com');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError(null);
    const res = await loginAdmin(email, password);
    setLoggingIn(false);
    if (!res.ok) {
      setAuthError(res.error || 'Authentication failed');
    }
  };

  // Real counts derived from CMS state
  const totalImages = state.mediaAssets.length;
  const totalProjects = state.portfolioProjects.length;
  const totalSlides = useMemo(
    () =>
      Object.values(state.pageHeroes).reduce(
        (sum, hero) => sum + (hero?.slides?.length || 0),
        0
      ),
    [state.pageHeroes]
  );
  const newInquiriesList = useMemo(
    () => state.inquiries.filter((inq) => inq.status === 'new'),
    [state.inquiries]
  );
  const newInquiriesCount = newInquiriesList.length;

  // Pick hero portrait & preview photo from real state assets
  const bannerPortraitAsset =
    getAssetById(state.pageHeroes.home?.slides?.[0]?.assetId || '') ||
    getAssetById(state.homepage.aboutPortraitAssetId) ||
    state.mediaAssets[0];
  const cardPreviewAsset =
    getAssetById(state.contactPage.sideCardAssetId) ||
    getAssetById(state.homepage.experienceFeatureAssetId) ||
    state.mediaAssets[1] ||
    bannerPortraitAsset;

  // Navigation structure matching reference screenshot
  const pagesNav: NavItem[] = [
    { id: 'page-home', label: 'Home', icon: FileText },
    { id: 'page-portfolio', label: 'Portfolio', icon: FileText },
    { id: 'page-digitals', label: 'Digitals', icon: FileText },
    { id: 'page-about', label: 'About', icon: FileText },
    { id: 'page-experience', label: 'Experience', icon: FileText },
    { id: 'page-representation', label: 'Representation', icon: Star },
    { id: 'page-contact', label: 'Contact', icon: Mail },
  ];

  const managementNav: NavItem[] = [
    { id: 'heroes', label: 'Hero Slideshows', icon: Layers },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'portfolio-manager', label: 'Portfolio Manager', icon: FolderKanban },
    { id: 'digitals-manager', label: 'Digitals Manager', icon: UserSquare2 },
    { id: 'experience-manager', label: 'Experience Manager', icon: Briefcase },
    { id: 'representation-manager', label: 'Representation Manager', icon: Star },
    {
      id: 'inquiries',
      label: 'Messages / Inquiries',
      icon: Mail,
      badge: newInquiriesCount > 0 ? newInquiriesCount : undefined,
    },
  ];

  const allNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    ...pagesNav,
    ...managementNav,
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Real Global Search across Navigation, Projects, Experience, Agencies, Media, Inquiries
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{
      id: string;
      title: string;
      category: string;
      target: AdminSectionId;
    }> = [];

    for (const item of allNavItems) {
      if (item.label.toLowerCase().includes(q)) {
        results.push({
          id: `nav-${item.id}`,
          title: item.label,
          category: 'Section',
          target: item.id,
        });
      }
    }

    for (const proj of state.portfolioProjects) {
      if (
        proj.title.toLowerCase().includes(q) ||
        proj.client.toLowerCase().includes(q) ||
        proj.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: `proj-${proj.id}`,
          title: proj.title,
          category: `Portfolio · ${proj.category}`,
          target: 'portfolio-manager',
        });
      }
    }

    for (const exp of state.experienceEntries) {
      if (
        exp.title.toLowerCase().includes(q) ||
        exp.clientOrPublication.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: `exp-${exp.id}`,
          title: exp.title,
          category: `Experience · ${exp.category}`,
          target: 'experience-manager',
        });
      }
    }

    for (const agency of state.representationAgencies) {
      if (
        agency.agencyName.toLowerCase().includes(q) ||
        agency.city.toLowerCase().includes(q) ||
        agency.country.toLowerCase().includes(q)
      ) {
        results.push({
          id: `ag-${agency.id}`,
          title: agency.agencyName || agency.city,
          category: `Agency · ${agency.city}`,
          target: 'representation-manager',
        });
      }
    }

    for (const asset of state.mediaAssets) {
      if (
        asset.assetName.toLowerCase().includes(q) ||
        asset.altText.toLowerCase().includes(q) ||
        asset.folder.toLowerCase().includes(q)
      ) {
        results.push({
          id: `media-${asset.id}`,
          title: asset.assetName,
          category: `Media · ${asset.folder}`,
          target: 'media',
        });
      }
    }

    for (const inq of state.inquiries) {
      if (
        inq.name.toLowerCase().includes(q) ||
        inq.email.toLowerCase().includes(q) ||
        inq.inquiryType.toLowerCase().includes(q)
      ) {
        results.push({
          id: `inq-${inq.id}`,
          title: `${inq.name} (${inq.inquiryType})`,
          category: 'Inquiry',
          target: 'inquiries',
        });
      }
    }

    return results.slice(0, 8);
  }, [searchQuery, state]);

  // Real Recent Activity feed merging adminActivity & latest inquiries
  const activityFeed = useMemo(() => {
    const entries: Array<{
      id: string;
      action: string;
      time: string;
      ts: number;
      target: AdminSectionId;
      isNew?: boolean;
      icon: 'inquiry' | 'media' | 'content';
    }> = [];

    for (const act of state.adminActivity || []) {
      entries.push({
        id: act.id,
        action: act.action,
        time: formatRelativeTime(act.createdAt),
        ts: new Date(act.createdAt).getTime(),
        target: resolveActivitySection(act.section),
        icon:
          act.section === 'inquiries'
            ? 'inquiry'
            : act.section === 'media'
              ? 'media'
              : 'content',
      });
    }

    // Ensure incoming inquiries appear even if pre-seeded before activity log existed
    for (const inq of state.inquiries.slice(0, 3)) {
      const alreadyLogged = entries.some((e) => e.action.includes(inq.name));
      if (!alreadyLogged) {
        entries.push({
          id: `inq-feed-${inq.id}`,
          action: `New message from ${inq.name}`,
          time: formatRelativeTime(inq.createdAt),
          ts: new Date(inq.createdAt).getTime(),
          target: 'inquiries',
          isNew: inq.status === 'new',
          icon: 'inquiry',
        });
      }
    }

    entries.sort((a, b) => b.ts - a.ts);

    if (entries.length === 0) {
      entries.push({
        id: 'init-ready',
        action: 'Studio CMS synced and ready for updates',
        time: formatRelativeTime(state.updatedAt),
        ts: new Date(state.updatedAt).getTime(),
        target: 'page-home',
        icon: 'content',
      });
    }

    return entries.slice(0, 5);
  }, [state.adminActivity, state.inquiries, state.updatedAt]);

  const activeNavMeta = allNavItems.find((item) => item.id === activeSection);

  const navigateTo = (id: AdminSectionId) => {
    setActiveSection(id);
    setMobileNavOpen(false);
    setNotifOpen(false);
    setProfileMenuOpen(false);
    setSearchFocused(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const url = id === 'dashboard' ? '/admin' : `/admin?section=${id}`;
      window.history.replaceState(null, '', url);
    } catch { }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0C0C0C] text-[#F5F0E8] flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md border border-white/15 bg-[#121212] p-8 sm:p-10 space-y-4 text-center">
          <p className="font-serif text-2xl tracking-[0.14em] uppercase text-[#F5F0E8]">ABIBAT</p>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#F5F0E8]/50 animate-pulse">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0C0C0C] text-[#F5F0E8] flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md border border-white/15 bg-[#121212] p-8 sm:p-10 space-y-6">
          <div className="space-y-2 border-b border-white/10 pb-5">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.24em] uppercase text-[#F5F0E8]/55">
              <Lock className="h-3.5 w-3.5" />
              <span>ABIBAT ADMIN PANEL</span>
            </div>
            <h1 className="font-serif text-3xl font-light uppercase">ADMIN SIGN IN</h1>
            <p className="text-xs text-[#F5F0E8]/65">
              Sign in with your authorized Supabase administrator credentials to manage portfolio
              projects, media assets, page content, and inquiries.
            </p>
          </div>

          {authError && (
            <div className="border border-red-400/30 bg-red-950/50 px-3.5 py-2.5 text-xs text-red-200">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#F5F0E8]/65">
                Admin Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eletuabibat12@gmail.com"
                className="mt-1.5 w-full border border-white/20 bg-[#0C0C0C] px-3.5 py-2.5 text-xs text-[#F5F0E8] focus:border-white focus:outline-none placeholder:text-[#F5F0E8]/30"
              />
            </label>

            <label className="block">
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#F5F0E8]/65">
                Password
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full border border-white/20 bg-[#0C0C0C] px-3.5 py-2.5 text-xs text-[#F5F0E8] focus:border-white focus:outline-none placeholder:text-[#F5F0E8]/30"
              />
            </label>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-[#E3D3C4] py-3 text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414] hover:bg-white transition-colors disabled:opacity-50"
            >
              {loggingIn ? 'VERIFYING CREDENTIALS...' : 'SIGN IN WITH SUPABASE'}
            </button>
          </form>

          <div className="border-t border-white/10 pt-4 text-[11px] text-[#F5F0E8]/55 space-y-1">
            <p>Protected by Supabase Authentication &amp; Row Level Security.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 pt-2 text-[10px] tracking-[0.2em] uppercase text-[#F5F0E8]/75 hover:text-white"
            >
              <ArrowUpRight className="h-3 w-3" />
              <span>View Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderSidebarItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => navigateTo(item.id)}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-md text-left text-[13px] transition-colors ${isActive
          ? 'bg-[#E3D3C4] text-[#141414] font-medium'
          : 'text-[#F5F0E8]/78 hover:text-[#F5F0E8] hover:bg-white/[0.06]'
          }`}
      >
        <span className="flex items-center gap-3 min-w-0">
          <Icon
            className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#141414]' : 'text-[#F5F0E8]/60'
              }`}
          />
          <span className="truncate">{item.label}</span>
        </span>
        {typeof item.badge === 'number' && item.badge > 0 && (
          <span
            className={`px-1.5 py-0.5 text-[10px] font-mono tabular-nums rounded ${isActive ? 'bg-[#141414] text-[#F5F0E8]' : 'bg-white/15 text-[#F5F0E8]'
              }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0C0C0C] text-[#F5F0E8] px-4 py-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Sidebar Header */}
        <div className="px-2 flex items-center justify-between">
          <div>
            <Link
              to="/"
              className="font-serif text-2xl tracking-[0.14em] uppercase text-[#F5F0E8] block leading-none"
            >
              ABIBAT
            </Link>
            <p className="mt-1.5 text-[10px] tracking-[0.22em] uppercase text-[#F5F0E8]/55">
              ADMIN PANEL
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation drawer"
            className="lg:hidden text-[#F5F0E8]/70 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dashboard Primary */}
        <div>
          {renderSidebarItem({ id: 'dashboard', label: 'Dashboard', icon: Home })}
        </div>

        {/* PAGES */}
        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-medium tracking-[0.2em] uppercase text-[#F5F0E8]/40">
            PAGES
          </p>
          <div className="space-y-0.5">{pagesNav.map(renderSidebarItem)}</div>
        </div>

        <div className="border-t border-white/10" />

        {/* CONTENT MANAGEMENT */}
        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-medium tracking-[0.2em] uppercase text-[#F5F0E8]/40">
            CONTENT MANAGEMENT
          </p>
          <div className="space-y-0.5">{managementNav.map(renderSidebarItem)}</div>
        </div>

        <div className="border-t border-white/10" />

        {/* SETTINGS */}
        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-medium tracking-[0.2em] uppercase text-[#F5F0E8]/40">
            SETTINGS
          </p>
          {renderSidebarItem({ id: 'settings', label: 'Settings', icon: Settings })}
        </div>
      </div>

      {/* Bottom Log Out */}
      <div className="pt-6 border-t border-white/10 mt-6">
        <button
          type="button"
          onClick={logoutAdmin}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-[13px] text-[#F5F0E8]/75 hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 text-[#F5F0E8]/55" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#141414] flex">
      {/* Desktop Fixed Dark Left Sidebar */}
      <aside className="hidden lg:block w-[256px] shrink-0 sticky top-0 h-screen border-r border-black/10">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-[270px] h-full shadow-2xl">{sidebarContent}</div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main Warm Off-White Admin Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean Top Utility Header */}
        <header className="sticky top-0 z-30 bg-[#F7F5F2]/95 backdrop-blur-sm border-b border-[#141414]/8 px-5 sm:px-8 lg:px-10 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md relative">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md border border-[#141414]/15 bg-white text-[#141414]"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#141414]/45" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder="Search anything..."
                aria-label="Search admin content"
                className="w-full rounded-md border border-[#141414]/12 bg-white pl-9 pr-3 py-2 text-xs text-[#141414] placeholder:text-[#141414]/45 focus:border-[#141414]/40 focus:outline-none"
              />

              {searchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 rounded-md border border-[#141414]/15 bg-white shadow-lg overflow-hidden z-40">
                  {searchResults.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-[#141414]/55">
                      No matching pages, projects, agencies, or assets.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#141414]/8">
                      {searchResults.map((res) => (
                        <button
                          key={res.id}
                          type="button"
                          onMouseDown={() => navigateTo(res.target)}
                          className="w-full px-4 py-2.5 text-left hover:bg-[#F7F5F2] flex items-center justify-between gap-3"
                        >
                          <span className="text-xs font-medium text-[#141414] truncate">
                            {res.title}
                          </span>
                          <span className="text-[10px] tracking-[0.14em] uppercase text-[#141414]/50 shrink-0">
                            {res.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Status, Notification Bell & Profile */}
          <div className="flex items-center gap-3 sm:gap-5 relative">
            <span className="hidden sm:inline-block text-[10px] tracking-[0.16em] uppercase text-[#141414]/50">
              {saving
                ? 'Saving...'
                : configStatus.cloudinaryConfigured
                  ? 'Cloudinary + Studio Synced'
                  : 'Studio Synced'}
            </span>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setProfileMenuOpen(false);
                }}
                aria-label="Inquiries notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
              >
                <Bell className="h-4.5 w-4.5 text-[#141414]/80" />
                {newInquiriesCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-[#F7F5F2]" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-md border border-[#141414]/15 bg-white shadow-lg p-3 space-y-2 z-40">
                  <div className="flex items-center justify-between border-b border-[#141414]/10 pb-2">
                    <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/65">
                      New Inquiries ({newInquiriesCount})
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateTo('inquiries')}
                      className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#141414] hover:underline"
                    >
                      Open Inbox
                    </button>
                  </div>
                  {newInquiriesList.length === 0 ? (
                    <p className="py-2 text-xs text-[#141414]/55">No unread inquiries.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {newInquiriesList.slice(0, 4).map((inq) => (
                        <button
                          key={inq.id}
                          type="button"
                          onClick={() => navigateTo('inquiries')}
                          className="w-full text-left p-2 rounded hover:bg-[#F7F5F2] transition-colors"
                        >
                          <p className="text-xs font-medium text-[#141414]">{inq.name}</p>
                          <p className="text-[11px] text-[#141414]/60 truncate">
                            {inq.inquiryType} · {inq.message}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((prev) => !prev);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-black/5 transition-colors"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden bg-[#141414] border border-[#141414]/15">
                  <EditorialMediaFrame
                    asset={bannerPortraitAsset}
                    preset="thumbnail"
                    showPlaceholderBadge={false}
                    className="h-full w-full"
                  />
                </div>
                <span className="hidden sm:inline text-xs font-medium tracking-[0.08em] uppercase text-[#141414]">
                  ABIBAT
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#141414]/60" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-md border border-[#141414]/15 bg-white shadow-lg py-1.5 z-40">
                  <div className="px-3.5 py-2 border-b border-[#141414]/10">
                    <p className="text-xs font-medium text-[#141414]">Eletu Abibat</p>
                    <p className="text-[11px] text-[#141414]/55 truncate">{adminEmail}</p>
                  </div>
                  <Link
                    to="/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-3.5 py-2 text-xs text-[#141414]/80 hover:bg-[#F7F5F2]"
                  >
                    <span>View Live Website</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigateTo('settings')}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#141414]/80 hover:bg-[#F7F5F2]"
                  >
                    Studio Settings
                  </button>
                  <button
                    type="button"
                    onClick={logoutAdmin}
                    className="w-full text-left px-3.5 py-2 text-xs text-red-700 hover:bg-red-50"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-5 sm:px-8 lg:px-10 py-7 max-w-[1380px] w-full mx-auto">
          {activeSection === 'dashboard' ? (
            <div className="space-y-7">
              {/* HERO WELCOME BANNER */}
              <section className="relative overflow-hidden rounded-lg border border-[#141414]/8 bg-[#EAE5DD] min-h-[220px] sm:min-h-[250px] flex items-center">
                {/* Right Portrait Background with Editorial Gradient Blend */}
                <div className="absolute inset-y-0 right-0 w-full md:w-[64%] overflow-hidden">
                  <EditorialMediaFrame
                    asset={bannerPortraitAsset}
                    preset="hero"
                    showPlaceholderBadge={false}
                    className="h-full w-full"
                    imgClassName="h-full w-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#EAE5DD] via-[#EAE5DD]/78 to-transparent" />
                  <div className="hidden md:block absolute inset-y-0 right-0 w-44 bg-gradient-to-l from-[#141414]/55 via-[#141414]/20 to-transparent" />
                </div>

                <div className="relative z-10 w-full px-6 sm:px-10 py-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="max-w-lg space-y-3">
                    <h1 className="font-serif text-3xl sm:text-[2.65rem] font-light leading-[1.02] text-[#141414]">
                      <span className="block">Welcome back,</span>
                      <span className="block uppercase tracking-[0.02em] font-normal">ABIBAT.</span>
                    </h1>

                    <p className="text-xs sm:text-[13px] text-[#141414]/75">
                      Manage your website content and keep your portfolio up to date.
                    </p>

                    <div className="pt-2">
                      <Link
                        to="/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 rounded bg-[#141414] px-5 py-2.5 text-[11px] font-medium tracking-[0.12em] text-[#F5F0E8] hover:bg-[#2a2a2a] transition-colors"
                      >
                        <span>View Website</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Editorial Quote on Right Side of Banner */}
                  <div className="hidden md:flex items-center gap-5 border-l border-white/40 pl-5 text-[#F5F0E8] max-w-[210px]">
                    <div className="space-y-2 drop-shadow-sm">
                      <p className="font-serif italic text-xl leading-snug">
                        “Dream it.
                        <br />
                        Create it.
                        <br />
                        Live it.”
                      </p>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-[#F5F0E8]/85">
                        — ABIBAT
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 4 REAL STATISTIC CARDS */}
              <section
                aria-label="Portfolio Overview Statistics"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
              >
                {[
                  {
                    label: 'Total Images',
                    value: totalImages,
                    icon: ImageIcon,
                    target: 'media' as AdminSectionId,
                  },
                  {
                    label: 'Portfolio Projects',
                    value: totalProjects,
                    icon: LayoutGrid,
                    target: 'portfolio-manager' as AdminSectionId,
                  },
                  {
                    label: 'Slideshow Images',
                    value: totalSlides,
                    icon: Play,
                    target: 'heroes' as AdminSectionId,
                  },
                  {
                    label: 'New Inquiries',
                    value: newInquiriesCount,
                    icon: Mail,
                    target: 'inquiries' as AdminSectionId,
                  },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <button
                      key={stat.label}
                      type="button"
                      onClick={() => navigateTo(stat.target)}
                      className="group rounded-lg border border-[#141414]/10 bg-white p-5 text-left hover:border-[#141414]/35 transition-colors flex items-end justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <Icon className="h-5 w-5 text-[#141414]/70" strokeWidth={1.6} />
                        <div>
                          <p className="font-serif text-3xl font-normal tabular-nums leading-none text-[#141414]">
                            {stat.value}
                          </p>
                          <p className="mt-1.5 text-xs text-[#141414]/65">{stat.label}</p>
                        </div>
                      </div>

                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#141414]/18 text-[#141414]/65 group-hover:border-[#141414] group-hover:text-[#141414] transition-colors">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })}
              </section>

              {/* QUICK ACTIONS */}
              <section aria-label="Quick Actions" className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="font-serif text-xl font-normal text-[#141414] whitespace-nowrap">
                    Quick Actions
                  </h2>
                  <span className="h-px flex-1 bg-[#141414]/10" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  {[
                    {
                      label: 'Edit Page',
                      icon: PenLine,
                      target: 'page-home' as AdminSectionId,
                    },
                    {
                      label: 'Add Slide',
                      icon: Plus,
                      target: 'heroes' as AdminSectionId,
                    },
                    {
                      label: 'Upload Images',
                      icon: Upload,
                      target: 'media' as AdminSectionId,
                    },
                    {
                      label: 'Add Portfolio Project',
                      icon: LayoutGrid,
                      target: 'portfolio-manager' as AdminSectionId,
                    },
                    {
                      label: 'Add Experience',
                      icon: Briefcase,
                      target: 'experience-manager' as AdminSectionId,
                    },
                    {
                      label: 'Add Agency',
                      icon: Star,
                      target: 'representation-manager' as AdminSectionId,
                    },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => navigateTo(action.target)}
                        className="rounded-lg border border-[#141414]/10 bg-white px-4 py-5 flex flex-col items-center justify-center gap-2.5 text-center hover:border-[#141414]/35 hover:bg-[#FAF9F7] transition-colors"
                      >
                        <Icon className="h-5 w-5 text-[#141414]/75" strokeWidth={1.6} />
                        <span className="text-xs font-medium text-[#141414]/85 leading-snug">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* BOTTOM ROW — RECENT ACTIVITY + EDITORIAL WEBSITE PREVIEW CARD */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Recent Activity */}
                <div className="lg:col-span-6 rounded-lg border border-[#141414]/10 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between border-b border-[#141414]/8 pb-3">
                    <h2 className="font-serif text-lg font-normal text-[#141414]">
                      Recent Activity
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigateTo('inquiries')}
                      className="inline-flex items-center gap-1.5 text-xs text-[#141414]/65 hover:text-[#141414] transition-colors"
                    >
                      <span>View All</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-[#141414]/8">
                    {activityFeed.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateTo(item.target)}
                        className="w-full py-3 flex items-center justify-between gap-4 text-left hover:bg-[#FAF9F7] px-2 -mx-2 rounded transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F0E8] text-[#141414]/70">
                            {item.icon === 'inquiry' ? (
                              <Mail className="h-3.5 w-3.5" />
                            ) : item.icon === 'media' ? (
                              <ImageIcon className="h-3.5 w-3.5" />
                            ) : (
                              <FolderKanban className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <span className="text-xs font-medium text-[#141414] truncate">
                            {item.action}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-[#141414]/55">{item.time}</span>
                          {item.isNew && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#9E7B56]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark Portfolio Preview Card */}
                <div className="lg:col-span-6 relative overflow-hidden rounded-lg bg-[#0C0C0C] text-[#F5F0E8] min-h-[210px] flex items-center">
                  <div className="absolute inset-y-0 left-0 w-[62%] overflow-hidden">
                    <EditorialMediaFrame
                      asset={cardPreviewAsset}
                      preset="portrait"
                      showPlaceholderBadge={false}
                      className="h-full w-full"
                      imgClassName="h-full w-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-[#0C0C0C]/75 to-[#0C0C0C]" />
                  </div>

                  <div className="relative z-10 ml-auto w-full sm:w-[58%] p-7 sm:p-9 space-y-3 text-left">
                    <h3 className="font-serif text-3xl font-light tracking-[0.06em] uppercase text-[#F5F0E8]">
                      {state.homepage.wordmark || 'ABIBAT'}
                    </h3>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-[#F5F0E8]/70">
                      INTERNATIONAL FASHION MODEL
                    </p>
                    <div className="h-px w-20 bg-white/25" />
                    <div className="pt-2">
                      <Link
                        to="/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 rounded bg-[#DFCDBE] px-5 py-2.5 text-[11px] font-medium tracking-[0.12em] text-[#141414] hover:bg-white transition-colors"
                      >
                        <span>View Website</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sub-page Header Breadcrumb */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#141414]/12 pb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => navigateTo('dashboard')}
                    className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#141414]/55 hover:text-[#141414]"
                  >
                    ← Back to Dashboard
                  </button>
                  <h1 className="mt-1 font-serif text-3xl font-light uppercase text-[#141414]">
                    {activeNavMeta?.label || 'Studio'}
                  </h1>
                </div>

                <Link
                  to="/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded border border-[#141414]/25 bg-white px-4 py-2 text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414] hover:border-[#141414] self-start sm:self-auto"
                >
                  <span>View Website</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Dedicated Page Editors */}
              {activeSection === 'page-home' && <HomepageEditorPanel />}
              {activeSection === 'page-portfolio' && (
                <PortfolioPageEditor
                  onOpenManager={() => navigateTo('portfolio-manager')}
                />
              )}
              {activeSection === 'page-digitals' && (
                <DigitalsPageEditor
                  onOpenManager={() => navigateTo('digitals-manager')}
                />
              )}
              {activeSection === 'page-about' && <AboutEditorPanel />}
              {activeSection === 'page-experience' && (
                <ExperiencePageEditor
                  onOpenManager={() => navigateTo('experience-manager')}
                />
              )}
              {activeSection === 'page-representation' && (
                <RepresentationPageEditor
                  onOpenManager={() => navigateTo('representation-manager')}
                />
              )}
              {activeSection === 'page-contact' && (
                <ContactPageEditor onOpenInbox={() => navigateTo('inquiries')} />
              )}

              {/* Content Managers */}
              {activeSection === 'heroes' && <HeroSlideshowPanel />}
              {activeSection === 'media' && <MediaLibraryPanel />}
              {activeSection === 'portfolio-manager' && <PortfolioEditorPanel />}
              {activeSection === 'digitals-manager' && <DigitalsEditorPanel />}
              {activeSection === 'experience-manager' && <ExperienceEditorPanel />}
              {activeSection === 'representation-manager' && <RepresentationEditorPanel />}
              {activeSection === 'inquiries' && <InquiriesManagerPanel />}
              {activeSection === 'settings' && <SiteSettingsPanel />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
