"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Contexts ───────────────────────────────────────── */
import { useEvents } from "@/context/EventsContext";
import { useNews } from "@/context/NewsContext";
import { useCommittees } from "@/context/CommitteesContext";
import { useDonations } from "@/context/DonationsContext";

/* ─── Components ─────────────────────────────────────── */
import HeroBanner from "@/components/ui/HeroBanner";
import SectionHeader from "@/components/ui/SectionHeader";
import CTASection from "@/components/ui/CTASection";
import GalleryLightbox from "@/components/ui/GalleryLightbox";
import AlertBanner from "@/components/ui/AlertBanner";
import EventCard from "@/components/cards/EventCard";
import NewsCard from "@/components/cards/NewsCard";
import SpotlightCard from "@/components/cards/SpotlightCard";
import CommitteeCard from "@/components/cards/CommitteeCard";

/* ─── Utils ──────────────────────────────────────────── */
import { cn } from "@/utils/cn";
import { useToast } from "@/hooks/useToast";
import { useLocalStorage } from "@/hooks/useLocalStorage";

/* ══════════════════════════════════════════════════════
   1. ANNOUNCEMENT BAR
   ══════════════════════════════════════════════════════ */
function AnnouncementBar() {
  const { getBreaking, getPublished } = useNews();
  const [dismissed, setDismissed] = useState(false);

  const breaking = useMemo(() => {
    const items = getBreaking();
    return items[0] ?? getPublished().find((p) => p.isPinned) ?? null;
  }, [getBreaking, getPublished]);

  if (!breaking || dismissed) return null;

  return (
    <AlertBanner
      type="warning"
      title="Breaking"
      message={breaking.title}
      dismissible
      onDismiss={() => setDismissed(true)}
      action={{
        label: "Read more →",
        onClick: () => window.location.assign(`/news/${breaking.slug}`),
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════
   3. STATS STRIP
   ══════════════════════════════════════════════════════ */
const PLATFORM_STATS = [
  { label: "Members", value: "500+", icon: "👥" },
  { label: "Years of Service", value: "25+", icon: "🏆" },
  { label: "Annual Events", value: "20+", icon: "🗓️" },
  { label: "Community Projects", value: "50+", icon: "🏘️" },
  { label: "Raised for Lagos", value: "$250K+", icon: "💚" },
];

function StatsStrip() {
  return (
    <section
      className="relative overflow-hidden py-10"
      style={{ background: "var(--color-green-900)" }}
      aria-label="Platform statistics"
    >
      {/* Subtle dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-green-300) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {PLATFORM_STATS.map((stat, i) => (
            <motion.li
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
              className="flex flex-col items-center gap-1 text-center"
            >
              <span className="text-2xl" aria-hidden="true">
                {stat.icon}
              </span>
              <span
                className="text-3xl font-extrabold tracking-tight"
                style={{ color: "var(--color-gold-300)" }}
              >
                {stat.value}
              </span>
              <span className="text-sm font-medium text-white/80">
                {stat.label}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   4. MISSION SECTION
   ══════════════════════════════════════════════════════ */
function MissionSection() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ background: "var(--color-neutral-50)" }}
      aria-labelledby="mission-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-green-600)" }}
            >
              Our Mission
            </span>
            <h2
              id="mission-heading"
              className="text-3xl font-extrabold leading-tight sm:text-4xl"
              style={{ color: "var(--color-green-950)" }}
            >
              Uniting Lagosians in Philadelphia —{" "}
              <span style={{ color: "var(--color-green-600)" }}>
                keeping the Eko spirit alive.
              </span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--color-neutral-600)" }}>
              Eko Club Philadelphia is a vibrant chapter of Eko Club International —
              a non-profit organization bringing together Lagosians in the diaspora.
              We foster unity and fellowship among our members, celebrate the rich
              cultural heritage of Lagos State, and contribute to the social and
              economic development of our homeland through cultural events, social
              welfare projects, and community activities.
            </p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                "Cultural celebrations & festivals",
                "Social welfare initiatives",
                "Scholarship & youth programmes",
                "Lagos State development projects",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-neutral-700)" }}>
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: "var(--color-green-500)" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: "var(--color-green-700)" }}
              >
                Learn about us
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2"
                style={{
                  borderColor: "var(--color-green-600)",
                  color: "var(--color-green-700)",
                }}
              >
                Join Eko Club Philadelphia
              </Link>
            </div>
          </motion.div>

          {/* SpotlightCard */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SpotlightCard
              eyebrow="Our Community"
              title="500+ Lagosians in Philadelphia"
              titleClassName="text-green-400"
              subtitle="Members across the Delaware Valley"
              description="Eko Club Philadelphia has been bringing together Lagosians in the diaspora for over two decades — through cultural galas, scholarship funds, community service, and a deep commitment to the development of Lagos State."
              stats={[
                { label: "Active Members", value: "500+" },
                { label: "Annual Events", value: "20+" },
                { label: "Years Active", value: "25+" },
              ]}
              ctas={[
                { label: "About Us", href: "/about", variant: "primary" },
                { label: "Join Us", href: "/register", variant: "outline" },
              ]}
              imageUrl="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600"
              imageAlt="Eko Club Philadelphia community at cultural event"
              accentColor="green"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   5. UPCOMING EVENTS PREVIEW
   ══════════════════════════════════════════════════════ */
function EventsPreview() {
  const { getUpcoming, getPublished } = useEvents();

  const upcoming = useMemo(() => {
    const evts = getUpcoming().filter((e) => e.status === "published").slice(0, 3);
    if (evts.length > 0) return evts;
    return getPublished().slice(0, 3);
  }, [getUpcoming, getPublished]);

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      aria-labelledby="events-heading"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="What's On"
          heading="Upcoming Events"
          headingAccent="Events"
          subheading="Town halls, workshops, volunteer days, and community meetups across Lagos."
          align="left"
          withBar
          action={
            <Link
              href="/events"
              className="shrink-0 text-sm font-semibold transition-colors hover:underline"
              style={{ color: "var(--color-green-600)" }}
            >
              View all events →
            </Link>
          }
        />

        {upcoming.length === 0 ? (
          <p className="mt-10 text-center text-sm" style={{ color: "var(--color-neutral-500)" }}>
            No upcoming events found. Check back soon!
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1, ease: "easeOut" }}
              >
                <EventCard
                  id={event.id}
                  title={event.title}
                  date={event.date}
                  endDate={event.endDate}
                  time={event.time}
                  location={event.location}
                  isOnline={event.isOnline}
                  type={event.type as import("@/components/cards/EventCard").EventType}
                  description={event.shortDescription ?? event.description}
                  imageUrl={event.imageUrl}
                  organizer={event.organizerName}
                  maxAttendees={event.maxAttendees}
                  isFeatured={event.isFeatured}
                  tags={event.tags}
                  registrationUrl={`/events/${event.slug}`}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA row */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: "var(--color-green-700)" }}
          >
            Browse all events
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   6. NEWS PREVIEW
   ══════════════════════════════════════════════════════ */
function NewsPreview() {
  const { getFeatured, getPublished, getBreaking } = useNews();

  const { featured, rest } = useMemo(() => {
    const breaking = getBreaking()[0] ?? null;
    const featuredList = getFeatured();
    const top = breaking ?? featuredList[0] ?? getPublished()[0];
    const remaining = getPublished()
      .filter((p) => p.id !== top?.id)
      .slice(0, 4);
    return { featured: top, rest: remaining };
  }, [getFeatured, getPublished, getBreaking]);

  if (!featured) return null;

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ background: "var(--color-neutral-50)" }}
      aria-labelledby="news-heading"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Latest News"
          heading="News & Announcements"
          headingAccent="News"
          subheading="Stay up to date with Eko Club Philadelphia events, member news, and Lagos development updates."
          align="left"
          withBar
          action={
            <Link
              href="/news"
              className="shrink-0 text-sm font-semibold transition-colors hover:underline"
              style={{ color: "var(--color-green-600)" }}
            >
              All news →
            </Link>
          }
        />

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Featured left column */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <NewsCard
              id={featured.id}
              title={featured.title}
              slug={featured.slug}
              excerpt={featured.excerpt}
              category={featured.category}
              publishedAt={featured.publishedAt ?? featured.createdAt}
              author={
                featured.authorName
                  ? { name: featured.authorName, avatarUrl: featured.authorAvatarUrl }
                  : undefined
              }
              imageUrl={featured.imageUrl}
              readingTime={featured.readingTimeMinutes}
              isBreaking={featured.isBreaking}
              isPinned={featured.isPinned}
              layout="featured"
            />
          </motion.div>

          {/* Right column: list */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {rest.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              >
                <NewsCard
                  id={post.id}
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  category={post.category}
                  publishedAt={post.publishedAt ?? post.createdAt}
                  author={
                    post.authorName
                      ? { name: post.authorName, avatarUrl: post.authorAvatarUrl }
                      : undefined
                  }
                  imageUrl={post.imageUrl}
                  readingTime={post.readingTimeMinutes}
                  layout="horizontal"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   7. SPOTLIGHT PREVIEW
   ══════════════════════════════════════════════════════ */
function SpotlightPreview() {
  const { committees } = useCommittees();

  const techCommittee = useMemo(
    () =>
      committees.find((c) => c.slug === "technology-innovation-committee") ??
      committees[committees.length - 1] ??
      null,
    [committees]
  );

  if (!techCommittee) return null;

  const chairperson = techCommittee.members.find((m) => m.isChairperson) ?? techCommittee.members[0];

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ background: "var(--color-green-950)" }}
      aria-labelledby="spotlight-heading"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Member Spotlight"
          heading="People Driving Our Mission"
          headingAccent="Mission"
          subheading="Meet the dedicated members and committee leaders powering Eko Club Philadelphia."
          align="center"
          dark
        />

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {committees.slice(0, 3).map((committee, i) => {
            const chair = committee.members.find((m) => m.isChairperson);
            if (!chair) return null;
            return (
              <motion.div
                key={committee.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
              >
                <SpotlightCard
                  eyebrow={committee.name}
                  title={chair.name}
                  subtitle={chair.role}
                  description={
                    chair.bio ??
                    `${chair.role} of the ${committee.name}, working to advance Eko Club Philadelphia's mission.`
                  }
                  imageUrl={chair.imageUrl}
                  imageAlt={chair.name}
                  accentColor={i === 0 ? "green" : i === 1 ? "gold" : "neutral"}
                  theme="dark"
                  ctas={[
                    {
                      label: "View Committee",
                      href: `/committees/${committee.slug}`,
                      variant: "outline",
                    },
                  ]}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   8. COMMITTEES PREVIEW
   ══════════════════════════════════════════════════════ */
function CommitteesPreview() {
  const { getActive } = useCommittees();

  const committees = useMemo(() => getActive().slice(0, 4), [getActive]);

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      aria-labelledby="committees-heading"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Structure"
          heading="Our Committees"
          headingAccent="Committees"
          subheading="Eko Club Philadelphia is organised into standing committees, each focused on key areas of our community mission."
          align="center"
          withBar
        />

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {committees.map((committee, i) => {
            const chair = committee.members.find((m) => m.isChairperson) ?? committee.members[0];
            return (
              <motion.div
                key={committee.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1, ease: "easeOut" }}
              >
                {/* Committee card */}
                <Link
                  href={`/committees/${committee.slug}`}
                  className="group flex h-full flex-col gap-4 rounded-2xl border p-6 transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    borderColor: "var(--color-neutral-200)",
                    background: "var(--color-neutral-50)",
                  }}
                >
                  {/* Type badge */}
                  <span
                    className="inline-block self-start rounded-full px-3 py-0.5 text-xs font-semibold capitalize"
                    style={{
                      background: "var(--color-green-100)",
                      color: "var(--color-green-800)",
                    }}
                  >
                    {committee.type}
                  </span>

                  {/* Name */}
                  <h3
                    className="text-base font-bold leading-snug transition-colors group-hover:underline"
                    style={{ color: "var(--color-green-900)" }}
                  >
                    {committee.name}
                  </h3>

                  {/* Description */}
                  <p
                    className="line-clamp-3 text-sm leading-relaxed"
                    style={{ color: "var(--color-neutral-600)" }}
                  >
                    {committee.description}
                  </p>

                  {/* Chair */}
                  {chair && (
                    <div className="mt-auto flex items-center gap-2 border-t pt-4" style={{ borderColor: "var(--color-neutral-200)" }}>
                      {chair.imageUrl ? (
                        <Image
                          src={chair.imageUrl}
                          alt={chair.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: "var(--color-green-700)" }}
                        >
                          {chair.name.charAt(0)}
                        </span>
                      )}
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "var(--color-neutral-800)" }}>
                          {chair.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-neutral-600)" }}>
                          {chair.role}
                        </p>
                      </div>
                      {/* member count */}
                      <span
                        className="ml-auto text-xs"
                        style={{ color: "var(--color-neutral-600)" }}
                      >
                        {committee.members.length} member{committee.members.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/committees"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition hover:bg-white focus-visible:outline-none focus-visible:ring-2"
            style={{
              borderColor: "var(--color-green-600)",
              color: "var(--color-green-700)",
            }}
          >
            View all committees
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   9. GALLERY TEASER
   ══════════════════════════════════════════════════════ */
const GALLERY_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=800",
    alt: "Eko Club Philadelphia cultural gala celebration",
    caption: "Annual Cultural Gala 2025",
  },
  {
    src: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800",
    alt: "Eko Club Philadelphia community meeting in Philadelphia",
    caption: "General Assembly — Philadelphia 2025",
  },
  {
    src: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800",
    alt: "Scholarship award ceremony for Lagosian students",
    caption: "Scholarship Presentation Ceremony",
  },
  {
    src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    alt: "Eko Club Philadelphia annual dinner and awards",
    caption: "Annual Dinner & Awards Night",
  },
  {
    src: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800",
    alt: "Youth engagement programme hosted by Eko Club Philadelphia",
    caption: "Youth & Culture Forum",
  },
  {
    src: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
    alt: "Community outreach and social welfare project",
    caption: "Community Outreach Day",
  },
];

function GalleryTeaser() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ background: "var(--color-neutral-50)" }}
      aria-labelledby="gallery-heading"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="In Pictures"
          heading="Eko Club Philadelphia in Action"
          headingAccent="Action"
          subheading="A glimpse into our cultural galas, community gatherings, scholarship ceremonies, and outreach events."
          align="center"
          withBar
        />

        <div className="mt-10">
          <GalleryLightbox images={GALLERY_IMAGES} columns={3} />
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: "var(--color-green-700)" }}
          >
            View full gallery
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   10. SPONSORS BAND
   ══════════════════════════════════════════════════════ */
const SPONSORS = [
  { name: "Eko Club International", logo: null },
  { name: "Lagos State Government", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Lagos_State_Government_logo.svg/200px-Lagos_State_Government_logo.svg.png" },
  { name: "NIDO Philadelphia", logo: null },
  { name: "Nigerian Community PA", logo: null },
  { name: "Lagosians in Diaspora", logo: null },
  { name: "Lagos Diaspora Forum", logo: null },
];

function SponsorsBand() {
  return (
    <section
      className="py-14 px-4 sm:px-6 lg:px-8 border-y"
      style={{ borderColor: "var(--color-neutral-200)", background: "#fff" }}
      aria-label="Our partners and sponsors"
    >
      <div className="mx-auto max-w-7xl">
        <p
          className="mb-8 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-neutral-600)" }}
        >
          Trusted partners & supporters
        </p>

        {/* Marquee-style infinite scroll */}
        <div className="relative overflow-hidden">
          <div className="flex animate-[scroll_30s_linear_infinite] gap-16 will-change-transform">
            {[...SPONSORS, ...SPONSORS].map((sponsor, i) => (
              <div
                key={`${sponsor.name}-${i}`}
                className="flex shrink-0 items-center justify-center"
              >
                {sponsor.logo ? (
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={100}
                    height={40}
                    className="h-8 w-auto object-contain opacity-50 grayscale transition hover:opacity-80 hover:grayscale-0"
                    unoptimized
                  />
                ) : (
                  <span
                    className="whitespace-nowrap text-sm font-semibold opacity-60"
                    style={{ color: "var(--color-neutral-700)" }}
                  >
                    {sponsor.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   11. DONATION CALLOUT
   ══════════════════════════════════════════════════════ */
function DonationCallout() {
  const { getTotalSuccessful, donations } = useDonations();

  const { total, count } = useMemo(() => ({
    total: getTotalSuccessful(),
    count: donations.filter((d) => d.status === "successful").length,
  }), [getTotalSuccessful, donations]);

  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(total);

  return (
    <CTASection
      eyebrow="Support Our Work"
      heading="Help Fund Our"
      headingAccent="Community"
      description={`Eko Club Philadelphia (ECP) is committed to uplifting and strengthening our community through impactful programs and initiatives, including cultural events, scholarship programs, health education, social welfare outreach, and support for the development of Lagos State.
      Your generous support is an investment in the future of our community. Contributions to ECP help sustain our mission, create opportunities, empower individuals, and build a stronger and more vibrant future for all.`}
      variant="green"
      pattern
      trustLabel="Every dollar goes directly to community programmes"
      buttons={[
        { label: "Donate Now", href: "/donate", variant: "white" },
        { label: "Our Impact", href: "/news", variant: "outline" },
      ]}
    />
  );
}

/* ══════════════════════════════════════════════════════
   12. NEWSLETTER SIGNUP
   ══════════════════════════════════════════════════════ */
function NewsletterSignup() {
  const { success, error } = useToast();
  const [subscribers, setSubscribers] = useLocalStorage<string[]>("ecp_newsletter_subscribers", []);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      error("Please enter a valid email address.");
      return;
    }
    if (subscribers.includes(trimmed)) {
      error("This email is already subscribed.");
      return;
    }
    setSubmitting(true);
    // Simulate async save
    setTimeout(() => {
      setSubscribers([...subscribers, trimmed]);
      setEmail("");
      setSubmitting(false);
      success("You're subscribed! Welcome to the Eko Club Philadelphia community. 🎉");
    }, 600);
  }

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ background: "var(--color-gold-50)" }}
      aria-labelledby="newsletter-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <span
            className="text-3xl"
            role="img"
            aria-label="Letter"
          >
            ✉️
          </span>
          <h2
            id="newsletter-heading"
            className="text-3xl font-extrabold leading-tight sm:text-4xl"
            style={{ color: "var(--color-green-950)" }}
          >
            Stay Connected.{" "}
            <span style={{ color: "var(--color-green-600)" }}>
              Stay Engaged.
            </span>
          </h2>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--color-neutral-600)" }}
          >
            Get the Eko Club Philadelphia newsletter — cultural event updates,
            community news, and Lagos development highlights — delivered straight
            to your inbox. No spam. Unsubscribe anytime.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
            noValidate
            aria-label="Newsletter signup form"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={submitting}
              className="flex-1 rounded-full border px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2 disabled:opacity-60"
              style={{
                borderColor: "var(--color-neutral-300)",
                background: "#fff",
                color: "var(--color-neutral-900)",
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
              style={{ background: "var(--color-green-700)" }}
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Joining…
                </>
              ) : (
                "Subscribe"
              )}
            </button>
          </form>

          <p className="text-xs" style={{ color: "var(--color-neutral-600)" }}>
            Join {subscribers.length > 0 ? `${subscribers.length.toLocaleString()}+` : "hundreds of"} Eko Club Philadelphia members already subscribed.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT EXPORT
   ══════════════════════════════════════════════════════ */
export default function HomePageClient() {
  return (
    <>
      {/* 1. Announcement bar */}
      <AnnouncementBar />

      {/* 2. Hero section */}
      <HeroBanner
        eyebrow="Eko Club Philadelphia — Est. 1998"
        headline="Lagosians United"
        headlineAccent="in Philadelphia"
        description="Eko Club Philadelphia is a chapter of Eko Club International, bringing together Lagosians in the diaspora to celebrate our culture, support our community, and advance the development of Lagos State."
        ctas={[
          { label: "Become a Member", href: "/register", variant: "primary" },
          { label: "Explore Events", href: "/events", variant: "secondary" },
          { label: "Donate Today", href: "/donate", variant: "outline" },
        ]}
        imageUrl="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=900"
        imageAlt="Eko Club Philadelphia members at a community celebration"
        variant="gradient"
        stats={[
          { label: "Members", value: "500+" },
          { label: "Years Active", value: "25+" },
          { label: "Events / Year", value: "20+" },
        ]}
      />

      {/* 3. Stats strip */}
      <StatsStrip />

      {/* 4. Mission section */}
      <MissionSection />

      {/* 5. Upcoming events */}
      <EventsPreview />

      {/* 6. News preview */}
      <NewsPreview />

      {/* 7. Spotlight */}
      <SpotlightPreview />

      {/* 8. Committees */}
      <CommitteesPreview />

      {/* 9. Gallery teaser */}
      <GalleryTeaser />

      {/* 10. Sponsors */}
      <SponsorsBand />

      {/* 11. Donation callout */}
      <DonationCallout />

      {/* 12. Newsletter */}
      <NewsletterSignup />
    </>
  );
}
