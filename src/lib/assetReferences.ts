import type { AssetReference, CmsState } from '../types/cms.ts';

export function getAssetReferences(state: CmsState, assetId: string): AssetReference[] {
  const refs: AssetReference[] = [];

  for (const [slug, hero] of Object.entries(state.pageHeroes)) {
    if (hero.slides.some((s) => s.assetId === assetId)) {
      refs.push({
        type: 'hero-slide',
        label: `${slug.toUpperCase()} Hero Slideshow`,
        route: slug === 'home' ? '/' : `/${slug}`,
      });
    }
  }

  for (const proj of state.portfolioProjects) {
    if (proj.coverAssetId === assetId) {
      refs.push({
        type: 'portfolio-cover',
        label: `Portfolio Cover: ${proj.title}`,
        route: '/portfolio',
      });
    } else if (proj.galleryAssetIds.includes(assetId)) {
      refs.push({
        type: 'portfolio-gallery',
        label: `Portfolio Gallery: ${proj.title}`,
        route: '/portfolio',
      });
    }
  }

  for (const exp of state.experienceEntries || []) {
    if (exp.coverAssetId === assetId) {
      refs.push({
        type: 'experience-cover',
        label: `Experience Cover: ${exp.title}`,
        route: '/experience',
      });
    } else if (exp.galleryAssetIds?.includes(assetId)) {
      refs.push({
        type: 'experience-gallery',
        label: `Experience Gallery: ${exp.title}`,
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
    if (agency.logoAssetId === assetId) {
      refs.push({
        type: 'agency-media',
        label: `Agency Logo: ${agency.agencyName || agency.city}`,
        route: '/representation',
      });
    }
    if (agency.photoAssetId === assetId) {
      refs.push({
        type: 'agency-media',
        label: `Agency Photo: ${agency.agencyName || agency.city}`,
        route: '/representation',
      });
    }
  }

  const slots: Array<[string, string]> = [
    [state.homepage.aboutPortraitAssetId, 'Home — About Portrait'],
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
    [state.portfolioPage.bottomCtaBackdropAssetId, 'Portfolio — Closing CTA Backdrop'],
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

  for (const [slotId, label] of slots) {
    if (slotId === assetId) {
      refs.push({
        type: 'homepage-slot',
        label,
        route: label.startsWith('About')
          ? '/about'
          : label.startsWith('Portfolio')
            ? '/portfolio'
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
