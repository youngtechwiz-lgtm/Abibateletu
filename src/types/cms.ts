export type PageSlug =
  | 'home'
  | 'portfolio'
  | 'digitals'
  | 'about'
  | 'experience'
  | 'representation'
  | 'contact';

export type ProjectCategory =
  | 'Campaigns'
  | 'Editorials'
  | 'Runway'
  | 'Publications'
  | 'Collaborations';
export type ExperienceCategory =
  | 'Campaigns'
  | 'Runway'
  | 'Editorials'
  | 'Publications'
  | 'Collaborations';

export interface MediaAsset {
  id: string;
  assetName: string;
  cloudinaryPublicId: string;
  cloudinaryAssetId: string;
  secureUrl: string;
  resourceType: 'image' | 'video';
  format: string;
  width: number;
  height: number;
  fileSize: number;
  altText: string;
  folder: string;
  tags: string[];
  isPlaceholder: boolean;
  placeholderTone?: 'obsidian' | 'bronze' | 'alabaster' | 'charcoal' | 'sepia';
  placeholderLabel?: string;
  createdAt: string;
}

export interface HeroSlide {
  id: string;
  assetId: string;
  title?: string;
  caption: string;
  locationTag: string;
  ctaText?: string;
  ctaLink?: string;
  isActive?: boolean;
  sortOrder: number;
}

export interface PageHero {
  pageSlug: PageSlug;
  kicker: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  slides: HeroSlide[];
}

export interface ModelStats {
  height: string;
  locations: string;
  agencyNote: string;
  specialties: string;
}

export interface SectionVisibility {
  hero: boolean;
  selectedWork: boolean;
  about: boolean;
  digitals: boolean;
  experienceRepresentation: boolean;
  contact: boolean;
}

export interface HomepageSettings {
  wordmark: string;
  heroSideCaption: string;
  selectedWorkKicker: string;
  selectedWorkTitle: string;
  selectedWorkDescription: string;
  selectedWorkCtaText: string;
  selectedWorkCtaLink: string;
  aboutKicker: string;
  aboutTitle: string;
  aboutParagraphs: string[];
  aboutQuote: string;
  aboutCtaText: string;
  aboutCtaLink: string;
  aboutPortraitAssetId: string;
  aboutInsetAssetId: string;
  modelStats: ModelStats;
  digitalsKicker: string;
  digitalsTitle: string;
  digitalsSubtitle: string;
  digitalsDescription: string;
  digitalsCtaText: string;
  digitalsCtaLink: string;
  digitalsFeatureAssetId: string;
  experienceKicker: string;
  experienceTitle: string;
  experienceDescription: string;
  experienceCtaText: string;
  experienceCtaLink: string;
  experienceFeatureAssetId: string;
  representationKicker: string;
  representationTitle: string;
  representationDescription: string;
  representationCtaText: string;
  representationCtaLink: string;
  representationFeatureAssetId: string;
  contactKicker: string;
  contactTitle: string;
  contactDescription: string;
  contactCtaText: string;
  contactCtaLink: string;
  contactBackdropAssetId: string;
  sectionVisibility: SectionVisibility;
  featuredProjectIds: string[];
}

export interface PortfolioProject {
  id: string;
  title: string;
  season: string;
  category: ProjectCategory;
  location: string;
  year: string;
  client: string;
  photographer: string;
  externalLink: string;
  description: string;
  credits: string;
  coverAssetId: string;
  galleryAssetIds: string[];
  featured: boolean;
  isPublished?: boolean;
  sortOrder: number;
  isPlaceholder: boolean;
}

export interface DigitalsItem {
  id: string;
  title: string;
  angle: string;
  notes: string;
  assetId: string;
  isBw: boolean;
  sortOrder: number;
  isPlaceholder: boolean;
}

export interface ExperienceEntry {
  id: string;
  year: string;
  season: string;
  category: ExperienceCategory;
  title: string;
  clientOrPublication: string;
  location: string;
  notes: string;
  description: string;
  coverAssetId: string;
  galleryAssetIds: string[];
  externalLink: string;
  featured: boolean;
  featuredOnHome: boolean;
  isPublished: boolean;
  sortOrder: number;
  isPlaceholder: boolean;
}

export interface RepresentationAgency {
  id: string;
  city: string;
  country: string;
  agencyName: string;
  agentName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  description: string;
  logoAssetId: string;
  photoAssetId: string;
  specialties: string[];
  statusNote: string;
  sortOrder: number;
  isActive: boolean;
  isPlaceholder: boolean;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  organization: string;
  inquiryType: string;
  location: string;
  dates: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: string;
}

export interface SiteSettings {
  email: string;
  phone: string;
  instagramPrimary: string;
  instagramSecondary: string;
  regionsLine: string;
  copyrightText: string;
}

export interface AboutPageContent {
  heroCornerCaption: string;
  storyKicker: string;
  storyTitle: string;
  storyParagraphs: string[];
  quickFactsTitle: string;
  quickFactsQuote: string;
  valuesTitle: string;
  valuesItems: Array<{ label: string; description: string }>;
  drivesKicker: string;
  drivesTitle: string;
  drivesParagraphs: string[];
  bigPictureKicker: string;
  bigPictureTitle: string;
  bigPictureParagraphs: string[];
  bigPictureCtaText: string;
  bigPictureCtaLink: string;
  bigPictureHandwrittenNote: string;
  storyPortraitAssetId: string;
  drivesBackdropAssetId: string;
  bigPictureLeftAssetId: string;
  bigPictureTopRightAssetId: string;
  bigPictureBottomRightAssetId: string;
  storyLayoutOrder: 'text-portrait-facts' | 'portrait-text-facts';
  bigPictureLayoutOrder: 'portrait-text-collage' | 'collage-text-portrait';
}

export interface PortfolioPageSettings {
  heroCornerCaption: string;
  bottomCtaTitle: string;
  bottomCtaDescription: string;
  bottomCtaText: string;
  bottomCtaLink: string;
  bottomCtaTagline: string;
  bottomCtaBackdropAssetId: string;
}

export interface DigitalsPageSettings {
  heroCornerCaption: string;
  aboutKicker: string;
  aboutName: string;
  aboutBio: string;
  quote: string;
  bookCtaText: string;
  bookCtaLink: string;
  bust: string;
  waist: string;
  hips: string;
  shoeSize: string;
  hair: string;
  eyes: string;
  compCardPdfUrl: string;
  compCardPdfName: string;
  compCardPdfPublicId: string;
}

export interface RepresentationPageSettings {
  heroCornerCaption: string;
  sectionKicker: string;
  sectionTitle: string;
  sectionDescription: string;
  bottomCtaKicker: string;
  bottomCtaTitle: string;
  bottomCtaDescription: string;
  bottomCtaText: string;
  bottomCtaLink: string;
  bottomCtaHighlights: string[];
  bottomCtaBackdropAssetId: string;
}

export interface ContactPageSettings {
  heroCornerCaption: string;
  sideCardKicker: string;
  sideCardTitle: string;
  sideCardSubtitle: string;
  sideCardAssetId: string;
  locationKicker: string;
  locationTitle: string;
  locationDescription: string;
  locationHandwrittenNote: string;
  locationBackdropAssetId: string;
  availableMarkets: string[];
}

export interface ExperiencePageSettings {
  heroCornerCaption: string;
  timelineKicker: string;
  timelineTitle: string;
  timelineDescription: string;
  categoryDescriptions: Record<ExperienceCategory, string>;
  categoryCoverAssetIds: Record<ExperienceCategory, string>;
  bottomCtaKicker: string;
  bottomCtaTitle: string;
  bottomCtaDescription: string;
  bottomCtaText: string;
  bottomCtaLink: string;
  bottomCtaBackdropAssetId: string;
}

export interface AdminActivityItem {
  id: string;
  action: string;
  detail: string;
  section: string;
  createdAt: string;
}

export interface CmsState {
  mediaAssets: MediaAsset[];
  pageHeroes: Record<PageSlug, PageHero>;
  homepage: HomepageSettings;
  aboutPage: AboutPageContent;
  portfolioPage: PortfolioPageSettings;
  digitalsPage: DigitalsPageSettings;
  experiencePage: ExperiencePageSettings;
  representationPage: RepresentationPageSettings;
  contactPage: ContactPageSettings;
  portfolioSeasons: string[];
  portfolioProjects: PortfolioProject[];
  digitalsItems: DigitalsItem[];
  experienceEntries: ExperienceEntry[];
  representationAgencies: RepresentationAgency[];
  siteSettings: SiteSettings;
  inquiries: ContactInquiry[];
  adminActivity: AdminActivityItem[];
  updatedAt: string;
}

export interface AssetReference {
  type:
    | 'hero-slide'
    | 'portfolio-cover'
    | 'portfolio-gallery'
    | 'experience-cover'
    | 'experience-gallery'
    | 'digitals'
    | 'homepage-slot'
    | 'agency-media';
  label: string;
  route: string;
}
