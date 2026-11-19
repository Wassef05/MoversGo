import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supportService } from "../../services/api/supportService";
import { bookingService } from "../../services/api/bookingService";
import { initSocket, getSocket } from "../../services/api/socket";
import { formatDate } from "../../utils/cn";
import { toast } from "sonner";
import {
  LifeBuoy,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Scale,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  MessageSquare,
  X,
  Loader2,
  ArrowRight,
  Sparkles,
  Archive,
  Lock,
  Trash2,
} from "lucide-react";

export function UserSupportPage({ role = "client" }) {
  const { currentUser } = useAuth();
  const isCompany = role === "company" || currentUser?.role === "company";

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected ticket & thread state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  // New ticket modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: isCompany ? "company" : "booking",
    priority: "medium",
    description: "",
    relatedBooking: "",
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ─────────────────────────────────────────────────────────────
  // 1. Load User Tickets
  // ─────────────────────────────────────────────────────────────
  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const res = await supportService.getMyTickets();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.tickets)
        ? res.tickets
        : Array.isArray(res)
        ? res
        : [];
      setTickets(list);

      // If a ticket is already selected, re-fetch its details
      if (selectedTicket) {
        const found = list.find(
          (t) => (t._id || t.id) === (selectedTicket._id || selectedTicket.id)
        );
        if (found) {
          handleSelectTicket(found, false);
        }
      } else if (list.length > 0 && !selectedTicket) {
        // Automatically select the most recent ticket on desktop
        handleSelectTicket(list[0], false);
      }
    } catch (err) {
      console.error("Erreur chargement tickets:", err);
      toast.error("Impossible de charger vos tickets d'assistance.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. Load User Bookings (for contextual linking)
  // ─────────────────────────────────────────────────────────────
  const fetchMyBookings = async () => {
    try {
      const res = await bookingService.getMyBookings();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.bookings)
        ? res.bookings
        : Array.isArray(res)
        ? res
        : [];
      setBookings(list);
    } catch (err) {
      console.warn("Could not load bookings for ticket context:", err);
    }
  };

  useEffect(() => {
    fetchMyTickets();
    fetchMyBookings();
  }, [currentUser]);

  // Socket.IO real-time notification listener for ticket updates
  useEffect(() => {
    const socket = initSocket();
    if (!socket) return;

    const handleTicketNotification = () => {
      fetchMyTickets();
    };

    socket.on("notification:new", handleTicketNotification);
    return () => {
      socket.off("notification:new", handleTicketNotification);
    };
  }, [selectedTicket?._id]);

  // ─────────────────────────────────────────────────────────────
  // 3. Select Ticket & Load Thread Details
  // ─────────────────────────────────────────────────────────────
  const handleSelectTicket = async (ticket, showToast = false) => {
    const tId = ticket._id || ticket.id;
    setSelectedTicket(ticket);
    setThreadLoading(true);
    try {
      const res = await supportService.getTicketById(tId);
      const detail = res?.data?.ticket || res?.ticket || res?.data || res;
      if (detail && (detail._id || detail.id)) {
        setSelectedTicket(detail);
        setTimeout(scrollToBottom, 60);
      }
    } catch (err) {
      console.error("Erreur chargement fil de discussion:", err);
      if (showToast) toast.error("Erreur lors de la récupération des messages.");
    } finally {
      setThreadLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. Send Message / Reply to Admin
  // ─────────────────────────────────────────────────────────────
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || replySending) return;
    const tId = selectedTicket._id || selectedTicket.id;
    const textToSend = replyText.trim();
    setReplySending(true);

    try {
      const res = await supportService.addMessage(tId, textToSend);
      const updated = res?.data?.ticket || res?.ticket || res?.data;

      if (updated) {
        setSelectedTicket(updated);
        setTickets((prev) =>
          prev.map((t) => ((t._id || t.id) === tId ? updated : t))
        );
      }
      setReplyText("");
      setTimeout(scrollToBottom, 50);
      toast.success("Votre réponse a été transmise aux coordinateurs MoversGo !");
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'envoi de votre message.");
    } finally {
      setReplySending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 5. Create New Ticket
  // ─────────────────────────────────────────────────────────────
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error("Veuillez renseigner le sujet et la description du problème.");
      return;
    }
    setCreateLoading(true);

    try {
      const payload = {
        subject: newTicket.subject.trim(),
        category: newTicket.category,
        priority: newTicket.priority,
        description: newTicket.description.trim(),
        relatedBooking: newTicket.relatedBooking || null,
      };

      const res = await supportService.createTicket(payload);
      const created = res?.data?.ticket || res?.ticket || res?.data;

      toast.success("Votre ticket d'assistance a été ouvert avec succès ! 🎉", {
        description: "L'administration MoversGo traitera votre demande sous 2h ouvrables.",
      });

      setIsModalOpen(false);
      setNewTicket({
        subject: "",
        category: isCompany ? "company" : "booking",
        priority: "medium",
        description: "",
        relatedBooking: "",
      });

      // Reload list and select newly created ticket
      fetchMyTickets();
      if (created) {
        setSelectedTicket(created);
      }
    } catch (err) {
      toast.error(err?.message || "Erreur lors de la création du ticket.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Badges helpers
  const [closingTicketId, setClosingTicketId] = useState(null);

  const handleCloseTicket = async (ticketId) => {
    if (
      !window.confirm(
        "Voulez-vous clôturer et archiver ce ticket d'assistance ?\n\nUne fois fermé, il sera conservé dans vos archives pendant 4 jours, puis définitivement supprimé de manière automatique."
      )
    ) {
      return;
    }
    setClosingTicketId(ticketId);
    try {
      const res = await supportService.closeTicket(ticketId);
      const updated = res?.data?.ticket || res?.ticket || res?.data;
      if (updated) {
        setSelectedTicket(updated);
        setTickets((prev) =>
          prev.map((t) => ((t._id || t.id) === ticketId ? updated : t))
        );
      } else {
        await fetchMyTickets();
      }
      toast.success("Ticket clôturé et archivé avec succès !", {
        description: "Il sera automatiquement et définitivement supprimé après 4 jours.",
      });
    } catch (err) {
      toast.error(err?.message || "Erreur lors de la clôture du ticket.");
    } finally {
      setClosingTicketId(null);
    }
  };

  const getDeletionCountdown = (ticket) => {
    if (!ticket || (ticket.status !== "closed" && !ticket.isArchived)) return null;
    const target = ticket.autoDeleteAt
      ? new Date(ticket.autoDeleteAt)
      : new Date(new Date(ticket.closedAt || ticket.updatedAt || Date.now()).getTime() + 4 * 24 * 60 * 60 * 1000);
    const diffMs = target.getTime() - Date.now();
    const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return {
      diffDays,
      formattedDate: formatDate(target),
    };
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "closed":
        return "bg-slate-100 text-slate-800 border-slate-300";
      case "resolved":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "in_progress":
        return "bg-sky-100 text-sky-800 border-sky-300";
      case "waiting_response":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      booking: "Déménagement & Réservation",
      payment: "Paiement & Séquestre",
      company: "Agrément & Dossier Entreprise",
      technical: "Support Technique",
      account: "Compte & Profil",
      dispute: "Litige & Arbitrage",
      other: "Demande Générale",
    };
    return labels[cat] || cat;
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "all") {
      if (statusFilter === "closed") {
        if (t.status !== "closed" && !t.isArchived) return false;
      } else {
        if (t.status !== statusFilter) return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const s = (t.subject || "").toLowerCase();
      const d = (t.description || "").toLowerCase();
      return s.includes(q) || d.includes(q);
    }
    return true;
  });

  const openTicketsCount = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress" || t.status === "waiting_response"
  ).length;
  const resolvedTicketsCount = tickets.filter((t) => t.status === "resolved").length;
  const closedArchivedCount = tickets.filter((t) => t.status === "closed" || t.isArchived).length;

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#800020] text-white flex items-center justify-center shadow-md">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Support &amp; Tickets d'Assistance
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-50 text-[#800020] border border-rose-200">
                {isCompany ? "Espace Partenaire" : "Espace Client"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Assistance dédiée, suivi de vos réclamations et médiation directe avec l'équipe MoversGo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMyTickets}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#800020] hover:bg-[#68001a] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ouvrir un nouveau ticket</span>
          </button>
        </div>
      </div>

      {/* ── Quick KPI Stat Pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
            Total Tickets
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {tickets.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-amber-600 text-[11px] font-bold uppercase tracking-wider block">
            En Cours / Ouverts
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {openTicketsCount}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-emerald-600 text-[11px] font-bold uppercase tracking-wider block">
            Tickets Résolus
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {resolvedTicketsCount}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
              Archivés (Suppr. 4j)
            </span>
            <span className="text-2xl font-black text-slate-700 mt-1 block">
              {closedArchivedCount}
            </span>
          </div>
          <Archive className="w-6 h-6 text-slate-400 opacity-80" />
        </div>
      </div>

      {/* ── Main Two-Column Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col h-[720px]">
          {/* Search & Filter Header */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/60">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par objet ou mot-clé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {[
                { id: "all", label: "Tous" },
                { id: "open", label: "Ouverts" },
                { id: "waiting_response", label: "Réponse reçue" },
                { id: "resolved", label: "Résolus" },
                { id: "closed", label: "Archivés (4j)" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === f.id
                      ? "bg-[#800020] text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {f.label}
                  {f.id === "closed" && closedArchivedCount > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] ${statusFilter === 'closed' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                      {closedArchivedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#800020]" />
                <span className="text-xs">Chargement de vos tickets...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <LifeBuoy className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Aucun ticket d'assistance trouvé.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs font-bold text-[#800020] hover:underline"
                >
                  Créer un ticket maintenant →
                </button>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const tId = t._id || t.id;
                const isSelected =
                  selectedTicket && (selectedTicket._id || selectedTicket.id) === tId;
                const hasAdminReply = t.messages?.some((m) => m.isAdminMessage);

                return (
                  <div
                    key={tId}
                    onClick={() => handleSelectTicket(t, true)}
                    className={`p-4 cursor-pointer transition-all border-l-4 ${
                      isSelected
                        ? "bg-rose-50/70 border-l-[#800020]"
                        : "border-l-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        #TK-{String(tId).slice(-6).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getPriorityBadge(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadge(
                            t.status
                          )}`}
                        >
                          {t.status === "closed" || t.isArchived
                            ? `Archivé (${getDeletionCountdown(t)?.diffDays || 4}j)`
                            : t.status === "open"
                            ? "Nouveau"
                            : t.status === "waiting_response"
                            ? "Réponse Support"
                            : t.status === "resolved"
                            ? "Résolu"
                            : t.status}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1 mb-1">
                      {t.subject}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                      {t.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>{getCategoryLabel(t.category)}</span>
                      <div className="flex items-center gap-1.5">
                        {hasAdminReply && (
                          <span className="inline-flex items-center gap-1 text-[#800020] font-bold text-[10px]">
                            <MessageSquare className="w-3 h-3" />
                            Réponse reçue
                          </span>
                        )}
                        <span>{formatDate(t.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation Thread */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col h-[720px]">
          {selectedTicket ? (
            <>
              {/* Thread Header */}
              <div className="p-5 border-b border-slate-100 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[#800020]">
                        #TK-{String(selectedTicket._id || selectedTicket.id).slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(
                          selectedTicket.priority
                        )}`}
                      >
                        Priorité {selectedTicket.priority}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          selectedTicket.status
                        )}`}
                      >
                        {selectedTicket.status === "open"
                          ? "Ouvert"
                          : selectedTicket.status === "waiting_response"
                          ? "Réponse reçue de l'administration"
                          : selectedTicket.status === "resolved"
                          ? "✓ Résolu"
                          : selectedTicket.status === "closed"
                          ? "📦 Fermé & Archivé"
                          : selectedTicket.status}
                      </span>
                    </div>
                    <h3 className="font-black text-base text-slate-900">
                      {selectedTicket.subject}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Catégorie : <strong>{getCategoryLabel(selectedTicket.category)}</strong> •
                      Créé le {formatDate(selectedTicket.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedTicket.status !== "closed" && !selectedTicket.isArchived && (
                      <button
                        onClick={() => handleCloseTicket(selectedTicket._id || selectedTicket.id)}
                        disabled={closingTicketId === (selectedTicket._id || selectedTicket.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        title="Clôturer et archiver ce ticket (suppression automatique après 4 jours)"
                      >
                        {closingTicketId === (selectedTicket._id || selectedTicket.id) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#800020]" />
                        ) : (
                          <Archive className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span>Fermer &amp; Archiver</span>
                      </button>
                    )}

                    {selectedTicket.category === "dispute" && (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex-shrink-0">
                        <Scale className="w-4 h-4 text-rose-600" />
                        <span>Dossier sous Médiation</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Archive Info Card if Closed */}
              {(selectedTicket.status === "closed" || selectedTicket.isArchived) && (
                <div className="p-4 mx-5 mt-4 rounded-2xl bg-amber-50 border-2 border-amber-200/90 flex items-start gap-3 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-200/60 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Archive className="w-4 h-4 text-amber-800" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-amber-950">
                        Ticket Clôturé &amp; Placé dans l'Archive
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200/80 text-amber-900 font-mono">
                        Suppression automatique dans {getDeletionCountdown(selectedTicket)?.diffDays || 4} jour(s)
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                      Ce dossier a été résolu et clôturé. Il est actuellement conservé dans les archives et sera <strong>définitivement supprimé de manière automatique le {getDeletionCountdown(selectedTicket)?.formattedDate}</strong> (délai de rétention de 4 jours).
                    </p>
                  </div>
                </div>
              )}

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                {threadLoading ? (
                  <div className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#800020]" />
                    <span className="text-xs">Chargement du fil...</span>
                  </div>
                ) : (
                  <>
                    {/* Initial Problem Statement Card */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>👤</span>
                          <span>Vous ({currentUser?.firstName}) — Problème signalé</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(selectedTicket.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                        {selectedTicket.description}
                      </p>
                    </div>

                    {/* Messages Thread (Replies) */}
                    {selectedTicket.messages &&
                      selectedTicket.messages.map((msg, idx) => {
                        const isAdmin = msg.isAdminMessage;

                        return (
                          <div
                            key={idx}
                            className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span
                                className={`text-[10px] font-bold ${
                                  isAdmin ? "text-[#800020]" : "text-slate-600"
                                }`}
                              >
                                {isAdmin ? "🛡️ Support Officiel MoversGo" : "Vous"}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {formatDate(msg.sentAt)}
                              </span>
                            </div>

                            <div
                              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                                isAdmin
                                  ? "bg-white text-slate-800 rounded-tl-none border-2 border-[#800020]/20 shadow-xs"
                                  : "bg-[#800020] text-white rounded-tr-none shadow-xs"
                              }`}
                            >
                              {isAdmin && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-[#800020] text-[10px] font-bold mb-2 border border-rose-200">
                                  <ShieldCheck className="w-3 h-3 text-[#800020]" />
                                  <span>Réponse administrative certifiée</span>
                                </div>
                              )}
                              <p className="whitespace-pre-line font-normal">{msg.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Reply Form or Locked Notice */}
              {selectedTicket.status === "closed" || selectedTicket.isArchived ? (
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium rounded-b-3xl">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Ce ticket est fermé et archivé. Le fil de discussion est verrouillé (suppression sous {getDeletionCountdown(selectedTicket)?.diffDays || 4} jours).</span>
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-white space-y-3">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrire une réponse ou apporter des détails supplémentaires à l'équipe support..."
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] leading-relaxed"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>L'équipe reçoit une notification instantanée</span>
                    </span>

                    <button
                      type="submit"
                      disabled={replySending || !replyText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#800020] hover:bg-[#68001a] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      {replySending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Envoi...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer ma réponse</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 text-[#800020] border-2 border-rose-200 flex items-center justify-center shadow-md">
                <LifeBuoy className="w-8 h-8" />
              </div>
              <div className="max-w-sm space-y-1">
                <h4 className="font-bold text-slate-900 text-base">
                  Sélectionnez un ticket pour voir le fil
                </h4>
                <p className="text-xs text-slate-500">
                  Consultez l'historique complet des réponses de nos coordinateurs et échangez en direct.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#800020] text-white text-xs font-bold hover:bg-[#68001a] shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ouvrir un nouveau ticket</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL : OUVERTURE DE TICKET D'ASSISTANCE
      ───────────────────────────────────────────────────────────────*/}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#800020] text-white flex items-center justify-center">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Ouvrir un Ticket d'Assistance
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Notre équipe étudie votre requête et vous répond rapidement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {/* Sujet */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Objet du ticket <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Problème d'accès au devis #DV-1024 / Question acompte..."
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                />
              </div>

              {/* Catégorie & Priorité */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catégorie <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                  >
                    {isCompany ? (
                      <>
                        <option value="company">Agrément &amp; Dossier RNE</option>
                        <option value="booking">Réservations &amp; Planning</option>
                        <option value="payment">Commission &amp; Virements</option>
                        <option value="dispute">Litige avec un Client</option>
                        <option value="technical">Problème Technique</option>
                        <option value="other">Autre Demande</option>
                      </>
                    ) : (
                      <>
                        <option value="booking">Déménagement &amp; Réservation</option>
                        <option value="payment">Paiement &amp; Acompte Séquestre</option>
                        <option value="dispute">Litige / Réclamation Prestataire</option>
                        <option value="technical">Problème Technique</option>
                        <option value="account">Compte &amp; Connexion</option>
                        <option value="other">Autre Question</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Niveau d'urgence
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, priority: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                  >
                    <option value="low">Faible — Demande d'information</option>
                    <option value="medium">Moyen — Question sur dossier</option>
                    <option value="high">Élevé — Besoin urgent</option>
                    <option value="urgent">Urgent — Blocage / Jour J</option>
                  </select>
                </div>
              </div>

              {/* Réservation liée (optionnel) */}
              {bookings.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Déménagement concerné (optionnel)
                  </label>
                  <select
                    value={newTicket.relatedBooking}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, relatedBooking: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                  >
                    <option value="">Aucun déménagement spécifique</option>
                    {bookings.map((b) => {
                      const bId = b._id || b.id;
                      const title = b.company?.companyName || b.client?.firstName || "Réservation";
                      return (
                        <option key={bId} value={bId}>
                          #{String(bId).slice(-6).toUpperCase()} — {title} ({formatDate(b.scheduledDate || b.createdAt)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description détaillée du problème <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Décrivez précisément votre situation, dates, montants ou difficultés rencontrées pour un traitement rapide..."
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#800020] hover:bg-[#68001a] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Envoi du ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmettre au Support</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
