import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { bookingService } from "../../services/api/bookingService";
import { formatDate, formatCurrency } from "../../utils/cn";
import { StatusBadge } from "../../components/common/StatusBadge";
import InvoiceModal from "../../components/common/InvoiceModal";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Truck,
  Eye,
  CheckCircle2,
  Bell,
  BellRing,
  Send,
  Phone,
  Mail,
  User,
  AlertCircle,
  FileText,
  CalendarDays,
  ListOrdered,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  X,
  Check
} from "lucide-react";

/**
 * Format Date to YYYY-MM-DD
 */
function toDateKey(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Format readable full address
 */
function fmtAddress(addr) {
  if (!addr) return "Adresse non précisée";
  if (typeof addr === "string") return addr;
  const parts = [
    addr.street,
    addr.postalCode ? `${addr.postalCode} ${addr.city || ""}`.trim() : addr.city,
    addr.governorate,
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  if (addr.city || addr.governorate) return [addr.city, addr.governorate].filter(Boolean).join(" - ");
  return "Adresse non précisée";
}

/**
 * Compute countdown relative to today
 */
function getCountdownBadge(scheduledDate) {
  if (!scheduledDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(scheduledDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Passé (${Math.abs(diffDays)}j)`, color: "bg-slate-100 text-slate-600 border-slate-200" };
  }
  if (diffDays === 0) {
    return { text: "Aujourd'hui !", color: "bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse" };
  }
  if (diffDays === 1) {
    return { text: "Demain (J-1)", color: "bg-amber-100 text-amber-800 border-amber-300 font-bold" };
  }
  if (diffDays <= 3) {
    return { text: `Dans ${diffDays} jours (J-${diffDays})`, color: "bg-amber-50 text-amber-700 border-amber-200 font-semibold" };
  }
  return { text: `Dans ${diffDays} jours (J-${diffDays})`, color: "bg-blue-50 text-blue-700 border-blue-200" };
}

export function CompanyCalendarPage() {
  const { currentUser } = useAuth();
  const { onBookingUpdate } = useNotifications();

  // Navigation state
  const today = new Date();
  const todayStr = toDateKey(today);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState("month"); // 'month', 'week', 'agenda'
  const [filterStatus, setFilterStatus] = useState("all");

  // Data state
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminderId, setSendingReminderId] = useState(null);

  // Modals state
  const [reminderModalBooking, setReminderModalBooking] = useState(null);
  const [invoiceModalBookingId, setInvoiceModalBookingId] = useState(null);

  // Load bookings
  const loadBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await bookingService.getCompanyBookings({ limit: 100 });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : res?.bookings || [];
      setBookings(list);
    } catch (err) {
      console.error("Erreur chargement réservations planning:", err);
      toast.error("Impossible de charger le planning des tournées.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const unregister = onBookingUpdate("*", () => {
      loadBookings(true);
    });
    return unregister;
  }, [onBookingUpdate]);

  // Helpers to navigate month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  // Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    // In France/Tunisia: Monday is 0, Sunday is 6
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Leading days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateKey = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateKey,
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateKey,
        isCurrentMonth: true,
      });
    }

    // Trailing days of next month to complete the grid (up to 35 or 42)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateKey = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateKey,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Bookings grouped by date key
  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const dateRaw = b.scheduledDate || b.movingDate || b.movingRequest?.preferredDate;
      const key = toDateKey(dateRaw);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(b);
      }
    });
    return map;
  }, [bookings]);

  // Month stats
  const monthStats = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const thisMonthBookings = bookings.filter((b) => {
      const k = toDateKey(b.scheduledDate || b.movingDate || b.movingRequest?.preferredDate);
      return k && k.startsWith(prefix);
    });

    const totalVolume = thisMonthBookings.reduce((sum, b) => {
      const vol = b.movingRequest?.volumeEstimate || b.movingRequest?.totalVolume || 20;
      return sum + Number(vol || 0);
    }, 0);

    const totalRevenue = thisMonthBookings.reduce((sum, b) => {
      return sum + Number(b.totalAmount || b.quote?.totalPrice || 0);
    }, 0);

    const remindersCount = thisMonthBookings.reduce((sum, b) => {
      return sum + Number(b.remindersCount || 0);
    }, 0);

    return {
      missionsCount: thisMonthBookings.length,
      totalVolume,
      totalRevenue,
      remindersCount,
    };
  }, [bookings, currentYear, currentMonth]);

  // Selected Day Bookings
  const selectedDayBookings = useMemo(() => {
    const list = bookingsByDate[selectedDate] || [];
    if (filterStatus === "all") return list;
    return list.filter((b) => b.serviceStatus === filterStatus);
  }, [bookingsByDate, selectedDate, filterStatus]);

  // Week View Days calculation (7 days of the selected week)
  const weekDays = useMemo(() => {
    const sel = new Date(selectedDate || todayStr);
    const dayOfWeek = (sel.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(sel);
    monday.setDate(sel.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateKey = toDateKey(d);
      days.push({
        date: d,
        dateKey,
        dayName: d.toLocaleDateString("fr-FR", { weekday: "short" }),
        dayNumber: d.getDate(),
        bookings: bookingsByDate[dateKey] || [],
      });
    }
    return days;
  }, [selectedDate, todayStr, bookingsByDate]);

  // Send Moving Reminder Handler
  const handleSendReminder = async (booking) => {
    const bId = booking._id || booking.id;
    setSendingReminderId(bId);
    try {
      const res = await bookingService.sendMovingReminder(bId);
      toast.success(res?.message || "Rappel de déménagement envoyé avec succès au client (Email + Notification).");

      // Update booking in local state
      setBookings((prev) =>
        prev.map((item) => {
          if ((item._id || item.id) === bId) {
            return {
              ...item,
              lastReminderSentAt: res?.data?.lastReminderSentAt || new Date().toISOString(),
              remindersCount: (item.remindersCount || 0) + 1,
            };
          }
          return item;
        })
      );
      setReminderModalBooking(null);
    } catch (err) {
      console.error("Erreur envoi rappel:", err);
      const msg = err?.response?.data?.message || err.message || "Impossible d'envoyer le rappel.";
      toast.error(msg);
    } finally {
      setSendingReminderId(null);
    }
  };

  const formattedMonthName = new Date(currentYear, currentMonth, 1).toLocaleString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const capMonthName = formattedMonthName.charAt(0).toUpperCase() + formattedMonthName.slice(1);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#800020] animate-pulse" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Planning & Calendrier des Tournées
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pilotez vos interventions de déménagement, gérez vos rotations d'équipes et déclenchez des rappels clients automatiques.
          </p>
        </div>

        {/* View Switcher & Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "month"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#800020]" />
              <span>Mois</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "week"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>Semaine</span>
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "agenda"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-emerald-600" />
              <span>Agenda</span>
            </button>
          </div>

          <button
            onClick={() => loadBookings()}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
            title="Rafraîchir le planning"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#800020]" : ""}`} />
          </button>

          <Link
            to="/company/bookings"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Toutes les réservations</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-[#800020] flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Missions ce mois</p>
            <p className="text-xl font-extrabold text-slate-900">{monthStats.missionsCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Volume estimé</p>
            <p className="text-xl font-extrabold text-slate-900">{monthStats.totalVolume} m³</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">CA Sécurisé</p>
            <p className="text-xl font-extrabold text-slate-900">{formatCurrency(monthStats.totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rappels Déclenchés</p>
            <p className="text-xl font-extrabold text-slate-900">{monthStats.remindersCount}</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar / Week / Agenda (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* MONTH VIEW */}
          {viewMode === "month" && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-subtle space-y-4">
              {/* Month Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">{capMonthName}</h2>
                  {currentYear === today.getFullYear() && currentMonth === today.getMonth() && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-[#800020] border border-rose-200">
                      Mois en cours
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200 shadow-xs"
                    title="Mois précédent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleToday}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    Aujourd'hui
                  </button>

                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200 shadow-xs"
                    title="Mois suivant"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider py-1">
                <span>Lun</span>
                <span>Mar</span>
                <span>Mer</span>
                <span>Jeu</span>
                <span>Ven</span>
                <span className="text-slate-600">Sam</span>
                <span className="text-[#800020]">Dim</span>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((cell, idx) => {
                  const dayBookings = bookingsByDate[cell.dateKey] || [];
                  const isSelected = selectedDate === cell.dateKey;
                  const isToday = cell.dateKey === todayStr;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(cell.dateKey)}
                      className={`min-h-[75px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between group relative ${!cell.isCurrentMonth
                        ? "bg-slate-50/40 border-slate-100 text-slate-300 opacity-60"
                        : isSelected
                          ? "border-[#800020] bg-rose-50/40 ring-2 ring-[#800020]/20 shadow-xs"
                          : isToday
                            ? "border-amber-300 bg-amber-50/30 hover:border-amber-400"
                            : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center ${isToday
                            ? "bg-amber-500 text-white shadow-xs"
                            : isSelected
                              ? "bg-[#800020] text-white"
                              : cell.isCurrentMonth
                                ? "text-slate-700 group-hover:text-slate-900"
                                : "text-slate-300"
                            }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {dayBookings.length > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-rose-100 text-[#800020] border border-rose-200">
                            {dayBookings.length}
                          </span>
                        )}
                      </div>

                      {/* Chips in cell */}
                      <div className="space-y-1 mt-1">
                        {dayBookings.slice(0, 2).map((b, bIdx) => {
                          const dep = b.movingRequest?.departureAddress?.city || "Départ";
                          const arr = b.movingRequest?.arrivalAddress?.city || "Arrivée";
                          const isDone = b.serviceStatus === "completed";
                          return (
                            <div
                              key={bIdx}
                              className={`p-1 rounded-md text-[9px] sm:text-[10px] font-bold truncate flex items-center justify-between gap-1 ${isDone
                                ? "bg-emerald-600 text-white"
                                : isSelected
                                  ? "bg-[#800020] text-white"
                                  : "bg-slate-900 text-white"
                                }`}
                            >
                              <span className="truncate">{dep} ➔ {arr}</span>
                              <span className="opacity-80 text-[8px] flex-shrink-0">{b.scheduledTime || "08h"}</span>
                            </div>
                          );
                        })}
                        {dayBookings.length > 2 && (
                          <p className="text-[9px] font-bold text-[#800020] text-center">
                            +{dayBookings.length - 2} autres
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {viewMode === "week" && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Tournées de la Semaine
                  </h3>
                  <p className="text-xs text-slate-500">
                    Semaine du {formatDate(weekDays[0]?.date)} au {formatDate(weekDays[6]?.date)}
                  </p>
                </div>
                <button
                  onClick={handleToday}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Semaine actuelle
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                {weekDays.map((col, idx) => {
                  const isSelected = selectedDate === col.dateKey;
                  const isToday = col.dateKey === todayStr;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(col.dateKey)}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-start gap-2 ${isSelected
                        ? "border-[#800020] bg-rose-50/40 ring-2 ring-[#800020]/20"
                        : isToday
                          ? "border-amber-300 bg-amber-50/20"
                          : "border-slate-200 bg-slate-50/30 hover:bg-slate-50"
                        }`}
                    >
                      <div className="text-center pb-2 border-b border-slate-200/60">
                        <p className="text-[10px] font-bold uppercase text-slate-400">{col.dayName}</p>
                        <p className={`text-base font-extrabold ${isToday ? "text-amber-600" : isSelected ? "text-[#800020]" : "text-slate-800"}`}>
                          {col.dayNumber}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        {col.bookings.length === 0 ? (
                          <p className="text-[10px] text-slate-400 text-center py-4 italic">Libre</p>
                        ) : (
                          col.bookings.map((b, bIdx) => (
                            <div
                              key={bIdx}
                              className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                                <span className="flex items-center gap-1 text-[#800020]">
                                  <Clock className="w-3 h-3" />
                                  {b.scheduledTime || "08:00"}
                                </span>
                                <span className="text-slate-400">
                                  {b.movingRequest?.volumeEstimate || 20}m³
                                </span>
                              </div>
                              <p className="font-bold text-slate-900 text-[11px] truncate">
                                {b.movingRequest?.departureAddress?.city || "Tunis"} ➔ {b.movingRequest?.arrivalAddress?.city || "Sousse"}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {b.client?.firstName} {b.client?.lastName}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AGENDA / LIST VIEW */}
          {viewMode === "agenda" && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Agenda Complet des Interventions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Liste chronologique de vos tournées programmées
                  </p>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1">
                  {["all", "preparation", "in_progress", "completed"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filterStatus === st
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      {st === "all" ? "Toutes" : st === "preparation" ? "À venir" : st === "in_progress" ? "En cours" : "Terminées"}
                    </button>
                  ))}
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Aucune réservation planifiée pour le moment.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {bookings
                    .filter((b) => filterStatus === "all" || b.serviceStatus === filterStatus)
                    .map((b) => {
                      const bDate = toDateKey(b.scheduledDate || b.movingDate);
                      const countdown = getCountdownBadge(b.scheduledDate || b.movingDate);
                      const isSelected = selectedDate === bDate;

                      return (
                        <div
                          key={b._id}
                          onClick={() => setSelectedDate(bDate)}
                          className={`py-3.5 px-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all ${isSelected ? "bg-rose-50/50 border border-rose-200" : "hover:bg-slate-50"
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center flex-shrink-0 text-center font-bold">
                              <span className="text-[10px] uppercase text-rose-300">
                                {new Date(b.scheduledDate || b.movingDate).toLocaleDateString("fr-FR", { month: "short" })}
                              </span>
                              <span className="text-base leading-none">
                                {new Date(b.scheduledDate || b.movingDate).getDate()}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900">
                                  {b.movingRequest?.departureAddress?.city || "Départ"} ➔ {b.movingRequest?.arrivalAddress?.city || "Arrivée"}
                                </h4>
                                {countdown && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${countdown.color}`}>
                                    {countdown.text}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-500 flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {b.scheduledTime || "08:00"}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  {b.client?.firstName} {b.client?.lastName}
                                </span>
                                <span>•</span>
                                <span>{b.movingRequest?.volumeEstimate || 20} m³</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReminderModalBooking(b);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <BellRing className="w-3.5 h-3.5 text-amber-600" />
                              <span>Rappel</span>
                            </button>

                            <Link
                              to={`/company/bookings/${b._id}`}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Feuille de route</span>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Selected Day Details & Tournée Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-subtle space-y-5 sticky top-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Feuille de Tournée</p>
              <h3 className="text-base font-extrabold text-slate-900">
                {formatDate(selectedDate, { weekday: "long", day: "numeric", month: "long" })}
              </h3>
            </div>
            {selectedDate === todayStr && (
              <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                Aujourd'hui
              </span>
            )}
          </div>

          {selectedDayBookings.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span>{selectedDayBookings.length} intervention(s)</span>
                <span className="font-bold text-slate-700">
                  {selectedDayBookings.reduce((acc, curr) => acc + Number(curr.movingRequest?.volumeEstimate || 20), 0)} m³ total
                </span>
              </div>

              {selectedDayBookings.map((b) => {
                const bId = b._id || b.id;
                const depAddr = fmtAddress(b.movingRequest?.departureAddress);
                const arrAddr = fmtAddress(b.movingRequest?.arrivalAddress);
                const clientName = `${b.client?.firstName || ""} ${b.client?.lastName || ""}`.trim() || "Client";
                const clientPhone = b.client?.phone || "";
                const clientEmail = b.client?.email || "";
                const countdown = getCountdownBadge(b.scheduledDate || b.movingDate);
                const isSendingThis = sendingReminderId === bId;

                return (
                  <div
                    key={bId}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-[#800020]/40 transition-all space-y-3.5 shadow-xs"
                  >
                    {/* Header badge & status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#800020]" />
                        <span className="text-xs font-extrabold text-slate-900">
                          {b.scheduledTime || "08:00"}
                        </span>
                      </div>
                      <StatusBadge status={b.serviceStatus || "preparation"} />
                    </div>

                    {/* Countdown indicator */}
                    {countdown && (
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${countdown.color}`}>
                          {countdown.text}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-700">
                          {b.movingRequest?.volumeEstimate || 20} m³
                        </span>
                      </div>
                    )}

                    {/* Itinerary */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Départ</p>
                          <p className="font-semibold text-slate-800 line-clamp-1">{depAddr}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Arrivée</p>
                          <p className="font-semibold text-slate-800 line-clamp-1">{arrAddr}</p>
                        </div>
                      </div>
                    </div>

                    {/* Client info */}
                    <div className="space-y-1 text-xs border-t border-slate-100 pt-2.5">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{clientName}</span>
                      </p>
                      {clientPhone && (
                        <p className="text-slate-600 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <a href={`tel:${clientPhone}`} className="hover:text-[#800020] underline">
                            {clientPhone}
                          </a>
                        </p>
                      )}
                      {clientEmail && (
                        <p className="text-slate-500 text-[11px] flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{clientEmail}</span>
                        </p>
                      )}
                    </div>

                    {/* Reminder Status Badge & Action */}
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-900 flex items-center gap-1">
                          <BellRing className="w-3 h-3 text-amber-600" />
                          <span>Rappel Déménagement</span>
                        </span>
                        {b.remindersCount > 0 ? (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Envoyé ({b.remindersCount}x)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            À envoyer
                          </span>
                        )}
                      </div>

                      {b.lastReminderSentAt && (
                        <p className="text-[10px] text-slate-500">
                          Dernier envoi : {formatDate(b.lastReminderSentAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}

                      <button
                        onClick={() => setReminderModalBooking(b)}
                        disabled={isSendingThis}
                        className="w-full py-2 rounded-xl bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        {isSendingThis ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Envoi en cours...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {b.remindersCount > 0 ? "Renvoyer un Rappel Client" : "Envoyer Rappel au Client"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        to={`/company/bookings/${bId}`}
                        className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold text-center flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Feuille de route</span>
                      </Link>

                      <button
                        onClick={() => setInvoiceModalBookingId(bId)}
                        className="py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#800020]" />
                        <span>Facture</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <CalendarIcon className="w-6 h-6 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-700">Aucune intervention programmée</p>
                <p className="text-[11px] text-slate-500">
                  Créneau libre pour le {formatDate(selectedDate)}. Vous pouvez accepter de nouvelles demandes sur vos trajets.
                </p>
              </div>

              <Link
                to="/company/requests"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#800020] text-white text-xs font-bold hover:bg-[#660019] transition-colors shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Voir les demandes disponibles</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION / PREVIEW REMINDER MODAL */}
      {reminderModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#800020] flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Déclencher un Rappel de Déménagement
                  </h3>
                  <p className="text-xs text-slate-500">Notification en temps réel & Email officiel au client</p>
                </div>
              </div>
              <button
                onClick={() => setReminderModalBooking(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recap Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Client destinataire :</span>
                <span className="font-extrabold text-slate-900">
                  {reminderModalBooking.client?.firstName} {reminderModalBooking.client?.lastName}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Date d'intervention :</span>
                <span className="font-extrabold text-[#800020]">
                  {formatDate(reminderModalBooking.scheduledDate || reminderModalBooking.movingDate)} à {reminderModalBooking.scheduledTime || "08:00"}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Échéance calculée :</span>
                <span className="font-bold text-slate-800">
                  {getCountdownBadge(reminderModalBooking.scheduledDate || reminderModalBooking.movingDate)?.text || "Très bientôt"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Itinéraire prévu :</span>
                <span className="font-bold text-slate-800">
                  {reminderModalBooking.movingRequest?.departureAddress?.city} ➔ {reminderModalBooking.movingRequest?.arrivalAddress?.city}
                </span>
              </div>
            </div>

            {/* What's included */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2">
              <h4 className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ce que le client va recevoir immédiatement :</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed pl-1">
                <li><strong>Notification Push in-app :</strong> Alerte avec badge de compte à rebours et lien direct de suivi.</li>
                <li><strong>Email formaté MoversGo :</strong> Récapitulatif heure d'arrivée, contact transporteur, itinéraire.</li>
                <li><strong>Checklist pratique du Jour J :</strong> Conseils stationnement, gestion de l'ascenseur, cartons et objets de valeur.</li>
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReminderModalBooking(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => handleSendReminder(reminderModalBooking)}
                disabled={sendingReminderId === (reminderModalBooking._id || reminderModalBooking.id)}
                className="px-5 py-2.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {sendingReminderId === (reminderModalBooking._id || reminderModalBooking.id) ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirmer l'envoi du rappel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL (IF TRIGGERED) */}
      {invoiceModalBookingId && (
        <InvoiceModal
          bookingId={invoiceModalBookingId}
          isOpen={Boolean(invoiceModalBookingId)}
          onClose={() => setInvoiceModalBookingId(null)}
          onInvoiceSigned={() => loadBookings(true)}
        />
      )}
    </div>
  );
}
