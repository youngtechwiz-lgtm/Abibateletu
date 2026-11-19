import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_CMS_STATE } from './src/data/defaultCmsState.ts';
import type { CmsState, ContactInquiry } from './src/types/cms.ts';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, '.data');
const DATA_FILE = path.join(DATA_DIR, 'abibat-cms.json');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const serverSupabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

function ensureDataStore(): CmsState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_CMS_STATE, null, 2), 'utf-8');
    return structuredClone(DEFAULT_CMS_STATE);
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as CmsState;
    const mergedAbout = {
      ...DEFAULT_CMS_STATE.aboutPage,
      ...(parsed.aboutPage || {}),
    };
    const mergedPortfolioPage = {
      ...DEFAULT_CMS_STATE.portfolioPage,
      ...(parsed.portfolioPage || {}),
    };
    const mergedDigitalsPage = {
      ...DEFAULT_CMS_STATE.digitalsPage,
      ...(parsed.digitalsPage || {}),
    };
    const mergedRepresentationPage = {
      ...DEFAULT_CMS_STATE.representationPage,
      ...(parsed.representationPage || {}),
    };
    const mergedExperiencePage = {
      ...DEFAULT_CMS_STATE.experiencePage,
      ...(parsed.experiencePage || {}),
      categoryDescriptions: {
        ...DEFAULT_CMS_STATE.experiencePage.categoryDescriptions,
        ...(parsed.experiencePage?.categoryDescriptions || {}),
      },
      categoryCoverAssetIds: {
        ...DEFAULT_CMS_STATE.experiencePage.categoryCoverAssetIds,
        ...(parsed.experiencePage?.categoryCoverAssetIds || {}),
      },
    };
    const mergedContactPage = {
      ...DEFAULT_CMS_STATE.contactPage,
      ...(parsed.contactPage || {}),
    };
    const mergedAboutHero =
      parsed.pageHeroes?.about?.title === 'MORE THAN A MODEL'
        ? DEFAULT_CMS_STATE.pageHeroes.about
        : parsed.pageHeroes?.about || DEFAULT_CMS_STATE.pageHeroes.about;
    const mergedPortfolioHero =
      parsed.pageHeroes?.portfolio?.title === 'PORTFOLIO'
        ? DEFAULT_CMS_STATE.pageHeroes.portfolio
        : parsed.pageHeroes?.portfolio || DEFAULT_CMS_STATE.pageHeroes.portfolio;
    const mergedDigitalsHero =
      parsed.pageHeroes?.digitals?.title === 'DIGITALS'
        ? DEFAULT_CMS_STATE.pageHeroes.digitals
        : parsed.pageHeroes?.digitals || DEFAULT_CMS_STATE.pageHeroes.digitals;
    const mergedExperienceHero =
      parsed.pageHeroes?.experience?.title === 'EXPERIENCE'
        ? DEFAULT_CMS_STATE.pageHeroes.experience
        : parsed.pageHeroes?.experience || DEFAULT_CMS_STATE.pageHeroes.experience;
    const mergedRepresentationHero =
      parsed.pageHeroes?.representation?.title === 'REPRESENTATION'
        ? DEFAULT_CMS_STATE.pageHeroes.representation
        : parsed.pageHeroes?.representation || DEFAULT_CMS_STATE.pageHeroes.representation;
    const mergedContactHero =
      parsed.pageHeroes?.contact?.title === 'CONTACT'
        ? DEFAULT_CMS_STATE.pageHeroes.contact
        : parsed.pageHeroes?.contact || DEFAULT_CMS_STATE.pageHeroes.contact;
    const migratedProjects = Array.isArray(parsed.portfolioProjects)
      ? parsed.portfolioProjects.map((p) => ({
        ...p,
        photographer: p.photographer ?? '',
        externalLink: p.externalLink ?? '',
        isPublished: p.isPublished ?? true,
        category:
          (p.category as string) === 'Editorial'
            ? ('Editorials' as const)
            : (p.category as string) === 'Commercial'
              ? ('Campaigns' as const)
              : p.category,
      }))
      : DEFAULT_CMS_STATE.portfolioProjects;
    const migratedAgencies = Array.isArray(parsed.representationAgencies)
      ? parsed.representationAgencies
        .filter((a) => !(a.isPlaceholder && !a.agencyName?.trim()))
        .map((a, idx) => ({
          ...a,
          description: a.description ?? '',
          logoAssetId: a.logoAssetId ?? '',
          photoAssetId: a.photoAssetId ?? '',
          specialties: Array.isArray(a.specialties) ? a.specialties : [],
          isActive: a.isActive ?? true,
          sortOrder: typeof a.sortOrder === 'number' ? a.sortOrder : idx,
        }))
      : DEFAULT_CMS_STATE.representationAgencies;
    const migratedInquiries = Array.isArray(parsed.inquiries)
      ? parsed.inquiries.map((inq) => ({
        ...inq,
        status:
          (inq.status as string) === 'reviewed'
            ? ('read' as const)
            : (inq.status as string) === 'responded'
              ? ('replied' as const)
              : inq.status,
      }))
      : [];
    const migratedSiteSettings = {
      ...DEFAULT_CMS_STATE.siteSettings,
      ...(parsed.siteSettings || {}),
      phone:
        parsed.siteSettings?.phone === '08078020513'
          ? '08076020513'
          : parsed.siteSettings?.phone || DEFAULT_CMS_STATE.siteSettings.phone,
    };
    const shouldUpgradeDigitals =
      !Array.isArray(parsed.digitalsItems) ||
      (parsed.digitalsItems.length === 4 &&
        parsed.digitalsItems.every(
          (d) => d.isPlaceholder && ['dig-1', 'dig-2', 'dig-3', 'dig-4'].includes(d.id)
        ));
    const mapExperienceCategory = (cat: string) => {
      if (cat === 'Campaign' || cat === 'Campaigns') return 'Campaigns' as const;
      if (cat === 'Editorial' || cat === 'Editorials') return 'Editorials' as const;
      if (cat === 'Runway') return 'Runway' as const;
      if (cat === 'Publications') return 'Publications' as const;
      if (cat === 'Commercial' || cat === 'Collaborations') return 'Collaborations' as const;
      return 'Campaigns' as const;
    };
    const isOldPlaceholderExperience =
      Array.isArray(parsed.experienceEntries) &&
      parsed.experienceEntries.length > 0 &&
      parsed.experienceEntries.every((e) => e.isPlaceholder && !e.coverAssetId);
    const migratedExperience = isOldPlaceholderExperience
      ? DEFAULT_CMS_STATE.experienceEntries
      : Array.isArray(parsed.experienceEntries)
        ? parsed.experienceEntries.map((e, idx) => ({
          ...e,
          season: e.season ?? '',
          category: mapExperienceCategory(e.category),
          description: e.description ?? e.notes ?? '',
          coverAssetId: e.coverAssetId ?? '',
          galleryAssetIds: Array.isArray(e.galleryAssetIds) ? e.galleryAssetIds : [],
          externalLink: e.externalLink ?? '',
          featured: e.featured ?? idx < 3,
          isPublished: e.isPublished ?? true,
          sortOrder: typeof e.sortOrder === 'number' ? e.sortOrder : idx,
        }))
        : DEFAULT_CMS_STATE.experienceEntries;
    return {
      ...DEFAULT_CMS_STATE,
      ...parsed,
      aboutPage: mergedAbout,
      portfolioPage: mergedPortfolioPage,
      digitalsPage: mergedDigitalsPage,
      experiencePage: mergedExperiencePage,
      representationPage: mergedRepresentationPage,
      contactPage: mergedContactPage,
      experienceEntries: migratedExperience,
      representationAgencies: migratedAgencies,
      inquiries: migratedInquiries,
      adminActivity: Array.isArray(parsed.adminActivity) ? parsed.adminActivity : [],
      siteSettings: migratedSiteSettings,
      digitalsItems: shouldUpgradeDigitals ? DEFAULT_CMS_STATE.digitalsItems : parsed.digitalsItems,
      portfolioSeasons: parsed.portfolioSeasons?.length
        ? parsed.portfolioSeasons
        : DEFAULT_CMS_STATE.portfolioSeasons,
      portfolioProjects: migratedProjects,
      pageHeroes: {
        ...DEFAULT_CMS_STATE.pageHeroes,
        ...(parsed.pageHeroes || {}),
        about: mergedAboutHero,
        portfolio: mergedPortfolioHero,
        digitals: mergedDigitalsHero,
        experience: mergedExperienceHero,
        representation: mergedRepresentationHero,
        contact: mergedContactHero,
      },
    };
  } catch {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_CMS_STATE, null, 2), 'utf-8');
    return structuredClone(DEFAULT_CMS_STATE);
  }
}

function saveDataStore(state: CmsState): CmsState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const nextState: CmsState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(nextState, null, 2), 'utf-8');
  return nextState;
}

async function verifyAdminBearerToken(
  token: string | undefined
): Promise<{ email: string; id: string } | null> {
  if (!token || !serverSupabase) return null;

  try {
    // 1. Cryptographically verify the JWT against Supabase Auth
    const { data: authData, error: authErr } = await serverSupabase.auth.getUser(token);
    if (authErr || !authData?.user) {
      return null;
    }

    const user = authData.user;

    // 2. Query public.admin_profiles for authorized administrator role
    const { data: profile, error: profileErr } = await serverSupabase
      .from('admin_profiles')
      .select('id, role, email')
      .eq('id', user.id)
      .maybeSingle();

    if (!profileErr && profile) {
      if (profile.role === 'admin' || profile.role === 'super_admin') {
        return { email: user.email || profile.email, id: user.id };
      }
      console.warn(
        `[Security Alert] Non-admin user "${user.email}" (${user.id}) attempted privileged admin operation.`
      );
      return null;
    }

    // If admin_profiles table has not been created yet in Supabase (PGRST205), safely check designated admin email
    if (profileErr && profileErr.code === 'PGRST205') {
      if (user.email?.toLowerCase() === 'eletuabibat12@gmail.com') {
        return { email: user.email, id: user.id };
      }
    }

    return null;
  } catch (err) {
    console.error('[Security] Failed to verify Supabase bearer token:', err);
    return null;
  }
}

function extractBearerToken(req: express.Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
  return authHeader.slice(7).trim();
}

async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. No bearer token provided.' });
    return;
  }

  const admin = await verifyAdminBearerToken(token);
  if (!admin) {
    res.status(403).json({ error: 'Access denied: Valid administrator credentials required.' });
    return;
  }

  (req as unknown as { adminUser?: { email: string; id: string } }).adminUser = admin;
  next();
}

function findAssetReferences(state: CmsState, assetId: string) {
  const refs: Array<{ type: string; label: string; route: string }> = [];

  for (const [slug, hero] of Object.entries(state.pageHeroes)) {
    const used = hero.slides.some((s) => s.assetId === assetId);
    if (used) {
      refs.push({
        type: 'hero-slide',
        label: `${slug.toUpperCase()} Hero Slideshow`,
        route: slug === 'home' ? '/' : `/${slug}`,
      });
    }
  }

  for (const proj of state.portfolioProjects) {
    if (proj.coverAssetId === assetId || proj.galleryAssetIds.includes(assetId)) {
      refs.push({
        type: proj.coverAssetId === assetId ? 'portfolio-cover' : 'portfolio-gallery',
        label: `Portfolio: ${proj.title}`,
        route: '/portfolio',
      });
    }
  }

  for (const exp of state.experienceEntries || []) {
    if (exp.coverAssetId === assetId || exp.galleryAssetIds?.includes(assetId)) {
      refs.push({
        type: exp.coverAssetId === assetId ? 'experience-cover' : 'experience-gallery',
        label: `Experience: ${exp.title}`,
        route: '/experience',
      });
    }
  }

  for (const dig of state.digitalsItems) {
    if (dig.assetId === assetId) {
      refs.push({
        type: 'digitals',
        label: `Digitals: ${dig.title}`,
        route: '/digitals',
      });
    }
  }

  for (const agency of state.representationAgencies || []) {
    if (agency.logoAssetId === assetId || agency.photoAssetId === assetId) {
      refs.push({
        type: 'agency-media',
        label: `Agency: ${agency.agencyName || agency.city}`,
        route: '/representation',
      });
    }
  }

  const slotChecks: Array<[string, string]> = [
    [state.homepage.aboutPortraitAssetId, 'Home — About Feature Portrait'],
    [state.homepage.aboutInsetAssetId, 'Home — Model Stats Inset'],
    [state.homepage.digitalsFeatureAssetId, 'Home — Digitals Monochrome Feature'],
    [state.homepage.experienceFeatureAssetId, 'Home — Experience Portrait'],
    [state.homepage.representationFeatureAssetId, 'Home — Representation Portrait'],
    [state.homepage.contactBackdropAssetId, 'Home — Contact Backdrop'],
    [state.aboutPage?.storyPortraitAssetId, 'About — My Story Portrait'],
    [state.aboutPage?.drivesBackdropAssetId, 'About — Passion & Discipline Backdrop'],
    [state.aboutPage?.bigPictureLeftAssetId, 'About — Big Picture Feature Portrait'],
    [state.aboutPage?.bigPictureTopRightAssetId, 'About — Big Picture Profile Portrait'],
    [state.aboutPage?.bigPictureBottomRightAssetId, 'About — Big Picture Wide Portrait'],
    [state.experiencePage?.bottomCtaBackdropAssetId, 'Experience — Closing CTA Backdrop'],
    [state.experiencePage?.categoryCoverAssetIds?.Campaigns, 'Experience — Campaigns Category Card'],
    [state.experiencePage?.categoryCoverAssetIds?.Runway, 'Experience — Runway Category Card'],
    [state.experiencePage?.categoryCoverAssetIds?.Editorials, 'Experience — Editorials Category Card'],
    [state.experiencePage?.categoryCoverAssetIds?.Publications, 'Experience — Publications Category Card'],
    [state.experiencePage?.categoryCoverAssetIds?.Collaborations, 'Experience — Collaborations Category Card'],
    [state.representationPage?.bottomCtaBackdropAssetId, 'Representation — Closing CTA Backdrop'],
    [state.contactPage?.sideCardAssetId, 'Contact — Booking Side Portrait'],
    [state.contactPage?.locationBackdropAssetId, 'Contact — Location Backdrop'],
  ];

  for (const [slotAssetId, label] of slotChecks) {
    if (slotAssetId === assetId) {
      refs.push({
        type: 'homepage-slot',
        label,
        route: label.startsWith('About')
          ? '/about'
          : label.startsWith('Experience')
            ? '/experience'
            : label.startsWith('Representation')
              ? '/representation'
              : label.startsWith('Contact')
                ? '/contact'
                : '/',
      });
    }
  }

  return refs;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/config/status', (_req, res) => {
    const supabaseConfigured = Boolean(
      process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY
    );
    const cloudinaryCloudName =
      process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    const cloudinaryConfigured = Boolean(
      cloudinaryCloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
    );
    res.json({
      supabaseConfigured,
      cloudinaryConfigured,
      cloudinaryCloudName,
    });
  });

  app.get('/api/content', async (req, res) => {
    const state = ensureDataStore();
    const token = extractBearerToken(req);
    const admin = await verifyAdminBearerToken(token);
    if (admin) {
      res.json(state);
      return;
    }
    res.json({
      ...state,
      inquiries: [],
      adminActivity: [],
    });
  });

  const appendActivity = (
    existing: CmsState['adminActivity'],
    action: string,
    detail: string,
    section: string
  ) => {
    const item = {
      id: `act-${crypto.randomUUID().slice(0, 8)}`,
      action,
      detail,
      section,
      createdAt: new Date().toISOString(),
    };
    return [item, ...(Array.isArray(existing) ? existing : [])].slice(0, 25);
  };

  app.put('/api/content', requireAdmin, (req, res) => {
    const current = ensureDataStore();
    const incoming = req.body as Partial<CmsState>;
    const activitySummary = (() => {
      if ((incoming.mediaAssets?.length ?? 0) > (current.mediaAssets?.length ?? 0)) {
        return { action: 'Media asset added to library', detail: 'Cloudinary Media Library', section: 'media' };
      }
      if ((incoming.portfolioProjects?.length ?? 0) !== (current.portfolioProjects?.length ?? 0)) {
        return { action: 'Portfolio project archive updated', detail: 'Portfolio Manager', section: 'portfolio-manager' };
      }
      if ((incoming.experienceEntries?.length ?? 0) !== (current.experienceEntries?.length ?? 0)) {
        return { action: 'Experience entry updated', detail: 'Experience Manager', section: 'experience-manager' };
      }
      if ((incoming.representationAgencies?.length ?? 0) !== (current.representationAgencies?.length ?? 0)) {
        return { action: 'Agency representation updated', detail: 'Representation Manager', section: 'representation-manager' };
      }
      if (JSON.stringify(incoming.pageHeroes) !== JSON.stringify(current.pageHeroes)) {
        return { action: 'Hero slideshow updated', detail: 'Hero Slideshows', section: 'heroes' };
      }
      return { action: 'Website content updated', detail: 'Studio CMS', section: 'dashboard' };
    })();

    const merged: CmsState = {
      ...current,
      ...incoming,
      inquiries: Array.isArray(incoming.inquiries) ? incoming.inquiries : current.inquiries,
      adminActivity: appendActivity(
        Array.isArray(incoming.adminActivity) ? incoming.adminActivity : current.adminActivity,
        activitySummary.action,
        activitySummary.detail,
        activitySummary.section
      ),
    };
    const saved = saveDataStore(merged);
    res.json(saved);
  });

  const inquiryRateMap = new Map<string, number[]>();

  app.post('/api/inquiries', (req, res) => {
    const {
      name,
      email,
      organization,
      inquiryType,
      location,
      dates,
      message,
      honeypot,
      formStartedAt,
    } = req.body ?? {};

    // Spam protection: honeypot trap
    if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
      res.status(400).json({ error: 'Spam check failed. Please try again.' });
      return;
    }

    // Spam protection: instant automated submission check (< 800ms) with clock-skew safety
    if (
      typeof formStartedAt === 'number' &&
      Date.now() - formStartedAt >= 0 &&
      Date.now() - formStartedAt < 800
    ) {
      res.status(400).json({ error: 'Submission was too fast. Please verify your details and retry.' });
      return;
    }

    // Spam protection: per-IP rate limiting (max 5 submissions / 10 min)
    const clientIp = req.ip || 'unknown';
    const now = Date.now();
    const recent = (inquiryRateMap.get(clientIp) || []).filter((ts) => now - ts < 10 * 60 * 1000);
    if (recent.length >= 5) {
      res.status(429).json({ error: 'Too many inquiries submitted. Please wait a few minutes.' });
      return;
    }

    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim();
    const cleanMessage = String(message || '').trim();

    if (cleanName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (cleanMessage.length < 10) {
      res.status(400).json({ error: 'Please include at least 10 characters in your message.' });
      return;
    }
    const urlCount = (cleanMessage.match(/https?:\/\//gi) || []).length;
    if (urlCount > 3) {
      res.status(400).json({ error: 'Message flagged by spam filter (too many links).' });
      return;
    }

    inquiryRateMap.set(clientIp, [...recent, now]);

    const state = ensureDataStore();
    const inquiry: ContactInquiry = {
      id: `inq-${crypto.randomUUID().slice(0, 8)}`,
      name: cleanName,
      email: cleanEmail,
      organization: String(organization || '').trim(),
      inquiryType: String(inquiryType || 'Editorial').trim(),
      location: String(location || '').trim(),
      dates: String(dates || '').trim(),
      message: cleanMessage,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    state.inquiries = [inquiry, ...(state.inquiries || [])];
    state.adminActivity = appendActivity(
      state.adminActivity,
      `New message from ${cleanName}`,
      `${inquiry.inquiryType} inquiry`,
      'inquiries'
    );
    saveDataStore(state);
    res.status(201).json({ inquiry });
  });

  app.patch('/api/inquiries/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body ?? {};
    const allowedStatuses = new Set(['new', 'read', 'replied', 'archived']);
    const state = ensureDataStore();
    let updatedSender = '';
    state.inquiries = state.inquiries.map((item) => {
      if (item.id === id && allowedStatuses.has(status)) {
        updatedSender = item.name;
        return { ...item, status };
      }
      return item;
    });
    if (updatedSender) {
      state.adminActivity = appendActivity(
        state.adminActivity,
        `Inquiry from ${updatedSender} marked ${status}`,
        'Messages / Inquiries',
        'inquiries'
      );
    }
    saveDataStore(state);
    res.json({ ok: true });
  });

  app.delete('/api/inquiries/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const state = ensureDataStore();
    state.inquiries = state.inquiries.filter((item) => item.id !== id);
    saveDataStore(state);
    res.json({ ok: true });
  });

  app.post('/api/cloudinary/sign', requireAdmin, (req, res) => {
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    const apiKey = process.env.CLOUDINARY_API_KEY || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

    if (!cloudName || !apiKey || !apiSecret) {
      res.status(503).json({
        error: 'Cloudinary server secrets are not configured in environment variables.',
        configured: false,
      });
      return;
    }

    const folder =
      typeof req.body?.folder === 'string' && req.body.folder.trim()
        ? req.body.folder.trim()
        : 'abibat/portfolio';
    const tags = Array.isArray(req.body?.tags)
      ? req.body.tags.join(',')
      : typeof req.body?.tags === 'string'
        ? req.body.tags
        : '';
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign: Record<string, string | number> = { folder, timestamp };
    if (tags) paramsToSign.tags = tags;

    const sortedQuery = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(`${sortedQuery}${apiSecret}`)
      .digest('hex');

    res.json({
      signature,
      timestamp,
      api_key: apiKey,
      cloud_name: cloudName,
      folder,
      tags,
    });
  });

  app.post('/api/cloudinary/destroy', requireAdmin, async (req, res) => {
    const { assetId, force } = req.body ?? {};
    if (!assetId) {
      res.status(400).json({ error: 'assetId is required' });
      return;
    }

    const state = ensureDataStore();
    const asset = state.mediaAssets.find((a) => a.id === assetId);
    if (!asset) {
      res.status(404).json({ error: 'Media asset not found' });
      return;
    }

    const references = findAssetReferences(state, assetId);
    if (references.length > 0 && !force) {
      res.status(409).json({
        error: 'Asset is currently in use on the website.',
        references,
      });
      return;
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    const apiKey = process.env.CLOUDINARY_API_KEY || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

    if (
      cloudName &&
      apiKey &&
      apiSecret &&
      asset.cloudinaryPublicId &&
      !asset.isPlaceholder &&
      asset.secureUrl.includes('cloudinary.com')
    ) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = crypto
        .createHash('sha1')
        .update(`public_id=${asset.cloudinaryPublicId}&timestamp=${timestamp}${apiSecret}`)
        .digest('hex');

      const form = new URLSearchParams();
      form.append('public_id', asset.cloudinaryPublicId);
      form.append('api_key', apiKey);
      form.append('timestamp', String(timestamp));
      form.append('signature', signature);

      await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        body: form,
      }).catch(() => null);
    }

    // Remove asset & clean any forced references cleanly
    state.mediaAssets = state.mediaAssets.filter((a) => a.id !== assetId);
    for (const hero of Object.values(state.pageHeroes)) {
      hero.slides = hero.slides.filter((s) => s.assetId !== assetId);
    }
    state.portfolioProjects = state.portfolioProjects.map((p) => ({
      ...p,
      coverAssetId: p.coverAssetId === assetId ? '' : p.coverAssetId,
      galleryAssetIds: p.galleryAssetIds.filter((gid) => gid !== assetId),
    }));
    state.experienceEntries = (state.experienceEntries || []).map((exp) => ({
      ...exp,
      coverAssetId: exp.coverAssetId === assetId ? '' : exp.coverAssetId,
      galleryAssetIds: (exp.galleryAssetIds || []).filter((gid) => gid !== assetId),
    }));
    state.digitalsItems = state.digitalsItems.map((d) => ({
      ...d,
      assetId: d.assetId === assetId ? '' : d.assetId,
    }));
    state.adminActivity = appendActivity(
      state.adminActivity,
      `Removed media "${asset.assetName}"`,
      'Media Library',
      'media'
    );

    const saved = saveDataStore(state);
    res.json({ deleted: true, state: saved });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: {
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // In development mode, serve transformed index.html for all non-API SPA routes
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const HOST = process.env.HOST || '0.0.0.0';

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
      console.error(`Please terminate the process using port ${PORT} or start with a different port (e.g. $env:PORT="3001"; npm run dev).\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(PORT, HOST, () => {
    const isDev = process.env.NODE_ENV !== 'production';
    console.log(`\n  ABIBAT Fashion Portfolio (${isDev ? 'Development' : 'Production'})`);
    console.log(`  > Local:   http://localhost:${PORT}/`);
    if (HOST === '0.0.0.0') {
      console.log(`  > Network: http://127.0.0.1:${PORT}/`);
    } else {
      console.log(`  > Host:    http://${HOST}:${PORT}/`);
    }
    console.log(`  > API:     http://localhost:${PORT}/api/health\n`);
  });

  const cleanup = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

startServer();
