import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { useCms } from '../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../components/EditorialMediaFrame.tsx';
import { AbibatSignature } from '../components/AbibatSignature.tsx';

const INQUIRY_TYPES = [
  'Agency',
  'Campaign',
  'Editorial',
  'Runway',
  'Brand Collaboration',
  'Photography',
  'Production',
  'Other',
] as const;

function resolveInitialInquiryType(param: string | null): string {
  if (!param) return '';
  if (param.toLowerCase().includes('agency')) return 'Agency';
  const exact = INQUIRY_TYPES.find((t) => t.toLowerCase() === param.trim().toLowerCase());
  return exact || '';
}

export function ContactPage() {
  const { state, getAssetById, submitInquiry } = useCms();
  const { pageHeroes, siteSettings, contactPage } = state;
  const hero = pageHeroes.contact;
  const rawSlides = hero?.slides?.length ? hero.slides : [];
  const activeHeroSlides = rawSlides.filter((s) => s.isActive !== false);
  const slides = activeHeroSlides.length > 0 ? activeHeroSlides : rawSlides;

  const [searchParams] = useSearchParams();
  const initialInquiryType = resolveInitialInquiryType(searchParams.get('inquiryType'));

  const [slideIndex, setSlideIndex] = useState(0);
  const [form, setForm] = useState({
    name: '',
    email: '',
    organization: '',
    inquiryType: initialInquiryType,
    dates: '',
    location: '',
    message: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const formStartedAtRef = useRef<number>(Date.now());

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setSlideIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (form.name.trim().length < 2) {
      errors.name = 'Please enter your full name.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!form.inquiryType) {
      errors.inquiryType = 'Please select an inquiry type.';
    }
    if (form.message.trim().length < 10) {
      errors.message = 'Please enter at least 10 characters about your project or inquiry.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    const res = await submitInquiry({
      ...form,
      honeypot,
      formStartedAt: formStartedAtRef.current,
    });
    setSubmitting(false);

    if (!res.ok) {
      setServerError(res.error || 'Unable to submit inquiry. Please try again.');
      return;
    }

    setSubmitted(true);
    setFieldErrors({});
    setForm({
      name: '',
      email: '',
      organization: '',
      inquiryType: '',
      dates: '',
      location: '',
      message: '',
    });
    setHoneypot('');
    formStartedAtRef.current = Date.now();
  };

  const activeSlide = slides[slideIndex] || slides[0];
  const activeHeroAsset = activeSlide ? getAssetById(activeSlide.assetId) : undefined;
  const resolvedHeroTitle = activeSlide?.title?.trim() || hero.title;

  return (
    <div className="bg-[#0C0C0C] text-[#F5F0E8]">
      {/* HERO SECTION — LET'S WORK TOGETHER. */}
      <section className="relative min-h-[60vh] sm:min-h-[68vh] w-full overflow-hidden bg-[#0C0C0C] flex items-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide?.id || 'contact-hero'}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <EditorialMediaFrame
              asset={activeHeroAsset}
              preset="hero"
              priority
              showPlaceholderBadge={false}
              className="h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C]/92 via-[#0C0C0C]/55 to-black/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C]/90 via-transparent to-black/50" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-10 lg:px-14 pt-32 pb-12 sm:pb-16 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] font-medium tracking-[0.28em] uppercase text-[#F5F0E8]/70">
                {hero.kicker}
              </span>
              <span className="h-px w-12 bg-white/30" />
            </div>

            <h1 className="font-serif text-5xl sm:text-7xl lg:text-[4.65rem] font-light tracking-[0.02em] uppercase leading-[0.94] text-[#F5F0E8]">
              {resolvedHeroTitle}
            </h1>

            {hero.subtitle && (
              <p className="mt-5 max-w-md text-[13px] leading-relaxed text-[#F5F0E8]/78">
                {hero.subtitle}
              </p>
            )}

            <div className="mt-6 text-[#F5F0E8]/90">
              <AbibatSignature className="w-28 h-auto" />
            </div>
          </div>

          {/* Right Vertical Caption & Slideshow Index */}
          <div className="flex flex-col items-start md:items-end gap-8">
            <div className="flex flex-col items-end gap-3 text-right">
              <p className="max-w-[96px] text-[9px] leading-[1.7] tracking-[0.26em] uppercase text-[#F5F0E8]/65">
                {contactPage.heroCornerCaption}
              </p>
              <span className="h-8 w-px bg-white/30" />
            </div>

            {slides.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono tabular-nums tracking-[0.22em] text-[#F5F0E8]/75">
                  {String(slideIndex + 1).padStart(2, '0')} /{' '}
                  {String(slides.length).padStart(2, '0')}
                </span>
                {slides.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)
                      }
                      aria-label="Previous hero slide"
                      className="flex h-8 w-8 items-center justify-center border border-white/25 text-[#F5F0E8]/80 hover:border-white hover:text-white transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideIndex((prev) => (prev + 1) % slides.length)}
                      aria-label="Next hero slide"
                      className="flex h-8 w-8 items-center justify-center border border-white/25 text-[#F5F0E8]/80 hover:border-white hover:text-white transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MAIN 3-COLUMN CONTACT & INQUIRY SECTION (Light Stone Paper) */}
      <section id="inquiry-form" className="bg-[#F5F0E8] text-[#141414] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-stretch">
            {/* COLUMN 1 — GET IN TOUCH DETAILS */}
            <aside className="lg:col-span-3 flex flex-col justify-between gap-8 lg:border-r lg:border-[#141414]/12 lg:pr-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-medium tracking-[0.24em] uppercase text-[#141414]">
                    GET IN TOUCH
                  </span>
                  <span className="h-px flex-1 max-w-[64px] bg-[#141414]/25" />
                </div>

                <div className="divide-y divide-[#141414]/12 border-t border-b border-[#141414]/12">
                  {/* Email */}
                  <div className="py-5 flex items-start gap-3.5">
                    <Mail className="h-4 w-4 text-[#141414]/55 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-medium tracking-[0.22em] uppercase text-[#141414]/50">
                        EMAIL
                      </p>
                      <a
                        href={`mailto:${siteSettings.email}`}
                        className="mt-1 block text-[13px] font-medium text-[#141414] hover:underline break-all"
                      >
                        {siteSettings.email}
                      </a>
                      <p className="mt-1 text-[11px] text-[#141414]/55">
                        For general inquiries, bookings and collaborations.
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="py-5 flex items-start gap-3.5">
                    <Phone className="h-4 w-4 text-[#141414]/55 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-medium tracking-[0.22em] uppercase text-[#141414]/50">
                        PHONE
                      </p>
                      <a
                        href={`tel:${siteSettings.phone}`}
                        className="mt-1 block text-[13px] font-medium tabular-nums text-[#141414] hover:underline"
                      >
                        {siteSettings.phone}
                      </a>
                      <p className="mt-1 text-[11px] text-[#141414]/55">
                        Direct booking desk &amp; production inquiries.
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="py-5 flex items-start gap-3.5">
                    <MapPin className="h-4 w-4 text-[#141414]/55 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-medium tracking-[0.22em] uppercase text-[#141414]/50">
                        LOCATION
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-[#141414]">
                        Lagos, Nigeria
                      </p>
                      <p className="mt-1 text-[11px] text-[#141414]/55">
                        Available for international bookings.
                      </p>
                    </div>
                  </div>

                  {/* Representation */}
                  <div className="py-5 flex items-start gap-3.5">
                    <Calendar className="h-4 w-4 text-[#141414]/55 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-medium tracking-[0.22em] uppercase text-[#141414]/50">
                        REPRESENTATION
                      </p>
                      <Link
                        to="/representation"
                        className="mt-1 block text-[13px] font-medium text-[#141414] hover:underline"
                      >
                        Worldwide
                      </Link>
                      <p className="mt-1 text-[11px] text-[#141414]/55">
                        Through international agency partners.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Follow Me / Socials */}
                <div className="pt-1 space-y-3">
                  <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#141414]/65">
                    FOLLOW ME
                  </p>

                  <div className="space-y-2 text-[12px]">
                    <a
                      href={`https://instagram.com/${siteSettings.instagramPrimary.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 text-[#141414]/80 hover:text-[#141414] transition-colors"
                    >
                      <Instagram className="h-3.5 w-3.5 text-[#141414]/55 shrink-0" />
                      <span>{siteSettings.instagramPrimary}</span>
                    </a>
                    <a
                      href={`mailto:${siteSettings.email}`}
                      className="flex items-center gap-2.5 text-[#141414]/80 hover:text-[#141414] transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5 text-[#141414]/55 shrink-0" />
                      <span>{siteSettings.email}</span>
                    </a>
                    <a
                      href="https://x.com/_theeletuabibat"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 text-[#141414]/80 hover:text-[#141414] transition-colors"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-3.5 w-3.5 text-[#141414]/55 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>@_theeletuabibat</span>
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            {/* COLUMN 2 — SEND A MESSAGE INQUIRY FORM */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-[11px] font-medium tracking-[0.24em] uppercase text-[#141414]">
                  SEND A MESSAGE
                </span>
                <span className="h-px w-12 bg-[#141414]/25" />
              </div>

              <p className="text-[12px] leading-relaxed text-[#141414]/68 mb-6">
                Fill out the form below and I&apos;ll get back to you as soon as possible.
              </p>

              {submitted ? (
                <div className="border border-[#141414]/15 bg-white p-8 sm:p-10 space-y-4">
                  <CheckCircle2 className="h-8 w-8 text-[#141414]" />
                  <h2 className="font-serif text-3xl font-light uppercase text-[#141414]">
                    MESSAGE RECEIVED
                  </h2>
                  <p className="text-[13px] leading-relaxed text-[#141414]/75">
                    Thank you for reaching out. Your inquiry has been recorded securely and ABIBAT
                    or her team will respond shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-2 inline-flex items-center gap-2 border-b border-[#141414] pb-1 text-[10px] font-medium tracking-[0.22em] uppercase text-[#141414]"
                  >
                    <span>Send Another Inquiry</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Anti-spam honeypot field (hidden from human visitors) */}
                  <div
                    aria-hidden="true"
                    className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
                  >
                    <label>
                      Company Website
                      <input
                        type="text"
                        name="companyWebsite"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </label>
                  </div>

                  {serverError && (
                    <div
                      role="alert"
                      className="border border-red-700/30 bg-red-50 px-4 py-3 text-xs text-red-900"
                    >
                      {serverError}
                    </div>
                  )}

                  <label className="block">
                    <span className="text-[11px] font-medium text-[#141414]/80">Full Name *</span>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                      }}
                      placeholder="Your name"
                      className="mt-1.5 w-full border border-[#141414]/15 bg-[#ECEAE4] px-3.5 py-2.5 text-[13px] text-[#141414] placeholder:text-[#141414]/40 focus:border-[#141414] focus:bg-white focus:outline-none transition-colors"
                    />
                    {fieldErrors.name && (
                      <span className="mt-1 block text-[11px] text-red-700">
                        {fieldErrors.name}
                      </span>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-medium text-[#141414]/80">
                      Email Address *
                    </span>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                      }}
                      placeholder="your@email.com"
                      className="mt-1.5 w-full border border-[#141414]/15 bg-[#ECEAE4] px-3.5 py-2.5 text-[13px] text-[#141414] placeholder:text-[#141414]/40 focus:border-[#141414] focus:bg-white focus:outline-none transition-colors"
                    />
                    {fieldErrors.email && (
                      <span className="mt-1 block text-[11px] text-red-700">
                        {fieldErrors.email}
                      </span>
                    )}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-[11px] font-medium text-[#141414]/80">
                        Company or Agency
                      </span>
                      <input
                        type="text"
                        value={form.organization}
                        onChange={(e) => setForm({ ...form, organization: e.target.value })}
                        placeholder="Brand, agency or publication"
                        className="mt-1.5 w-full border border-[#141414]/15 bg-[#ECEAE4] px-3.5 py-2.5 text-[13px] text-[#141414] placeholder:text-[#141414]/40 focus:border-[#141414] focus:bg-white focus:outline-none transition-colors"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-medium text-[#141414]/80">
                        Inquiry Type *
                      </span>
                      <select
                        required
                        value={form.inquiryType}
                        onChange={(e) => {
                          setForm({ ...form, inquiryType: e.target.value });
                          if (fieldErrors.inquiryType) {
                            setFieldErrors({ ...fieldErrors, inquiryType: '' });
                          }
                        }}
                        className="mt-1.5 w-full border border-[#141414]/15 bg-[#ECEAE4] px-3.5 py-2.5 text-[13px] text-[#141414] focus:border-[#141414] focus:bg-white focus:outline-none transition-colors"
                      >
                        <option value="">Select an option</option>
                        {INQUIRY_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.inquiryType && (
                        <span className="mt-1 block text-[11px] text-red-700">
                          {fieldErrors.inquiryType}
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-[11px] font-medium text-[#141414]/80">
                        Project Date
                      </span>
                      <input
                        type="text"
                        value={form.dates}
                        onChange={(e) => setForm({ ...form, dates: e.target.value })}
                        placeholder="e.g. June 14 – June 18, 2026"
                        className="mt-1.5 w-full border border-[#141414]/15 bg-[#ECEAE4] px-3.5 py-2.5 text-[13px] text-[#141414] placeholder:text-[#141414]/40 focus:border-[#141414] focus:bg-white focus:outline-none transition-colors"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-medium text-[#141414]/80">
                        Project Location
                      </span>
                      <input
                        type="text"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="e.g. Lagos, Paris, Milan, Madrid"
                        className="mt-1.5 w-full border border-[#141414]/15 bg-[#ECEAE4] px-3.5 py-2.5 text-[13px] text-[#141414] placeholder:text-[#141414]/40 focus:border-[#141414] focus:bg-white focus:outline-none transition-colors"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-[11px] font-medium text-[#141414]/80">Message *</span>
                    <textarea
                      rows={5}
                      required
                      value={form.message}
                      onChange={(e) => {
                        setForm({ ...form, message: e.target.value });
                        if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: '' });
                      }}
                      placeholder="Tell me a little about your project or inquiry..."
                      className="mt-1.5 w-full border border-[#141414]/15 bg-[#ECEAE4] px-3.5 py-2.5 text-[13px] text-[#141414] placeholder:text-[#141414]/40 focus:border-[#141414] focus:bg-white focus:outline-none transition-colors"
                    />
                    {fieldErrors.message && (
                      <span className="mt-1 block text-[11px] text-red-700">
                        {fieldErrors.message}
                      </span>
                    )}
                  </label>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="group inline-flex items-center gap-4 bg-[#141414] px-7 py-3.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:bg-[#2a2a2a] disabled:opacity-50 transition-colors"
                    >
                      <span>{submitting ? 'SENDING MESSAGE...' : 'SEND MESSAGE'}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* COLUMN 3 — RIGHT BOOKING EDITORIAL CARD */}
            <div className="lg:col-span-4">
              <div className="relative h-full min-h-[460px] overflow-hidden bg-[#161513] flex items-end">
                <EditorialMediaFrame
                  asset={getAssetById(contactPage.sideCardAssetId)}
                  preset="portrait"
                  className="absolute inset-0 h-full w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" />

                <div className="relative z-10 p-7 sm:p-9 text-[#F5F0E8] space-y-4">
                  <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8]/70">
                    {contactPage.sideCardKicker}
                  </p>
                  <h2 className="font-serif text-3xl sm:text-[2.15rem] font-light uppercase leading-[1.04] tracking-[0.02em]">
                    {contactPage.sideCardTitle}
                  </h2>
                  <div className="h-px w-10 bg-white/35" />
                  <p className="text-[12px] text-[#F5F0E8]/80">{contactPage.sideCardSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM LOCATION & AVAILABILITY BAND — WHERE I AM / LAGOS, NIGERIA */}
      <section className="grid grid-cols-1 lg:grid-cols-12 bg-[#0C0C0C] text-[#F5F0E8] border-t border-white/10">
        {/* Left Atmospheric Portrait + Location Copy */}
        <div className="lg:col-span-6 relative min-h-[340px] sm:min-h-[380px] overflow-hidden flex items-center">
          <EditorialMediaFrame
            asset={getAssetById(contactPage.locationBackdropAssetId)}
            preset="hero"
            showPlaceholderBadge={false}
            className="absolute inset-0 h-full w-full opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C]/92 via-[#0C0C0C]/65 to-[#0C0C0C]/85" />

          <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-14 max-w-lg space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-medium tracking-[0.26em] uppercase text-[#F5F0E8]/65">
                {contactPage.locationKicker}
              </span>
              <span className="h-px w-12 bg-white/30" />
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl font-light uppercase leading-[0.98] tracking-[0.02em] text-[#F5F0E8]">
              {contactPage.locationTitle}
            </h2>

            <p className="text-[13px] leading-relaxed text-[#F5F0E8]/78">
              {contactPage.locationDescription}
            </p>
          </div>
        </div>

        {/* Right Architectural Global Presence & Available Markets */}
        <div className="lg:col-span-6 bg-[#0F0F0F] px-6 sm:px-10 lg:px-14 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10 border-t lg:border-t-0 lg:border-l border-white/10">
          {/* Minimalist Continental Presence Frame */}
          <div className="relative w-full sm:w-64 aspect-[16/10] border border-white/10 bg-[#141414] overflow-hidden flex items-center justify-center">
            <svg
              viewBox="0 0 320 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="w-full h-full opacity-45"
            >
              <g stroke="rgba(243,241,237,0.22)" strokeWidth="0.8">
                <path d="M24 44 L86 36 L104 68 L74 86 L46 72 Z" />
                <path d="M78 96 L108 108 L98 152 L72 138 Z" />
                <path d="M138 34 L194 28 L206 54 L144 62 Z" />
                <path d="M144 68 L186 70 L196 106 L170 136 L146 110 Z" />
                <path d="M206 42 L274 36 L286 74 L242 94 L208 76 Z" />
                <path d="M248 118 L284 114 L290 142 L252 144 Z" />
              </g>
              {/* Lagos & European hubs */}
              <circle cx="154" cy="96" r="10" fill="rgba(218,176,130,0.18)" />
              <circle cx="154" cy="96" r="2.6" fill="#F5F0E8" />
              <circle cx="156" cy="48" r="7" fill="rgba(218,176,130,0.16)" />
              <circle cx="156" cy="48" r="2" fill="#F5F0E8" />
              <circle cx="170" cy="52" r="2" fill="#F5F0E8" />
              <circle cx="144" cy="56" r="2" fill="#F5F0E8" />
            </svg>
            <span className="absolute bottom-2.5 left-3 text-[9px] tracking-[0.22em] uppercase text-[#F5F0E8]/45">
              INTERNATIONAL CIRCUIT
            </span>
          </div>

          <div className="space-y-6">
            <p className="font-serif italic text-xl leading-snug text-[#F5F0E8]/85 -rotate-3 select-none">
              {contactPage.locationHandwrittenNote}
            </p>

            <div className="space-y-3">
              <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8]/55">
                AVAILABLE IN
              </p>
              <ul className="space-y-2.5 text-[12px] text-[#F5F0E8]/85">
                {contactPage.availableMarkets.map((market) => (
                  <li key={market} className="flex items-center gap-2.5">
                    <MapPin className="h-3.5 w-3.5 text-[#F5F0E8]/50 shrink-0" />
                    <span>{market}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
