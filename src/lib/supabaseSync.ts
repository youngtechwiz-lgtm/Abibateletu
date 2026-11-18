import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminActivityItem,
  CmsState,
  ContactInquiry,
  DigitalsItem,
  ExperienceEntry,
  HeroSlide,
  MediaAsset,
  PageHero,
  PageSlug,
  PortfolioProject,
  RepresentationAgency,
} from '../types/cms.ts';
import { DEFAULT_CMS_STATE } from '../data/defaultCmsState.ts';

// Helper to convert DB media asset row to MediaAsset
function mapDbMediaAsset(row: Record<string, unknown>): MediaAsset {
  return {
    id: String(row.id || ''),
    assetName: String(row.asset_name || ''),
    cloudinaryPublicId: String(row.cloudinary_public_id || ''),
    cloudinaryAssetId: String(row.cloudinary_asset_id || ''),
    secureUrl: String(row.secure_url || ''),
    resourceType: (row.resource_type as 'image' | 'video') || 'image',
    format: String(row.format || 'jpg'),
    width: Number(row.width || 0),
    height: Number(row.height || 0),
    fileSize: Number(row.file_size || 0),
    altText: String(row.alt_text || ''),
    folder: String(row.folder || 'abibat/general'),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    isPlaceholder: Boolean(row.is_placeholder),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

// Helper to convert DB portfolio project row to PortfolioProject
function mapDbPortfolioProject(row: Record<string, unknown>): PortfolioProject {
  return {
    id: String(row.id || ''),
    title: String(row.title || ''),
    season: String(row.season || ''),
    category: (row.category as PortfolioProject['category']) || 'Editorials',
    location: String(row.location || ''),
    year: String(row.year || ''),
    client: String(row.client || ''),
    photographer: String(row.photographer || ''),
    externalLink: String(row.external_link || ''),
    description: String(row.description || ''),
    credits: String(row.credits || ''),
    coverAssetId: String(row.cover_asset_id || ''),
    galleryAssetIds: Array.isArray(row.gallery_asset_ids)
      ? (row.gallery_asset_ids as string[])
      : [],
    featured: Boolean(row.featured),
    isPublished: row.is_published !== false,
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0,
    isPlaceholder: Boolean(row.is_placeholder),
  };
}

// Helper to convert DB digitals item row to DigitalsItem
function mapDbDigitalsItem(row: Record<string, unknown>): DigitalsItem {
  return {
    id: String(row.id || ''),
    title: String(row.title || ''),
    angle: String(row.angle || 'Front Portrait'),
    notes: String(row.notes || ''),
    assetId: String(row.asset_id || ''),
    isBw: Boolean(row.is_bw),
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0,
    isPlaceholder: Boolean(row.is_placeholder),
  };
}

// Helper to convert DB experience entry row to ExperienceEntry
function mapDbExperienceEntry(row: Record<string, unknown>): ExperienceEntry {
  return {
    id: String(row.id || ''),
    year: String(row.year || ''),
    season: String(row.season || ''),
    category: (row.category as ExperienceEntry['category']) || 'Campaigns',
    title: String(row.title || ''),
    clientOrPublication: String(row.client_or_publication || ''),
    location: String(row.location || ''),
    notes: String(row.notes || ''),
    description: String(row.description || ''),
    coverAssetId: String(row.cover_asset_id || ''),
    galleryAssetIds: Array.isArray(row.gallery_asset_ids)
      ? (row.gallery_asset_ids as string[])
      : [],
    externalLink: String(row.external_link || ''),
    featured: Boolean(row.featured),
    featuredOnHome: row.featured_on_home !== false,
    isPublished: row.is_published !== false,
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0,
    isPlaceholder: Boolean(row.is_placeholder),
  };
}

// Helper to convert DB representation agency row to RepresentationAgency
function mapDbRepresentationAgency(row: Record<string, unknown>): RepresentationAgency {
  return {
    id: String(row.id || ''),
    city: String(row.city || ''),
    country: String(row.country || ''),
    agencyName: String(row.agency_name || ''),
    agentName: String(row.agent_name || ''),
    email: String(row.email || ''),
    phone: String(row.phone || ''),
    website: String(row.website || ''),
    address: String(row.address || ''),
    description: String(row.description || ''),
    logoAssetId: String(row.logo_asset_id || ''),
    photoAssetId: String(row.photo_asset_id || ''),
    specialties: Array.isArray(row.specialties) ? (row.specialties as string[]) : [],
    statusNote: String(row.status_note || ''),
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0,
    isActive: row.is_active !== false,
    isPlaceholder: Boolean(row.is_placeholder),
  };
}

// Helper to convert DB contact inquiry row to ContactInquiry
function mapDbContactInquiry(row: Record<string, unknown>): ContactInquiry {
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    email: String(row.email || ''),
    organization: String(row.organization || ''),
    inquiryType: String(row.inquiry_type || ''),
    location: String(row.location || ''),
    dates: String(row.dates || ''),
    message: String(row.message || ''),
    status: (row.status as ContactInquiry['status']) || 'new',
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

/**
 * Loads entire CmsState from Supabase PostgreSQL tables.
 * Falls back gracefully to default values for any table that is not yet populated.
 */
export async function fetchCmsStateFromSupabase(
  supabase: SupabaseClient
): Promise<CmsState | null> {
  try {
    const [
      mediaRes,
      heroesRes,
      homepageRes,
      portfolioRes,
      digitalsRes,
      expRes,
      repRes,
      inqRes,
      siteRes,
      aboutRes,
      digitalsPageRes,
      repPageRes,
      contactPageRes,
      expPageRes,
      portfolioPageRes,
      actRes,
    ] = await Promise.all([
      supabase.from('media_assets').select('*').order('created_at', { ascending: false }),
      supabase.from('page_heroes').select('*'),
      supabase.from('homepage_settings').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('portfolio_projects').select('*').order('sort_order', { ascending: true }),
      supabase.from('digitals_items').select('*').order('sort_order', { ascending: true }),
      supabase.from('experience_entries').select('*').order('sort_order', { ascending: true }),
      supabase.from('representation_agencies').select('*').order('sort_order', { ascending: true }),
      supabase.from('contact_inquiries').select('*').order('created_at', { ascending: false }),
      supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('about_page_settings').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('digitals_page_settings').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('representation_page_settings').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('contact_page_settings').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('experience_page_settings').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('portfolio_page_settings').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('admin_activity').select('*').order('created_at', { ascending: false }).limit(25),
    ]);

    // Build mediaAssets
    const mediaAssets: MediaAsset[] =
      mediaRes.data && mediaRes.data.length > 0
        ? mediaRes.data.map(mapDbMediaAsset)
        : DEFAULT_CMS_STATE.mediaAssets;

    // Build pageHeroes
    const pageHeroes = { ...DEFAULT_CMS_STATE.pageHeroes };
    if (heroesRes.data && heroesRes.data.length > 0) {
      for (const h of heroesRes.data) {
        const slug = h.page_slug as PageSlug;
        if (pageHeroes[slug]) {
          pageHeroes[slug] = {
            pageSlug: slug,
            kicker: String(h.kicker ?? pageHeroes[slug].kicker),
            title: String(h.title ?? pageHeroes[slug].title),
            subtitle: String(h.subtitle ?? pageHeroes[slug].subtitle),
            ctaText: String(h.cta_text ?? pageHeroes[slug].ctaText),
            ctaLink: String(h.cta_link ?? pageHeroes[slug].ctaLink),
            slides: Array.isArray(h.slides) ? (h.slides as HeroSlide[]) : pageHeroes[slug].slides,
          };
        }
      }
    }

    // Build homepage settings
    const hpRow = homepageRes.data as Record<string, unknown> | null;
    const homepage = {
      ...DEFAULT_CMS_STATE.homepage,
      ...(hpRow
        ? {
            wordmark: String(hpRow.wordmark ?? DEFAULT_CMS_STATE.homepage.wordmark),
            heroSideCaption: String(hpRow.hero_side_caption ?? DEFAULT_CMS_STATE.homepage.heroSideCaption),
            selectedWorkKicker: String(hpRow.selected_work_kicker ?? DEFAULT_CMS_STATE.homepage.selectedWorkKicker),
            selectedWorkTitle: String(hpRow.selected_work_title ?? DEFAULT_CMS_STATE.homepage.selectedWorkTitle),
            selectedWorkDescription: String(hpRow.selected_work_description ?? DEFAULT_CMS_STATE.homepage.selectedWorkDescription),
            selectedWorkCtaText: String(hpRow.selected_work_cta_text ?? DEFAULT_CMS_STATE.homepage.selectedWorkCtaText),
            selectedWorkCtaLink: String(hpRow.selected_work_cta_link ?? DEFAULT_CMS_STATE.homepage.selectedWorkCtaLink),
            aboutKicker: String(hpRow.about_kicker ?? DEFAULT_CMS_STATE.homepage.aboutKicker),
            aboutTitle: String(hpRow.about_title ?? DEFAULT_CMS_STATE.homepage.aboutTitle),
            aboutParagraphs: Array.isArray(hpRow.about_paragraphs)
              ? (hpRow.about_paragraphs as string[])
              : DEFAULT_CMS_STATE.homepage.aboutParagraphs,
            aboutQuote: String(hpRow.about_quote ?? DEFAULT_CMS_STATE.homepage.aboutQuote),
            aboutCtaText: String(hpRow.about_cta_text ?? DEFAULT_CMS_STATE.homepage.aboutCtaText),
            aboutCtaLink: String(hpRow.about_cta_link ?? DEFAULT_CMS_STATE.homepage.aboutCtaLink),
            aboutPortraitAssetId: String(hpRow.about_portrait_asset_id ?? DEFAULT_CMS_STATE.homepage.aboutPortraitAssetId),
            aboutInsetAssetId: String(hpRow.about_inset_asset_id ?? DEFAULT_CMS_STATE.homepage.aboutInsetAssetId),
            modelStats:
              hpRow.model_stats && typeof hpRow.model_stats === 'object'
                ? { ...DEFAULT_CMS_STATE.homepage.modelStats, ...(hpRow.model_stats as object) }
                : DEFAULT_CMS_STATE.homepage.modelStats,
            digitalsKicker: String(hpRow.digitals_kicker ?? DEFAULT_CMS_STATE.homepage.digitalsKicker),
            digitalsTitle: String(hpRow.digitals_title ?? DEFAULT_CMS_STATE.homepage.digitalsTitle),
            digitalsSubtitle: String(hpRow.digitals_subtitle ?? DEFAULT_CMS_STATE.homepage.digitalsSubtitle),
            digitalsDescription: String(hpRow.digitals_description ?? DEFAULT_CMS_STATE.homepage.digitalsDescription),
            digitalsCtaText: String(hpRow.digitals_cta_text ?? DEFAULT_CMS_STATE.homepage.digitalsCtaText),
            digitalsCtaLink: String(hpRow.digitals_cta_link ?? DEFAULT_CMS_STATE.homepage.digitalsCtaLink),
            digitalsFeatureAssetId: String(hpRow.digitals_feature_asset_id ?? DEFAULT_CMS_STATE.homepage.digitalsFeatureAssetId),
            experienceKicker: String(hpRow.experience_kicker ?? DEFAULT_CMS_STATE.homepage.experienceKicker),
            experienceTitle: String(hpRow.experience_title ?? DEFAULT_CMS_STATE.homepage.experienceTitle),
            experienceDescription: String(hpRow.experience_description ?? DEFAULT_CMS_STATE.homepage.experienceDescription),
            experienceCtaText: String(hpRow.experience_cta_text ?? DEFAULT_CMS_STATE.homepage.experienceCtaText),
            experienceCtaLink: String(hpRow.experience_cta_link ?? DEFAULT_CMS_STATE.homepage.experienceCtaLink),
            experienceFeatureAssetId: String(hpRow.experience_feature_asset_id ?? DEFAULT_CMS_STATE.homepage.experienceFeatureAssetId),
            representationKicker: String(hpRow.representation_kicker ?? DEFAULT_CMS_STATE.homepage.representationKicker),
            representationTitle: String(hpRow.representation_title ?? DEFAULT_CMS_STATE.homepage.representationTitle),
            representationDescription: String(hpRow.representation_description ?? DEFAULT_CMS_STATE.homepage.representationDescription),
            representationCtaText: String(hpRow.representation_cta_text ?? DEFAULT_CMS_STATE.homepage.representationCtaText),
            representationCtaLink: String(hpRow.representation_cta_link ?? DEFAULT_CMS_STATE.homepage.representationCtaLink),
            representationFeatureAssetId: String(hpRow.representation_feature_asset_id ?? DEFAULT_CMS_STATE.homepage.representationFeatureAssetId),
            contactKicker: String(hpRow.contact_kicker ?? DEFAULT_CMS_STATE.homepage.contactKicker),
            contactTitle: String(hpRow.contact_title ?? DEFAULT_CMS_STATE.homepage.contactTitle),
            contactDescription: String(hpRow.contact_description ?? DEFAULT_CMS_STATE.homepage.contactDescription),
            contactCtaText: String(hpRow.contact_cta_text ?? DEFAULT_CMS_STATE.homepage.contactCtaText),
            contactCtaLink: String(hpRow.contact_cta_link ?? DEFAULT_CMS_STATE.homepage.contactCtaLink),
            contactBackdropAssetId: String(hpRow.contact_backdrop_asset_id ?? DEFAULT_CMS_STATE.homepage.contactBackdropAssetId),
            sectionVisibility:
              hpRow.section_visibility && typeof hpRow.section_visibility === 'object'
                ? { ...DEFAULT_CMS_STATE.homepage.sectionVisibility, ...(hpRow.section_visibility as object) }
                : DEFAULT_CMS_STATE.homepage.sectionVisibility,
            featuredProjectIds: Array.isArray(hpRow.featured_project_ids)
              ? (hpRow.featured_project_ids as string[])
              : DEFAULT_CMS_STATE.homepage.featuredProjectIds,
          }
        : {}),
    };

    // Build portfolio projects
    const portfolioProjects =
      portfolioRes.data && portfolioRes.data.length > 0
        ? portfolioRes.data.map(mapDbPortfolioProject)
        : DEFAULT_CMS_STATE.portfolioProjects;

    // Build digitals items
    const digitalsItems =
      digitalsRes.data && digitalsRes.data.length > 0
        ? digitalsRes.data.map(mapDbDigitalsItem)
        : DEFAULT_CMS_STATE.digitalsItems;

    // Build experience entries
    const experienceEntries =
      expRes.data && expRes.data.length > 0
        ? expRes.data.map(mapDbExperienceEntry)
        : DEFAULT_CMS_STATE.experienceEntries;

    // Build representation agencies
    const representationAgencies =
      repRes.data && repRes.data.length > 0
        ? repRes.data.map(mapDbRepresentationAgency)
        : DEFAULT_CMS_STATE.representationAgencies;

    // Build inquiries (read-only for authenticated admin, empty for public)
    const inquiries = inqRes.data ? inqRes.data.map(mapDbContactInquiry) : [];

    // Build site settings
    const siteRow = siteRes.data as Record<string, unknown> | null;
    const siteSettings = {
      ...DEFAULT_CMS_STATE.siteSettings,
      ...(siteRow
        ? {
            email: String(siteRow.email ?? DEFAULT_CMS_STATE.siteSettings.email),
            phone: String(siteRow.phone ?? DEFAULT_CMS_STATE.siteSettings.phone),
            instagramPrimary: String(siteRow.instagram_primary ?? DEFAULT_CMS_STATE.siteSettings.instagramPrimary),
            instagramSecondary: String(siteRow.instagram_secondary ?? DEFAULT_CMS_STATE.siteSettings.instagramSecondary),
            regionsLine: String(siteRow.regions_line ?? DEFAULT_CMS_STATE.siteSettings.regionsLine),
            copyrightText: String(siteRow.copyright_text ?? DEFAULT_CMS_STATE.siteSettings.copyrightText),
          }
        : {}),
    };

    // Build about page
    const aboutRow = aboutRes.data as Record<string, unknown> | null;
    const aboutPage = {
      ...DEFAULT_CMS_STATE.aboutPage,
      ...(aboutRow
        ? {
            heroCornerCaption: String(aboutRow.hero_corner_caption ?? DEFAULT_CMS_STATE.aboutPage.heroCornerCaption),
            storyKicker: String(aboutRow.story_kicker ?? DEFAULT_CMS_STATE.aboutPage.storyKicker),
            storyTitle: String(aboutRow.story_title ?? DEFAULT_CMS_STATE.aboutPage.storyTitle),
            storyParagraphs: Array.isArray(aboutRow.story_paragraphs)
              ? (aboutRow.story_paragraphs as string[])
              : DEFAULT_CMS_STATE.aboutPage.storyParagraphs,
            quickFactsTitle: String(aboutRow.quick_facts_title ?? DEFAULT_CMS_STATE.aboutPage.quickFactsTitle),
            quickFactsQuote: String(aboutRow.quick_facts_quote ?? DEFAULT_CMS_STATE.aboutPage.quickFactsQuote),
            valuesTitle: String(aboutRow.values_title ?? DEFAULT_CMS_STATE.aboutPage.valuesTitle),
            valuesItems: Array.isArray(aboutRow.values_items)
              ? (aboutRow.values_items as Array<{ label: string; description: string }>)
              : DEFAULT_CMS_STATE.aboutPage.valuesItems,
            drivesKicker: String(aboutRow.drives_kicker ?? DEFAULT_CMS_STATE.aboutPage.drivesKicker),
            drivesTitle: String(aboutRow.drives_title ?? DEFAULT_CMS_STATE.aboutPage.drivesTitle),
            drivesParagraphs: Array.isArray(aboutRow.drives_paragraphs)
              ? (aboutRow.drives_paragraphs as string[])
              : DEFAULT_CMS_STATE.aboutPage.drivesParagraphs,
            bigPictureKicker: String(aboutRow.big_picture_kicker ?? DEFAULT_CMS_STATE.aboutPage.bigPictureKicker),
            bigPictureTitle: String(aboutRow.big_picture_title ?? DEFAULT_CMS_STATE.aboutPage.bigPictureTitle),
            bigPictureParagraphs: Array.isArray(aboutRow.big_picture_paragraphs)
              ? (aboutRow.big_picture_paragraphs as string[])
              : DEFAULT_CMS_STATE.aboutPage.bigPictureParagraphs,
            bigPictureCtaText: String(aboutRow.big_picture_cta_text ?? DEFAULT_CMS_STATE.aboutPage.bigPictureCtaText),
            bigPictureCtaLink: String(aboutRow.big_picture_cta_link ?? DEFAULT_CMS_STATE.aboutPage.bigPictureCtaLink),
            bigPictureHandwrittenNote: String(aboutRow.big_picture_handwritten_note ?? DEFAULT_CMS_STATE.aboutPage.bigPictureHandwrittenNote),
            storyPortraitAssetId: String(aboutRow.story_portrait_asset_id ?? DEFAULT_CMS_STATE.aboutPage.storyPortraitAssetId),
            drivesBackdropAssetId: String(aboutRow.drives_backdrop_asset_id ?? DEFAULT_CMS_STATE.aboutPage.drivesBackdropAssetId),
            bigPictureLeftAssetId: String(aboutRow.big_picture_left_asset_id ?? DEFAULT_CMS_STATE.aboutPage.bigPictureLeftAssetId),
            bigPictureTopRightAssetId: String(aboutRow.big_picture_top_right_asset_id ?? DEFAULT_CMS_STATE.aboutPage.bigPictureTopRightAssetId),
            bigPictureBottomRightAssetId: String(aboutRow.big_picture_bottom_right_asset_id ?? DEFAULT_CMS_STATE.aboutPage.bigPictureBottomRightAssetId),
          }
        : {}),
    };

    // Build digitals page
    const digRow = digitalsPageRes.data as Record<string, unknown> | null;
    const digitalsPage = {
      ...DEFAULT_CMS_STATE.digitalsPage,
      ...(digRow
        ? {
            heroCornerCaption: String(digRow.hero_corner_caption ?? DEFAULT_CMS_STATE.digitalsPage.heroCornerCaption),
            aboutKicker: String(digRow.about_kicker ?? DEFAULT_CMS_STATE.digitalsPage.aboutKicker),
            aboutName: String(digRow.about_name ?? DEFAULT_CMS_STATE.digitalsPage.aboutName),
            aboutBio: String(digRow.about_bio ?? DEFAULT_CMS_STATE.digitalsPage.aboutBio),
            quote: String(digRow.quote ?? DEFAULT_CMS_STATE.digitalsPage.quote),
            bookCtaText: String(digRow.book_cta_text ?? DEFAULT_CMS_STATE.digitalsPage.bookCtaText),
            bookCtaLink: String(digRow.book_cta_link ?? DEFAULT_CMS_STATE.digitalsPage.bookCtaLink),
            bust: String(digRow.bust ?? DEFAULT_CMS_STATE.digitalsPage.bust),
            waist: String(digRow.waist ?? DEFAULT_CMS_STATE.digitalsPage.waist),
            hips: String(digRow.hips ?? DEFAULT_CMS_STATE.digitalsPage.hips),
            shoeSize: String(digRow.shoe_size ?? DEFAULT_CMS_STATE.digitalsPage.shoeSize),
            hair: String(digRow.hair ?? DEFAULT_CMS_STATE.digitalsPage.hair),
            eyes: String(digRow.eyes ?? DEFAULT_CMS_STATE.digitalsPage.eyes),
            compCardPdfUrl: String(digRow.comp_card_pdf_url ?? DEFAULT_CMS_STATE.digitalsPage.compCardPdfUrl),
            compCardPdfName: String(digRow.comp_card_pdf_name ?? DEFAULT_CMS_STATE.digitalsPage.compCardPdfName),
            compCardPdfPublicId: String(digRow.comp_card_pdf_public_id ?? DEFAULT_CMS_STATE.digitalsPage.compCardPdfPublicId),
          }
        : {}),
    };

    // Build representation page
    const repRow = repPageRes.data as Record<string, unknown> | null;
    const representationPage = {
      ...DEFAULT_CMS_STATE.representationPage,
      ...(repRow
        ? {
            heroCornerCaption: String(repRow.hero_corner_caption ?? DEFAULT_CMS_STATE.representationPage.heroCornerCaption),
            sectionKicker: String(repRow.section_kicker ?? DEFAULT_CMS_STATE.representationPage.sectionKicker),
            sectionTitle: String(repRow.section_title ?? DEFAULT_CMS_STATE.representationPage.sectionTitle),
            sectionDescription: String(repRow.section_description ?? DEFAULT_CMS_STATE.representationPage.sectionDescription),
            bottomCtaKicker: String(repRow.bottom_cta_kicker ?? DEFAULT_CMS_STATE.representationPage.bottomCtaKicker),
            bottomCtaTitle: String(repRow.bottom_cta_title ?? DEFAULT_CMS_STATE.representationPage.bottomCtaTitle),
            bottomCtaDescription: String(repRow.bottom_cta_description ?? DEFAULT_CMS_STATE.representationPage.bottomCtaDescription),
            bottomCtaText: String(repRow.bottom_cta_text ?? DEFAULT_CMS_STATE.representationPage.bottomCtaText),
            bottomCtaLink: String(repRow.bottom_cta_link ?? DEFAULT_CMS_STATE.representationPage.bottomCtaLink),
            bottomCtaHighlights: Array.isArray(repRow.bottom_cta_highlights)
              ? (repRow.bottom_cta_highlights as string[])
              : DEFAULT_CMS_STATE.representationPage.bottomCtaHighlights,
            bottomCtaBackdropAssetId: String(repRow.bottom_cta_backdrop_asset_id ?? DEFAULT_CMS_STATE.representationPage.bottomCtaBackdropAssetId),
          }
        : {}),
    };

    // Build contact page
    const contactRow = contactPageRes.data as Record<string, unknown> | null;
    const contactPage = {
      ...DEFAULT_CMS_STATE.contactPage,
      ...(contactRow
        ? {
            heroCornerCaption: String(contactRow.hero_corner_caption ?? DEFAULT_CMS_STATE.contactPage.heroCornerCaption),
            sideCardKicker: String(contactRow.side_card_kicker ?? DEFAULT_CMS_STATE.contactPage.sideCardKicker),
            sideCardTitle: String(contactRow.side_card_title ?? DEFAULT_CMS_STATE.contactPage.sideCardTitle),
            sideCardSubtitle: String(contactRow.side_card_subtitle ?? DEFAULT_CMS_STATE.contactPage.sideCardSubtitle),
            sideCardAssetId: String(contactRow.side_card_asset_id ?? DEFAULT_CMS_STATE.contactPage.sideCardAssetId),
            locationKicker: String(contactRow.location_kicker ?? DEFAULT_CMS_STATE.contactPage.locationKicker),
            locationTitle: String(contactRow.location_title ?? DEFAULT_CMS_STATE.contactPage.locationTitle),
            locationDescription: String(contactRow.location_description ?? DEFAULT_CMS_STATE.contactPage.locationDescription),
            locationHandwrittenNote: String(contactRow.location_handwritten_note ?? DEFAULT_CMS_STATE.contactPage.locationHandwrittenNote),
            locationBackdropAssetId: String(contactRow.location_backdrop_asset_id ?? DEFAULT_CMS_STATE.contactPage.locationBackdropAssetId),
            availableMarkets: Array.isArray(contactRow.available_markets)
              ? (contactRow.available_markets as string[])
              : DEFAULT_CMS_STATE.contactPage.availableMarkets,
          }
        : {}),
    };

    // Build experience page
    const expRow = expPageRes.data as Record<string, unknown> | null;
    const experiencePage = {
      ...DEFAULT_CMS_STATE.experiencePage,
      ...(expRow
        ? {
            heroCornerCaption: String(expRow.hero_corner_caption ?? DEFAULT_CMS_STATE.experiencePage.heroCornerCaption),
            timelineKicker: String(expRow.timeline_kicker ?? DEFAULT_CMS_STATE.experiencePage.timelineKicker),
            timelineTitle: String(expRow.timeline_title ?? DEFAULT_CMS_STATE.experiencePage.timelineTitle),
            timelineDescription: String(expRow.timeline_description ?? DEFAULT_CMS_STATE.experiencePage.timelineDescription),
            categoryDescriptions:
              expRow.category_descriptions && typeof expRow.category_descriptions === 'object'
                ? { ...DEFAULT_CMS_STATE.experiencePage.categoryDescriptions, ...(expRow.category_descriptions as object) }
                : DEFAULT_CMS_STATE.experiencePage.categoryDescriptions,
            categoryCoverAssetIds:
              expRow.category_cover_asset_ids && typeof expRow.category_cover_asset_ids === 'object'
                ? { ...DEFAULT_CMS_STATE.experiencePage.categoryCoverAssetIds, ...(expRow.category_cover_asset_ids as object) }
                : DEFAULT_CMS_STATE.experiencePage.categoryCoverAssetIds,
            bottomCtaKicker: String(expRow.bottom_cta_kicker ?? DEFAULT_CMS_STATE.experiencePage.bottomCtaKicker),
            bottomCtaTitle: String(expRow.bottom_cta_title ?? DEFAULT_CMS_STATE.experiencePage.bottomCtaTitle),
            bottomCtaDescription: String(expRow.bottom_cta_description ?? DEFAULT_CMS_STATE.experiencePage.bottomCtaDescription),
            bottomCtaText: String(expRow.bottom_cta_text ?? DEFAULT_CMS_STATE.experiencePage.bottomCtaText),
            bottomCtaLink: String(expRow.bottom_cta_link ?? DEFAULT_CMS_STATE.experiencePage.bottomCtaLink),
            bottomCtaBackdropAssetId: String(expRow.bottom_cta_backdrop_asset_id ?? DEFAULT_CMS_STATE.experiencePage.bottomCtaBackdropAssetId),
          }
        : {}),
    };

    // Build portfolio page
    const portRow = portfolioPageRes.data as Record<string, unknown> | null;
    const portfolioPage = {
      ...DEFAULT_CMS_STATE.portfolioPage,
      ...(portRow
        ? {
            heroCornerCaption: String(portRow.hero_corner_caption ?? DEFAULT_CMS_STATE.portfolioPage.heroCornerCaption),
            bottomCtaTitle: String(portRow.bottom_cta_title ?? DEFAULT_CMS_STATE.portfolioPage.bottomCtaTitle),
            bottomCtaDescription: String(portRow.bottom_cta_description ?? DEFAULT_CMS_STATE.portfolioPage.bottomCtaDescription),
            bottomCtaText: String(portRow.bottom_cta_text ?? DEFAULT_CMS_STATE.portfolioPage.bottomCtaText),
            bottomCtaLink: String(portRow.bottom_cta_link ?? DEFAULT_CMS_STATE.portfolioPage.bottomCtaLink),
            bottomCtaTagline: String(portRow.bottom_cta_tagline ?? DEFAULT_CMS_STATE.portfolioPage.bottomCtaTagline),
            bottomCtaBackdropAssetId: String(portRow.bottom_cta_backdrop_asset_id ?? DEFAULT_CMS_STATE.portfolioPage.bottomCtaBackdropAssetId),
          }
        : {}),
    };

    // Build admin activity
    const adminActivity: AdminActivityItem[] = actRes.data
      ? actRes.data.map((act) => ({
          id: String(act.id),
          action: String(act.action),
          detail: String(act.detail || ''),
          section: String(act.section || 'dashboard'),
          createdAt: String(act.created_at || new Date().toISOString()),
        }))
      : [];

    return {
      mediaAssets,
      pageHeroes,
      homepage,
      aboutPage,
      portfolioPage,
      digitalsPage,
      experiencePage,
      representationPage,
      contactPage,
      portfolioSeasons: DEFAULT_CMS_STATE.portfolioSeasons,
      portfolioProjects,
      digitalsItems,
      experienceEntries,
      representationAgencies,
      siteSettings,
      inquiries,
      adminActivity,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Supabase state load fallback:', err);
    return null;
  }
}

/**
 * Persists updated CmsState to Supabase PostgreSQL database.
 */
export async function saveCmsStateToSupabase(
  supabase: SupabaseClient,
  state: CmsState
): Promise<void> {
  const promises: Array<PromiseLike<unknown>> = [];

  // 1. Homepage settings
  promises.push(
    supabase.from('homepage_settings').upsert({
      id: 'default',
      wordmark: state.homepage.wordmark,
      hero_side_caption: state.homepage.heroSideCaption,
      selected_work_kicker: state.homepage.selectedWorkKicker,
      selected_work_title: state.homepage.selectedWorkTitle,
      selected_work_description: state.homepage.selectedWorkDescription,
      selected_work_cta_text: state.homepage.selectedWorkCtaText,
      selected_work_cta_link: state.homepage.selectedWorkCtaLink,
      about_kicker: state.homepage.aboutKicker,
      about_title: state.homepage.aboutTitle,
      about_paragraphs: state.homepage.aboutParagraphs,
      about_quote: state.homepage.aboutQuote,
      about_cta_text: state.homepage.aboutCtaText,
      about_cta_link: state.homepage.aboutCtaLink,
      about_portrait_asset_id: state.homepage.aboutPortraitAssetId || null,
      about_inset_asset_id: state.homepage.aboutInsetAssetId || null,
      model_stats: state.homepage.modelStats,
      digitals_kicker: state.homepage.digitalsKicker,
      digitals_title: state.homepage.digitalsTitle,
      digitals_subtitle: state.homepage.digitalsSubtitle,
      digitals_description: state.homepage.digitalsDescription,
      digitals_cta_text: state.homepage.digitalsCtaText,
      digitals_cta_link: state.homepage.digitalsCtaLink,
      digitals_feature_asset_id: state.homepage.digitalsFeatureAssetId || null,
      experience_kicker: state.homepage.experienceKicker,
      experience_title: state.homepage.experienceTitle,
      experience_description: state.homepage.experienceDescription,
      experience_cta_text: state.homepage.experienceCtaText,
      experience_cta_link: state.homepage.experienceCtaLink,
      experience_feature_asset_id: state.homepage.experienceFeatureAssetId || null,
      representation_kicker: state.homepage.representationKicker,
      representation_title: state.homepage.representationTitle,
      representation_description: state.homepage.representationDescription,
      representation_cta_text: state.homepage.representationCtaText,
      representation_cta_link: state.homepage.representationCtaLink,
      representation_feature_asset_id: state.homepage.representationFeatureAssetId || null,
      contact_kicker: state.homepage.contactKicker,
      contact_title: state.homepage.contactTitle,
      contact_description: state.homepage.contactDescription,
      contact_cta_text: state.homepage.contactCtaText,
      contact_cta_link: state.homepage.contactCtaLink,
      contact_backdrop_asset_id: state.homepage.contactBackdropAssetId || null,
      section_visibility: state.homepage.sectionVisibility,
      featured_project_ids: state.homepage.featuredProjectIds,
      updated_at: new Date().toISOString(),
    })
  );

  // 2. Site settings
  promises.push(
    supabase.from('site_settings').upsert({
      id: 'default',
      email: state.siteSettings.email,
      phone: state.siteSettings.phone,
      instagram_primary: state.siteSettings.instagramPrimary,
      instagram_secondary: state.siteSettings.instagramSecondary,
      regions_line: state.siteSettings.regionsLine,
      copyright_text: state.siteSettings.copyrightText,
      updated_at: new Date().toISOString(),
    })
  );

  // 3. About page settings
  promises.push(
    supabase.from('about_page_settings').upsert({
      id: 'default',
      hero_corner_caption: state.aboutPage.heroCornerCaption,
      story_kicker: state.aboutPage.storyKicker,
      story_title: state.aboutPage.storyTitle,
      story_paragraphs: state.aboutPage.storyParagraphs,
      quick_facts_title: state.aboutPage.quickFactsTitle,
      quick_facts_quote: state.aboutPage.quickFactsQuote,
      values_title: state.aboutPage.valuesTitle,
      values_items: state.aboutPage.valuesItems,
      drives_kicker: state.aboutPage.drivesKicker,
      drives_title: state.aboutPage.drivesTitle,
      drives_paragraphs: state.aboutPage.drivesParagraphs,
      big_picture_kicker: state.aboutPage.bigPictureKicker,
      big_picture_title: state.aboutPage.bigPictureTitle,
      big_picture_paragraphs: state.aboutPage.bigPictureParagraphs,
      big_picture_cta_text: state.aboutPage.bigPictureCtaText,
      big_picture_cta_link: state.aboutPage.bigPictureCtaLink,
      big_picture_handwritten_note: state.aboutPage.bigPictureHandwrittenNote,
      story_portrait_asset_id: state.aboutPage.storyPortraitAssetId || null,
      drives_backdrop_asset_id: state.aboutPage.drivesBackdropAssetId || null,
      big_picture_left_asset_id: state.aboutPage.bigPictureLeftAssetId || null,
      big_picture_top_right_asset_id: state.aboutPage.bigPictureTopRightAssetId || null,
      big_picture_bottom_right_asset_id: state.aboutPage.bigPictureBottomRightAssetId || null,
      updated_at: new Date().toISOString(),
    })
  );

  // 4. Digitals page settings
  promises.push(
    supabase.from('digitals_page_settings').upsert({
      id: 'default',
      hero_corner_caption: state.digitalsPage.heroCornerCaption,
      about_kicker: state.digitalsPage.aboutKicker,
      about_name: state.digitalsPage.aboutName,
      about_bio: state.digitalsPage.aboutBio,
      quote: state.digitalsPage.quote,
      book_cta_text: state.digitalsPage.bookCtaText,
      book_cta_link: state.digitalsPage.bookCtaLink,
      bust: state.digitalsPage.bust,
      waist: state.digitalsPage.waist,
      hips: state.digitalsPage.hips,
      shoe_size: state.digitalsPage.shoeSize,
      hair: state.digitalsPage.hair,
      eyes: state.digitalsPage.eyes,
      comp_card_pdf_url: state.digitalsPage.compCardPdfUrl,
      comp_card_pdf_name: state.digitalsPage.compCardPdfName,
      comp_card_pdf_public_id: state.digitalsPage.compCardPdfPublicId,
      updated_at: new Date().toISOString(),
    })
  );

  // 5. Representation page settings
  promises.push(
    supabase.from('representation_page_settings').upsert({
      id: 'default',
      hero_corner_caption: state.representationPage.heroCornerCaption,
      section_kicker: state.representationPage.sectionKicker,
      section_title: state.representationPage.sectionTitle,
      section_description: state.representationPage.sectionDescription,
      bottom_cta_kicker: state.representationPage.bottomCtaKicker,
      bottom_cta_title: state.representationPage.bottomCtaTitle,
      bottom_cta_description: state.representationPage.bottomCtaDescription,
      bottom_cta_text: state.representationPage.bottomCtaText,
      bottom_cta_link: state.representationPage.bottomCtaLink,
      bottom_cta_highlights: state.representationPage.bottomCtaHighlights,
      bottom_cta_backdrop_asset_id: state.representationPage.bottomCtaBackdropAssetId || null,
      updated_at: new Date().toISOString(),
    })
  );

  // 6. Contact page settings
  promises.push(
    supabase.from('contact_page_settings').upsert({
      id: 'default',
      hero_corner_caption: state.contactPage.heroCornerCaption,
      side_card_kicker: state.contactPage.sideCardKicker,
      side_card_title: state.contactPage.sideCardTitle,
      side_card_subtitle: state.contactPage.sideCardSubtitle,
      side_card_asset_id: state.contactPage.sideCardAssetId || null,
      location_kicker: state.contactPage.locationKicker,
      location_title: state.contactPage.locationTitle,
      location_description: state.contactPage.locationDescription,
      location_handwritten_note: state.contactPage.locationHandwrittenNote,
      location_backdrop_asset_id: state.contactPage.locationBackdropAssetId || null,
      available_markets: state.contactPage.availableMarkets,
      updated_at: new Date().toISOString(),
    })
  );

  // 7. Experience page settings
  promises.push(
    supabase.from('experience_page_settings').upsert({
      id: 'default',
      hero_corner_caption: state.experiencePage.heroCornerCaption,
      timeline_kicker: state.experiencePage.timelineKicker,
      timeline_title: state.experiencePage.timelineTitle,
      timeline_description: state.experiencePage.timelineDescription,
      category_descriptions: state.experiencePage.categoryDescriptions,
      category_cover_asset_ids: state.experiencePage.categoryCoverAssetIds,
      bottom_cta_kicker: state.experiencePage.bottomCtaKicker,
      bottom_cta_title: state.experiencePage.bottomCtaTitle,
      bottom_cta_description: state.experiencePage.bottomCtaDescription,
      bottom_cta_text: state.experiencePage.bottomCtaText,
      bottom_cta_link: state.experiencePage.bottomCtaLink,
      bottom_cta_backdrop_asset_id: state.experiencePage.bottomCtaBackdropAssetId || null,
      updated_at: new Date().toISOString(),
    })
  );

  // 8. Portfolio page settings
  promises.push(
    supabase.from('portfolio_page_settings').upsert({
      id: 'default',
      hero_corner_caption: state.portfolioPage.heroCornerCaption,
      bottom_cta_title: state.portfolioPage.bottomCtaTitle,
      bottom_cta_description: state.portfolioPage.bottomCtaDescription,
      bottom_cta_text: state.portfolioPage.bottomCtaText,
      bottom_cta_link: state.portfolioPage.bottomCtaLink,
      bottom_cta_tagline: state.portfolioPage.bottomCtaTagline,
      bottom_cta_backdrop_asset_id: state.portfolioPage.bottomCtaBackdropAssetId || null,
      updated_at: new Date().toISOString(),
    })
  );

  // 9. Page heroes
  for (const hero of Object.values(state.pageHeroes)) {
    promises.push(
      supabase.from('page_heroes').upsert(
        {
          page_slug: hero.pageSlug,
          kicker: hero.kicker,
          title: hero.title,
          subtitle: hero.subtitle,
          cta_text: hero.ctaText,
          cta_link: hero.ctaLink,
          slides: hero.slides,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'page_slug' }
      )
    );
  }

  // 10. Portfolio projects
  for (const p of state.portfolioProjects) {
    promises.push(
      supabase.from('portfolio_projects').upsert({
        id: p.id,
        title: p.title,
        season: p.season,
        category: p.category,
        location: p.location,
        year: p.year,
        client: p.client,
        photographer: p.photographer,
        external_link: p.externalLink,
        description: p.description,
        credits: p.credits,
        cover_asset_id: p.coverAssetId || null,
        gallery_asset_ids: p.galleryAssetIds,
        featured: p.featured,
        is_published: p.isPublished !== false,
        sort_order: p.sortOrder,
        is_placeholder: p.isPlaceholder,
      })
    );
  }

  // 11. Digitals items
  for (const d of state.digitalsItems) {
    promises.push(
      supabase.from('digitals_items').upsert({
        id: d.id,
        title: d.title,
        angle: d.angle,
        notes: d.notes,
        asset_id: d.assetId || null,
        is_bw: d.isBw,
        sort_order: d.sortOrder,
        is_placeholder: d.isPlaceholder,
      })
    );
  }

  // 12. Experience entries
  for (const exp of state.experienceEntries) {
    promises.push(
      supabase.from('experience_entries').upsert({
        id: exp.id,
        year: exp.year,
        season: exp.season,
        category: exp.category,
        title: exp.title,
        client_or_publication: exp.clientOrPublication,
        location: exp.location,
        notes: exp.notes,
        description: exp.description,
        cover_asset_id: exp.coverAssetId || null,
        gallery_asset_ids: exp.galleryAssetIds || [],
        external_link: exp.externalLink,
        featured: exp.featured,
        featured_on_home: exp.featuredOnHome !== false,
        is_published: exp.isPublished !== false,
        sort_order: exp.sortOrder,
        is_placeholder: exp.isPlaceholder,
      })
    );
  }

  // 13. Representation agencies
  for (const ag of state.representationAgencies) {
    promises.push(
      supabase.from('representation_agencies').upsert({
        id: ag.id,
        city: ag.city,
        country: ag.country,
        agency_name: ag.agencyName,
        agent_name: ag.agentName,
        email: ag.email,
        phone: ag.phone,
        website: ag.website,
        address: ag.address,
        description: ag.description,
        logo_asset_id: ag.logoAssetId || null,
        photo_asset_id: ag.photoAssetId || null,
        specialties: ag.specialties || [],
        status_note: ag.statusNote,
        sort_order: ag.sortOrder,
        is_active: ag.isActive !== false,
        is_placeholder: ag.isPlaceholder,
      })
    );
  }

  await Promise.allSettled(promises);
}

/**
 * Saves or updates a single media asset in Supabase.
 */
export async function saveMediaAssetToSupabase(
  supabase: SupabaseClient,
  asset: MediaAsset
): Promise<void> {
  try {
    await supabase.from('media_assets').upsert({
      id: asset.id,
      asset_name: asset.assetName,
      cloudinary_public_id: asset.cloudinaryPublicId,
      cloudinary_asset_id: asset.cloudinaryAssetId || null,
      secure_url: asset.secureUrl,
      resource_type: asset.resourceType || 'image',
      format: asset.format || 'jpg',
      width: asset.width || 0,
      height: asset.height || 0,
      file_size: asset.fileSize || 0,
      alt_text: asset.altText || '',
      folder: asset.folder || 'abibat/general',
      tags: asset.tags || [],
      is_placeholder: Boolean(asset.isPlaceholder),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Unable to persist media asset to Supabase:', err);
  }
}

/**
 * Deletes a media asset from Supabase.
 */
export async function deleteMediaAssetFromSupabase(
  supabase: SupabaseClient,
  assetId: string
): Promise<void> {
  try {
    await supabase.from('media_assets').delete().eq('id', assetId);
  } catch (err) {
    console.warn('Unable to delete media asset from Supabase:', err);
  }
}
