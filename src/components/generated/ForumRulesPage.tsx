import * as React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Calendar, CheckCircle2, CircleDot, ExternalLink, FileText, Mail, Shield, Star } from 'lucide-react';
import { SideRail } from '@/components/SideRail';

import { cn } from '../../lib/utils';
type RuleCopy = {
  id: string;
  title: string;
  description: string;
};
type TocItem = {
  id: string;
  label: string;
};
type PremiumMethod = {
  id: string;
  label: string;
};
type ConsequenceRow = {
  id: string;
  level: string;
  action: string;
  duration: string;
  tone: 'minor' | 'major' | 'critical';
};
type SectionHeadingProps = {
  icon: React.ElementType;
  title: string;
  eyebrow: string;
  tone?: 'primary' | 'amber' | 'danger';
  headingId?: string;
};
const TABLE_OF_CONTENTS: TocItem[] = [{
  id: 'general-rules',
  label: 'General Rules'
}, {
  id: 'posting-guidelines',
  label: 'Posting Guidelines'
}, {
  id: 'premium-membership',
  label: 'Premium Membership'
}, {
  id: 'consequences',
  label: 'Consequences'
}, {
  id: 'contact-admin',
  label: 'Contact Admin'
}];
const GENERAL_RULES: RuleCopy[] = [{
  id: 'no-spamming',
  title: 'No Spamming',
  description: 'Do not post irrelevant, repetitive, or low-quality content. Spam posts will be removed to keep the forum useful.'
}, {
  id: 'search-before-posting',
  title: 'Search Before Posting',
  description: 'Check existing threads before opening a new discussion so members can find answers in one reliable place.'
}, {
  id: 'respectful-communication',
  title: 'Respectful Communication',
  description: 'Treat members, moderators, and visitors with care. Harassment, hate speech, or personal attacks are not allowed.'
}, {
  id: 'no-unauthorized-promotion',
  title: 'No Unauthorized Promotion',
  description: 'Do not advertise products, services, channels, or private offers without approval from the admin team.'
}, {
  id: 'report-dead-links',
  title: 'Report Dead Links',
  description: 'Use the Expired or Not Working category when a shared resource is unavailable, outdated, or unsafe.'
}, {
  id: 'no-duplicate-posts',
  title: 'No Duplicate Posts',
  description: 'Avoid posting the same topic in multiple categories. Choose the most relevant location and keep the discussion focused.'
}, {
  id: 'language-policy',
  title: 'Language Policy',
  description: 'Use English in main sections for global accessibility. Local language threads may be created only where clearly permitted.'
}];
const POSTING_GUIDELINES: RuleCopy[] = [{
  id: 'descriptive-titles',
  title: 'Use Descriptive Titles',
  description: 'Write titles that explain what your post contains, who it helps, and why members should open it.'
}, {
  id: 'proper-tags',
  title: 'Add Proper Tags',
  description: 'Attach relevant tags so discussions stay searchable and category feeds remain organized.'
}, {
  id: 'credit-sources',
  title: 'Credit Original Sources',
  description: 'Give proper attribution when sharing resources, templates, tutorials, code, or research from another creator.'
}, {
  id: 'clear-formatting',
  title: 'Format for Clarity',
  description: 'Use headings, lists, and code blocks where helpful. Clear formatting saves time for every reader.'
}, {
  id: 'reliable-hosting',
  title: 'Use Reliable File Hosting',
  description: 'Share files through trusted hosts and include enough context for members to understand what they are downloading.'
}];
const PREMIUM_METHODS: PremiumMethod[] = [{
  id: 'quality-posts',
  label: 'Contribute 50+ quality posts'
}, {
  id: 'marketplace-purchase',
  label: 'Purchase from the Marketplace'
}, {
  id: 'give-away',
  label: 'Win a Give-Away event'
}, {
  id: 'active-referrals',
  label: 'Refer 5+ active members'
}];
const CONSEQUENCES: ConsequenceRow[] = [{
  id: 'minor',
  level: 'Minor',
  action: 'Warning',
  duration: 'Logged on account',
  tone: 'minor'
}, {
  id: 'major',
  level: 'Major',
  action: 'Temp-ban',
  duration: '7-30 days',
  tone: 'major'
}, {
  id: 'critical',
  level: 'Critical',
  action: 'Permanent-ban',
  duration: 'Indefinite',
  tone: 'critical'
}];
const SectionHeading = ({
  icon: Icon,
  title,
  eyebrow,
  tone = 'primary',
  headingId
}: SectionHeadingProps) => {
  return <div className="mb-5 flex items-start gap-3">
      <span className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white shadow-sm', tone === 'amber' ? 'border-amber-100 text-amber-600' : tone === 'danger' ? 'border-red-100 text-red-600' : 'border-sky-100 text-[#0ea5e9]')}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className={cn('block text-xs font-extrabold uppercase tracking-[0.18em]', tone === 'amber' ? 'text-amber-700' : tone === 'danger' ? 'text-red-600' : 'text-[#0ea5e9]')}>{eyebrow}</span>
        <h2 id={headingId} className="mt-1 text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
          <span>{title}</span>
        </h2>
      </span>
    </div>;
};
export const ForumRulesPage: React.FC = () => {
  return <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827]">
      <div className="mx-auto flex max-w-[1440px]">

        <SideRail />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <motion.article initial={{
          opacity: 0,
          y: 16
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.35,
          ease: 'easeOut'
        }} className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
            <header className="border-b border-[#e5e7eb] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[#0ea5e9]">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    <span>Community Standards</span>
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl lg:text-5xl">
                    <span>Forum Rules</span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-[#6b7280]">
                    <span>Please read these instructions before participating. They keep MegaFlow organized, respectful, and useful for every member.</span>
                  </p>
                </div>
                <div className="flex w-fit shrink-0 items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] shadow-sm">
                  <Calendar className="h-4 w-4 text-[#0ea5e9]" aria-hidden="true" />
                  <span>Last updated July 2026</span>
                </div>
              </div>
            </header>

            <div className="bg-[#f6f7f8] p-3 sm:p-4 lg:p-5">
              <nav className="mb-4 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-5" aria-label="Table of contents">
                <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0ea5e9]">
                  <span>Table of contents</span>
                </h2>
                <ol className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                  {TABLE_OF_CONTENTS.map(item => <li key={item.id} className="group">
                      <a href={`#${item.id}`} className="flex h-full items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-3 py-3 text-sm font-bold text-[#111827] hover:border-sky-200 hover:text-[#0ea5e9] hover:shadow-sm hover:shadow-sky-100/70">
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f6f7f8] text-xs font-extrabold text-[#6b7280] ring-1 ring-[#e5e7eb] group-hover:bg-sky-50 group-hover:text-[#0ea5e9]">{TABLE_OF_CONTENTS.findIndex(tocItem => tocItem.id === item.id) + 1}</span>
                          <span className="truncate">{item.label}</span>
                        </span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-[#6b7280] group-hover:text-[#0ea5e9]" aria-hidden="true" />
                      </a>
                    </li>)}
                </ol>
              </nav>

              <div className="space-y-4">
                <section id="general-rules" aria-labelledby="general-rules-title" className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                  <SectionHeading icon={AlertCircle} title="General Rules" eyebrow="Start here" headingId="general-rules-title" />
                  <ol className="space-y-3">
                    {GENERAL_RULES.map(rule => <li key={rule.id} className="group rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/70 sm:grid sm:grid-cols-[auto_1fr] sm:gap-4">
                        <span className="mb-3 flex items-center gap-2 sm:mb-0 sm:block">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sm font-extrabold text-[#0ea5e9] ring-1 ring-sky-100">{GENERAL_RULES.findIndex(generalRule => generalRule.id === rule.id) + 1}</span>
                          <CircleDot className="h-5 w-5 text-[#0ea5e9] sm:mt-3 sm:ml-2" aria-hidden="true" />
                        </span>
                        <span>
                          <h3 id={rule.id} className="text-base font-extrabold leading-snug text-[#111827] sm:text-lg">
                            <span>{rule.title}</span>
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-[#6b7280]">
                            <span>{rule.description}</span>
                          </p>
                        </span>
                      </li>)}
                  </ol>
                </section>

                <section id="posting-guidelines" aria-labelledby="posting-guidelines-title" className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                  <SectionHeading icon={FileText} title="Posting Guidelines" eyebrow="Before publishing" headingId="posting-guidelines-title" />
                  <ul className="grid gap-3 md:grid-cols-2">
                    {POSTING_GUIDELINES.map(rule => <li key={rule.id} className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/70">
                        <span className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0ea5e9]" aria-hidden="true" />
                          <strong className="text-base font-extrabold text-[#111827]">{rule.title}</strong>
                        </span>
                        <p className="mt-3 text-sm leading-7 text-[#6b7280]">
                          <span>{rule.description}</span>
                        </p>
                      </li>)}
                  </ul>
                </section>

                <section id="premium-membership" aria-labelledby="premium-membership-title" className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm sm:p-6 lg:p-8">
                  <SectionHeading icon={Star} title="Premium Membership" eyebrow="Earn access" tone="amber" headingId="premium-membership-title" />
                  <p className="max-w-3xl text-sm leading-7 text-amber-950/80">
                    <span>Premium status is reserved for members who consistently add value to the community. You can qualify through contribution, participation, or approved marketplace activity.</span>
                  </p>
                  <ul className="mt-5 grid gap-3 md:grid-cols-2">
                    {PREMIUM_METHODS.map(method => <li key={method.id} className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3 text-sm font-bold text-[#111827] shadow-sm">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
                        <span>{method.label}</span>
                      </li>)}
                  </ul>
                </section>

                <section id="consequences" aria-labelledby="consequences-title" className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                  <SectionHeading icon={AlertTriangle} title="Consequences" eyebrow="Moderation path" tone="danger" headingId="consequences-title" />
                  <div className="overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white">
                    <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                      <caption className="sr-only">Forum rule violation levels and moderation actions</caption>
                      <thead className="bg-[#f6f7f8] text-xs uppercase tracking-[0.14em] text-[#6b7280]">
                        <tr>
                          <th scope="col" className="px-5 py-4 font-extrabold"><span>Violation</span></th>
                          <th scope="col" className="px-5 py-4 font-extrabold"><span>Admin action</span></th>
                          <th scope="col" className="px-5 py-4 font-extrabold"><span>Duration</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb] bg-white">
                        {CONSEQUENCES.map(row => <tr key={row.id} className="hover:bg-[#f6f7f8]">
                            <td className="px-5 py-5">
                              <span className="flex items-center gap-3 font-extrabold text-[#111827]">
                                <AlertTriangle className={cn('h-5 w-5', row.tone === 'minor' ? 'text-amber-400' : row.tone === 'major' ? 'text-orange-500' : 'text-red-600')} aria-hidden="true" />
                                <span>{row.level}</span>
                              </span>
                            </td>
                            <td className="px-5 py-5 font-semibold text-[#374151]"><span>{row.action}</span></td>
                            <td className="px-5 py-5 text-[#6b7280]"><span>{row.duration}</span></td>
                          </tr>)}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section id="contact-admin" aria-labelledby="contact-admin-title" className="rounded-2xl border border-sky-100 bg-sky-50 p-4 shadow-sm sm:p-6 lg:p-8">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0ea5e9] shadow-sm ring-1 ring-sky-100">
                        <Mail className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span>
                        <h2 id="contact-admin-title" className="text-2xl font-extrabold tracking-tight text-[#111827]">
                          <span>Contact Admin</span>
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6b7280]">
                          <span>For urgent issues, business inquiries, or appeal requests, contact </span>
                          <strong className="font-extrabold text-[#0ea5e9]">@admin</strong>
                          <span> on Telegram or use the official Contact Us page.</span>
                        </p>
                      </span>
                    </div>
                    <a href="#" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0ea5e9] px-4 py-3 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      <span>Open Telegram</span>
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </motion.article>
        </main>
      </div>

    </div>;
};