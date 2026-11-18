import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { dataService } from "../../services/mock/dataService";
import { companyService } from "../../services/api/companyService";
import { requestService } from "../../services/api/requestService";
import { RatingStars } from "../../components/common/RatingStars";
import { LocationBadge } from "../../components/common/LocationBadge";
import { formatCurrency } from "../../utils/cn";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Truck,
  FileText,
  BadgePercent,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Star,
  Award,
  MapPin,
  Compass,
  Calculator,
  Box,
  Check,
  Play,
  TrendingUp,
  Phone,
  Headphones,
  MessageSquare,
  Calendar,
  Boxes,
  Users,
  ArrowUpRight,
  Navigation,
  Eye,
  Activity,
  Zap,
  CheckCircle,
  Quote,
  Package,
  Home,
  ArrowLeftRight,
  ArrowRightCircle,
  BarChart3,
  Globe,
  Heart,
  Layers,
  LifeBuoy,
  BookOpen,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   Reusable: fade-in-up when element enters viewport
───────────────────────────────────────────────────────────*/
function FadeInUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function useCounter(target, inView) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = parseInt(String(target).replace(/\D/g, "")) || 0;
    if (end === 0) { setVal(target); return; }
    const step = Math.ceil(end / 50);
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setVal(start);
      if (start >= end) clearInterval(timer);
    }, 28);
    return () => clearInterval(timer);
  }, [inView, target]);
  return val;
}

const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const clean = url.replace(/\\/g, "/").replace(/^\/+/, "");
  const base = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${base}/${clean}`;
};

const formatDate = (d) => {
  if (!d) return "Date flexible";
  try {
    return new Date(d).toLocaleDateString("fr-TN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return String(d); }
};

const HOUSING_TRANSLATIONS = {
  studio: "Studio", apartment: "Appartement", house: "Maison",
  villa: "Grande Villa", duplex: "Duplex", office: "Bureaux Pro",
};

const HOUSING_EMOJI = {
  studio: "🏠", apartment: "🏢", house: "🏡", villa: "🏰", duplex: "🏘️", office: "🏗️",
};

const COMPANY_FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=1200&auto=format&fit=crop&q=85",
];

const getCompanyCover = (comp, idx = 0) => {
  if (comp?.coverImage && comp.coverImage.startsWith("http")) return comp.coverImage;
  return COMPANY_FALLBACK_COVERS[idx % COMPANY_FALLBACK_COVERS.length];
};

const SAMPLE_REQUESTS = [
  { _id: "req-sample-1", departure: { city: "La Marsa", governorate: "Tunis", housingType: "villa", floor: 0, elevator: false }, departureAddress: { city: "La Marsa", governorate: "Tunis", latitude: 36.8782, longitude: 10.3247 }, arrival: { city: "Hammamet", governorate: "Nabeul", housingType: "house", floor: 0, elevator: false }, arrivalAddress: { city: "Hammamet", governorate: "Nabeul", latitude: 36.4, longitude: 10.6167 }, departureHousingType: "villa", arrivalHousingType: "house", estimatedVolume: 45, estimatedBoxes: 50, desiredDate: "2025-03-01T00:00:00.000Z", preferredDate: "2025-03-01T00:00:00.000Z", quotesCount: 1, client: { fullName: "Salma Jaziri", firstName: "Salma" }, estimatedBudget: "800 - 1200 DT" },
  { _id: "req-sample-2", departure: { city: "Ennasr 2", governorate: "Ariana", housingType: "apartment", floor: 3, elevator: false }, departureAddress: { city: "Ennasr 2", governorate: "Ariana", latitude: 36.8745, longitude: 10.1561 }, arrival: { city: "Sousse", governorate: "Sousse", housingType: "apartment", floor: 1, elevator: true }, arrivalAddress: { city: "Sousse", governorate: "Sousse", latitude: 35.8256, longitude: 10.6369 }, departureHousingType: "apartment", arrivalHousingType: "apartment", estimatedVolume: 25, estimatedBoxes: 30, desiredDate: "2025-02-15T00:00:00.000Z", preferredDate: "2025-02-15T00:00:00.000Z", quotesCount: 2, client: { fullName: "Yassine Ben Salem", firstName: "Yassine" }, estimatedBudget: "400 - 700 DT" },
  { _id: "req-sample-3", departure: { city: "Les Berges du Lac", governorate: "Tunis", housingType: "duplex", floor: 2, elevator: true }, departureAddress: { city: "Les Berges du Lac", governorate: "Tunis", latitude: 36.8327, longitude: 10.2341 }, arrival: { city: "Sfax Ville", governorate: "Sfax", housingType: "villa", floor: 0, elevator: false }, arrivalAddress: { city: "Sfax Ville", governorate: "Sfax", latitude: 34.7406, longitude: 10.7603 }, departureHousingType: "duplex", arrivalHousingType: "villa", estimatedVolume: 38, estimatedBoxes: 40, desiredDate: "2025-03-10T00:00:00.000Z", preferredDate: "2025-03-10T00:00:00.000Z", quotesCount: 3, client: { fullName: "Khadija Mansour", firstName: "Khadija" }, estimatedBudget: "950 - 1400 DT" },
  { _id: "req-sample-4", departure: { city: "Bizerte Nord", governorate: "Bizerte", housingType: "apartment", floor: 4, elevator: false }, departureAddress: { city: "Bizerte Nord", governorate: "Bizerte", latitude: 37.2744, longitude: 9.8739 }, arrival: { city: "Ariana Ville", governorate: "Ariana", housingType: "apartment", floor: 2, elevator: true }, arrivalAddress: { city: "Ariana Ville", governorate: "Ariana", latitude: 36.8665, longitude: 10.1934 }, departureHousingType: "apartment", arrivalHousingType: "apartment", estimatedVolume: 20, estimatedBoxes: 25, desiredDate: "2025-03-18T00:00:00.000Z", preferredDate: "2025-03-18T00:00:00.000Z", quotesCount: 0, client: { fullName: "Mehdi Trabelsi", firstName: "Mehdi" }, estimatedBudget: "450 - 650 DT" },
];

/* ─────────────────────────────────────────────────────────
   HERO SLIDES — Carousel 3 Slides (Responsive)
   Images : /slide1.png, /slide2.png, /slide3.png
───────────────────────────────────────────────────────────*/
const HERO_SLIDES = [
  {
    id: 1,
    image: "/slide1.png",
    alt: "MoversGo Tunisie Déménagement - Slide 1",
  },
  {
    id: 2,
    image: "/slide2.png",
    alt: "MoversGo Tunisie Déménagement - Slide 2",
  },
  {
    id: 3,
    image: "/slide3.png",
    alt: "MoversGo Tunisie Déménagement - Slide 3",
  },
];

function HeroSlidesSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Auto-advance every 5 seconds (pause when hovering)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  // Mobile touch swipe gestures
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-950 select-none border-b-2 border-slate-200/80 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide Display Area: Natural 16:9 banner proportion, responsive across mobile, tablet & desktop */}
      <div className="relative w-full aspect-[16/9] min-h-[220px] sm:min-h-[360px] md:min-h-[460px] lg:min-h-[580px] max-h-[85vh] overflow-hidden bg-slate-950 flex items-center justify-center">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            <img
              src={HERO_SLIDES[currentSlide].image}
              alt={HERO_SLIDES[currentSlide].alt}
              className="w-full h-full object-contain sm:object-cover object-center"
              loading={currentSlide === 0 ? "eager" : "lazy"}
            />
          </motion.div>
        </AnimatePresence>

        {/* Slide Counter Badge (Top Right) */}
        {/* <div className="absolute top-3 sm:top-6 right-3 sm:right-6 z-20 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#800020]/90 text-white border-2 border-white text-[11px] sm:text-xs font-mono font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{`0${currentSlide + 1} / 0${HERO_SLIDES.length}`}</span>
        </div> */}

        {/* Left Arrow Button */}
        <button
          onClick={handlePrev}
          aria-label="Slide précédente"
          className="absolute left-2.5 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-13 sm:h-13 rounded-2xl bg-white/90 hover:bg-[#800020] text-[#800020] hover:text-white border-2 border-white shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={handleNext}
          aria-label="Slide suivante"
          className="absolute right-2.5 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-13 sm:h-13 rounded-2xl bg-white/90 hover:bg-[#800020] text-[#800020] hover:text-white border-2 border-white shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Pagination Dots (Bottom Center) */}
        <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/20 shadow-xl">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Aller au slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full ${currentSlide === idx
                ? "w-7 sm:w-10 h-2.5 sm:h-3 bg-[#800020] border-2 border-white shadow-md"
                : "w-2.5 sm:w-3 h-2.5 sm:h-3 bg-white/70 hover:bg-white"
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   HERO — Design Contemporain : Arche Royale, Galet & Carte Écho
   Background bg_hero.png officiel
   3 Formes géométriques complémentaires et harmonieuses
───────────────────────────────────────────────────────────*/
function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-white py-8 sm:py-12 lg:py-16 border-b border-slate-100 min-h-auto lg:min-h-[620px] flex items-center">
      {/* ── Background Image: /bg_hero.png (uploaded by user) ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <img
          src="/bg_hero.png"
          alt="MoversGo Déménagement Tunisie"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-8 items-center">

          {/* ──── LEFT COLUMN (Typography, Buttons & Trust Badges) ──── */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-1 sm:space-y-1.5"
            >
              <h1 className="space-y-2 sm:space-y-2.5 lg:space-y-3.5 leading-[1.2]">
                <span className="block text-xl sm:text-3xl md:text-4xl lg:text-[2.75rem] xl:text-[2.85rem] font-extrabold text-slate-900 tracking-tight">
                  Votre déménagement
                </span>
                <span className="inline-block text-lg sm:text-2xl md:text-3xl lg:text-[2.75rem] xl:text-[2.85rem] font-black tracking-tight px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#800020] text-white shadow-md max-w-full">
                  organisé, comparé &amp; garanti
                </span>
                <span className="block text-xl sm:text-3xl md:text-4xl lg:text-[2.75rem] xl:text-[2.85rem] font-extrabold text-slate-900 tracking-tight">
                  partout en Tunisie<span className="text-[#800020]">.</span>
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg font-normal"
            >
              Une équipe professionnelle, des services complets
              pour un déménagement simple, rapide et sans stress.
            </motion.p>

            {/* Two CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1"
            >
              {/* Button 1: Devis gratuit — filled bordeaux pill */}
              <Link
                to="/client/requests/new"
                className="relative group overflow-hidden inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#800020] hover:bg-[#68001a] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-[#800020]/30 hover:shadow-xl hover:shadow-[#800020]/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 w-full sm:w-auto"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                <span>Devis gratuit</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>

              {/* Button 2: Contactez-nous — outlined bordeaux pill with headphones icon */}
              <Link
                to="/contact"
                className="group inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-white text-[#800020] font-extrabold text-sm sm:text-base border-2 border-[#800020] shadow-md hover:bg-rose-50/70 hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 w-full sm:w-auto"
              >
                <Headphones className="w-4.5 h-4.5 text-[#800020]" />
                <span>Contactez-nous</span>
              </Link>
            </motion.div>

            {/* Trust badges row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-4 lg:gap-6"
            >
              {[
                { icon: ShieldCheck, label: "100% Sécurité", sub: "de vos biens" },
                { icon: Users, label: "Équipe", sub: "Professionnelle" },
                { icon: Truck, label: "Camions", sub: "Modernes" },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-2.5 bg-white/75 backdrop-blur-xs px-2.5 py-1 sm:py-1 rounded-xl border border-rose-100 sm:border-slate-100 shadow-2xs sm:shadow-none">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-rose-100/70 border border-rose-200/80 flex items-center justify-center flex-shrink-0">
                    <badge.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#800020]" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10.5px] sm:text-xs font-bold text-slate-800">{badge.label}</p>
                    <p className="text-[9.5px] sm:text-[11px] text-slate-500 font-medium">{badge.sub}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ──── RIGHT COLUMN: 3 Geometric Shapes (Arche, Oeuf Organique, Carte) — 100% Responsive ──── */}
          <div className="lg:col-span-6 relative flex items-center justify-center w-full pt-4 sm:pt-6 lg:pt-0">
            <div className="relative grid grid-cols-12 gap-3 sm:gap-4 items-stretch max-w-[330px] sm:max-w-[420px] lg:max-w-[480px] w-full mx-auto">

              {/* 1. Grande Arche Royale Méditerranéenne (Gauche, col-span-7) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="col-span-7 flex flex-col"
              >
                <div className="relative w-full aspect-[11/19] sm:aspect-[11/20] overflow-hidden rounded-t-[3.5rem] sm:rounded-t-[4.5rem] lg:rounded-t-[5rem] rounded-b-[1.5rem] sm:rounded-b-[2rem] border-[3px] sm:border-4 border-[#800020] shadow-xl sm:shadow-2xl shadow-[#800020]/20 bg-slate-100 group">
                  <img
                    src="/heroo1.png"
                    onError={(e) => { e.currentTarget.src = "/hero_img (1).jfif"; }}
                    alt="Déménageurs professionnels MoversGo"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </motion.div>

              {/* Right Sub-Column: Oeuf Organique + Carte Écho (col-span-5) */}
              <div className="col-span-5 flex flex-col justify-between gap-3 sm:gap-4">

                {/* 2. Format d'un Œuf / Cercle Organique (Haut Droite) */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                  className="w-full"
                >
                  <div
                    className="relative w-full aspect-[1/1.08] overflow-hidden border-[3px] sm:border-4 border-[#800020] shadow-lg sm:shadow-xl shadow-[#800020]/15 bg-slate-100 group"
                    style={{
                      borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                      WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                      isolation: "isolate",
                    }}
                  >
                    <img
                      src="/heroo2.png"
                      onError={(e) => { e.currentTarget.src = "/hero_img (2).jfif"; }}
                      alt="Service de déménagement et manutention MoversGo"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </motion.div>

                {/* 3. Carte Sculptée avec Écho de Courbe (Bas Droite) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="w-full flex-1 flex flex-col"
                >
                  <div className="relative w-full h-full flex-1 min-h-[105px] sm:min-h-[145px] lg:min-h-[175px] overflow-hidden rounded-2xl sm:rounded-[1.5rem] lg:rounded-[1.75rem] rounded-br-[2.5rem] sm:rounded-br-[3rem] lg:rounded-br-[3.5rem] border-[3px] sm:border-4 border-[#800020] shadow-lg sm:shadow-xl shadow-[#800020]/15 bg-slate-100 group">
                    <img
                      src="/heroo3.png"
                      onError={(e) => { e.currentTarget.src = "/hero_img (3).jfif"; }}
                      alt="Camion logistique moderne MoversGo"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </motion.div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   PARTNER LOGOS — Continuous Circle Marquee (Approved Companies)
───────────────────────────────────────────────────────────*/
function PartnerCircleItem({ company }) {
  const compName = company.companyName || company.name || "Déménageur Agréé";
  const rawLogo = company.logo;
  const logoUrl = resolveMediaUrl(rawLogo);
  const [imgError, setImgError] = useState(false);
  const city =
    company.address?.governorate ||
    company.address?.city ||
    company.city ||
    "Tunisie";
  const initials =
    compName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "MO";
  const companyId = company._id || company.id;

  return (
    <Link
      to={companyId ? `/companies/${companyId}` : "/companies"}
      className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0 px-3 sm:px-4 py-2 select-none hover:-translate-y-1.5 transition-transform duration-200"
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white ring-3 ring-[#800020] shadow-lg bg-white flex items-center justify-center overflow-hidden group-hover:ring-4 group-hover:scale-105 group-hover:shadow-xl transition-all duration-200">
        {logoUrl && !imgError ? (
          <img
            src={logoUrl}
            alt={compName}
            onError={() => setImgError(true)}
            className="w-full h-full object-contain p-2"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-rose-50 text-[#800020] font-black text-xl sm:text-2xl">
            {initials}
          </div>
        )}
      </div>
      <p className="text-[12px] sm:text-xs font-bold text-center text-slate-800 max-w-[130px] truncate leading-tight group-hover:text-[#800020] transition-colors">
        {compName}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Agréé RNE
        </span>
        {city && (
          <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
            {city}
          </span>
        )}
      </div>
    </Link>
  );
}

function PartnerMarquee({ initialCompanies = [] }) {
  const [approvedList, setApprovedList] = useState(initialCompanies);

  useEffect(() => {
    let isMounted = true;
    async function loadApproved() {
      try {
        const res = await companyService.getPublicCompanies({ limit: 50 });
        const list =
          res?.data?.companies ||
          res?.companies ||
          res?.data ||
          (Array.isArray(res) ? res : []);
        const filtered = (Array.isArray(list) ? list : []).filter(
          (c) => c.verificationStatus === "approved" || !c.verificationStatus
        );
        if (isMounted && filtered.length > 0) {
          setApprovedList(filtered);
          return;
        }
      } catch (err) {
        console.warn("Could not fetch approved companies for marquee:", err);
      }

      try {
        const fb = await dataService.getCompanies();
        const fbApproved = (Array.isArray(fb) ? fb : []).filter(
          (c) => c.verificationStatus === "approved" || !c.verificationStatus
        );
        if (isMounted && fbApproved.length > 0) {
          setApprovedList(fbApproved);
        }
      } catch (e) {
        // Silent fallback
      }
    }
    loadApproved();
    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure enough items to fill wide screens without gap, then duplicate for seamless 50% loop
  const baseList = approvedList && approvedList.length > 0 ? approvedList : initialCompanies;
  let displayList = [];
  if (baseList && baseList.length > 0) {
    while (displayList.length < 12) {
      displayList = displayList.concat(baseList);
    }
  }
  const marqueeItems = [...displayList, ...displayList];

  return (
    <div className="relative overflow-hidden bg-white border-y border-slate-100 py-16">
      {/* Subtle architectural background texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #800020 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 z-10">
        {/* Section Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#800020] bg-rose-50 px-4 py-1.5 rounded-full border border-rose-200 shadow-2xs mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#800020]" />
            Réseau Partenaire Certifié
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-slate-900 tracking-tight leading-[1.2] mt-2 mb-3">
            Sociétés de déménagement<br className="hidden sm:inline" />{" "}
            <span className="relative inline-block text-[#800020] font-black">
              agréées en Tunisie
              <span className="absolute -bottom-1.5 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#800020]/40 to-transparent rounded-full" />
            </span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm md:text-base max-w-xl mx-auto font-normal leading-relaxed">
            Chaque partenaire est rigoureusement vérifié : extrait RNE, patente fiscale, agrément transport et assurance cargo.
          </p>
        </div>
      </div>

      {/* ONE SINGLE SECTION: Continuous leftward scrolling marquee of circular logos */}
      {marqueeItems.length > 0 ? (
        <div className="relative py-4 overflow-hidden select-none z-10">
          {/* Fading left & right gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

          <div
            className="flex gap-6 sm:gap-10 w-max items-center"
            style={{
              animation: "marquee-scroll-left 35s linear infinite",
              willChange: "transform",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.animationPlayState = "paused";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.animationPlayState = "running";
            }}
          >
            {marqueeItems.map((comp, idx) => (
              <PartnerCircleItem
                key={`${comp._id || comp.id || "comp"}-${idx}`}
                company={comp}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-slate-400 z-10">
          Chargement des partenaires agréés...
        </div>
      )}

      {/* View all directory link */}
      <div className="text-center mt-10 relative z-10">
        <Link
          to="/companies"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#800020] hover:bg-[#660019] text-white border-2 border-white shadow-md text-xs sm:text-sm font-bold transition-all hover:-translate-y-0.5 group"
        >
          <span>Voir tout l'annuaire des déménageurs agréés</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <style>{`
        @keyframes marquee-scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="marquee-scroll-left"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STAT CARD — Unslop White Architecture with Bordeaux Contour
───────────────────────────────────────────────────────────*/
function StatCard({ label, value, suffix = "", icon: Icon, description = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCounter(value, inView);

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 280 }}
      className="relative p-6 sm:p-7 rounded-[2.2rem] bg-white border-2 border-white shadow-2xl hover:shadow-[#800020]/25 hover:border-[#800020] transition-all duration-300 group flex flex-col justify-between overflow-hidden"
    >
      {/* Subtle top indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#800020] opacity-80" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="w-12 h-12 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-[#800020] border border-rose-200 shadow-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#800020] animate-pulse" />
            Certifié
          </span>
        </div>

        <p className="font-heading text-4xl sm:text-5xl font-black text-[#800020] tracking-tight mb-2">
          {typeof count === "number" ? count.toLocaleString("fr-TN") : count}{suffix}
        </p>
        <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug mb-1">{label}</p>
      </div>

      {description && (
        <p className="text-xs text-slate-500 font-light leading-relaxed pt-2 border-t border-slate-100 mt-2">
          {description}
        </p>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   STEP WIDGETS — Tangible interactive simulation artifacts
───────────────────────────────────────────────────────────*/
function StepWidgetOne() {
  return (
    <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 border-b border-slate-200/70 pb-1.5">
        <span className="flex items-center gap-1.5 text-slate-800 font-bold">
          <Home className="w-3.5 h-3.5 text-blue-600" /> Dossier Logement
        </span>
        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">Prêt</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="bg-white p-2 rounded-xl border border-slate-200/70">
          <p className="text-[10px] text-slate-400 font-medium uppercase">Typologie</p>
          <p className="font-bold text-slate-900">S+2 · 78 m²</p>
        </div>
        <div className="bg-white p-2 rounded-xl border border-slate-200/70">
          <p className="text-[10px] text-slate-400 font-medium uppercase">Volume</p>
          <p className="font-bold text-slate-900">~26 m³</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/70">
        <span className="text-slate-600 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Monte-meubles requis
        </span>
        <span className="text-[10px] font-bold text-slate-500 font-mono">3e étage</span>
      </div>
    </div>
  );
}

function StepWidgetTwo() {
  return (
    <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 border-b border-slate-200/70 pb-1.5">
        <span className="flex items-center gap-1.5 text-slate-800 font-bold">
          <Clock className="w-3.5 h-3.5 text-amber-600" /> Propositions Reçues
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> 2 offres
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="bg-white p-2 rounded-xl border border-slate-200/70 flex items-center justify-between">
          <div>
            <p className="font-bold text-[11px] text-slate-900 leading-none">Carthage Movers</p>
            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> 4.9 · 3 porteurs
            </p>
          </div>
          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">480 DT</span>
        </div>
        <div className="bg-white p-2 rounded-xl border border-slate-200/70 flex items-center justify-between">
          <div>
            <p className="font-bold text-[11px] text-slate-900 leading-none">Sahel Express</p>
            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> 4.8 · Véhicule 22m³
            </p>
          </div>
          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">450 DT</span>
        </div>
      </div>
    </div>
  );
}

function StepWidgetThree() {
  return (
    <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 border-b border-slate-200/70 pb-1.5">
        <span className="flex items-center gap-1.5 text-slate-800 font-bold">
          <Search className="w-3.5 h-3.5 text-violet-600" /> Audit &amp; Sécurité
        </span>
        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">100% Vérifié</span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/70 flex items-center gap-2 text-slate-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="truncate">Assurance STAR 200 000 DT</span>
        </div>
        <div className="bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/70 flex items-center gap-2 text-slate-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="truncate">Matricule &amp; Agrément certifiés</span>
        </div>
        <div className="bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/70 flex items-center gap-2 text-slate-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="truncate">Prix ferme garanti sans surcoût</span>
        </div>
      </div>
    </div>
  );
}

function StepWidgetFour() {
  return (
    <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 border-b border-slate-200/70 pb-1.5">
        <span className="flex items-center gap-1.5 text-slate-800 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Séquestre CIB
        </span>
        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">Garanti</span>
      </div>
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">1. Acompte validation (30%)</span>
          <span className="font-bold text-slate-800">Sous séquestre</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full w-[30%]" />
        </div>
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
          <span className="text-slate-500">2. Solde final (70%)</span>
          <span className="font-bold text-emerald-700">Après livraison conforme</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STEP CARD — Architectural Sculpted Design with Micro-Widgets
───────────────────────────────────────────────────────────*/
function StepCard({ number, title, description, icon: Icon, tag, index }) {
  const widgets = [StepWidgetOne, StepWidgetTwo, StepWidgetThree, StepWidgetFour];
  const Widget = widgets[index % widgets.length];

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="relative p-6 sm:p-7 rounded-[2.2rem] bg-white border-2 border-slate-200/90 hover:border-[#800020] shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
    >
      <div>
        {/* Top bar with index badge in rouge bordeaux with white border */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black px-3.5 py-1 rounded-full bg-[#800020] text-white tracking-wider border-2 border-white shadow-md ring-2 ring-[#800020]/25">
              {number}
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Étape
            </span>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {tag}
          </span>
        </div>

        {/* Icon & Title */}
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-[#800020] flex items-center justify-center mb-4 group-hover:bg-[#800020] group-hover:text-white group-hover:border-2 group-hover:border-white group-hover:ring-2 group-hover:ring-[#800020]/25 transition-all duration-200 shadow-sm">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-heading text-lg font-bold text-slate-900 mb-2 leading-snug">
          {title}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          {description}
        </p>
      </div>

      {/* Embedded tangible micro-widget */}
      <Widget />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPANY CARD — Unslop Architectural Design (Rouge Bordeaux & White Contour)
───────────────────────────────────────────────────────────*/
function CompanyCard({ comp, idx }) {
  const compId = comp._id || comp.id;
  const compName = comp.companyName || comp.name || comp.commercialName || "Société Agréée";
  const compCity = typeof comp.address === "object"
    ? comp.address?.city || comp.address?.governorate || "Tunis"
    : comp.city || comp.headquartersAddress?.city || "Tunis";
  const logoUrl = resolveMediaUrl(comp.logo);
  const rating = comp.rating || comp.averageRating || 4.9;
  const revCount = comp.reviewsCount || comp.totalReviews || 24;
  const initials = compName.charAt(0).toUpperCase();

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 280 }}
      className="bg-white rounded-[2.2rem] overflow-hidden border-2 border-slate-200/90 hover:border-[#800020] shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group relative"
    >
      {/* Solid Bordeaux Header with White Contour Badges */}
      <div className="h-28 bg-[#800020] relative flex items-center justify-between px-4 pb-4">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        {/* City & Approval Seals */}
        <div className="relative z-10 flex items-center justify-between w-full">
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 flex items-center gap-1 shadow-xs">
            <MapPin className="w-3 h-3 text-rose-200" />
            {compCity}
          </span>
          <span className="bg-white text-[#800020] text-[10px] font-mono font-black px-2.5 py-1 rounded-full border-2 border-white flex items-center gap-1 shadow-md">
            <ShieldCheck className="w-3 h-3 text-[#800020]" />
            Agréé RNE
          </span>
        </div>

        {/* Centered Circular Logo with White Contour */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="w-18 h-18 rounded-full bg-white shadow-xl border-4 border-white ring-2 ring-[#800020]/25 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={compName}
                className="w-full h-full object-contain p-2"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <span className="text-2xl font-black text-[#800020]">{initials}</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="pt-11 px-5 pb-5 flex-1 flex flex-col">
        <div className="text-center mb-3">
          <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-[#800020] transition-colors line-clamp-1 mb-1">
            {compName}
          </h3>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <RatingStars rating={rating} count={revCount} size="xs" />
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Vérifié Ministère Transport
          </span>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 font-normal text-center">
          {comp.description || "Spécialiste certifié du déménagement avec camions capitonnés, monte-meubles et équipes déclarées."}
        </p>

        {/* Hardware & Team specs */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 font-semibold flex items-center justify-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-[#800020]" />
            <span>{comp.fleetSize || 6} Camions</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 font-semibold flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#800020]" />
            <span>{comp.employeesCount || 12} Porteurs</span>
          </div>
        </div>

        {/* Solid Bordeaux CTA Button with White Border */}
        <div className="mt-auto">
          <Link
            to={`/companies/${compId}`}
            className="w-full py-3 px-3.5 rounded-xl bg-[#800020] hover:bg-[#6b001a] text-white border-2 border-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ring-2 ring-[#800020]/25 group-hover:scale-[1.01]"
          >
            <span>Voir la fiche &amp; Devis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   REQUEST CARD — Architectural Dossier (Rouge Bordeaux & White Contour)
───────────────────────────────────────────────────────────*/
function RequestCard({ req }) {
  const reqId = req._id || req.id;
  const depCity = req.departure?.city || req.departureAddress?.city || req.departureAddress?.governorate || "Tunis";
  const arrCity = req.arrival?.city || req.arrivalAddress?.city || req.arrivalAddress?.governorate || "Sousse";
  const volume = req.estimatedVolume || req.inventory?.estimatedVolume || 25;
  const boxes = req.estimatedBoxes || req.inventory?.estimatedBoxes || 30;
  const housingKey = req.departureHousingType || req.departure?.housingType || "apartment";
  const housing = HOUSING_TRANSLATIONS[housingKey] || housingKey;
  const clientName = req.client?.fullName || req.client?.firstName || "Client MoversGo";
  const quotesCount = typeof req.quotesCount === "number" ? req.quotesCount : 0;
  const moveDate = formatDate(req.desiredDate || req.preferredDate);

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ scale: 1.01, y: -6 }}
      transition={{ type: "spring", stiffness: 280 }}
      className="bg-white rounded-[2.2rem] overflow-hidden border-2 border-slate-200/90 hover:border-[#800020] shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group relative"
    >
      {/* Solid Bordeaux Header */}
      <div className="bg-[#800020] text-white p-5 pb-7 relative overflow-hidden">
        {/* Subtle dot matrix */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Housing category badge */}
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-white/15 border-2 border-white text-white flex items-center justify-center font-bold shadow-sm">
              <Home className="w-4 h-4" />
            </span>
            <span className="font-mono text-xs font-bold text-white tracking-wide">
              {housing}
            </span>
          </div>

          {/* Quotes count pill */}
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white text-[#800020] border-2 border-white shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {quotesCount > 0 ? `${quotesCount} devis` : "Nouveau"}
          </span>
        </div>

        <div className="relative z-10 mt-3 flex items-center gap-1.5 text-xs text-rose-100 font-mono">
          <Calendar className="w-3.5 h-3.5 text-rose-200" />
          <span>Date : {moveDate}</span>
        </div>
      </div>

      {/* Floating Route Card */}
      <div className="px-4 sm:px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Départ</p>
              <p className="text-xs font-black text-slate-900 truncate">{depCity}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <div className="w-5 h-px border-t-2 border-dashed border-slate-300" />
              <ArrowRight className="w-3.5 h-3.5 text-[#800020]" />
              <div className="w-5 h-px border-t-2 border-dashed border-slate-300" />
              <div className="w-2 h-2 rounded-full bg-[#800020]" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Arrivée</p>
              <p className="text-xs font-black text-slate-900 truncate">{arrCity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details & Specs */}
      <div className="px-4 sm:px-5 py-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
              <Box className="w-4 h-4 text-[#800020] flex-shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400 font-medium uppercase">Cubage</p>
                <p className="text-xs font-bold text-slate-900 font-mono">{volume} m³</p>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#800020] flex-shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400 font-medium uppercase">Cartons</p>
                <p className="text-xs font-bold text-slate-900 font-mono">~{boxes}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 mb-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Anonymat garanti
            </span>
            <span className="text-slate-700 font-semibold truncate max-w-[120px]">
              {clientName}
            </span>
          </div>
        </div>

        {/* Solid Bordeaux CTA Button with White Border */}
        <div className="mt-auto">
          <Link
            to="/demenagements"
            className="w-full py-3 px-3.5 rounded-xl bg-[#800020] hover:bg-[#6b001a] text-white border-2 border-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ring-2 ring-[#800020]/25 group-hover:scale-[1.01]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Examiner &amp; Proposer devis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   CONSTANTS — Tunisian Governorates & Precision Estimator
───────────────────────────────────────────────────────────*/
const TN_GOVERNORATES = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Le Kef",
  "Siliana",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Gabès",
  "Médenine",
  "Tataouine",
  "Gafsa",
  "Tozeur",
  "Kébili",
];

const ESTIMATOR_HOUSING_TYPES = [
  { id: "Studio", label: "Studio", volume: "10–15 m³", icon: Box, subtitle: "1 pièce · ~25-35 m²" },
  { id: "S+1", label: "S+1", volume: "15–22 m³", icon: Home, subtitle: "2 pièces · ~40-60 m²" },
  { id: "S+2", label: "S+2", volume: "22–32 m³", icon: Building2, subtitle: "3 pièces · ~70-95 m²" },
  { id: "S+3", label: "S+3", volume: "32–45 m³", icon: Boxes, subtitle: "4 pièces · ~100-140 m²" },
  { id: "Villa", label: "Villa", volume: "45–75 m³", icon: Layers, subtitle: "Maison / Duplex · >150 m²" },
];

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────*/
export function HomePage() {
  const [companies, setCompanies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);
  const [estType, setEstType] = useState("S+2");
  const [estFrom, setEstFrom] = useState("Tunis");
  const [estTo, setEstTo] = useState("Sousse");
  const [estLift, setEstLift] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPublicData() {
      try {
        const resComps = await companyService.getPublicCompanies({ limit: 4 });
        const listComps = resComps?.data?.companies || resComps?.companies || resComps?.data || (Array.isArray(resComps) ? resComps : []);
        const fallbackComps = await dataService.getCompanies();
        const mergedComps = [...(Array.isArray(listComps) ? listComps : [])];
        for (const fb of fallbackComps) {
          if (mergedComps.length >= 4) break;
          const fbId = fb.id || fb._id;
          if (!mergedComps.some((c) => (c.id || c._id) === fbId)) mergedComps.push(fb);
        }
        if (isMounted) setCompanies(mergedComps.slice(0, 4));
      } catch (err) {
        const fallbackComps = await dataService.getCompanies();
        if (isMounted) setCompanies(fallbackComps.slice(0, 4));
      } finally {
        if (isMounted) setLoadingCompanies(false);
      }

      try {
        const resReqs = await requestService.getPublicRequests({ limit: 4 });
        const listReqs = Array.isArray(resReqs) ? resReqs : (resReqs?.data || resReqs?.requests || []);
        const mergedReqs = [...(Array.isArray(listReqs) ? listReqs : [])];
        for (const sample of SAMPLE_REQUESTS) {
          if (mergedReqs.length >= 4) break;
          const sampleId = sample._id || sample.id;
          if (!mergedReqs.some((r) => (r._id || r.id) === sampleId)) mergedReqs.push(sample);
        }
        if (isMounted) setRequests(mergedReqs.slice(0, 4));
      } catch (err) {
        if (isMounted) setRequests(SAMPLE_REQUESTS.slice(0, 4));
      } finally {
        if (isMounted) setLoadingRequests(false);
      }

      try {
        const revs = await dataService.getReviews();
        if (isMounted) setReviews(revs.slice(0, 3));
      } catch (err) {
        console.warn("Could not load reviews:", err);
      }
    }
    loadPublicData();
    return () => { isMounted = false; };
  }, []);

  const getEstimatedPriceRange = () => {
    let base = 350;
    if (estType === "Studio") base = 250;
    if (estType === "S+1") base = 320;
    if (estType === "S+2") base = 480;
    if (estType === "S+3") base = 680;
    if (estType === "Villa") base = 1100;
    if (estFrom !== estTo) base += 350;
    if (estLift) base += 140;
    return `${base} – ${base + 220} DT`;
  };

  const getEstimatedVolume = () => {
    if (estType === "Studio") return "10–15 m³";
    if (estType === "S+1") return "15–22 m³";
    if (estType === "S+2") return "22–32 m³";
    if (estType === "S+3") return "32–45 m³";
    return "45–75 m³";
  };

  const stats = [
    { label: "Déménagements réussis", value: "6400", suffix: "+", icon: Truck, color: "brand", description: "Familles et entreprises accompagnées" },
    { label: "Transporteurs agréés RNE", value: "85", suffix: "+", icon: Award, color: "emerald", description: "Partenaires certifiés sur tout le territoire" },
    { label: "Taux de satisfaction", value: "98", suffix: "%", icon: Heart, color: "amber", description: "Clients satisfaits après livraison" },
    { label: "Économie moyenne constatée", value: "35", suffix: "%", icon: BarChart3, color: "sapphire", description: "Par rapport au marché traditionnel" },
  ];

  const steps = [
    { number: "01", title: "Décrivez votre logement", description: "Formulaire guidé en 2 min : type de bien, étages, ascenseur, mobilier et gouvernorat.", icon: FileText, tag: "100% Gratuit" },
    { number: "02", title: "Recevez vos devis sous 2h", description: "Les déménageurs certifiés de votre région vous envoient leurs propositions en DT.", icon: Clock, tag: "Sans engagement" },
    { number: "03", title: "Comparez en toute transparence", description: "Tarifs détaillés, monte-meubles, avis vérifiés, assurance STAR / COMAR incluse.", icon: Search, tag: "Prix garantis" },
    { number: "04", title: "Réservez avec séquestre CIB", description: "Validez avec un acompte sécurisé de 30%. Solde versé après livraison en parfait état.", icon: ShieldCheck, tag: "Paiement protégé" },
  ];

  const benefits = [
    { title: "Économisez jusqu'à 40%", description: "Mise en concurrence transparente entre professionnels vérifiés locaux pour obtenir le meilleur prix du marché.", icon: BadgePercent, gradient: "from-rose-500 to-pink-600" },
    { title: "Transporteurs Agréés RNE", description: "Chaque partenaire est minutieusement audité : patente fiscale, agrément Ministère du Transport, assurance cargo.", icon: ShieldCheck, gradient: "from-emerald-500 to-teal-600" },
    { title: "Monte-charge & Accès difficiles", description: "Équipements télescopiques modernes pour immeubles élevés à Ennasr, Menzah, Lac, Sousse ou Sfax.", icon: Layers, gradient: "from-sky-500 to-blue-600" },
    { title: "Paiement Sécurisé en DT", description: "Acompte sous séquestre bancaire. Aucun risque de surfacturation ni de mauvaise surprise le jour J.", icon: Sparkles, gradient: "from-amber-500 to-orange-600" },
  ];

  const faqs = [
    { question: "La demande de devis sur MoversGo est-elle payante ?", answer: "Non, la demande de devis est 100% gratuite et sans aucun engagement. Vous pouvez comparer les offres en toute liberté." },
    { question: "Comment MoversGo sélectionne-t-il ses partenaires ?", answer: "Chaque société doit fournir son extrait RNE, sa patente/matricule fiscal, son agrément de transport et son attestation d'assurance marchandises (STAR, COMAR, GAT…)." },
    { question: "Disposez-vous de monte-charges pour les étages élevés ?", answer: "Oui, la majorité de nos partenaires disposent de monte-meubles télescopiques modernes capables d'atteindre du 1er au 10ème étage." },
    { question: "Comment s'effectue le règlement ?", answer: "Un acompte de 30% est versé en ligne (CIB ou virement sécurisé). Le solde de 70% est remis directement au chef d'équipe après constat de bon état." },
  ];

  return (
    <div className="overflow-hidden bg-slate-50/60">

      {/* 1. HERO SLIDES (NOUVELLE SECTION CARROUSEL 3 SLIDES RESPONSIVE)
      <HeroSlidesSection /> */}

      {/* 
        1. ANCIEN HERO (COMMENTÉ SELON LA DEMANDE UTILISATEUR)
        */}
      <HeroSection />


      {/* 2. PARTNER CIRCLE MARQUEE (AGRÉÉES RNE) */}
      <PartnerMarquee initialCompanies={companies} />

      {/* 3. STATS — La confiance en chiffres (Unslop Architectural Style) */}
      <section className="py-20 bg-slate-950 relative overflow-hidden border-y-2 border-slate-800">
        {/* Subtle architectural dot grid pattern in Rouge Bordeaux */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #800020 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Wave top divider */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden h-10 pointer-events-none">
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="w-full h-full text-slate-50/60" fill="currentColor">
            <path d="M0,0 C360,40 1080,0 1440,20 L1440,0 Z" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeInUp className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-white bg-[#800020] px-4 py-1.5 rounded-full border-2 border-white shadow-md mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
              Chiffres Clés MoversGo
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3">
              La confiance en{" "}
              <span className="inline-block text-[#800020] bg-white px-3.5 py-0.5 rounded-xl border-2 border-white shadow-md">
                chiffres
              </span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
              Des milliers de déménagements réussis à travers toute la Tunisie, chaque année.
            </p>
          </FadeInUp>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((s) => (<StatCard key={s.label} {...s} />))}
          </motion.div>
        </div>

        {/* Wave bottom divider */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden h-10 pointer-events-none">
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="w-full h-full text-white" fill="currentColor">
            <path d="M0,40 C360,0 1080,40 1440,20 L1440,40 Z" />
          </svg>
        </div>
      </section>

      {/* 4. LES 4 DERNIÈRES ENTREPRISES AGRÉÉES */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeInUp className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-4 py-1.5 rounded-full border border-rose-200 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-[#800020]" />Réseau Professionnel · Registre National (RNE)
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
              Les 4 Dernières
              <span className="relative inline-block ml-3">
                <span className="text-[#800020]">Entreprises Agréées</span>
              </span>
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto font-light leading-relaxed">
              Transporteurs et déménageurs professionnels audités avec patente fiscale, extrait RNE officiel, flotte capitonnée et assurance cargo.
            </p>
          </FadeInUp>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
          >
            {companies.slice(0, 4).map((comp, idx) => (
              <CompanyCard key={comp._id || comp.id} comp={comp} idx={idx} />
            ))}
          </motion.div>

          <div className="text-center">
            <Link
              to="/companies"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#800020] hover:bg-[#6b001a] text-white border-2 border-white text-sm font-bold shadow-xl ring-2 ring-[#800020]/25 transition-all group"
            >
              <span>Voir tous les déménageurs agréés</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. DERNIERS DÉMÉNAGEMENTS PUBLIÉS */}
      <section className="py-20 bg-slate-50/70 relative overflow-hidden border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeInUp className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-4 py-1.5 rounded-full border border-rose-200 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#800020]" />Bourse des Déménagements en Direct · Tunisie
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
              Derniers Déménagements
              <span className="text-[#800020] ml-3">Publiés</span>
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto font-light leading-relaxed">
              Les particuliers et entreprises viennent de publier leurs besoins. Consultez les itinéraires, les étages, le cubage précis et proposez vos offres.
            </p>
          </FadeInUp>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
          >
            {requests.slice(0, 4).map((req) => (
              <RequestCard key={req._id || req.id} req={req} />
            ))}
          </motion.div>

          <div className="text-center">
            <Link
              to="/demenagements"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#800020] hover:bg-[#6b001a] text-white border-2 border-white text-sm font-bold shadow-xl ring-2 ring-[#800020]/25 transition-all group"
            >
              <span>Voir plus de déménagements</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="py-20 bg-white relative overflow-hidden border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInUp className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-4 py-1.5 rounded-full border border-rose-200 mb-4">
              Processus simple &amp; transparent
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              4 étapes pour un
              <span className="text-[#800020]"> déménagement réussi</span>
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed font-light">
              De votre premier inventaire jusqu'à l'installation complète dans votre nouveau foyer.
            </p>
          </FadeInUp>

          {/* Stepper timeline progress ribbon */}
          <div className="hidden lg:grid grid-cols-4 gap-6 mb-8 px-4">
            {[
              { num: "01", label: "Inventaire digital", sub: "2 minutes" },
              { num: "02", label: "Devis certifiés", sub: "Sous 2h max" },
              { num: "03", label: "Comparatif & Audit", sub: "100% transparent" },
              { num: "04", label: "Séquestre CIB", sub: "Paiement protégé" },
            ].map((node, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#800020] text-white font-mono text-xs font-black flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md ring-2 ring-[#800020]/25">
                    {node.num}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{node.label}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{node.sub}</p>
                  </div>
                </div>
                {i < 3 && (
                  <div className="flex-1 flex items-center px-2">
                    <div className="h-0.5 w-full bg-slate-200 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#800020]" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative"
          >
            {steps.map((step, idx) => (<StepCard key={idx} {...step} index={idx} />))}
          </motion.div>

          {/* Bottom assurance footer bar */}
          <div className="mt-12 p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Vous gardez le contrôle total à chaque étape</p>
                <p className="text-xs text-slate-500 font-light">Aucun engagement financier avant la validation finale du devis retenu.</p>
              </div>
            </div>
            <Link
              to="/client/requests/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#800020] hover:bg-[#6b001a] text-white border-2 border-white text-xs font-bold transition-all shadow-lg ring-2 ring-[#800020]/25 flex-shrink-0"
            >
              <span>Démarrer ma demande</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. SPLIT — Why MoversGo — Multi-format Geometric Gallery & Bordeaux Editorial */}
      <section className="py-20 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[3rem] p-8 lg:p-14 bg-white border-2 border-slate-200/90 shadow-xl grid lg:grid-cols-12 gap-10 lg:gap-14 items-center relative">
            {/* Left: Multi-Image Geometric Mosaic Gallery */}
            <div className="lg:col-span-6 relative">
              {/* Decorative architectural backdrop */}
              <div className="absolute -inset-4 bg-rose-50/70 rounded-[3.5rem] -rotate-1 pointer-events-none border border-rose-100" />

              <div className="relative grid grid-cols-12 gap-3 sm:gap-4 items-center">
                {/* 1. Large Monumental Portrait Arch */}
                <div className="col-span-7 relative group">
                  <div className="overflow-hidden rounded-t-[5.5rem] rounded-b-[2rem] border-4 border-white shadow-2xl aspect-[3/4] bg-slate-100 relative">
                    <img
                      src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=85"
                      onError={(e) => { e.currentTarget.src = "/hero-1.jfif"; }}
                      alt="Équipe déménagement professionnel Tunisie"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#800020] text-white border-2 border-white text-[10px] font-mono font-bold shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Flotte Agréée RNE
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Right Stack: Circular Lens Vignette & Chamfered Landscape */}
                <div className="col-span-5 flex flex-col gap-3 sm:gap-4">
                  {/* Circular porthole lens */}
                  <div className="relative group self-center sm:self-start w-32 h-32 sm:w-36 sm:h-36">
                    <div className="overflow-hidden rounded-full border-4 border-white shadow-xl w-full h-full bg-slate-100">
                      <img
                        src="/hero-2.jfif"
                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80"; }}
                        alt="Déménageur certifié MoversGo"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#800020] text-white border-2 border-white shadow-md flex items-center justify-center font-bold text-xs ring-2 ring-[#800020]/20">
                      ★
                    </div>
                  </div>

                  {/* Asymmetric chamfered landscape */}
                  <div className="relative group">
                    <div className="overflow-hidden rounded-3xl rounded-br-[3.5rem] rounded-tl-xl border-4 border-white shadow-xl aspect-[4/3] bg-slate-100">
                      <img
                        src="/hero-3.jfif"
                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop&q=80"; }}
                        alt="Matériel logistique et monte-meubles"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Reassurance Badge in Bordeaux & White Contour */}
              <div className="absolute -bottom-6 left-4 sm:left-8 p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border-2 border-slate-200/90 max-w-xs z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#800020] text-white border-2 border-white shadow-md flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">Assurance STAR &amp; COMAR</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Biens couverts jusqu'à 200 000 DT</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Editorial & 4 Benefits Cards */}
            <div className="lg:col-span-6 space-y-6">
              <FadeInUp>
                <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-4 py-1.5 rounded-full border border-rose-200 mb-3">
                  Pourquoi choisir MoversGo
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
                  Fini le déménagement improvisé et les <span className="text-[#800020]">mauvaises surprises</span>
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-light">
                  Bénéficiez de véhicules capitonnés, d'équipes déclarées et de contrats fermes sans frais cachés — dans les 24 gouvernorats de Tunisie.
                </p>

                <div className="grid sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {benefits.map((b, i) => {
                    const Icon = b.icon;
                    return (
                      <motion.div
                        key={i}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200/80 hover:border-[#800020] shadow-sm hover:shadow-xl transition-all space-y-2.5 group relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#800020] border border-rose-200/80 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-[#800020] group-hover:text-white group-hover:border-2 group-hover:border-white transition-all duration-200">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#800020] text-white border border-white shadow-sm">
                            0{i + 1}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#800020] transition-colors leading-snug">
                          {b.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                          {b.description}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bottom reassurance callout in rouge bordeaux with white border */}
                <div className="mt-5">
                  <div className="p-4 rounded-2xl bg-[#800020] text-white border-2 border-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 ring-2 ring-[#800020]/25">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-rose-200 flex-shrink-0" />
                      <span className="text-xs font-bold leading-tight">
                        Contrat officiel &amp; tarif garanti sans surcoût le jour J
                      </span>
                    </div>
                    <Link
                      to="/client/requests/new"
                      className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-[#800020] font-black text-xs transition-all shadow-md border border-white whitespace-nowrap flex items-center gap-1.5 flex-shrink-0"
                    >
                      <span>Comparer les devis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </FadeInUp>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICE SIMULATOR — Minimalist Architectural Console & Solid Bordeaux Carbon Slip (Zero Gradients) */}
      <section id="simulator" className="py-20 bg-slate-100/70 border-y border-slate-200/90 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInUp className="text-center mb-12">

            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Estimez le <span className="text-[#800020]">budget</span> de votre déménagement
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto font-normal">
              Simulateur prévisionnel calculé sur la base des prix moyens observés pour 1 200+ déménagements à travers les 24 gouvernorats.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Interactive Geometric Control Console */}
              <div className="lg:col-span-7 bg-white rounded-[2.5rem] border-2 border-slate-200/90 p-6 sm:p-9 shadow-sm space-y-7">
                {/* 1. Housing Type Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#800020] text-white font-mono text-xs flex items-center justify-center font-black border-2 border-white shadow-md ring-2 ring-[#800020]/25">1</span>
                      Gabarit du logement
                    </label>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      Volume : {getEstimatedVolume()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {ESTIMATOR_HOUSING_TYPES.map((t) => {
                      const IconComp = t.icon;
                      const isSelected = estType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEstType(t.id)}
                          className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${isSelected
                            ? "bg-[#800020] text-white border-2 border-white shadow-lg ring-2 ring-[#800020]/30"
                            : "bg-white text-slate-800 border-slate-200 hover:border-[#800020]/40 hover:bg-rose-50/20"
                            }`}
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? "bg-white/20 text-white border border-white/40" : "bg-slate-100 text-slate-700"
                              }`}>
                              <IconComp className="w-4 h-4" />
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-tight">{t.label}</p>
                            <p className={`text-[10px] font-mono mt-0.5 ${isSelected ? "text-rose-100" : "text-slate-500"}`}>
                              {t.volume}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Departure & Arrival Governorates */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-[#800020] text-white font-mono text-xs flex items-center justify-center font-black border-2 border-white shadow-md ring-2 ring-[#800020]/25">2</span>
                    Axe de trajet (24 Gouvernorats)
                  </label>

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Gouvernorat de Départ
                      </span>
                      <select
                        value={estFrom}
                        onChange={(e) => setEstFrom(e.target.value)}
                        className="w-full py-3 px-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/20 cursor-pointer transition-colors"
                      >
                        {TN_GOVERNORATES.map((gov) => (
                          <option key={gov} value={gov}>{gov}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Gouvernorat d'Arrivée
                      </span>
                      <select
                        value={estTo}
                        onChange={(e) => setEstTo(e.target.value)}
                        className="w-full py-3 px-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/20 cursor-pointer transition-colors"
                      >
                        {TN_GOVERNORATES.map((gov) => (
                          <option key={gov} value={gov}>{gov}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Route Indicator */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{estFrom}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800">{estTo}</span>
                    </div>
                    {estFrom === estTo ? (
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Trajet Local (Même gouvernorat)
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] font-bold text-[#800020] bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                        Inter-Gouvernorats (+350 DT transit)
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Heavy Access & Mechanical Lift Option */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-[#800020] text-white font-mono text-xs flex items-center justify-center font-black border-2 border-white shadow-md ring-2 ring-[#800020]/25">3</span>
                    Options d'accès &amp; équipement
                  </label>

                  <button
                    type="button"
                    onClick={() => setEstLift(!estLift)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${estLift
                      ? "border-2 border-[#800020] bg-rose-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${estLift ? "bg-[#800020] text-white border-2 border-white shadow-sm ring-2 ring-[#800020]/20" : "bg-slate-100 text-slate-600"
                        }`}>
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">Monte-charge extérieur télescopique</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-[#800020] border border-rose-200">+140 DT</span>
                        </div>
                        <p className="text-xs text-slate-500 font-light mt-0.5">
                          Recommandé dès le 3ème étage sans ascenseur ou escaliers étroits
                        </p>
                      </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${estLift ? "bg-[#800020] border border-white shadow-sm" : "bg-slate-200"
                      }`}>
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${estLift ? "translate-x-5 shadow-sm" : "translate-x-0"
                        }`} />
                    </div>
                  </button>
                </div>
              </div>

              {/* Right Column: Solid Bordeaux Slip with White Border (Zero Gradient) */}
              <div className="lg:col-span-5 bg-[#800020] text-white rounded-[2.5rem] p-7 sm:p-9 border-2 border-white shadow-2xl relative flex flex-col justify-between ring-4 ring-[#800020]/25">
                <div>
                  {/* Voucher Header Stamp */}
                  <div className="flex items-center justify-between pb-4 border-b border-dashed border-white/25">
                    <div>
                      <p className="font-mono text-[10px] tracking-widest text-rose-200 uppercase font-bold">
                        Bordereau Tarifaire Officiel
                      </p>
                      <p className="font-mono text-xs font-bold text-white">
                        REF: #EST-{estType}-TN
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/30 font-mono text-[10px] font-bold text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Calcul Direct
                    </span>
                  </div>

                  {/* Giant Price Block */}
                  <div className="py-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-200 font-mono">
                      Budget Moyen Prévisionnel
                    </p>
                    <motion.div
                      key={getEstimatedPriceRange()}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-heading text-4xl sm:text-5xl font-black text-white mt-1 mb-2 tracking-tight"
                    >
                      {getEstimatedPriceRange()}
                    </motion.div>
                    <p className="text-xs text-rose-100 font-light leading-relaxed">
                      Comprend camion capitonné, équipe de porteurs déclarés et assurance tous risques STAR / COMAR.
                    </p>
                  </div>

                  {/* Itemized Perforated Breakdown */}
                  <div className="space-y-3 pt-4 border-t border-dashed border-white/25 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-rose-200">Gabarit sélectionné</span>
                      <span className="font-bold text-white font-mono">{estType} ({getEstimatedVolume()})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-200">Équipage recommandé</span>
                      <span className="font-bold text-white">
                        {estType === "Studio"
                          ? "1 Véhicule 12m³ + 2 Porteurs"
                          : estType === "S+1"
                            ? "1 Véhicule 16m³ + 2 Porteurs"
                            : estType === "S+2"
                              ? "1 Camion 22m³ + 3 Porteurs"
                              : estType === "S+3"
                                ? "1 Camion 35m³ + 3 Porteurs"
                                : "2 Camions 50m³ + 4 Porteurs"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-200">Parcours géographique</span>
                      <span className="font-bold text-white">
                        {estFrom === estTo ? `${estFrom} (Intra-Gov)` : `${estFrom} ➔ ${estTo}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-200">Monte-charge télescopique</span>
                      <span className="font-bold text-white font-mono">
                        {estLift ? "Inclus (+140 DT)" : "Non sélectionné (0 DT)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-200">Assurance marchandises</span>
                      <span className="font-bold text-emerald-300">Incluse (200 000 DT)</span>
                    </div>
                  </div>
                </div>

                {/* Voucher CTA Button */}
                <div className="mt-8 pt-6 border-t border-dashed border-white/25 space-y-3">
                  <Link
                    to="/client/requests/new"
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white hover:bg-rose-50 text-[#800020] font-black text-sm transition-all shadow-xl hover:scale-[1.01] active:scale-[0.99] text-center border-2 border-white ring-2 ring-white/50"
                  >
                    <span>Recevoir mes devis exacts</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-[11px] text-center text-rose-200/90 font-light">
                    100% gratuit et sans engagement · Devis fermes établis par les entreprises agréées
                  </p>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* 9. TESTIMONIALS — Dark background with Bordeaux Accent */}
      <section className="py-20 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#800020]/60 to-transparent" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#800020]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeInUp className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-rose-300 bg-[#800020]/30 px-4 py-1.5 rounded-full border border-rose-500/30 mb-4">
              Avis clients certifiés
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-3">
              Ils ont déménagé avec <span className="text-rose-400">MoversGo</span>
            </h2>
            <p className="text-slate-400 text-sm font-light">Témoignages authentiques recueillis après chaque livraison terminée.</p>
          </FadeInUp>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-7"
          >
            {reviews.map((rev) => {
              return (
                <motion.div
                  key={rev.id}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  className="relative bg-white rounded-3xl p-7 border-t-4 border-t-[#800020] border-x border-b border-slate-200/90 hover:shadow-2xl transition-all flex flex-col justify-between"
                >
                  {/* Big quote mark */}
                  <div className="text-6xl font-black text-rose-100 leading-none mb-2 select-none" aria-hidden>"</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <RatingStars rating={rev.rating} size="sm" />
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Vérifié ✓</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2 leading-snug">"{rev.title}"</h4>
                    <p className="text-xs text-slate-600 leading-relaxed italic font-light">"{rev.comment}"</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                    <img src={rev.clientAvatar} alt={rev.clientName} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-[#800020]/20" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rev.clientName}</p>
                      <p className="text-[10px] text-slate-500">{rev.companyName}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#800020]/60 to-transparent" />
      </section>

      {/* 10. FAQ */}
      <section className="py-20 bg-white relative overflow-hidden border-b border-slate-200/70">
        {/* Mesh grid background */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: "linear-gradient(to right, #e2e8f020 1px, transparent 1px), linear-gradient(to bottom, #e2e8f020 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }} />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeInUp className="text-center mb-12">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-4 py-1.5 rounded-full border border-rose-200 mb-4">
              Questions fréquentes
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Tout ce que vous devez savoir
            </h2>
            <p className="text-slate-500 text-sm font-light">Nos réponses aux questions les plus courantes de nos clients.</p>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div key={index} className={`rounded-2xl border transition-all overflow-hidden ${isOpen ? "border-[#800020] ring-2 ring-[#800020]/15 shadow-sm" : "bg-white border-slate-200"}`}>
                    <button onClick={() => setActiveFaq(isOpen ? null : index)} className="w-full flex items-center justify-between p-5 text-left">
                      <span className={`text-sm font-bold leading-snug pr-4 ${isOpen ? "text-[#800020]" : "text-slate-900"}`}>{faq.question}</span>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className={`w-5 h-5 ${isOpen ? "text-[#800020]" : "text-slate-400"}`} />
                      </motion.div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="flex">
                            {/* Bordeaux left accent bar */}
                            <div className="w-1.5 bg-[#800020] flex-shrink-0 rounded-r ml-5 my-2" />
                            <p className="pl-4 pr-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed pt-3 font-light">{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* 11. SUPPORT SECTION */}
      <section className="py-20 bg-gradient-to-br from-[#800020] via-[#6b001a] to-[#4a0012] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full mb-4 border border-white/20">
              <LifeBuoy className="w-4 h-4" />
              Assistance &amp; Support
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Besoin d&apos;aide ? Notre équipe est là pour vous.
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Un déménagement, c&apos;est stressant. Mais avec MoversGo, vous n&apos;êtes jamais seul.
              Contactez-nous à tout moment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {/* Ticket Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <LifeBuoy className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ouvrir un Ticket</h3>
              <p className="text-white/60 text-sm mb-4 leading-relaxed">
                Signalez un problème, suivez votre demande et obtenez une réponse rapide de notre équipe support.
              </p>
              <ul className="space-y-1 mb-5">
                <li className="flex items-center gap-2 text-white/70 text-sm"><Check className="w-4 h-4 text-green-400" />Réponse en moins de 24h</li>
                <li className="flex items-center gap-2 text-white/70 text-sm"><Check className="w-4 h-4 text-green-400" />Suivi en temps réel</li>
                <li className="flex items-center gap-2 text-white/70 text-sm"><Check className="w-4 h-4 text-green-400" />Historique complet</li>
              </ul>
              <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-[#800020] font-semibold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors text-sm">
                Créer un ticket <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Contact Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nous Contacter</h3>
              <p className="text-white/60 text-sm mb-4 leading-relaxed">
                Une question avant de réserver ? Contactez directement nos coordinateurs disponibles du lundi au samedi.
              </p>
              <ul className="space-y-1 mb-5">
                <li className="flex items-center gap-2 text-white/70 text-sm"><Check className="w-4 h-4 text-green-400" />Formulaire de contact</li>
                <li className="flex items-center gap-2 text-white/70 text-sm"><Check className="w-4 h-4 text-green-400" />Email &amp; Téléphone</li>
                <li className="flex items-center gap-2 text-white/70 text-sm"><Check className="w-4 h-4 text-green-400" />Réponse personnalisée</li>
              </ul>
              <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-[#800020] font-semibold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors text-sm">
                Envoyer un message <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* FAQ Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Base de Connaissances</h3>
              <p className="text-white/60 text-sm mb-4 leading-relaxed">
                Trouvez des réponses instantanées aux questions les plus fréquentes sur nos services et processus.
              </p>
              <ul className="space-y-1 mb-5">
                <li className="flex items-center gap-2 text-white/70 text-sm"><Check className="w-4 h-4 text-green-400" />50+ questions répondues</li>
                <li className="flex items-center gap-2 text-white/70 text-sm"><Check className="w-4 h-4 text-green-400" />Guides pratiques</li>
                <li className="flex items-center gap-2 text-white/70 text-sm"><Check className="w-4 h-4 text-green-400" />Accès instantané</li>
              </ul>
              <Link to="/faq" className="inline-flex items-center gap-2 bg-white text-[#800020] font-semibold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors text-sm">
                Consulter la FAQ <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">&lt;2h</div>
              <div className="text-white/60 text-sm mt-1">Temps de réponse moyen</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-white/60 text-sm mt-1">Clients satisfaits</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-white/60 text-sm mt-1">Support disponible</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-white/60 text-sm mt-1">Tickets résolus</div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FINAL CTA — Solid Bordeaux with White Contour */}
      <section className="py-20 bg-slate-50/60 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="rounded-[3rem] p-10 sm:p-16 bg-[#800020] text-white border-4 border-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 ring-4 ring-[#800020]/25">
            <div className="max-w-xl space-y-4 text-center md:text-left z-10">
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-white bg-white/15 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/30">
                Prêt pour le grand départ ?
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                Publiez votre demande et comparez vos devis gratuitement
              </h2>
              <p className="text-rose-100 text-sm leading-relaxed font-light">
                Rejoignez plus de 6 400 familles et entreprises qui ont déménagé en Tunisie avec sérénité et sécurité.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 z-10 w-full sm:w-auto">
              <Link
                to="/client/requests/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-3xl bg-white text-[#800020] hover:bg-rose-50 transition-all font-black text-sm shadow-xl hover:-translate-y-0.5 border-2 border-white ring-2 ring-white/50"
              >
                <span>Publier ma demande gratuite</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/demenagements"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-3xl bg-white/15 hover:bg-white/25 text-white border-2 border-white transition-all font-bold text-sm backdrop-blur-md shadow-md"
              >
                <span>Voir les déménagements</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
