/**
 * ============================================================================
 * MALABAR DARBAR — Malabar Wedding Attire Rental, Kozhikode — v3
 * ----------------------------------------------------------------------------
 * v3 redesign notes:
 *  - Two-mode theme: light = off-white stage + deep red accent, dark = black
 *    stage + red-shade accent. Same CSS custom-property names as before
 *    (--gold / --gold-bright / --gold-deep / --maroon*) just re-pointed to
 *    red tones, so the whole component tree needed almost no renaming.
 *  - Full-bleed video hero: landscape.mp4 / vertical.mp4 swapped live off the
 *    device orientation, framed with an inset "shadow border" + vignette.
 *  - Transparent nav over the hero that solidifies on scroll. Five sections:
 *    Home, Collections, Groomsmen, Happy Marriages, Contact Us.
 *  - Classy English-editorial type pairing: Cormorant Garamond (headings) +
 *    Archivo (UI/body).
 *  - Real photography throughout: Collections + Happy Marriages use
 *    hover/tap "a → b" image swaps; Groomsmen uses the Aceternity Hero Parallax scroll composition with
 *    three editorial image rows (no swap image available per person).
 *  - Native cursor dot + trailing ring (no dependency), disabled on touch.
 *  - The old cart/pricing/booking flow has been retired in favour of a
 *    showcase + "enquire on WhatsApp" pattern, which fits a rental studio
 *    with fixed, appointment-based fittings better than a live checkout.
 *
 * v3.1 update — enquire flow:
 *  - Every photo card (Collections / Groomsmen / Happy Couples) now opens an
 *    in-page EnquiryModal. On touch devices the first tap still flips the
 *    image; the "Enquire" pill (always visible) opens the modal directly.
 *    On fine-pointer devices a card click opens the modal directly.
 *  - Modal collects name / WhatsApp / place / date / duration / notes,
 *    validates locally, then hands off to wa.me with a pre-filled message.
 *
 * ASSET WIRING — do this once in your project before running:
 *   1. Copy your local `assets/wedfit` folder to  `public/assets/wedfit`
 *      (so it contains public/assets/wedfit/solo, /family, /groomsmen).
 *   2. Copy `landscape.mp4` and `vertical.mp4` into `public/videos/`.
 *   Vite/CRA/Next all serve anything under `public/` from `/`, which is
 *   exactly the paths ASSETS/VIDEOS below point at.
 * ============================================================================
 */

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { CometCard } from "@/components/ui/comet-card";
import {
  ChevronLeft, ChevronRight, ArrowRight,
  MapPin, Phone, Menu, X, Sun, Moon, Calendar,
} from "lucide-react";
import CDN_MAP from "./scripts/cloudinary-map.json";

function Instagram({ size = 24, strokeWidth = 2, className, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function WhatsApp({ size = 24, className, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.35 4.95L2 22l5.28-1.39a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.19 8.19 0 0 1-1.26-4.35c0-4.53 3.69-8.22 8.24-8.22 2.2 0 4.27.86 5.82 2.42a8.17 8.17 0 0 1 2.41 5.81c0 4.54-3.7 8.22-8.21 8.22zm4.52-6.16c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.96-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.04 0 1.2.88 2.37 1 2.53.12.16 1.73 2.64 4.2 3.7.59.25 1.05.4 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z" />
    </svg>
  );
}

/* ============================================================================
 * mock-data/studio.js
 * ============================================================================ */
const STUDIO = {
  area: "Near Mananchira, Kozhikode",
  phoneDisplay: "+91 98470 XX000",
  phoneHref: "tel:+9198470XX000",
  whatsappHref: "https://wa.me/919567832715",
  instagramHandle: "@malabardarbar",
  instagramHref: "https://instagram.com/malabardarbar",
  hours: [
    { day: "Mon – Sat", time: "10:00 AM – 8:00 PM" },
    { day: "Sunday", time: "By appointment" },
  ],
};

/* WhatsApp number used by the EnquiryModal (separate from the display number above). */
const ENQUIRY_WHATSAPP_NUMBER = "919567832715";
const ENQUIRY_STUDIO_NAME = "Wedfit";

/* ============================================================================
 * assets — Cloudinary CDN map + auto-optimization
 * ============================================================================ */
const ASSETS = CDN_MAP;
const CDN_TRANSFORM = "f_auto,q_auto"; // auto-format + auto-quality, then cached at the CDN edge

const cdnImage = (localPath) => {
  const url = CDN_MAP.images[localPath];
  if (!url) return localPath; // graceful fallback
  return url.replace("/upload/", `/upload/${CDN_TRANSFORM}/`);
};
const cdnVideo = (localPath) => {
  const url = CDN_MAP.videos[localPath];
  if (!url) return localPath;
  const isVertical = localPath.includes("vertical");
  const transform = isVertical
    ? "q_auto:eco,w_540,c_limit"
    : "q_auto:eco,w_1280,c_limit";
  return url.replace("/video/upload/", `/video/upload/${transform}/`);
};

const LOGO_SRC = cdnImage("/assets/wedfit/logo/website_logo.png");
/* NOTE: this q=... form resolves to the studio pin as long as the business name stays indexed on Google.
 * For production, prefer Google Maps → Share → "Embed a map" → copy the long src= (it contains the place ID)
 * and paste it here verbatim instead. */
const MAP_EMBED_SRC =
  "https://maps.google.com/maps?q=Wedfit+Kozhikode+Kerala&z=15&output=embed";

const COLLECTION_CATEGORIES = [
  { id: "wedding-suits", label: "Wedding Suits" },
  { id: "waistcoat", label: "Waistcoat" },
  { id: "jodhpuri", label: "Jodhpuri" },
  { id: "sherwani", label: "Sherwani" },
  { id: "indo-western", label: "Indo-Western" },
  { id: "dress-codes", label: "Dress Codes" },
];

// solo1 – solo9, mixed jpg/webp per your folder listing
const SOLO_EXT = { 1: "jpg", 2: "jpg", 3: "jpg", 4: "jpg", 5: "jpg", 6: "webp", 7: "webp", 8: "webp", 9: "jpg" };
const SOLO_ITEMS = Object.keys(SOLO_EXT).map((n) => ({
  id: `solo${n}`,
  a: cdnImage(`/assets/wedfit/solo/solo${n}-a.${SOLO_EXT[n]}`),
  b: cdnImage(`/assets/wedfit/solo/solo${n}-b.${SOLO_EXT[n]}`),
}));

// family1 – family8, all jpg
const FAMILY_ITEMS = Array.from({ length: 8 }, (_, i) => {
  const n = i + 1;
  return {
    id: `family${n}`,
    a: cdnImage(`/assets/wedfit/family/family${n}-a.jpg`),
    b: cdnImage(`/assets/wedfit/family/family${n}-b.jpg`),
  };
});

// groomsmen1 – groomsmen8, mixed jpg/webp, single shot each
const GROOMSMEN_EXT = { 1: "jpg", 2: "webp", 3: "webp", 4: "webp", 5: "webp", 6: "jpg", 7: "webp", 8: "jpg" };
const GROOMSMEN_ITEMS = Object.keys(GROOMSMEN_EXT).map((n) => ({
  id: `groomsmen${n}`,
  src: cdnImage(`/assets/wedfit/groomsmen/groomsmen${n}.${GROOMSMEN_EXT[n]}`),
}));

/* ============================================================================
 * hooks/useMagnetic.js
 * ============================================================================ */
function useMagnetic(strength = 0.28) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setOffset({
      x: (e.clientX - (rect.left + rect.width / 2)) * strength,
      y: (e.clientY - (rect.top + rect.height / 2)) * strength,
    });
  }, [strength]);
  const onMouseLeave = useCallback(() => setOffset({ x: 0, y: 0 }), []);
  return { ref, offset, onMouseMove, onMouseLeave };
}

/* ============================================================================
 * hooks/useOrientation.js — drives which hero video plays
 * ============================================================================ */
function useOrientation() {
  const [portrait, setPortrait] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(orientation: portrait)").matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const update = () => setPortrait(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);
  return portrait;
}

/* ============================================================================
 * hooks/usePointerFine.js — detects a real mouse/trackpad vs touch
 * ============================================================================ */
function usePointerFine() {
  const [fine, setFine] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
      : true
  );
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);
  return fine;
}

/* ============================================================================
 * hooks/useMediaQuery.js — generic breakpoint watcher (drives the groomsmen
 * carousel's desktop-pin vs mobile-stack switch)
 * ============================================================================ */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, [query]);
  return matches;
}

/* ============================================================================
 * hooks/usePrefersReducedMotion.js
 * ============================================================================ */
function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/* ============================================================================
 * components/MagneticButton.jsx
 * ============================================================================ */
function MagneticButton({ children, onClick, variant = "primary", ariaLabel, style, href }) {
  const { ref, offset, onMouseMove, onMouseLeave } = useMagnetic();
  const Tag = href ? "a" : "button";
  return (
    <Tag
      ref={ref}
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      aria-label={ariaLabel}
      className={`md-btn md-btn--${variant}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, ...style }}
    >
      {children}
    </Tag>
  );
}

/* ============================================================================
 * components/ThemeToggle.jsx
 * ============================================================================ */
function ThemeToggle({ theme, onToggle, compact }) {
  return (
    <button
      className={`md-theme-toggle ${compact ? "md-theme-toggle--compact" : ""}`}
      onClick={onToggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
      {compact && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}

/* ============================================================================
 * components/JaliDivider.jsx
 * ============================================================================ */
function JaliDivider() {
  return (
    <div className="md-jali" aria-hidden="true">
      <svg viewBox="0 0 480 24" preserveAspectRatio="none">
        <defs>
          <pattern id="jaliPattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M12 0 L24 12 L12 24 L0 12 Z M12 6 L18 12 L12 18 L6 12 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="480" height="24" fill="url(#jaliPattern)" />
      </svg>
    </div>
  );
}

/* ============================================================================
 * components/NavBar.jsx — transparent over the hero, solidifies on scroll
 * ============================================================================ */
const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#collections", label: "Collections" },
  { href: "#groomsmen", label: "Groomsmen" },
  { href: "#families", label: "Happy Couples" },
  { href: "#contact", label: "Contact Us" },
];

function NavBar({ theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (href) => {
    setMenuOpen(false);
    if (href === "#home") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className={`md-nav ${scrolled ? "md-nav--solid" : "md-nav--ghost"}`} aria-label="Primary">
      <button className="md-nav__brand" onClick={() => goTo("#home")} aria-label="Wedfit, home">
        <img src={LOGO_SRC} alt="Wedfit" className="md-nav__logo" loading="eager" fetchpriority="high" decoding="async" />
      </button>

      <div className="md-nav__links" role="none">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} className="md-nav__link" onClick={(e) => { e.preventDefault(); goTo(l.href); }}>
            {l.label}
          </a>
        ))}
      </div>

      <div className="md-nav__contact">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <a className="md-nav__icon" href={STUDIO.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
          <WhatsApp size={16} />
        </a>
        <a className="md-nav__icon" href={STUDIO.instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Wedfit on Instagram">
          <Instagram size={16} strokeWidth={1.8} />
        </a>
      </div>

      <button className="md-nav__burger" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
        {menuOpen ? <X size={20} strokeWidth={1.8} /> : <Menu size={20} strokeWidth={1.8} />}
      </button>

      {menuOpen && (
        <div className="md-nav__sheet" role="menu">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="md-nav__sheet-link" onClick={(e) => { e.preventDefault(); goTo(l.href); }}>
              {l.label}
            </a>
          ))}
          <div className="md-nav__sheet-contact">
            <a href={STUDIO.whatsappHref} target="_blank" rel="noopener noreferrer"><WhatsApp size={16} /> WhatsApp</a>
            <a href={STUDIO.instagramHref} target="_blank" rel="noopener noreferrer"><Instagram size={16} strokeWidth={1.8} /> Instagram</a>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
        </div>
      )}
    </nav>
  );
}

/* ============================================================================
 * components/Hero.jsx — full-bleed video, vignette + shadow-frame, orientation swap
 * ============================================================================ */
function Hero() {
  const portrait = useOrientation();
  const videoSrc = cdnVideo(portrait ? "/videos/vertical.mp4" : "/videos/landscape.mp4");
  const posterSrc = portrait
    ? cdnImage("/assets/wedfit/videos/vertical-poster.jpg")
    : cdnImage("/assets/wedfit/videos/landscape-poster.jpg");

  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);

  // Synchronously set muted and inline attributes on element attach to satisfy Safari autoplay heuristics before initial paint
  const setVideoRef = useCallback((el) => {
    if (el) {
      el.defaultMuted = true;
      el.muted = true;
      el.playsInline = true;
      el.setAttribute("muted", "");
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "true");
      const p = el.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    }
    videoRef.current = el;
  }, []);

  const playVideo = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      v.defaultMuted = true;
      v.muted = true;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    setVideoFailed(false);
    playVideo();
  }, [videoSrc, playVideo]);

  const scrollTo = (id) => (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <header className="md-hero" id="home">
      <div className="md-hero__video-wrap">
        {!videoFailed ? (
          <video
            ref={setVideoRef}
            key={videoSrc}
            src={videoSrc}
            className="md-hero__video"
            autoPlay
            muted
            defaultMuted
            loop
            playsInline
            webkit-playsinline="true"
            preload="auto"
            fetchpriority="high"
            poster={posterSrc}
            disablePictureInPicture
            disableRemotePlayback
            onLoadedData={playVideo}
            onCanPlay={playVideo}
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <img src={posterSrc} alt="" className="md-hero__video" fetchpriority="high" decoding="async" />
        )}
        <div className="md-hero__vignette" aria-hidden="true" />
      </div>

      <div className="md-hero__content">
        <h1 className="md-hero__title" style={{ "--i": 0 }}>
          Suits, sherwanis,<br />sorted.
        </h1>
        <p className="md-hero__sub" style={{ "--i": 1 }}>
          Wedding suits and accessories — to rent or to buy — for the groom and
          everyone standing beside him. Areekode, Kondotty, Manjeri and Mukkam.
        </p>
        <div className="md-hero__actions" style={{ "--i": 2 }}>
          <MagneticButton variant="primary" onClick={scrollTo("collections")} ariaLabel="Explore the collection">
            Explore the collection <ArrowRight size={16} strokeWidth={2} />
          </MagneticButton>
          <a className="md-hero__link" href="#contact" onClick={scrollTo("contact")}>Book a fitting</a>
        </div>
      </div>
    </header>
  );
}

/* ============================================================================
 * components/PhotoCard.jsx — the a/b hover-and-tap swap used everywhere
 * ============================================================================ */
function PhotoCard({
  id, a, b, label, enquireLabel,
  index = 0, wide,
  onEnquire,
}) {
  const [flip, setFlip] = useState(false);

  const fireEnquire = () =>
    onEnquire?.({
      id,
      label: enquireLabel || label,
      image: flip ? b : a,
      imageA: a,
      imageB: b,
      aspect: "3/4",
    });

  const cardContent = (extraClass = "") => (
    <div className={`md-photo__frame ${extraClass}`}>
      <img src={a} alt={label || "Wedfit outfit"} className={`md-photo__img md-photo__img--a ${flip ? "md-photo__img--out" : ""}`} loading="lazy" decoding="async" />
      <img src={b} alt="" aria-hidden="true" className={`md-photo__img md-photo__img--b ${flip ? "md-photo__img--in" : ""}`} loading="lazy" decoding="async" />
      <button
        type="button"
        className="md-photo__enquire"
        onClick={(e) => { e.stopPropagation(); fireEnquire(); }}
      >
        Enquire
      </button>
    </div>
  );

  return (
    <figure
      className={`md-photo ${wide ? "md-photo--wide" : ""}`}
      style={{ "--i": index }}
      onMouseEnter={() => setFlip(true)}
      onMouseLeave={() => setFlip(false)}
      onClick={fireEnquire}
    >
      <div className="md-photo__comet-wrap">
        <div className="md-photo__desktop-comet">
          <CometCard
            rotateDepth={17.5}
            translateDepth={20}
            className="w-full md-photo__comet"
          >
            {cardContent()}
          </CometCard>
        </div>
        <div className="md-photo__mobile-card">
          {cardContent()}
        </div>
      </div>
      {label && <figcaption className="md-photo__caption">{label}</figcaption>}
    </figure>
  );
}


/* ============================================================================
 * components/GlowingCollectionCard.jsx — mouse-tracked border glow
 * ============================================================================ */
function GlowingCollectionCard({ id, a, b, label, index = 0, onEnquire }) {
  const [flip, setFlip] = useState(false);
  const glowRef = useRef(null);

  const handleMove = useCallback((e) => {
    const el = glowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--gx", `${x}%`);
    el.style.setProperty("--gy", `${y}%`);
  }, []);

  const fireEnquire = () => onEnquire?.({ id, label, image: flip ? b : a, imageA: a, imageB: b, aspect: "3/4" });

  return (
    <figure
      className="md-photo"
      style={{ "--i": index }}
      onMouseEnter={() => setFlip(true)}
      onMouseLeave={() => setFlip(false)}
      onClick={fireEnquire}
    >
      <div className="md-glow" ref={glowRef} onMouseMove={handleMove}>
        <div className="md-photo__frame">
          <img
            src={a}
            alt={label || "Wedfit outfit"}
            className={`md-photo__img md-photo__img--a ${flip ? "md-photo__img--out" : ""}`}
            loading="lazy"
            decoding="async"
          />
          <img
            src={b}
            alt=""
            aria-hidden="true"
            className={`md-photo__img md-photo__img--b ${flip ? "md-photo__img--in" : ""}`}
            loading="lazy"
            decoding="async"
          />
          <button
            type="button"
            className="md-photo__enquire"
            onClick={(e) => { e.stopPropagation(); fireEnquire(); }}
          >
            Enquire
          </button>
        </div>
      </div>
      {label && <figcaption className="md-photo__caption">{label}</figcaption>}
    </figure>
  );
}

/* ============================================================================
 * components/CollectionSection.jsx
 * ============================================================================ */
function CollectionSection({ onEnquire }) {
  const [active, setActive] = useState(COLLECTION_CATEGORIES[0].id);
  const activeLabel = COLLECTION_CATEGORIES.find((c) => c.id === active)?.label;

  return (
    <section className="md-section" id="collections" aria-labelledby="collections-heading">
      <div className="md-section__head">
        <div>
          <p className="md-eyebrow">The Collection</p>
          <h2 id="collections-heading" className="md-section__title">Every silhouette, tailored to the occasion</h2>
        </div>
        <p className="md-section__note">A rotating edit of what's on our racks right now.</p>
      </div>

      <div className="md-tabs" role="tablist" aria-label="Collection categories">
        {COLLECTION_CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={active === c.id}
            className={`md-tab ${active === c.id ? "md-tab--active" : ""}`}
            onClick={() => setActive(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="md-photo-grid md-photo-grid--wide" aria-label="Collection looks">
        {SOLO_ITEMS.map((item, i) => (
          <li key={`${active}-${item.id}`}>
            <GlowingCollectionCard
              id={item.id}
              a={item.a}
              b={item.b}
              label={`${activeLabel} 0${i + 1}`}
              index={i}
              onEnquire={onEnquire}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ============================================================================
 * components/GroomsmenSection.jsx — scroll carousel
 * ----------------------------------------------------------------------------
 * Swapped the old 3-row Aceternity parallax for a single-row scroll carousel:
 *  - Desktop (>=900px, no reduced-motion): the section pins via CSS
 *    `position: sticky` (no gsap/ScrollTrigger needed — motion/react is
 *    already a project dependency and this avoids shipping a second
 *    scroll-animation library) while an 8-card track translates horizontally,
 *    driven by scrollYProgress + a spring, with a slim progress bar.
 *  - Mobile / tablet (<900px): renders as a plain vertical stack that
 *    fades/slides each card in on scroll-into-view. No scroll-jacking, no
 *    pinned height, no reflow cost — this is the version most visitors on
 *    phones will actually see, so it's the one kept cheapest.
 *  - `prefers-reduced-motion: reduce`: falls back to the same static stack,
 *    animation-free.
 * ============================================================================ */
function GroomsmenCard({ product, index, onEnquire }) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="md-gm-card"
    >
      <button
        type="button"
        className="md-gm-card__link"
        onClick={() =>
          onEnquire?.({
            id: product.id,
            label: product.title,
            image: product.thumbnail,
            imageA: product.thumbnail,
            imageB: undefined,
            aspect: "16/10",
          })
        }
      >
        <img src={product.thumbnail} alt={product.title} loading="lazy" decoding="async" />
        <div className="md-gm-card__overlay" />
        <div className="md-gm-card__caption">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{product.title}</strong>
        </div>
      </button>
    </motion.div>
  );
}

function GroomsmenHeader() {
  return (
    <div className="md-gm-hero-header">
      <div>
        <p className="md-eyebrow">Standing With Him</p>
        <h2 id="groomsmen-heading" className="md-gm-hero-title">The groomsmen's line-up</h2>
        <p className="md-gm-hero-note">Coordinated looks for the whole party, moving together as one.</p>
      </div>
      <div className="md-gm-hero-mark" aria-hidden="true">
        <span>MD</span>
        <i />
        <small>08 LOOKS</small>
      </div>
    </div>
  );
}

/* Static, animation-free layout — used on mobile/tablet and whenever the
 * visitor has prefers-reduced-motion set, so it's also the fallback that
 * ships zero scroll-listener cost. */
function GroomsmenStack({ products, onEnquire, animated }) {
  return (
    <section className="md-gm-carousel md-gm-carousel--stack" id="groomsmen" aria-labelledby="groomsmen-heading">
      <GroomsmenHeader />
      <div className="md-gm-carousel__stack">
        {products.map((product, i) =>
          animated ? (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: (i % 2) * 0.06 }}
            >
              <GroomsmenCard product={product} index={i} onEnquire={onEnquire} />
            </motion.div>
          ) : (
            <GroomsmenCard key={product.id} product={product} index={i} onEnquire={onEnquire} />
          )
        )}
      </div>
    </section>
  );
}

/* Desktop & Mobile pinned 2-row runway scroll carousel. Pinning is done with `position: sticky`
 * inside a tall wrapper while 2 rows of 4 cards translate horizontally in counter-directions. */
function GroomsmenPinnedTrack({ products, onEnquire }) {
  const wrapRef = useRef(null);
  const row1Ref = useRef(null);
  const [scrollDistance, setScrollDistance] = useState(0);

  const row1 = useMemo(() => products.slice(0, 4), [products]);
  const row2 = useMemo(() => products.slice(4, 8), [products]);

  useLayoutEffect(() => {
    const row = row1Ref.current;
    const wrap = wrapRef.current;
    if (!row || !wrap) return;
    const measure = () => {
      const dist = Math.max(0, row.scrollWidth - wrap.offsetWidth + 60);
      setScrollDistance(dist);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [products.length]);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 240, damping: 32, mass: 0.3 });
  const x1 = useTransform(progress, [0, 1], [0, -scrollDistance]);
  const x2 = useTransform(progress, [0, 1], [-scrollDistance, 0]);

  return (
    <section
      ref={wrapRef}
      className="md-gm-carousel"
      id="groomsmen"
      aria-labelledby="groomsmen-heading"
      style={{ height: `calc(100vh + ${Math.max(scrollDistance * 1.3, 750)}px)` }}
    >
      <div className="md-gm-carousel__sticky">
        <GroomsmenHeader />
        <div className="md-gm-carousel__stage">
          <motion.div ref={row1Ref} className="md-gm-carousel__track" style={{ x: x1 }}>
            {row1.map((product, i) => (
              <GroomsmenCard key={product.id} product={product} index={i} onEnquire={onEnquire} />
            ))}
          </motion.div>
          <motion.div className="md-gm-carousel__track md-gm-carousel__track--rev" style={{ x: x2 }}>
            {row2.map((product, i) => (
              <GroomsmenCard key={product.id} product={product} index={i + 4} onEnquire={onEnquire} />
            ))}
          </motion.div>
        </div>
        <div className="md-gm-carousel__progress" aria-hidden="true">
          <motion.div className="md-gm-carousel__progress-bar" style={{ scaleX: progress }} />
        </div>
      </div>
    </section>
  );
}

function GroomsmenSection({ onEnquire }) {
  const products = useMemo(
    () =>
      GROOMSMEN_ITEMS.map((item, i) => ({
        id: item.id,
        title: `Groomsmen Look ${String(i + 1).padStart(2, "0")}`,
        thumbnail: item.src,
      })),
    []
  );
  const reducedMotion = usePrefersReducedMotion();

  if (!reducedMotion) {
    return <GroomsmenPinnedTrack products={products} onEnquire={onEnquire} />;
  }
  return <GroomsmenStack products={products} onEnquire={onEnquire} animated={false} />;
}

/* ============================================================================
 * components/FamiliesSection.jsx — "Happy Couples"
 * ============================================================================ */
function FamiliesSection({ onEnquire }) {
  return (
    <section className="md-section" id="families" aria-labelledby="families-heading">
      <div className="md-section__head">
        <div>
          <p className="md-eyebrow">Happy Couples</p>
          <h2 id="families-heading" className="md-section__title">Couples we've dressed</h2>
        </div>
        <p className="md-section__note">A few of the weddings across the Malabar coast our sets made it down the aisle for.</p>
      </div>

      <ul className="md-photo-grid md-photo-grid--wide" aria-label="Couples dressed for their weddings">
        {FAMILY_ITEMS.map((item, i) => (
          <li key={item.id}>
            <PhotoCard
              id={item.id}
              a={item.a}
              b={item.b}
              enquireLabel={`Couple Look ${String(i + 1).padStart(2, "0")}`}
              index={i}
              wide
              rotateDepth={17.5}
              translateDepth={20}
              onEnquire={onEnquire}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ============================================================================
 * components/ContactSection.jsx
 * ============================================================================ */
function ContactSection() {
  return (
    <section className="md-visit" id="contact" aria-labelledby="contact-heading">
      <div className="md-section__head">
        <div>
          <p className="md-eyebrow">Contact Us</p>
          <h2 id="contact-heading" className="md-section__title">Come try it on</h2>
          <p className="md-section__note">Fittings are by appointment — WhatsApp us a date or just call ahead.</p>
        </div>
      </div>

      <div className="md-visit__grid">
        <div className="md-visit__map" role="region" aria-label={`Map showing ${STUDIO.area}`}>
          <iframe
            className="md-visit__map-frame"
            src={MAP_EMBED_SRC}
            title={`Map showing ${STUDIO.area}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <span className="md-visit__map-label">{STUDIO.area}</span>
        </div>

        <div className="md-visit__details">
          <ul className="md-visit__list">
            <li><MapPin size={17} strokeWidth={1.8} aria-hidden="true" /><span>{STUDIO.area}, Kerala</span></li>
            <li><Phone size={17} strokeWidth={1.8} aria-hidden="true" /><a href={STUDIO.phoneHref}>{STUDIO.phoneDisplay}</a></li>
            <li><WhatsApp size={17} aria-hidden="true" /><a href={STUDIO.whatsappHref} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></li>
            <li><Instagram size={17} strokeWidth={1.8} aria-hidden="true" /><a href={STUDIO.instagramHref} target="_blank" rel="noopener noreferrer">{STUDIO.instagramHandle}</a></li>
          </ul>
          <div className="md-visit__hours">
            <h3 className="md-visit__hours-title">Studio hours</h3>
            {STUDIO.hours.map((h) => (
              <div className="md-visit__hours-row" key={h.day}>
                <span>{h.day}</span><span>{h.time}</span>
              </div>
            ))}
          </div>
          <MagneticButton variant="primary" href={STUDIO.whatsappHref} ariaLabel="Chat with the studio on WhatsApp">
            Book a fitting on WhatsApp <ArrowRight size={16} strokeWidth={2} />
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * components/EnquiryModal.jsx — inlined here so there's no extra file / import
 * path to get wrong. If you'd rather keep it separate, cut this whole block
 * into ./components/EnquiryModal.jsx and re-add
 *     import EnquiryModal from "./components/EnquiryModal";
 * ============================================================================ */
function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function EnquiryModal({ item, onClose }) {
  const modalRef = useRef(null);
  const nameRef = useRef(null);
  const previousFocusRef = useRef(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  const resetForm = useCallback(() => {
    setName("");
    setPhone("");
    setPlace("");
    setDate("");
    setEndDate("");
    setNotes("");
    setErrors({});
  }, []);

  // A modal is a fresh enquiry every time it opens — including a different product.
  useEffect(() => {
    if (item) resetForm();
  }, [item, resetForm]);

  // body scroll lock + focus trap + Esc-to-close + focus restore
  useEffect(() => {
    if (!item) return undefined;

    previousFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = requestAnimationFrame(() => nameRef.current?.focus());

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusables = modalRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const list = Array.from(focusables);
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown, true);
      cancelAnimationFrame(focusFrame);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
    };
  }, [item, onClose]);

  if (!item) return null;

  const handleBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Please enter your name.";
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) next.phone = "Enter a valid 10-digit WhatsApp number.";
    if (!place.trim()) next.place = "Please enter a place or address.";
    if (!date) next.date = "Please choose a date.";
    if (!endDate) {
      next.endDate = "Please choose when the booking ends.";
    } else if (date) {
      const days = Math.round((new Date(endDate) - new Date(date)) / 86400000) + 1;
      if (days < 1) next.endDate = "Booking till can't be before booking from.";
      else if (days > 4) next.endDate = "Bookings can be 1 to 4 days long.";
    }
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const digits = phone.replace(/\D/g, "");
    const startLabel = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const endLabel = new Date(`${endDate}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const days = Math.round((new Date(`${endDate}T00:00:00`) - new Date(`${date}T00:00:00`)) / 86400000) + 1;

    const leafId = item.imageA?.split("/").pop()?.replace(/\.[a-zA-Z0-9]+$/, "") || "";
    const shellUrl = leafId ? `https://ajaxnova.github.io/wedfit/look/${leafId}/` : "";

    const lines = [
      `*WEDFIT* 👋`,
      `Wedding Attire Enquiry`,
      ``,
      `*LOOK*`,
      `${item.label}`,
      ``,
      `*BOOKING*`,
      `📅 From  · ${startLabel}`,
      `📅 Till  · ${endLabel}`,
      `⏱️ Duration  · ${days} day${days > 1 ? "s" : ""}`,
      ``,
      `*GUEST DETAILS*`,
      `👤 Name      · ${name.trim()}`,
      `👤 WhatsApp  · +91 ${digits}`,
      `📍 Location   · ${place.trim()}`,
      ``,
      `*NOTE*`,
      `${notes.trim() || "No additional note"}`,
      ...(shellUrl ? [``, `🔗 ${shellUrl}`] : []),
      ``,
      `Please confirm availability and fitting details.`,
      `Thank you 🙏`
    ];

    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${ENQUIRY_WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer");
    resetForm();
    onClose();
  };

  return (
    <div className="md-enquiry-backdrop" onMouseDown={handleBackdropMouseDown}>
      <div
        className="md-enquiry-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="md-enquiry-title"
      >
        <button type="button" className="md-enquiry-close" onClick={onClose} aria-label="Close enquiry form">
          <X size={20} strokeWidth={1.8} />
        </button>

        <div className="md-enquiry-context">
          <div className={`md-enquiry-context__frame ${item.imageB ? "md-enquiry-context__frame--has-b" : ""}`} style={{ aspectRatio: item.aspect }}>
            <img src={item.imageA || item.image} alt={item.label} className="md-enquiry-context__img md-enquiry-context__img--a" loading="lazy" decoding="async" />
            {item.imageB && <img src={item.imageB} alt="" aria-hidden="true" className="md-enquiry-context__img md-enquiry-context__img--b" loading="lazy" decoding="async" />}
            {item.imageB && <span className="md-enquiry-context__hover-label" aria-hidden="true">Hover to view the second look</span>}
          </div>
          <p className="md-enquiry-context__caption">{item.label}</p>
          <p className="md-enquiry-context__note">We'll confirm availability on WhatsApp within a few hours.</p>
        </div>

        <form className="md-enquiry-form" onSubmit={handleSubmit} noValidate>
          <p className="md-eyebrow">Enquire</p>
          <h2 id="md-enquiry-title" className="md-enquiry-title">Reserve this look</h2>

          <div className={`md-enquiry-field ${errors.name ? "md-enquiry-field--error" : ""}`}>
            <label htmlFor="enquiry-name">Full name</label>
            <input
              id="enquiry-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
              placeholder="Your full name"
            />
            {errors.name && <p className="md-enquiry-field__error">{errors.name}</p>}
          </div>

          <div className={`md-enquiry-field ${errors.phone ? "md-enquiry-field--error" : ""}`}>
            <label htmlFor="enquiry-phone">WhatsApp number</label>
            <div className="md-enquiry-phone">
              <span className="md-enquiry-phone__prefix">+91</span>
              <input
                id="enquiry-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })); }}
                placeholder="98470 12345"
                maxLength={10}
              />
            </div>
            {errors.phone && <p className="md-enquiry-field__error">{errors.phone}</p>}
          </div>

          <div className={`md-enquiry-field ${errors.place ? "md-enquiry-field--error" : ""}`}>
            <label htmlFor="enquiry-place">Place / address</label>
            <textarea
              id="enquiry-place"
              rows={2}
              value={place}
              onChange={(e) => { setPlace(e.target.value); setErrors((p) => ({ ...p, place: undefined })); }}
              placeholder="Where should we plan the fitting around?"
            />
            {errors.place && <p className="md-enquiry-field__error">{errors.place}</p>}
          </div>

          <div className="md-enquiry-date-row">
            <div className={`md-enquiry-field ${errors.date ? "md-enquiry-field--error" : ""}`}>
              <label htmlFor="enquiry-start-date">Booking from</label>
              <div className="md-enquiry-date">
                <input
                  id="enquiry-start-date"
                  type="date"
                  min={todayISO()}
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })); }}
                />
                <Calendar size={16} strokeWidth={1.8} className="md-enquiry-date__icon" aria-hidden="true" />
              </div>
              {errors.date && <p className="md-enquiry-field__error">{errors.date}</p>}
            </div>

            <div className={`md-enquiry-field ${errors.endDate ? "md-enquiry-field--error" : ""}`}>
              <label htmlFor="enquiry-end-date">Booking till</label>
              <div className="md-enquiry-date">
                <input
                  id="enquiry-end-date"
                  type="date"
                  min={date || todayISO()}
                  max={date ? addDaysISO(date, 3) : undefined}
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setErrors((p) => ({ ...p, endDate: undefined })); }}
                />
                <Calendar size={16} strokeWidth={1.8} className="md-enquiry-date__icon" aria-hidden="true" />
              </div>
              {errors.endDate && <p className="md-enquiry-field__error">{errors.endDate}</p>}
            </div>
          </div>

          <div className="md-enquiry-field">
            <label htmlFor="enquiry-notes">Anything specific?</label>
            <textarea
              id="enquiry-notes"
              rows={1}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <button type="submit" className="md-btn md-btn--primary md-enquiry-submit">
            Continue on WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
 * App.jsx
 * ============================================================================ */
export default function App() {
  const [theme, setTheme] = useState("dark");
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="md-app" data-theme={theme}>
      <style>{STYLES}</style>
      <div className="md-grain" aria-hidden="true" />
      <NavBar theme={theme} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />

      <Hero />
      <JaliDivider />
      <CollectionSection onEnquire={setSelectedItem} />
      <GroomsmenSection onEnquire={setSelectedItem} />
      <FamiliesSection onEnquire={setSelectedItem} />
      <ContactSection />

      <EnquiryModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      <footer className="md-footer">
        <span>WEDFIT · Wedding attire rental, Kozhikode</span>
        <div className="md-footer__links">
          <a href={STUDIO.instagramHref} target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href={STUDIO.whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a href={STUDIO.phoneHref}>{STUDIO.phoneDisplay}</a>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================================
 * Stylesheet
 * ============================================================================ */
const STYLES = `
  :where(html, body){ margin:0; padding:0; }
  ::selection{ background:#E14953; color:#F8ECEA; }

  .md-app{
    color-scheme: dark;
    --bg:#0A0908; --bg-raised:#161211; --bg-raised-2:#201A18;
    --ink:#F4ECDD; --line:rgba(198,58,58,0.18); --line-strong:rgba(198,58,58,0.34);
    --gold:#9B2226; --gold-bright:#E14953; --gold-deep:#6B1418;
    --maroon:#B23349; --maroon-deep:#3D0C10; --maroon-bright:#E14953;
    --emerald:#241C1A; --sand:#120D0C;
    --nav-solid-bg: rgba(10,9,8,0.92);
    --shadow-card:0 24px 48px -22px rgba(0,0,0,0.7), 0 2px 0 rgba(255,255,255,0.03) inset;
    --shadow-lift:0 10px 30px -12px rgba(0,0,0,0.55);
    background:var(--bg); color:var(--ink);
    font-family:'Archivo', -apple-system, sans-serif;
    font-size:16px; line-height:1.6;
    min-height:100vh; overflow-x:clip; position:relative;
    transition:background 0.35s ease, color 0.35s ease;
  }
  .md-app[data-theme="light"]{
    color-scheme: light;
    --bg:#FBF6EC; --bg-raised:#FFFFFF; --bg-raised-2:#F3EAD9;
    --ink:#241811; --line:rgba(142,27,34,0.14); --line-strong:rgba(142,27,34,0.28);
    --gold:#8E1B22; --gold-bright:#B3272E; --gold-deep:#6B1418;
    --maroon:#7A2735; --maroon-deep:#4A131A; --maroon-bright:#9C2E36;
    --emerald:#EFE4D0; --sand:#F1E4C8;
    --nav-solid-bg: rgba(251,246,236,0.92);
    --shadow-card:0 18px 34px -18px rgba(90,20,20,0.2), 0 1px 0 rgba(255,255,255,0.6) inset;
    --shadow-lift:0 14px 28px -16px rgba(90,20,20,0.25);
  }
  .md-app *{ box-sizing:border-box; }
  .md-app h1,.md-app h2,.md-app h3,.md-app h4{ font-family:'Cormorant Garamond', Georgia, serif; margin:0; }
  .md-app :focus-visible{ outline:2px solid var(--gold-bright); outline-offset:3px; }
  @media (prefers-reduced-motion: reduce){ .md-app *{ animation-duration:0.001ms !important; transition-duration:0.001ms !important; } }

  .md-grain{ position:fixed; inset:0; z-index:3; pointer-events:none; opacity:0.05; mix-blend-mode:overlay;
    will-change:opacity; transform:translateZ(0);
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .md-app[data-theme="light"] .md-grain{ opacity:0.03; mix-blend-mode:multiply; }

  /* nav — transparent ghost over the hero, solidifies on scroll */
  .md-nav{ position:fixed; top:0; left:0; right:0; z-index:50; display:flex; align-items:center; gap:28px; padding:18px clamp(20px,5vw,64px); border-bottom:1px solid transparent; transition:background 0.4s ease, border-color 0.4s ease, padding 0.3s ease; }
  .md-nav--ghost{ background:linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0)); }
  .md-nav--ghost .md-nav__link,.md-nav--ghost .md-nav__icon,.md-nav--ghost .md-nav__burger,.md-nav--ghost .md-theme-toggle{ color:#F4ECDD; border-color:rgba(244,236,221,0.35); }
  .md-nav__brand{ display:flex; align-items:center; background:none; border:none; cursor:pointer; padding:0; flex-shrink:0; }
  .md-nav__logo{
    height:36px;
    width:auto;
    display:block;
    transition:filter 0.35s ease;
    filter:drop-shadow(0 2px 8px rgba(0,0,0,0.55));
  }
  .md-app[data-theme="light"] .md-nav__logo{
    filter:
      drop-shadow(0 1px 0 rgba(107,20,24,0.55))
      drop-shadow(0 2px 6px rgba(142,27,34,0.28))
      brightness(0.82)
      saturate(1.15);
  }
  .md-nav--ghost .md-nav__logo,
  .md-app[data-theme="light"] .md-nav--ghost .md-nav__logo{
    filter:drop-shadow(0 2px 8px rgba(0,0,0,0.55));
  }
  .md-nav--solid{ background:var(--nav-solid-bg); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border-color:var(--line); }
  .md-nav__links{ display:flex; align-items:center; gap:28px; margin-right:auto; margin-left:8px; }
  .md-nav__link{ position:relative; font-size:12.5px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; opacity:0.72; text-decoration:none; padding-bottom:3px; color:var(--ink); transition:opacity 0.2s ease, color 0.2s ease; }
  .md-nav__link::after{ content:""; position:absolute; left:0; right:100%; bottom:0; height:2px; background:var(--gold-bright); transition:right 0.25s cubic-bezier(.2,.7,.3,1); }
  .md-nav__link:hover{ opacity:1; color:var(--gold-bright); }
  .md-nav__link:hover::after{ right:0; }
  .md-nav__contact{ display:flex; align-items:center; gap:8px; }
  .md-nav__icon{ position:relative; display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; opacity:0.9; border:1px solid var(--line); color:var(--ink); overflow:hidden; transition:border-color 0.25s ease, color 0.2s ease, transform 0.25s cubic-bezier(.3,1.4,.6,1); }
  .md-nav__icon::before{ content:""; position:absolute; inset:0; border-radius:50%; background:var(--gold-bright); transform:scale(0); transition:transform 0.25s cubic-bezier(.3,1.4,.6,1); }
  .md-nav__icon svg{ position:relative; z-index:1; transition:color 0.2s ease; }
  .md-nav__icon:hover{ border-color:var(--gold-bright); transform:scale(1.08) rotate(-6deg); color:#F8ECEA; }
  .md-nav__icon:hover::before{ transform:scale(1); }
  .md-nav__burger{ display:none; align-items:center; justify-content:center; width:34px; height:34px; background:none; border:1px solid var(--line); cursor:pointer; }
  @media (max-width:760px){
    .md-nav__links,.md-nav__contact{ display:none; }
    .md-nav__burger{ display:flex; }
  }
  .md-nav__sheet{ position:absolute; top:100%; left:0; right:0; background:var(--bg); border-bottom:1px solid var(--line); padding:8px clamp(20px,5vw,64px) 20px; display:flex; flex-direction:column; gap:2px; z-index:49; color:var(--ink); }
  .md-nav__sheet-link{ padding:12px 0; font-size:15px; font-weight:600; color:var(--ink); text-decoration:none; border-bottom:1px solid var(--line); }
  .md-nav__sheet-contact{ display:flex; flex-direction:column; gap:12px; padding-top:14px; }
  .md-nav__sheet-contact a{ display:flex; align-items:center; gap:10px; font-size:14px; color:var(--gold-bright); text-decoration:none; font-weight:600; }

  .md-theme-toggle{ all:unset; display:flex; align-items:center; justify-content:center; gap:8px; width:34px; height:34px; border-radius:50%; border:1px solid var(--line); color:var(--gold-bright); cursor:pointer; transition:border-color 0.2s ease, background 0.2s ease, transform 0.2s ease; }
  .md-theme-toggle:hover{ border-color:var(--gold); background:rgba(0,0,0,0.08); transform:rotate(14deg); }
  .md-theme-toggle--compact{ width:auto; height:auto; border-radius:0; padding:12px 0; font-size:14px; font-weight:600; color:var(--ink); border:none; border-top:1px solid var(--line); margin-top:6px; justify-content:flex-start; }
  .md-theme-toggle--compact:hover{ background:none; transform:none; color:var(--gold-bright); }
  .md-app[data-theme="light"] .md-nav__sheet .md-theme-toggle--compact{ color:var(--ink); border-color:var(--line); }
  .md-app[data-theme="light"] .md-nav__sheet .md-theme-toggle--compact:hover{ color:var(--gold-bright); }

  /* buttons */
  .md-btn{ display:inline-flex; align-items:center; gap:8px; border:none; cursor:pointer; text-decoration:none; font-family:'Archivo', sans-serif; font-weight:600; font-size:15px; padding:14px 26px; transition:transform 0.15s ease-out, box-shadow 0.25s ease; will-change:transform; }
  .md-btn--primary{ background:linear-gradient(135deg, var(--gold-bright), var(--gold-deep)); color:#F8ECEA; border:1px solid var(--gold-bright); box-shadow:0 10px 24px -10px rgba(225,73,83,0.5); }
  .md-btn--primary:hover{ box-shadow:0 14px 30px -10px rgba(225,73,83,0.7); }

  .md-hero{ position:relative; margin:0; min-height:100vh; min-height:100svh; display:flex; align-items:flex-end; overflow:hidden; }
  .md-hero__video-wrap{ position:absolute; inset:0; z-index:0; margin:0; padding:0; background:#000; overflow:hidden; }
  .md-hero__video{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; display:block; }
  .md-hero__video::-webkit-media-controls-start-playback-button,
  .md-hero__video::-webkit-media-controls-play-button,
  .md-hero__video::-webkit-media-controls{
    display:none !important;
    -webkit-appearance:none;
    opacity:0 !important;
    pointer-events:none !important;
  }
  .md-hero__vignette{ position:absolute; inset:0; pointer-events:none;
    background:linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 22%, rgba(0,0,0,0.1) 62%, rgba(0,0,0,0.8) 100%);
    box-shadow: inset 0 0 160px 50px rgba(0,0,0,0.7);
  }
  .md-hero__content{ position:relative; z-index:2; padding:0 clamp(20px,6vw,80px) 96px; max-width:760px; color:#F8ECEA; }
  .md-hero__content > *{ opacity:0; transform:translateY(10px);
    animation: heroFadeIn 0.8s cubic-bezier(.2,.7,.3,1) forwards;
    animation-delay:calc(60ms + var(--i) * 120ms); }
  @keyframes heroFadeIn {
    to { opacity: 1; transform: translateY(0); }
  }
  .md-hero__title{ font-family:'Cormorant Garamond', Georgia, serif; font-size:clamp(44px,7.4vw,92px); line-height:1.02; letter-spacing:-0.01em; font-weight:600; margin:0; text-shadow:0 6px 30px rgba(0,0,0,0.55); font-optical-sizing:auto; }
  .md-hero__sub{ font-size:18px; line-height:1.6; opacity:0.85; margin:26px 0 36px; max-width:46ch; text-shadow:0 2px 14px rgba(0,0,0,0.5); }
  .md-hero__actions{ display:flex; align-items:center; gap:24px; flex-wrap:wrap; }
  .md-hero__link{ font-size:14.5px; color:#F8ECEA; text-decoration:none; border-bottom:1px solid var(--gold-bright); padding-bottom:2px; opacity:0.9; }
  .md-hero__link:hover{ opacity:1; color:var(--gold-bright); }
  @media (max-width:640px){ .md-hero__content{ padding-bottom:64px; } }

  /* jali divider */
  .md-jali{ position:relative; color:var(--gold); background:linear-gradient(180deg, var(--bg-raised-2), var(--bg)); height:24px; box-shadow:0 0 24px -4px rgba(225,73,83,0.35); }
  .md-jali svg{ width:100%; height:100%; display:block; }

  /* sections */
  .md-section{ padding:64px clamp(20px,6vw,80px) 44px; }
  .md-section--sand{ background:var(--sand); }
  .md-section__head{ display:flex; justify-content:space-between; gap:40px; flex-wrap:wrap; margin-bottom:34px; align-items:flex-end; }
  .md-eyebrow{ font-size:13px; letter-spacing:0.08em; text-transform:uppercase; color:var(--gold-bright); margin:0 0 8px; font-weight:600; }
  .md-section__title{ font-size:clamp(30px,3.8vw,44px); color:var(--ink); font-weight:600; max-width:20ch; line-height:1.06; }
  .md-section__note{ font-size:15px; line-height:1.65; color:var(--ink); opacity:0.62; max-width:36ch; margin:8px 0 0; }

  /* category tabs */
  .md-tabs{ display:flex; gap:10px; flex-wrap:wrap; margin-bottom:28px; }
  .md-tab{ all:unset; cursor:pointer; font-size:13.5px; font-weight:600; letter-spacing:0.03em; color:var(--ink); opacity:0.55; padding:9px 16px; border:1px solid var(--line); transition:opacity 0.2s ease, border-color 0.2s ease, color 0.2s ease, background 0.2s ease; }
  .md-tab:hover{ opacity:0.85; border-color:var(--gold); }
  .md-tab--active{ opacity:1; color:#F8ECEA; background:var(--gold-bright); border-color:var(--gold-bright); }

  /* photo grid + card — the real-image hover/tap swap used in Collections and Happy Marriages */
  .md-photo-grid{ list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(4, 1fr); gap:18px; }
  .md-photo-grid--wide{ grid-template-columns:repeat(4, 1fr); }
  @media (max-width:1000px){ .md-photo-grid{ grid-template-columns:repeat(3, 1fr); } }
  @media (max-width:700px){ .md-photo-grid{ grid-template-columns:repeat(2, 1fr); gap:12px; } }
  @media (max-width:420px){ .md-photo-grid{ grid-template-columns:1fr 1fr; gap:10px; } }

  .md-photo{ margin:0; cursor:pointer; perspective:1000px; min-width:0; }
  .md-photo__frame{
    position:relative;
    aspect-ratio:3/4;
    overflow:hidden;
    border-radius:18px;
    border:1px solid var(--line);
    box-shadow:var(--shadow-card);
    background:var(--sand);
  }
  .md-photo__img{
    position:absolute;
    top:-2%; left:-2%;
    width:104%; height:104%;
    object-fit:cover;
    display:block;
  }
  .md-photo__img--a{ opacity:1; transform:scale(1); }
  .md-photo__img--b{ opacity:0; transform:scale(1.08); }
  .md-photo__img--a.md-photo__img--out{ opacity:0; transform:scale(1.08); }
  .md-photo__img--b.md-photo__img--in{ opacity:1; transform:scale(1); }

  /* Keep effect wrappers paintable; only the actual image frame should clip. */
  .md-photo-grid{ contain:none; overflow:visible; }
  .md-photo-grid > li{ min-width:0; overflow:visible; }
  .md-photo__comet-wrap{ position:relative; overflow:visible; min-width:0; }
  .md-photo__comet{ position:relative; overflow:visible !important; }
  .md-photo__mobile-card{ display:none; }

  /* The 3D Comet treatment is intentionally desktop-only. On touch screens the
     plain card keeps the exact same frame/radius without the needless tilt layer. */
  @media (hover:none), (pointer:coarse){
    .md-photo__desktop-comet{ display:none; }
    .md-photo__mobile-card{ display:block; }
  }

  /* Desktop-only motion polish — touch devices stay simple and stable. */
  @media (hover: hover) and (pointer: fine){
    .md-photo__img{ transition:opacity 0.6s ease, transform 0.9s cubic-bezier(.2,.7,.3,1); }
    .md-glow::before{ transition:opacity 0.3s ease; }
    .md-gm-card img{ transition:transform 0.5s cubic-bezier(.2,.7,.3,1); }
    .md-gm-card:hover img{ transform:scale(1.05); }
  }

  /* touch: kill the sheen/glow layers entirely so there's no radial-gradient
     recompute / blend-mode stacking-context churn on scroll */
  @media (hover: none){
    .md-glow::before{ display:none; }
    .md-photo__img{ transition:opacity 0.35s ease; }
  }

  /* Keep Aceternity CometCard intact on desktop, but neutralise the
     component's own painted shell so the image frame is the only visible edge.
     CometCard's public className lands on the outer perspective wrapper; its
     immediate motion child carries the large inline box-shadow, so this selector
     intentionally overrides that visual treatment without replacing the 3D logic. */
  .md-photo__desktop-comet{ min-width:0; }
  .md-photo__comet{
    width:100%;
    background:transparent !important;
  }
  .md-photo__comet > div{
    border-radius:18px !important;
    box-shadow:none !important;
    background:transparent !important;
  }
  .md-photo__desktop-comet .md-photo__frame{
    border:1px solid var(--line);
    box-shadow:var(--shadow-card);
  }
  /* GlowingCollectionCard — cursor-tracked border glow, plain CSS (no Tailwind/motion) */
  .md-glow{ position:relative; border-radius:18px; }
  .md-glow::before{
    content:""; position:absolute; inset:-2px; border-radius:inherit; padding:2px;
    background:radial-gradient(240px circle at var(--gx,50%) var(--gy,50%), var(--gold-bright), var(--maroon-bright) 45%, transparent 70%);
    -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite:xor; mask-composite:exclude;
    opacity:0; pointer-events:none; z-index:1;
  }
  .md-glow:hover::before{ opacity:1; }

  .md-photo__caption{ margin-top:10px; font-size:12.5px; letter-spacing:0.04em; text-transform:uppercase; color:var(--ink); opacity:0.55; font-weight:600; }

  /* Groomsmen — scroll carousel. Desktop pins via position:sticky (no
     scroll-jacking library) while an 8-card track translates horizontally;
     mobile/tablet and prefers-reduced-motion get a plain vertical stack. */
  .md-gm-carousel{
    position:relative;
    background:
      radial-gradient(900px 520px at 50% 10%, rgba(142,27,34,.13), transparent 62%),
      var(--sand);
    color:var(--ink);
    isolation:isolate;
  }
  .md-gm-carousel::before{
    content:"";
    position:absolute;
    inset:0;
    pointer-events:none;
    opacity:.06;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .md-gm-hero-header{
    position:relative;
    z-index:4;
    width:min(1180px,calc(100% - 40px));
    margin:0 auto;
    padding:0 0 20px;
    display:flex;
    justify-content:space-between;
    align-items:flex-end;
    gap:40px;
  }
  .md-gm-hero-title{
    max-width:10ch;
    color:var(--ink);
    font-family:'Cormorant Garamond',Georgia,serif;
    font-size:clamp(46px,6.2vw,82px);
    font-weight:600;
    line-height:.9;
    letter-spacing:-.025em;
  }
  .md-gm-hero-note{
    max-width:38ch;
    margin:20px 0 0;
    font-size:15px;
    line-height:1.7;
    color:var(--ink);
    opacity:.6;
  }
  .md-gm-hero-mark{
    display:flex;
    flex-direction:column;
    align-items:flex-end;
    gap:10px;
    color:var(--gold-deep);
    white-space:nowrap;
  }
  .md-gm-hero-mark span{
    font-family:'Cormorant Garamond',Georgia,serif;
    font-size:58px;
    line-height:.7;
    letter-spacing:-.05em;
  }
  .md-gm-hero-mark i{ width:46px; height:1px; background:var(--gold-bright); }
  .md-gm-hero-mark small{ font-size:10px; font-weight:800; letter-spacing:.16em; }

  /* --- 2-Row Pinned Scroll Runway Carousel --- */
  .md-gm-carousel__sticky{
    position:sticky;
    top:0;
    height:100vh;
    height:100svh;
    display:flex;
    flex-direction:column;
    justify-content:center;
    gap:18px;
    padding:20px 0;
    overflow:hidden;
    box-sizing:border-box;
  }
  .md-gm-carousel__stage{
    position:relative;
    z-index:2;
    display:flex;
    flex-direction:column;
    gap:16px;
    width:100%;
    overflow:visible;
  }
  .md-gm-carousel__track{
    display:flex;
    flex-direction:row;
    gap:18px;
    width:max-content;
    padding-left:max(20px, calc((100vw - 1180px)/2));
    padding-right:max(20px, calc((100vw - 1180px)/2));
    will-change:transform;
  }
  .md-gm-carousel__track--rev{
    padding-left:max(20px, calc((100vw - 1180px)/2));
  }
  .md-gm-carousel__progress{
    position:relative;
    z-index:4;
    width:min(1180px, calc(100% - 40px));
    margin:6px auto 0;
    height:2px;
    background:var(--line);
    overflow:hidden;
    border-radius:2px;
  }
  .md-gm-carousel__progress-bar{
    height:100%;
    width:100%;
    transform-origin:left center;
    background:var(--gold-bright);
  }

  /* --- Card Sizing for 2 Rows --- */
  .md-gm-card{
    position:relative;
    width:clamp(280px, 30vw, 400px);
    height:clamp(165px, 18vw, 235px);
    flex:0 0 clamp(280px, 30vw, 400px);
    will-change:transform;
  }
  .md-gm-card__link{
    position:relative;
    display:block;
    width:100%;
    height:100%;
    overflow:hidden;
    border-radius:6px;
    text-decoration:none;
    background:var(--bg-raised);
    border:1px solid var(--line);
    box-shadow:0 16px 36px -18px rgba(74,19,26,.45);
  }
  /* button.md-gm-card__link UA-style reset, since the card is a <button> */
  button.md-gm-card__link{ font:inherit; padding:0; margin:0; color:inherit; text-align:left; -webkit-appearance:none; appearance:none; cursor:pointer; }
  .md-gm-card__link::before{
    content:"";
    position:absolute;
    z-index:2;
    inset:0;
    border:1px solid rgba(255,255,255,.1);
    pointer-events:none;
  }
  .md-gm-card img{
    position:absolute;
    inset:-1.5%;
    width:103%;
    height:103%;
    object-fit:cover;
    object-position:center center;
    display:block;
    transform:scale(1.005);
    transition:transform .8s cubic-bezier(.2,.7,.3,1),filter .6s ease;
  }
  .md-gm-card:hover img{ transform:scale(1.075); filter:saturate(1.08) contrast(1.03); }
  .md-gm-card__overlay{
    position:absolute;
    z-index:1;
    inset:0;
    pointer-events:none;
    background:linear-gradient(180deg,rgba(10,7,6,.02) 38%,rgba(10,7,6,.78) 100%);
  }
  .md-gm-card__caption{
    position:absolute;
    z-index:3;
    left:16px;
    right:16px;
    bottom:14px;
    display:flex;
    align-items:flex-end;
    justify-content:space-between;
    gap:12px;
    color:#F8ECEA;
  }
  .md-gm-card__caption span{
    font:700 9.5px/1 'Archivo',sans-serif;
    letter-spacing:.15em;
    opacity:.65;
  }
  .md-gm-card__caption strong{
    font:600 20px/1 'Cormorant Garamond',Georgia,serif;
    letter-spacing:-.01em;
  }

  /* --- Mobile / Small Screens --- */
  @media (max-width:760px){
    .md-gm-carousel__sticky{ gap:12px; padding:14px 0; }
    .md-gm-hero-header{ width:calc(100% - 32px); padding-bottom:8px; }
    .md-gm-hero-mark{ display:none; }
    .md-gm-hero-title{ font-size:clamp(30px, 8vw, 42px); }
    .md-gm-hero-note{ font-size:12.5px; line-height:1.4; }
    .md-gm-carousel__stage{ gap:10px; }
    .md-gm-carousel__track{ gap:12px; padding-left:16px; padding-right:16px; }
    .md-gm-carousel__track--rev{ padding-left:16px; padding-right:16px; }
    .md-gm-card{
      width:clamp(190px, 54vw, 250px);
      height:clamp(120px, 34vw, 156px);
      flex:0 0 clamp(190px, 54vw, 250px);
    }
    .md-gm-card__caption{ left:12px; right:12px; bottom:10px; }
    .md-gm-card__caption strong{ font-size:15.5px; }
    .md-gm-card__caption span{ font-size:8px; }
    .md-gm-carousel__progress{ width:calc(100% - 32px); margin-top:4px; }
  }


  /* contact */
  .md-visit{ padding:56px clamp(20px,6vw,80px) 8px; }
  .md-visit__grid{ display:grid; grid-template-columns:1.1fr 1fr; gap:44px; align-items:stretch; margin-top:8px; }
  @media (max-width:800px){ .md-visit__grid{ grid-template-columns:1fr; } }
  .md-visit__map{ position:relative; min-height:340px; border:1px solid var(--line); overflow:hidden; box-shadow:var(--shadow-lift); background:var(--sand); }
  .md-visit__map-frame{ display:block; width:100%; height:100%; min-height:340px; border:0; filter:grayscale(0.15) contrast(1.02); }
  .md-app[data-theme="dark"] .md-visit__map-frame{ filter:invert(0.92) hue-rotate(180deg) brightness(0.92) contrast(0.95) saturate(0.7); }
  .md-visit__map-label{ position:absolute; left:16px; bottom:14px; background:var(--bg-raised); border:1px solid var(--line); padding:6px 12px; font-size:12.5px; font-weight:600; color:var(--gold-bright); pointer-events:none; }
  .md-visit__details{ display:flex; flex-direction:column; justify-content:space-between; gap:24px; }
  .md-visit__list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:16px; }
  .md-visit__list li{ display:flex; align-items:center; gap:14px; font-size:15px; color:var(--ink); }
  .md-visit__list svg{ color:var(--gold-bright); flex-shrink:0; }
  .md-visit__list a{ color:var(--ink); text-decoration:none; font-weight:600; opacity:0.85; }
  .md-visit__list a:hover{ color:var(--gold-bright); opacity:1; }
  .md-visit__hours{ border-top:1px solid var(--line); padding-top:20px; }
  .md-visit__hours-title{ font-size:13px; letter-spacing:0.02em; color:var(--gold-bright); font-weight:600; margin:0 0 12px; }
  .md-visit__hours-row{ display:flex; justify-content:space-between; font-size:14px; color:var(--ink); opacity:0.72; padding:6px 0; }

  .md-footer{ display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; padding:26px clamp(20px,6vw,80px) 34px; border-top:1px solid var(--line); font-size:12.5px; color:var(--ink); opacity:0.5; }
  .md-footer__links{ display:flex; gap:16px; }
  .md-footer__links a{ color:var(--ink); text-decoration:none; }
  .md-footer__links a:hover{ color:var(--gold-bright); }

  /* enquiry pill on photo cards (Collections / Groomsmen / Happy Couples) */
  .md-photo__enquire{
    all:unset;
    position:absolute; z-index:4; right:10px; bottom:10px;
    display:inline-flex; align-items:center; gap:4px;
    font:700 10.5px/1 'Archivo',sans-serif; letter-spacing:.06em; text-transform:uppercase;
    color:#F8ECEA; background:rgba(10,9,8,0.62);
    -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px);
    border:1px solid rgba(255,255,255,0.22); border-radius:999px;
    padding:7px 12px; cursor:pointer; box-sizing:border-box;
  }
  .md-photo__enquire:hover{ background:var(--gold-bright); border-color:var(--gold-bright); }
  .md-photo__enquire:focus-visible{ outline:2px solid var(--gold-bright); outline-offset:2px; }
  @media (hover:none){ .md-photo__enquire{ display:none; } }

  /* enquiry modal */
  @keyframes mdEnquiryFade{ from{ opacity:0; } to{ opacity:1; } }
  @keyframes mdEnquiryPop{ from{ opacity:0; transform:translateY(18px) scale(.98); } to{ opacity:1; transform:translateY(0) scale(1); } }

  .md-enquiry-backdrop{
    position:fixed; inset:0; z-index:300;
    display:flex; align-items:stretch; justify-content:center; padding:0;
    background:rgba(10,9,8,0.55);
    -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px);
    animation:mdEnquiryFade .25s ease;
  }
  .md-enquiry-modal{
    position:relative;
    width:100%; max-width:640px; height:100%; max-height:100dvh;
    display:grid; grid-template-columns:1fr; grid-template-rows:auto 1fr;
    background:var(--bg-raised); border:1px solid var(--line); box-shadow:var(--shadow-card);
    overflow-y:auto;
    animation:mdEnquiryPop .3s cubic-bezier(.2,.7,.3,1);
  }
  .md-enquiry-close{
    all:unset; position:absolute; z-index:8;
    top:calc(14px + env(safe-area-inset-top)); right:14px;
    width:42px; height:42px; display:flex; align-items:center; justify-content:center;
    color:#F8ECEA; cursor:pointer; border-radius:50%;
    background:linear-gradient(145deg, rgba(179,39,46,.96), rgba(107,20,24,.96));
    border:1px solid rgba(248,236,234,.34);
    box-shadow:0 10px 24px -10px rgba(0,0,0,.6), 0 0 0 5px rgba(179,39,46,.10);
    transition:transform .28s cubic-bezier(.2,.8,.3,1), box-shadow .28s ease, border-color .2s ease;
  }
  .md-enquiry-close::before{
    content:""; position:absolute; inset:5px; border:1px solid rgba(248,236,234,.16);
    border-radius:50%; pointer-events:none;
  }
  .md-enquiry-close svg{ position:relative; z-index:1; }
  .md-enquiry-close:hover{ transform:rotate(8deg) scale(1.06); border-color:rgba(248,236,234,.58); box-shadow:0 14px 28px -10px rgba(0,0,0,.65), 0 0 0 7px rgba(179,39,46,.12); }
  .md-enquiry-close:focus-visible{ outline:2px solid var(--gold-bright); outline-offset:4px; }

  .md-enquiry-context{
    order:1; background:var(--bg-raised-2);
    padding:calc(24px + env(safe-area-inset-top)) 24px 8px;
    display:flex; flex-direction:column; gap:14px;
  }
  .md-enquiry-context__frame{ position:relative; overflow:hidden; border-radius:18px; border:1px solid var(--line); box-shadow:var(--shadow-lift), inset 0 1px 0 rgba(255,255,255,0.08); background:var(--sand); width:100%; }
  .md-enquiry-context__frame img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
  .md-enquiry-context__frame:not(.md-enquiry-context__frame--has-b) .md-enquiry-context__img--a{ opacity:1; transform:scale(1); transition:transform .65s cubic-bezier(.2,.7,.3,1); }
  .md-enquiry-context__frame:not(.md-enquiry-context__frame--has-b):hover .md-enquiry-context__img--a{ transform:scale(1.05); }
  .md-enquiry-context__frame--has-b .md-enquiry-context__img--a{ opacity:1; transform:scale(1); transition:opacity .55s ease, transform .75s cubic-bezier(.2,.7,.3,1); }
  .md-enquiry-context__frame--has-b .md-enquiry-context__img--b{ opacity:0; transform:scale(1.055); transition:opacity .55s ease, transform .75s cubic-bezier(.2,.7,.3,1); }
  .md-enquiry-context__frame--has-b:hover .md-enquiry-context__img--a{ opacity:0; transform:scale(1.055); }
  .md-enquiry-context__frame--has-b:hover .md-enquiry-context__img--b{ opacity:1; transform:scale(1); }
  .md-enquiry-context__hover-label{ display:none; position:absolute; left:14px; bottom:14px; z-index:2; padding:7px 10px; border:1px solid rgba(255,255,255,.22); border-radius:999px; background:rgba(10,9,8,.5); color:#fff; font:600 10px/1 'Archivo',sans-serif; letter-spacing:.06em; text-transform:uppercase; backdrop-filter:blur(7px); pointer-events:none; }
  @media (hover:hover) and (pointer:fine){ .md-enquiry-context__hover-label{ display:block; } }
  .md-enquiry-context__caption{ font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-weight:600; color:var(--ink); margin:0; }
  .md-enquiry-context__note{ font-size:13px; line-height:1.6; color:var(--ink); opacity:.6; margin:0; }

  .md-enquiry-form{ order:2; padding:20px 24px calc(28px + env(safe-area-inset-bottom)); display:flex; flex-direction:column; }
  .md-enquiry-title{ font-family:'Cormorant Garamond',Georgia,serif; font-weight:600; font-size:clamp(24px,3vw,30px); color:var(--ink); margin:2px 0 20px; letter-spacing:-.01em; }

  .md-enquiry-field{ display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
  .md-enquiry-field label{ font-size:12px; font-weight:600; letter-spacing:.03em; color:var(--ink); opacity:.75; text-transform:uppercase; }
  .md-enquiry-field input,
  .md-enquiry-field textarea{
    font-family:'Archivo',sans-serif; font-size:14.5px; color:var(--ink);
    background:var(--bg-raised); border:1px solid var(--line); border-radius:2px;
    padding:11px 13px; outline:none; resize:none; width:100%; box-sizing:border-box;
    transition:border-color .2s ease;
  }
  .md-enquiry-field input::placeholder,
  .md-enquiry-field textarea::placeholder{ color:var(--ink); opacity:.35; }
  .md-enquiry-field input:focus-visible,
  .md-enquiry-field textarea:focus-visible{ border-color:var(--gold-bright); outline:2px solid var(--gold-bright); outline-offset:2px; }
  .md-enquiry-field--error input,
  .md-enquiry-field--error textarea,
  .md-enquiry-field--error .md-enquiry-phone{ border-color:var(--maroon-bright); }
  .md-enquiry-field__error{ font-size:12px; color:var(--maroon-bright); margin:0; }

  .md-enquiry-date{ position:relative; }
  .md-enquiry-date input[type="date"]{ padding-right:38px; cursor:pointer; }
  .md-enquiry-date__icon{ position:absolute; top:50%; right:13px; transform:translateY(-50%); pointer-events:none; color:var(--ink); opacity:.55; }
  .md-enquiry-date input[type="date"]::-webkit-calendar-picker-indicator{
    opacity:0; position:absolute; inset:0; width:100%; height:100%; margin:0; padding:0; cursor:pointer;
  }

  .md-enquiry-phone{ display:flex; align-items:stretch; border:1px solid var(--line); border-radius:2px; overflow:hidden; background:var(--bg-raised); transition:border-color .2s ease; }
  .md-enquiry-phone__prefix{ display:flex; align-items:center; padding:0 12px; font-size:14.5px; font-weight:600; color:var(--ink); opacity:.6; background:var(--bg-raised-2); border-right:1px solid var(--line); }
  .md-enquiry-phone input{ border:none; border-radius:0; flex:1; }
  .md-enquiry-phone:focus-within{ border-color:var(--gold-bright); outline:2px solid var(--gold-bright); outline-offset:2px; }

  .md-enquiry-date-row{ display:grid; grid-template-columns:1fr; gap:0; }
  @media (min-width:640px){ .md-enquiry-date-row{ grid-template-columns:1fr 1fr; gap:12px; } }

  .md-enquiry-submit{ width:100%; margin-top:4px; justify-content:center; }

  @media (max-width:899px){
    .md-enquiry-context{ padding-left:20px; padding-right:20px; padding-top:calc(20px + env(safe-area-inset-top)); gap:10px; }
    .md-enquiry-context__frame{ width:min(84%, 300px); align-self:center; aspect-ratio:4/5 !important; }
    .md-enquiry-context__caption,
    .md-enquiry-context__note{ width:min(84%, 300px); align-self:center; }
  }

  @media (min-width:900px){
    .md-enquiry-backdrop{ padding:24px; align-items:center; }
    .md-enquiry-modal{
      max-width:980px; height:auto; max-height:min(640px, 88vh);
      border-radius:4px;
      grid-template-columns:1fr 1fr; grid-template-rows:1fr;
      align-items:stretch;
      overflow-y:hidden;
    }
    .md-enquiry-context{ order:2; padding:32px; justify-content:center; min-height:0; }
    .md-enquiry-form{ order:1; padding:32px; overflow-y:auto; overscroll-behavior:contain; min-height:0; }
    .md-enquiry-submit{ width:auto; align-self:flex-start; }
  }

  @media (prefers-reduced-motion:reduce){
    .md-enquiry-backdrop,
    .md-enquiry-modal{ animation:none !important; }
  }
`;