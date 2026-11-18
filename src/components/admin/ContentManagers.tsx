import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useCms } from '../../context/CmsContext.tsx';
import type { ContactInquiry } from '../../types/cms.ts';

export function InquiriesManagerPanel() {
  const { state, updateInquiryStatus, deleteInquiry } = useCms();
  const [statusFilter, setStatusFilter] = useState<'all' | ContactInquiry['status']>('all');

  const filteredInquiries =
    statusFilter === 'all'
      ? state.inquiries
      : state.inquiries.filter((inq) => inq.status === statusFilter);

  const counts = {
    all: state.inquiries.length,
    new: state.inquiries.filter((i) => i.status === 'new').length,
    read: state.inquiries.filter((i) => i.status === 'read').length,
    replied: state.inquiries.filter((i) => i.status === 'replied').length,
    archived: state.inquiries.filter((i) => i.status === 'archived').length,
  };

  return (
    <div className="border border-[#141414]/12 bg-white p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414]/10 pb-4">
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            INCOMING BOOKINGS &amp; SPAM-PROTECTED INBOX
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">
            MESSAGES &amp; INQUIRIES ({state.inquiries.length})
          </h3>
        </div>

        <div className="flex flex-wrap border border-[#141414]/20 text-[10px] uppercase tracking-[0.16em]">
          {(['all', 'new', 'read', 'replied', 'archived'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 ${
                statusFilter === status
                  ? 'bg-[#141414] text-white'
                  : 'bg-white text-[#141414]/70 hover:text-[#141414]'
              }`}
            >
              {status} ({counts[status]})
            </button>
          ))}
        </div>
      </div>

      {filteredInquiries.length === 0 ? (
        <p className="py-10 text-xs text-[#141414]/60">
          {state.inquiries.length === 0
            ? 'No inquiries submitted yet. Submissions from the Contact page will appear here.'
            : `No inquiries marked as ${statusFilter}.`}
        </p>
      ) : (
        <div className="divide-y divide-[#141414]/12">
          {filteredInquiries.map((inq) => (
            <div key={inq.id} className="py-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#141414]">
                    {inq.name} ·{' '}
                    <a href={`mailto:${inq.email}`} className="text-[#141414]/70 hover:underline">
                      {inq.email}
                    </a>
                  </p>
                  <p className="text-[11px] text-[#141414]/60">
                    {inq.inquiryType}
                    {inq.organization ? ` · ${inq.organization}` : ''}
                    {inq.location ? ` · ${inq.location}` : ''}
                    {inq.dates ? ` · ${inq.dates}` : ''}
                    {' · '}
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Status for inquiry from ${inq.name}`}
                    value={inq.status}
                    onChange={(e) =>
                      updateInquiryStatus(inq.id, e.target.value as ContactInquiry['status'])
                    }
                    className="border border-[#141414]/25 bg-white px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em]"
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => deleteInquiry(inq.id)}
                    aria-label={`Delete inquiry from ${inq.name}`}
                    className="border border-red-800/25 p-1.5 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-[#141414]/80 whitespace-pre-line">
                {inq.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SiteSettingsPanel() {
  const { state, configStatus, adminEmail, updateState } = useCms();

  return (
    <div className="space-y-6">
      <div className="border border-[#141414]/12 bg-white p-6 space-y-5">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            GLOBAL CONTACT &amp; FOOTER SETTINGS
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">
            SITE CONTACT &amp; BRAND DETAILS
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Site Wordmark
            </span>
            <input
              type="text"
              value={state.homepage.wordmark}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  homepage: { ...prev.homepage, wordmark: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Direct Email
            </span>
            <input
              type="email"
              value={state.siteSettings.email}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  siteSettings: { ...prev.siteSettings, email: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Phone
            </span>
            <input
              type="text"
              value={state.siteSettings.phone}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  siteSettings: { ...prev.siteSettings, phone: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Instagram Primary
            </span>
            <input
              type="text"
              value={state.siteSettings.instagramPrimary}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  siteSettings: { ...prev.siteSettings, instagramPrimary: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Instagram Secondary
            </span>
            <input
              type="text"
              value={state.siteSettings.instagramSecondary}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  siteSettings: { ...prev.siteSettings, instagramSecondary: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Footer Regions Line
            </span>
            <input
              type="text"
              value={state.siteSettings.regionsLine}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  siteSettings: { ...prev.siteSettings, regionsLine: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block sm:col-span-2 lg:col-span-3">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Footer Copyright Text
            </span>
            <input
              type="text"
              value={state.siteSettings.copyrightText}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  siteSettings: { ...prev.siteSettings, copyrightText: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
        </div>
      </div>

      {/* Model Core Facts */}
      <div className="border border-[#141414]/12 bg-white p-6 space-y-4">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            CONFIRMED PORTFOLIO SPECIFICATIONS
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">MODEL PROFILE &amp; INTEGRATIONS</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Confirmed Height
            </span>
            <input
              type="text"
              value={state.homepage.modelStats.height}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  homepage: {
                    ...prev.homepage,
                    modelStats: { ...prev.homepage.modelStats, height: e.target.value },
                  },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Active Locations
            </span>
            <input
              type="text"
              value={state.homepage.modelStats.locations}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  homepage: {
                    ...prev.homepage,
                    modelStats: { ...prev.homepage.modelStats, locations: e.target.value },
                  },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#141414]/10 pt-4 text-xs">
          <div className="border border-[#141414]/12 p-3.5 bg-[#FAF9F7]">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/55">Admin Account</p>
            <p className="mt-1 font-medium text-[#141414]">{adminEmail || 'eletuabibat12@gmail.com'}</p>
          </div>
          <div className="border border-[#141414]/12 p-3.5 bg-[#FAF9F7]">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/55">Database Layer</p>
            <p className="mt-1 font-medium text-[#141414]">
              {configStatus.supabaseConfigured ? 'Supabase PostgreSQL Active' : 'Server Data Store Active'}
            </p>
          </div>
          <div className="border border-[#141414]/12 p-3.5 bg-[#FAF9F7]">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/55">Media Delivery</p>
            <p className="mt-1 font-medium text-[#141414]">
              {configStatus.cloudinaryConfigured
                ? `Cloudinary (${configStatus.cloudinaryCloudName})`
                : 'Cloudinary Secrets Needed in Env'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
