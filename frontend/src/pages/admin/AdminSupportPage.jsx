import React, { useState, useEffect, useRef } from "react";
import { adminService } from "../../services/api/adminService";
import { contactService } from "../../services/api/contactService";
import { supportService } from "../../services/api/supportService";
import { messageService } from "../../services/api/messageService";
import { useAuth } from "../../contexts/AuthContext";
import { initSocket, getSocket } from "../../services/api/socket";
import { formatDate, formatCurrency } from "../../utils/cn";
import { toast } from "sonner";
import {
  LifeBuoy,
  Mail,
  Scale,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Send,
  User,
  MapPin,
  Phone,
  Eye,
  Trash2,
  ShieldCheck,
  Building2,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  Loader2,
  Plus,
  X,
  MessagesSquare,
  Paperclip,
} from "lucide-react";

const FAQ_DATA = [
  { id: 1, category: 'Général', question: 'Comment fonctionne MoversGo ?', answer: 'MoversGo est une plateforme qui met en relation les particuliers avec des sociétés de déménagement agréées en Tunisie. Vous soumettez votre demande, recevez des devis de plusieurs prestataires, comparez et choisissez.' },
  { id: 2, category: 'Général', question: 'Les sociétés sont-elles vérifiées ?', answer: 'Oui, toutes les sociétés partenaires sont agréées et vérifiées par notre équipe avant d\'être référencées sur la plateforme.' },
  { id: 3, category: 'Devis & Prix', question: 'Comment sont calculés les devis ?', answer: 'Les devis sont calculés en fonction du volume à déménager, de la distance, de l\'étage, des services supplémentaires (emballage, montage/démontage, etc.).' },
  { id: 4, category: 'Devis & Prix', question: 'Y a-t-il des frais cachés ?', answer: 'Non. MoversGo s\'engage pour la transparence totale des prix. Tous les frais sont inclus dans le devis final accepté.' },
  { id: 5, category: 'Réservation', question: 'Comment confirmer ma réservation ?', answer: 'Après avoir accepté un devis, vous devez confirmer votre réservation. La société vous contactera pour finaliser les détails.' },
  { id: 6, category: 'Réservation', question: 'Puis-je annuler ma réservation ?', answer: 'Oui, l\'annulation est possible selon les conditions de la société sélectionnée. Consultez la politique d\'annulation dans votre contrat.' },
  { id: 7, category: 'Litiges', question: 'Que faire en cas de problème avec un prestataire ?', answer: 'Contactez notre équipe de médiation via le formulaire de litige. Nous intervenons comme médiateur et garantissons une résolution équitable.' },
  { id: 8, category: 'Paiement', question: 'Quels sont les modes de paiement acceptés ?', answer: 'Le paiement se fait directement entre vous et la société de déménagement selon leurs modalités (espèces, virement, etc.).' },
];

const FAQ_CATEGORIES = [...new Set(FAQ_DATA.map(f => f.category))];

export function AdminSupportPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("tickets"); // "tickets" | "contact" | "disputes" | "live_chat" | "faq"

  // ─────────────────────────────────────────────────────────
  // 1. Tickets State
  // ─────────────────────────────────────────────────────────
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // ─────────────────────────────────────────────────────────
  // 2. Contact Messages State
  // ─────────────────────────────────────────────────────────
  const [contactMessages, setContactMessages] = useState([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactStatusFilter, setContactStatusFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [contactReplyText, setContactReplyText] = useState("");
  const [contactReplySending, setContactReplySending] = useState(false);

  // ─────────────────────────────────────────────────────────
  // 3. Live Chat State
  // ─────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [liveChatMessageText, setLiveChatMessageText] = useState("");
  const [liveChatSending, setLiveChatSending] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [chatRoleFilter, setChatRoleFilter] = useState("all"); // "all" | "client" | "company"

  // User picker modal for live chat
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [allUsersList, setAllUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userPickerSearch, setUserPickerSearch] = useState("");
  const [userPickerRole, setUserPickerRole] = useState("all");

  const chatMessagesEndRef = useRef(null);

  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Search query (for tickets & contact)
  const [searchQuery, setSearchQuery] = useState("");

  // FAQ State
  const [openFaq, setOpenFaq] = useState(null);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState("all");

  // ─────────────────────────────────────────────────────────
  // DATA FETCHING: TICKETS & CONTACT
  // ─────────────────────────────────────────────────────────
  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await adminService.getAllTickets();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setTickets(list);
    } catch (err) {
      console.error("Erreur chargement tickets:", err);
      toast.error("Impossible de charger les tickets.");
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchContactMessages = async () => {
    setContactLoading(true);
    try {
      const res = await contactService.getAllContactMessages();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setContactMessages(list);
    } catch (err) {
      console.error("Erreur chargement messages de contact:", err);
      toast.error("Impossible de charger les messages de contact.");
    } finally {
      setContactLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // DATA FETCHING: LIVE CHAT CONVERSATIONS
  // ─────────────────────────────────────────────────────────
  const fetchConversations = async () => {
    setConversationsLoading(true);
    try {
      const res = await messageService.getConversations();
      const list = Array.isArray(res?.conversations)
        ? res.conversations
        : Array.isArray(res?.data?.conversations)
        ? res.data.conversations
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setConversations(list);
    } catch (err) {
      console.error("Erreur chargement conversations:", err);
    } finally {
      setConversationsLoading(false);
    }
  };

  const fetchMessagesForConversation = async (convId) => {
    setChatLoading(true);
    try {
      const res = await messageService.getMessages(convId);
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.messages)
        ? res.messages
        : [];
      setChatMessages(list);
      setTimeout(scrollToBottom, 60);
    } catch (err) {
      console.error("Erreur chargement messages:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    fetchMessagesForConversation(conv._id || conv.id);
  };

  const handleSendLiveChatMessage = async (e) => {
    e?.preventDefault();
    if (!liveChatMessageText.trim() || !activeConversation || liveChatSending) return;
    const textToSend = liveChatMessageText.trim();
    setLiveChatMessageText("");
    setLiveChatSending(true);

    try {
      const convId = activeConversation._id || activeConversation.id;
      const res = await messageService.sendMessage(convId, { content: textToSend });
      const newMsg = res?.data?.message || res?.message || res?.data;

      if (newMsg) {
        setChatMessages((prev) => [...prev, newMsg]);
        setConversations((prev) =>
          prev.map((c) =>
            ((c._id || c.id) === convId
              ? { ...c, lastMessage: newMsg, lastMessageAt: new Date().toISOString() }
              : c)
          )
        );
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'envoi du message.");
    } finally {
      setLiveChatSending(false);
    }
  };

  const handleOpenUserPicker = async () => {
    setIsUserPickerOpen(true);
    if (allUsersList.length === 0) {
      setUsersLoading(true);
      try {
        const res = await adminService.getAllUsers({ limit: 100 });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setAllUsersList(list);
      } catch (err) {
        toast.error("Impossible de charger les utilisateurs.");
      } finally {
        setUsersLoading(false);
      }
    }
  };

  const handleStartChatWithUser = async (targetUser) => {
    try {
      const uId = targetUser._id || targetUser.id;
      const res = await messageService.getOrCreateConversation(uId);
      const conv = res?.data?.conversation || res?.conversation || res?.data;
      if (conv) {
        setConversations((prev) => {
          const exists = prev.some((c) => (c._id || c.id) === (conv._id || conv.id));
          return exists ? prev : [conv, ...prev];
        });
        setActiveConversation(conv);
        setIsUserPickerOpen(false);
        fetchMessagesForConversation(conv._id || conv.id);
        toast.success(`Discussion ouverte avec ${targetUser.firstName} ${targetUser.lastName}`);
      }
    } catch (err) {
      toast.error(err?.message || "Erreur lors de la création de la discussion.");
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv?.participants || !Array.isArray(conv.participants)) return null;
    const currentId = currentUser?._id || currentUser?.id;
    return conv.participants.find((p) => String(p._id || p.id) !== String(currentId)) || conv.participants[0];
  };

  // Socket setup for Live Chat
  useEffect(() => {
    if (activeTab === "live_chat") {
      fetchConversations();
      const socket = initSocket();

      const handleNewMessage = (msg) => {
        if (activeConversation && String(msg.conversation) === String(activeConversation._id || activeConversation.id)) {
          setChatMessages((prev) => {
            if (prev.some((m) => (m._id || m.id) === (msg._id || msg.id))) return prev;
            return [...prev, msg];
          });
          setTimeout(scrollToBottom, 50);
        }
        fetchConversations();
      };

      if (socket) {
        socket.on("message:new", handleNewMessage);
        socket.on("message:received", handleNewMessage);
      }

      // Fallback periodic refresh every 8s
      const interval = setInterval(fetchConversations, 8000);

      return () => {
        if (socket) {
          socket.off("message:new", handleNewMessage);
          socket.off("message:received", handleNewMessage);
        }
        clearInterval(interval);
      };
    }
  }, [activeTab, activeConversation?._id]);

  useEffect(() => {
    if (activeConversation) {
      const socket = getSocket();
      const convId = activeConversation._id || activeConversation.id;
      socket?.emit("join:conversation", convId);

      return () => {
        socket?.emit("leave:conversation", convId);
      };
    }
  }, [activeConversation?._id]);

  useEffect(() => {
    fetchTickets();
    fetchContactMessages();
  }, []);

  // ─────────────────────────────────────────────────────────
  // TICKET HANDLING
  // ─────────────────────────────────────────────────────────
  const handleSelectTicket = async (t) => {
    const tId = t._id || t.id;
    setSelectedTicket(t);
    setTicketDetailLoading(true);
    try {
      const res = await supportService.getTicketById(tId);
      const detail = res?.data?.ticket || res?.ticket || res?.data || res;
      if (detail && (detail._id || detail.id)) {
        setSelectedTicket(detail);
      }
    } catch (err) {
      console.warn("Could not fetch full ticket details:", err);
    } finally {
      setTicketDetailLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      await adminService.updateTicketStatus(ticketId, newStatus);
      setTickets((prev) =>
        prev.map((t) => ((t._id || t.id) === ticketId ? { ...t, status: newStatus } : t))
      );
      if (selectedTicket && (selectedTicket._id || selectedTicket.id) === ticketId) {
        setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
      }
      toast.success(`Statut mis à jour (${newStatus})`);
    } catch (err) {
      toast.error(err?.message || "Erreur de mise à jour");
    }
  };

  const handleSendTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReplyText.trim() || !selectedTicket) return;
    setReplyLoading(true);
    try {
      const tId = selectedTicket._id || selectedTicket.id;
      const res = await supportService.addMessage(tId, ticketReplyText.trim());
      const updated = res?.data?.ticket || res?.ticket || res?.data;
      if (updated) {
        setSelectedTicket(updated);
        setTickets((prev) =>
          prev.map((t) => ((t._id || t.id) === tId ? updated : t))
        );
      }
      setTicketReplyText("");
      toast.success("Réponse administrative envoyée à l'utilisateur par notification & email !");
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'envoi de la réponse.");
    } finally {
      setReplyLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // CONTACT MESSAGES HANDLING
  // ─────────────────────────────────────────────────────────
  const handleUpdateContactStatus = async (id, status, notes = null) => {
    try {
      await contactService.updateContactMessageStatus(
        id,
        status,
        notes !== null ? notes : selectedContact?.adminNotes || ""
      );
      setContactMessages((prev) =>
        prev.map((m) => ((m._id || m.id) === id ? { ...m, status, ...(notes !== null ? { adminNotes: notes } : {}) } : m))
      );
      if (selectedContact && (selectedContact._id || selectedContact.id) === id) {
        setSelectedContact((prev) => ({ ...prev, status, ...(notes !== null ? { adminNotes: notes } : {}) }));
      }
      toast.success("Demande de contact mise à jour.");
    } catch (err) {
      toast.error(err?.message || "Erreur de mise à jour.");
    }
  };

  const handleSaveContactNotes = async () => {
    if (!selectedContact) return;
    setNoteSaving(true);
    try {
      const id = selectedContact._id || selectedContact.id;
      await contactService.updateContactMessageStatus(id, selectedContact.status, adminNoteInput);
      setContactMessages((prev) =>
        prev.map((m) => ((m._id || m.id) === id ? { ...m, adminNotes: adminNoteInput } : m))
      );
      setSelectedContact((prev) => ({ ...prev, adminNotes: adminNoteInput }));
      toast.success("Note administrative enregistrée !");
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement de la note.");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleSendContactReply = async (e) => {
    e?.preventDefault();
    if (!contactReplyText.trim() || !selectedContact) return;
    setContactReplySending(true);
    try {
      const cId = selectedContact._id || selectedContact.id;
      const res = await contactService.replyToContactMessage(cId, contactReplyText.trim(), adminNoteInput);
      const updated = res?.data?.contactMessage || res?.contactMessage || res?.data;

      setContactMessages((prev) =>
        prev.map((m) =>
          ((m._id || m.id) === cId ? { ...m, status: "replied", ...(updated || {}) } : m)
        )
      );
      if (selectedContact && (selectedContact._id || selectedContact.id) === cId) {
        setSelectedContact((prev) => ({ ...prev, status: "replied", ...(updated || {}) }));
      }
      setContactReplyText("");
      toast.success(`Réponse officielle envoyée avec succès par email à ${selectedContact.email} !`);
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'envoi de la réponse par email.");
    } finally {
      setContactReplySending(false);
    }
  };

  // Badges helper
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
      case "resolved":
      case "closed":
      case "replied":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "in_progress":
        return "bg-sky-100 text-sky-800 border-sky-300";
      case "waiting_response":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (activeTab === "disputes") {
      if (t.category !== "dispute") return false;
    } else if (activeTab === "tickets") {
      if (t.category === "dispute") return false;
    }
    if (ticketStatusFilter !== "all" && t.status !== ticketStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const s = (t.subject || "").toLowerCase();
      const d = (t.description || "").toLowerCase();
      const u = `${t.user?.firstName || ""} ${t.user?.lastName || ""}`.toLowerCase();
      return s.includes(q) || d.includes(q) || u.includes(q);
    }
    return true;
  });

  // Filtered Contact Messages
  const filteredContactMessages = contactMessages.filter((m) => {
    if (contactStatusFilter !== "all" && m.status !== contactStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const n = (m.name || "").toLowerCase();
      const e = (m.email || "").toLowerCase();
      const s = (m.subject || "").toLowerCase();
      const msg = (m.message || "").toLowerCase();
      return n.includes(q) || e.includes(q) || s.includes(q) || msg.includes(q);
    }
    return true;
  });

  // Filtered Live Chat Conversations
  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    if (!other) return false;
    if (chatRoleFilter !== "all" && other.role !== chatRoleFilter) return false;
    if (chatSearchQuery.trim()) {
      const q = chatSearchQuery.toLowerCase();
      const name = `${other.firstName || ""} ${other.lastName || ""}`.toLowerCase();
      const email = (other.email || "").toLowerCase();
      const last = (conv.lastMessage?.content || "").toLowerCase();
      return name.includes(q) || email.includes(q) || last.includes(q);
    }
    return true;
  });

  // Filtered Users for Picker Modal
  const filteredUsersForPicker = allUsersList.filter((u) => {
    if (userPickerRole !== "all" && u.role !== userPickerRole) return false;
    if (userPickerSearch.trim()) {
      const q = userPickerSearch.toLowerCase();
      const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    }
    return true;
  });

  // Counts
  const disputesCount = tickets.filter((t) => t.category === "dispute" && t.status !== "resolved" && t.status !== "closed").length;
  const newContactCount = contactMessages.filter((m) => m.status === "new").length;
  const openTicketsCount = tickets.filter((t) => t.category !== "dispute" && t.status === "open").length;

  return (
    <div className="space-y-6">
      {/* ── Top Header & Tab Navigation ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Support, Contact &amp; Médiation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#800020] text-white">
              Centrale MoversGo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestion intégrale des demandes de contact public, réclamations, tickets d'assistance et messagerie directe en temps réel.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchTickets();
              fetchContactMessages();
              if (activeTab === "live_chat") fetchConversations();
              toast.success("Données actualisées en direct");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* ── 5 Main Modules Navigation Tabs ── */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
        {[
          {
            id: "tickets",
            label: "Tickets d'Assistance",
            icon: LifeBuoy,
            badge: openTicketsCount,
            badgeColor: "bg-amber-500",
          },
          {
            id: "contact",
            label: "Messages de Contact Web",
            icon: Mail,
            badge: newContactCount,
            badgeColor: "bg-[#800020]",
          },
          {
            id: "disputes",
            label: "Litiges & Médiation",
            icon: Scale,
            badge: disputesCount,
            badgeColor: "bg-rose-600",
          },
          {
            id: "live_chat",
            label: "Console de Messagerie Directe & Support Live",
            icon: MessageSquare,
            badge: conversations.length > 0 ? conversations.length : undefined,
            badgeColor: "bg-emerald-600",
          },
          {
            id: "faq",
            label: "Base de Connaissances & FAQ",
            icon: BookOpen,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedTicket(null);
              setSelectedContact(null);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#800020] text-white shadow-md shadow-[#800020]/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${tab.badgeColor}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search Bar & Filter Controls (Tickets, Contact, Disputes) ── */}
      {(activeTab === "tickets" || activeTab === "contact" || activeTab === "disputes") && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === "contact"
                  ? "Rechercher par nom, email, sujet ou message..."
                  : "Rechercher un ticket, mot-clé ou utilisateur..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Statut :</span>
            {activeTab === "contact" ? (
              <select
                value={contactStatusFilter}
                onChange={(e) => setContactStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
              >
                <option value="all">Tous les messages</option>
                <option value="new">Nouveaux</option>
                <option value="in_progress">En cours</option>
                <option value="replied">Répondus / Traités</option>
                <option value="archived">Archivés</option>
              </select>
            ) : (
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
              >
                <option value="all">Tous les statuts</option>
                <option value="open">Ouverts</option>
                <option value="in_progress">En cours</option>
                <option value="waiting_response">En attente de réponse</option>
                <option value="resolved">Résolus</option>
                <option value="closed">Fermés</option>
              </select>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 1 & TAB 3: TICKETS D'ASSISTANCE & MÉDIATION / LITIGES
      ───────────────────────────────────────────────────────────────*/}
      {(activeTab === "tickets" || activeTab === "disputes") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List Table Column */}
          <div className={`${selectedTicket ? "lg:col-span-6 xl:col-span-7" : "lg:col-span-12"} transition-all`}>
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {activeTab === "disputes" ? "Dossiers de Litiges & Contestations" : "Demandes de Support Utilisateurs"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {filteredTickets.length} ticket(s) répertorié(s)
                  </p>
                </div>
                {activeTab === "disputes" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-rose-600" />
                    Séquestre Garanti
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Réf</th>
                      <th className="py-3 px-4">Utilisateur</th>
                      <th className="py-3 px-4">Objet</th>
                      <th className="py-3 px-4">Priorité</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ticketsLoading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#800020]" />
                          Chargement des données...
                        </td>
                      </tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Aucun ticket correspondant trouvé.
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((t) => {
                        const tId = t._id || t.id;
                        const isSelected = selectedTicket && (selectedTicket._id || selectedTicket.id) === tId;
                        const userFull = t.user ? `${t.user.firstName || ""} ${t.user.lastName || ""}`.trim() : (t.userName || "Utilisateur");

                        return (
                          <tr
                            key={tId}
                            onClick={() => handleSelectTicket(t)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-rose-50/70" : "hover:bg-slate-50/70"
                            }`}
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              #{String(tId).slice(-6)}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {userFull}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {t.user?.role === "company" ? "🚚 Déménageur" : "👤 Particulier"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 max-w-[200px] truncate font-medium text-slate-700">
                              {t.subject}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(t.priority)}`}>
                                {t.priority}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(t.status)}`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                              {formatDate(t.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectTicket(t);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#800020] hover:text-white transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Ticket Detail Drawer Column */}
          {selectedTicket && (
            <div className="lg:col-span-6 xl:col-span-5 bg-white rounded-3xl border-2 border-slate-200 shadow-lg p-6 space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#800020]">
                      Ticket #{String(selectedTicket._id || selectedTicket.id).slice(-8)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mt-1">
                    {selectedTicket.subject}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Créé le {formatDate(selectedTicket.createdAt)} par{" "}
                    <strong>
                      {selectedTicket.user?.firstName} {selectedTicket.user?.lastName}
                    </strong>{" "}
                    ({selectedTicket.user?.email || "Email non renseigné"})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Action statut :</span>
                {["open", "in_progress", "waiting_response", "resolved", "closed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateTicketStatus(selectedTicket._id || selectedTicket.id, st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      selectedTicket.status === st
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Dispute Mediation Actions if Category is Dispute */}
              {selectedTicket.category === "dispute" && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <Scale className="w-4 h-4 text-rose-600" />
                    <span>Arbitrage &amp; Médiation Séquestre MoversGo</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Ce litige bloque temporairement le versement des fonds au déménageur. Vous pouvez trancher ou proposer un accord :
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => {
                        handleUpdateTicketStatus(selectedTicket._id || selectedTicket.id, "resolved");
                        toast.success("Décision arbitrée : Fonds libérés pour le déménageur après accord.");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors"
                    >
                      ✓ Débloquer les fonds (Déménageur)
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateTicketStatus(selectedTicket._id || selectedTicket.id, "resolved");
                        toast.success("Décision arbitrée : Remboursement client enclenché via passerelle de paiement.");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition-colors"
                    >
                      ↩ Rembourser le client (Acompte)
                    </button>
                  </div>
                </div>
              )}

              {/* Message Thread */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {ticketDetailLoading ? (
                  <div className="p-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#800020]" />
                    <span>Chargement du fil de discussion...</span>
                  </div>
                ) : selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                        msg.isAdminMessage
                          ? "bg-rose-50/80 border border-rose-200 ml-6"
                          : "bg-slate-50 border border-slate-200 mr-6"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-800">
                          {msg.isAdminMessage ? "🛡️ Support MoversGo (Admin)" : `${msg.sender?.firstName || "Utilisateur"}`}
                        </span>
                        <span className="text-slate-400">{formatDate(msg.sentAt)}</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                        {msg.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs">
                    {selectedTicket.description}
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendTicketReply} className="space-y-2 pt-2 border-t border-slate-100">
                <textarea
                  rows={3}
                  value={ticketReplyText}
                  onChange={(e) => setTicketReplyText(e.target.value)}
                  placeholder="Rédigez votre réponse officielle à l'utilisateur (notification + email)..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                />
                <button
                  type="submit"
                  disabled={replyLoading || !ticketReplyText.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#800020] hover:bg-[#68001a] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  {replyLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Envoi de la réponse...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer la réponse</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: MESSAGES DE CONTACT PUBLICS (Page /contact)
      ───────────────────────────────────────────────────────────────*/}
      {activeTab === "contact" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={`${selectedContact ? "lg:col-span-6 xl:col-span-7" : "lg:col-span-12"} transition-all`}>
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Messages reçus depuis le Formulaire de Contact
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Prospects, demandes de devis et requêtes directes depuis le site public
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-[#800020] border border-rose-200">
                  {filteredContactMessages.length} message(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Gouvernorat</th>
                      <th className="py-3 px-4">Objet</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4">Reçu le</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contactLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#800020]" />
                          Chargement des messages...
                        </td>
                      </tr>
                    ) : filteredContactMessages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Aucun message de contact enregistré.
                        </td>
                      </tr>
                    ) : (
                      filteredContactMessages.map((m) => {
                        const mId = m._id || m.id;
                        const isSelected = selectedContact && (selectedContact._id || selectedContact.id) === mId;

                        return (
                          <tr
                            key={mId}
                            onClick={() => {
                              setSelectedContact(m);
                              setAdminNoteInput(m.adminNotes || "");
                              setContactReplyText("");
                            }}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-rose-50/70" : "hover:bg-slate-50/70"
                            }`}
                          >
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {m.name}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {m.email} {m.phone ? `• ${m.phone}` : ""}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                                {m.governorate || "Tunis"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 max-w-[200px] truncate font-medium text-slate-700">
                              {m.subject}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(m.status)}`}>
                                {m.status === "new" ? "Nouveau" : m.status === "replied" ? "✓ Répondu" : m.status === "in_progress" ? "En cours" : m.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                              {formatDate(m.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContact(m);
                                  setAdminNoteInput(m.adminNotes || "");
                                  setContactReplyText("");
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#800020] hover:text-white transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Contact Message Detail Drawer */}
          {selectedContact && (
            <div className="lg:col-span-6 xl:col-span-5 bg-white rounded-3xl border-2 border-slate-200 shadow-lg p-6 space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                      {selectedContact.governorate || "Tunis"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedContact.status)}`}>
                      {selectedContact.status === "new" ? "Nouveau" : selectedContact.status === "replied" ? "✓ Répondu" : selectedContact.status}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mt-2">
                    {selectedContact.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Reçu le {formatDate(selectedContact.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Direct Action Contacts */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <a
                  href={`mailto:${selectedContact.email}?subject=Réponse MoversGo : ${encodeURIComponent(selectedContact.subject)}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#800020] flex items-center gap-2 font-bold text-slate-800 transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#800020]" />
                  <span className="truncate">{selectedContact.email}</span>
                </a>
                {selectedContact.phone ? (
                  <a
                    href={`tel:${selectedContact.phone}`}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-600 flex items-center gap-2 font-bold text-slate-800 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Appeler ({selectedContact.phone})</span>
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 text-slate-400 flex items-center gap-2 text-xs">
                    <Phone className="w-4 h-4" />
                    <span>Téléphone non renseigné</span>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Objet : {selectedContact.subject}</span>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                  {selectedContact.message}
                </div>
              </div>

              {/* ── NOUVEAU : ZONE DE RÉPONSE DIRECTE PAR EMAIL ── */}
              <form onSubmit={handleSendContactReply} className="space-y-3 pt-3 border-t border-slate-100 bg-rose-50/40 p-4 rounded-2xl border border-rose-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#800020]" />
                    <span>Répondre directement au contact par email :</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    vers {selectedContact.email}
                  </span>
                </div>

                {/* Quick canned templates */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Prise en charge", text: `Bonjour ${selectedContact.name},\n\nNous avons bien reçu votre demande. Un conseiller logistique MoversGo prend contact avec vous afin de finaliser l'estimation.` },
                    { label: "Demande de devis", text: `Bonjour ${selectedContact.name},\n\nPour établir votre devis comparatif au meilleur prix, pourriez-vous nous préciser vos adresses de départ et d'arrivée ainsi que la date souhaitée ?` },
                    { label: "Agrément transporteur", text: `Bonjour ${selectedContact.name},\n\nNous vous remercions pour votre intérêt pour le réseau de transporteurs agréés MoversGo. Notre équipe administrative procède à l'examen de votre dossier.` }
                  ].map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setContactReplyText(tpl.text)}
                      className="text-[10px] bg-white hover:bg-rose-100 hover:text-[#800020] text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 transition-colors"
                    >
                      + {tpl.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={contactReplyText}
                  onChange={(e) => setContactReplyText(e.target.value)}
                  placeholder="Rédigez la réponse administrative officielle qui sera transmise par email à l'utilisateur..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] leading-relaxed"
                />

                <button
                  type="submit"
                  disabled={contactReplySending || !contactReplyText.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#800020] hover:bg-[#68001a] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  {contactReplySending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Envoi de l'email en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer la réponse par Email</span>
                    </>
                  )}
                </button>
              </form>

              {/* Status Update Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Changer le statut :</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "new", label: "Nouveau" },
                    { id: "in_progress", label: "En cours" },
                    { id: "replied", label: "✓ Répondu & Traité" },
                    { id: "archived", label: "Archiver" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleUpdateContactStatus(selectedContact._id || selectedContact.id, s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        selectedContact.status === s.id
                          ? "bg-[#800020] text-white border-[#800020]"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Notes internes administratives (confidentiel) :
                </label>
                <textarea
                  rows={2}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Ajouter une note de suivi interne..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                />
                <button
                  onClick={handleSaveContactNotes}
                  disabled={noteSaving}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                >
                  {noteSaving ? "Enregistrement..." : "Enregistrer la note"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: CONSOLE DE MESSAGERIE DIRECTE & SUPPORT LIVE (DYNAMIQUE)
      ───────────────────────────────────────────────────────────────*/}
      {activeTab === "live_chat" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Live Chat Top Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#800020] text-white flex items-center justify-center shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Console de Messagerie Directe &amp; Support Live
                  </h3>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    En direct
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Échangez en temps réel avec les clients et transporteurs pour une assistance immédiate
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenUserPicker}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#800020] hover:bg-[#68001a] text-white font-bold text-xs shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nouvelle discussion</span>
              </button>
              <button
                onClick={fetchConversations}
                disabled={conversationsLoading}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Actualiser la liste"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${conversationsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Main Chat Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-12 h-[680px]">
            {/* Left Column: Conversations List */}
            <div className="md:col-span-4 lg:col-span-4 border-r border-slate-100 flex flex-col h-full bg-slate-50/40">
              {/* Search & Filter */}
              <div className="p-3 border-b border-slate-100 space-y-2 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrer les discussions..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { id: "all", label: "Tous" },
                    { id: "client", label: "Clients" },
                    { id: "company", label: "Déménageurs" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setChatRoleFilter(f.id)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                        chatRoleFilter === f.id
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversations Scroll Area */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {conversationsLoading && conversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#800020]" />
                    <span className="text-xs">Chargement des fils...</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-3">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">Aucune discussion trouvée.</p>
                    <button
                      onClick={handleOpenUserPicker}
                      className="text-xs font-bold text-[#800020] hover:underline"
                    >
                      Démarrer un chat avec un utilisateur →
                    </button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const cId = conv._id || conv.id;
                    const other = getOtherParticipant(conv);
                    const isSelected = activeConversation && (activeConversation._id || activeConversation.id) === cId;
                    const name = other ? `${other.firstName || ""} ${other.lastName || ""}`.trim() || other.company?.companyName || "Utilisateur" : "Utilisateur";
                    const isCompany = other?.role === "company";
                    const lastMsg = conv.lastMessage?.content || "Aucun message";

                    return (
                      <div
                        key={cId}
                        onClick={() => handleSelectConversation(conv)}
                        className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? "bg-rose-50/90 border-l-4 border-l-[#800020]"
                            : "hover:bg-slate-100/70"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${
                          isCompany ? "bg-amber-600" : "bg-[#800020]"
                        }`}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {name}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {conv.lastMessageAt ? formatDate(conv.lastMessageAt) : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isCompany ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-[#800020]"
                            }`}>
                              {isCompany ? "Déménageur" : "Client"}
                            </span>
                            {conv.booking && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                Réf #{String(conv.booking._id || conv.booking).slice(-4)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {lastMsg}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Live Chat Window */}
            <div className="md:col-span-8 lg:col-span-8 flex flex-col h-full bg-white">
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  {(() => {
                    const other = getOtherParticipant(activeConversation);
                    const name = other ? `${other.firstName || ""} ${other.lastName || ""}`.trim() || other.company?.companyName || "Utilisateur" : "Utilisateur";
                    const isCompany = other?.role === "company";

                    return (
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm ${
                            isCompany ? "bg-amber-600" : "bg-[#800020]"
                          }`}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isCompany ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-[#800020]"
                              }`}>
                                {isCompany ? "🚚 Déménageur Agréé" : "👤 Client Particulier"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {other?.email} {other?.phone ? `• ${other?.phone}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {other?.phone && (
                            <a
                              href={`tel:${other.phone}`}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
                              title="Appeler l'utilisateur"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => fetchMessagesForConversation(activeConversation._id || activeConversation.id)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Actualiser les messages"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Messages Bubble Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                    {chatLoading ? (
                      <div className="p-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#800020]" />
                        <span className="text-xs">Chargement des messages...</span>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 space-y-2">
                        <MessagesSquare className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-xs">Aucun message échangé pour le moment.</p>
                        <p className="text-[11px] text-slate-400">Écrivez le premier message ci-dessous pour lancer l'assistance.</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => {
                        const mId = msg._id || msg.id || i;
                        const isMe =
                          String(msg.sender?._id || msg.sender?.id || msg.sender) ===
                          String(currentUser?._id || currentUser?.id) ||
                          msg.sender?.role === "admin";

                        return (
                          <div
                            key={mId}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] font-bold text-slate-600">
                                {isMe ? "🛡️ Support MoversGo (Vous)" : `${msg.sender?.firstName || "Utilisateur"}`}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                              </span>
                            </div>
                            <div
                              className={`max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                                isMe
                                  ? "bg-[#800020] text-white rounded-tr-none shadow-sm"
                                  : "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-2xs"
                              }`}
                            >
                              <p className="whitespace-pre-line font-normal">{msg.content}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-1 pt-2 border-t border-white/20">
                                  {msg.attachments.map((att, attIdx) => (
                                    <a
                                      key={attIdx}
                                      href={att.filePath}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`text-[11px] underline flex items-center gap-1 ${
                                        isMe ? "text-rose-200" : "text-[#800020]"
                                      }`}
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      <span>{att.fileName || "Pièce jointe"}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendLiveChatMessage} className="p-3 border-t border-slate-100 bg-white space-y-2">
                    {/* Quick suggestion chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {[
                        "Bonjour, comment pouvons-nous vous assister ?",
                        "Votre demande a bien été transmise au transporteur.",
                        "Pouvez-vous nous confirmer l'adresse exacte ?",
                        "Le paiement de votre acompte est bien sécurisé en séquestre."
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLiveChatMessageText(chip)}
                          className="whitespace-nowrap text-[10px] bg-slate-100 hover:bg-rose-50 hover:text-[#800020] text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 transition-colors"
                        >
                          {chip.length > 30 ? `${chip.substring(0, 27)}...` : chip}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={liveChatMessageText}
                        onChange={(e) => setLiveChatMessageText(e.target.value)}
                        placeholder="Écrire un message d'assistance en direct... (Entrée pour envoyer)"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                      />
                      <button
                        type="submit"
                        disabled={liveChatSending || !liveChatMessageText.trim()}
                        className="px-5 py-2.5 rounded-xl bg-[#800020] hover:bg-[#68001a] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all flex-shrink-0"
                      >
                        {liveChatSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Envoyer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-rose-50 text-[#800020] border-2 border-rose-200 flex items-center justify-center shadow-md">
                    <MessagesSquare className="w-8 h-8" />
                  </div>
                  <div className="max-w-sm space-y-1">
                    <h4 className="font-bold text-slate-900 text-base">
                      Sélectionnez une discussion en direct
                    </h4>
                    <p className="text-xs text-slate-500">
                      Choisissez un fil de conversation dans la liste à gauche ou initiez un nouvel échange avec un utilisateur.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenUserPicker}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#800020] text-white text-xs font-bold hover:bg-[#68001a] shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Démarrer un nouveau chat utilisateur</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: NOUVELLE DISCUSSION UTILISATEUR
      ───────────────────────────────────────────────────────────────*/}
      {isUserPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Démarrer un chat avec un utilisateur
                </h3>
                <p className="text-[11px] text-slate-500">
                  Sélectionnez un particulier ou un transporteur inscrit
                </p>
              </div>
              <button
                onClick={() => setIsUserPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-4 border-b border-slate-100 space-y-2 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={userPickerSearch}
                  onChange={(e) => setUserPickerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { id: "all", label: "Tous les utilisateurs" },
                  { id: "client", label: "Particuliers" },
                  { id: "company", label: "Déménageurs" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setUserPickerRole(f.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      userPickerRole === f.id
                        ? "bg-[#800020] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Users List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-50">
              {usersLoading ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#800020]" />
                  <span className="text-xs">Chargement de l'annuaire...</span>
                </div>
              ) : filteredUsersForPicker.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aucun utilisateur correspondant trouvé.
                </div>
              ) : (
                filteredUsersForPicker.map((u) => {
                  const uId = u._id || u.id;
                  const isCompany = u.role === "company";
                  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.company?.companyName || "Utilisateur";

                  return (
                    <div
                      key={uId}
                      className="pt-2 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${
                          isCompany ? "bg-amber-600" : "bg-[#800020]"
                        }`}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">{name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isCompany ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-[#800020]"
                            }`}>
                              {isCompany ? "Transporteur" : "Client"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {u.email} {u.phone ? `• ${u.phone}` : ""}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartChatWithUser(u)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-[#800020] text-white font-bold text-xs flex items-center gap-1 transition-colors flex-shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chatter</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: BASE DE CONNAISSANCES & FAQ
      ───────────────────────────────────────────────────────────────*/}
      {activeTab === "faq" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Base de Connaissances &amp; FAQ Plateforme
              </h3>
              <p className="text-xs text-slate-500">
                Articles de vulgarisation, guides d'inventaire et questions fréquentes publiées sur /faq
              </p>
            </div>
            <a
              href="/faq"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-[#800020] transition-colors"
            >
              <span>Voir la page publique</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Guide de Calcul des Volumes (m³)",
                desc: "Barèmes pour studios, appartements F3/F4 et villas avec formule d'estimation.",
                views: "1,420 vues",
              },
              {
                title: "Protocole d'Agrément Transporteur",
                desc: "Critères RNE, patente fiscale et validation des camions capitonnés.",
                views: "890 vues",
              },
              {
                title: "Procédure de Séquestre & Acompte",
                desc: "Fonctionnement de la garantie financière et conditions de déblocage des fonds.",
                views: "2,150 vues",
              },
            ].map((art, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-[#800020] transition-colors">
                <span className="text-[10px] font-mono font-bold text-[#800020] uppercase">Article Standard</span>
                <h4 className="font-bold text-sm text-slate-900">{art.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{art.desc}</p>
                <p className="text-[10px] text-slate-400 font-mono pt-2">{art.views}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
