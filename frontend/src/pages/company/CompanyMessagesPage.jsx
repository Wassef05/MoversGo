import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { messageService } from "../../services/api/messageService";
import { initSocket, getSocket } from "../../services/api/socket";
import { formatDate, getLogoUrl } from "../../utils/cn";
import {
  Send,
  User,
  Building2,
  CheckCheck,
  Search,
  MessageSquare,
  Calendar,
  Truck,
  RefreshCw,
  AlertCircle,
  ShieldOff,
  ShieldCheck,
  MoreVertical,
  Sparkles,
  Paperclip,
} from "lucide-react";

function avatarUrl(img) {
  return getLogoUrl(img);
}

export function CompanyMessagesPage() {
  const { id: paramConvId } = useParams();
  const [searchParams] = useSearchParams();
  const queryConvId = searchParams.get("conversationId");
  const targetConvId = paramConvId || queryConvId;

  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch Conversations
  const fetchConversations = async () => {
    setLoadingConvs(true);
    try {
      const res = await messageService.getConversations();
      // messageService.getConversations() returns { conversations: [...] }
      const list = Array.isArray(res) ? res : (res?.conversations || []);
      setConversations(Array.isArray(list) ? list : []);

      if (list && list.length > 0) {
        if (targetConvId) {
          const match = list.find((c) => String(c._id) === String(targetConvId));
          if (match) setSelectedConv(match);
          else setSelectedConv(list[0]);
        } else if (!selectedConv) {
          setSelectedConv(list[0]);
        }
      }
    } catch (err) {
      console.error("Erreur chargement conversations entreprise:", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [targetConvId]);

  // 2. Fetch Messages for Selected Conversation
  useEffect(() => {
    if (!selectedConv?._id) return;

    let isMounted = true;
    async function loadMsgs() {
      setLoadingMessages(true);
      try {
        const res = await messageService.getMessages(selectedConv._id, { limit: 100 });
        // messageService.getMessages returns array of messages directly (paginated)
        const list = Array.isArray(res) ? res : (res?.messages || res?.data || []);
        if (isMounted) setMessages(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Erreur chargement messages:", err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }

    loadMsgs();

    // Socket.io room join
    const socket = initSocket();
    if (socket) {
      socket.emit("join:conversation", selectedConv._id);

      const handleNewMessage = (newMsg) => {
        if (!newMsg) return;
        const msgConvId = String(newMsg.conversation?._id || newMsg.conversation?.id || newMsg.conversation || "");
        const currentConvId = String(selectedConv._id || selectedConv.id || "");
        if (msgConvId === currentConvId) {
          setMessages((prev) => {
            const newId = String(newMsg._id || newMsg.id || "");
            if (newId && prev.some((m) => String(m._id || m.id || "") === newId)) return prev;
            return [...prev, newMsg];
          });
          setConversations((prev) =>
            prev.map((c) =>
              String(c._id) === String(selectedConv._id)
                ? { ...c, lastMessage: newMsg, lastMessageAt: new Date() }
                : c
            )
          );
        }
      };

      socket.on("message:new", handleNewMessage);

      // Handle new messages from OTHER conversations
      const handleMessageReceived = (newMsg) => {
        if (!newMsg) return;
        const msgConvId = String(newMsg.conversation?._id || newMsg.conversation?.id || newMsg.conversation || "");
        const currentConvId = String(selectedConv._id || selectedConv.id || "");
        if (msgConvId !== currentConvId) {
          setConversations((prev) =>
            prev.map((c) =>
              String(c._id) === msgConvId
                ? { ...c, lastMessage: newMsg, lastMessageAt: new Date() }
                : c
            )
          );
          if (!conversations.some((c) => String(c._id) === msgConvId)) {
            fetchConversations();
          }
        }
      };
      socket.on("message:received", handleMessageReceived);

      return () => {
        isMounted = false;
        socket.emit("leave:conversation", selectedConv._id);
        socket.off("message:new", handleNewMessage);
        socket.off("message:received", handleMessageReceived);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [selectedConv?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Send Message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedConv?._id || sending) return;

    const contentToSend = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await messageService.sendMessage(selectedConv._id, { content: contentToSend });
      // messageService.sendMessage returns { message: {...} }
      const createdMsg = res?.message || res?.data?.message || res?.data;
      if (createdMsg) {
        setMessages((prev) => {
          const newId = String(createdMsg._id || createdMsg.id || "");
          if (newId && prev.some((m) => String(m._id || m.id || "") === newId)) return prev;
          return [...prev, createdMsg];
        });
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConv._id
            ? { ...c, lastMessage: createdMsg || { content: contentToSend }, lastMessageAt: new Date() }
            : c
        )
      );
    } catch (err) {
      console.error("Erreur envoi message entreprise:", err);
      alert("Erreur lors de l'envoi du message.");
      setInput(contentToSend);
    } finally {
      setSending(false);
    }
  };

  const getPartner = (conv) => {
    if (!conv?.participants) return null;
    return conv.participants.find((p) => String(p._id) !== String(currentUser?._id));
  };

  // Block / unblock
  const isPartnerBlocked = (partnerId) =>
    blockedUsers.some((id) => String(id) === String(partnerId));

  const handleToggleBlock = async (partnerId) => {
    try {
      if (isPartnerBlocked(partnerId)) {
        await messageService.unblockUser(partnerId);
        setBlockedUsers((prev) => prev.filter((id) => String(id) !== String(partnerId)));
      } else {
        await messageService.blockUser(partnerId);
        setBlockedUsers((prev) => [...prev, partnerId]);
      }
      setBlockMenuOpen(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Erreur lors du blocage.");
    }
  };

  useEffect(() => {
    messageService.getBlockedList().then((res) => {
      const list = res?.data?.blockedUsers || [];
      setBlockedUsers(list.map((u) => u._id || u));
    }).catch(() => { });
  }, []);

  const filteredConversations = conversations.filter((c) => {
    const partner = getPartner(c);
    const name = partner
      ? `${partner.firstName || ""} ${partner.lastName || ""}`.toLowerCase()
      : "";
    return name.includes(searchTerm.toLowerCase());
  });

  const partner = getPartner(selectedConv);
  const isPartnerAdmin = partner?.role === "admin";
  const hasAdminParticipant = selectedConv?.participants?.some((p) => p.role === "admin");
  const partnerName = isPartnerAdmin
    ? "Support Officiel MoversGo"
    : partner
    ? `${partner.firstName} ${partner.lastName}`
    : "Client Particulier";
  const partnerPhoto = isPartnerAdmin ? null : avatarUrl(partner?.profileImage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messagerie Clients</h1>
          <p className="text-xs text-slate-500">
            Communiquez en direct avec vos clients avant, pendant et après l'intervention
          </p>
        </div>
        <button
          onClick={fetchConversations}
          title="Actualiser les messages"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loadingConvs ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row h-[680px] overflow-hidden">
        {/* Left Conversations Sidebar */}
        <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un client..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConvs ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Chargement...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">Aucun échange en cours</p>
                <p className="text-[11px]">
                  Dès qu'un client valide l'un de vos devis, une conversation sera automatiquement ouverte ici.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedConv?._id === c._id;
                const p = getPartner(c);
                const isPAdmin = p?.role === "admin";
                const pName = isPAdmin
                  ? "Support Officiel MoversGo"
                  : p
                  ? `${p.firstName} ${p.lastName}`
                  : "Client";
                const pImg = isPAdmin ? null : avatarUrl(p?.profileImage);
                const lastMsg = c.lastMessage?.content || "Conversation démarrée";

                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setSelectedConv(c)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${isSelected ? "bg-white shadow-xs" : "hover:bg-slate-100/60"
                      }`}
                  >
                    {isPAdmin ? (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#800020] to-[#5a0016] text-white flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
                        <ShieldCheck className="w-5 h-5 text-amber-300" />
                      </div>
                    ) : pImg ? (
                      <img
                        src={pImg}
                        alt={pName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 font-bold border border-slate-200">
                        <User className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{pName}</h4>
                          {isPAdmin && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-50 text-[#800020] border border-rose-200 flex-shrink-0">
                              Support
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {c.lastMessageAt ? formatDate(c.lastMessageAt) : ""}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{lastMsg}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Messages Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                <div className="flex items-center gap-3">
                  {isPartnerAdmin ? (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#800020] via-[#73001c] to-[#4d0013] text-white flex items-center justify-center font-bold shadow-xs">
                      <ShieldCheck className="w-5 h-5 text-amber-300" />
                    </div>
                  ) : partnerPhoto ? (
                    <img
                      src={partnerPhoto}
                      alt={partnerName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{partnerName}</h3>
                      {isPartnerAdmin && (
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-[#800020] border border-rose-300 uppercase tracking-wider">
                          Support Certifié
                        </span>
                      )}
                    </div>
                    {isPartnerAdmin ? (
                      <p className="text-[11px] text-[#800020] font-bold flex items-center gap-1.5 mt-0.5">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Administration & Assistance Officielle MoversGo</span>
                      </p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-emerald-600 font-medium">
                          Client MoversGo
                        </p>
                        {hasAdminParticipant && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-rose-50 text-[#800020] border border-rose-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#800020]" />
                            <span>Supervision active</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {selectedConv.booking && (
                  <Link
                    to={`/company/bookings/${selectedConv.booking._id || selectedConv.booking}`}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5 text-brand-600" />
                    <span>Détail Réservation</span>
                  </Link>
                )}
                {/* Block menu */}
                {partner && (
                  <div className="relative">
                    <button
                      onClick={() => setBlockMenuOpen((v) => !v)}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
                      title="Options de conversation"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {blockMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-2xl shadow-lg z-10 overflow-hidden">
                        <button
                          onClick={() => handleToggleBlock(partner._id)}
                          className={`w-full px-4 py-3 text-xs font-semibold text-left flex items-center gap-2 transition-colors ${isPartnerBlocked(partner._id)
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-rose-600 hover:bg-rose-50"
                            }`}
                        >
                          {isPartnerBlocked(partner._id) ? (
                            <><ShieldCheck className="w-4 h-4" /> Débloquer ce client</>
                          ) : (
                            <><ShieldOff className="w-4 h-4" /> Bloquer ce client</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Messages list */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/20">
                {loadingMessages ? (
                  <div className="py-20 text-center text-slate-400 text-xs">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Chargement des messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs space-y-1">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">Aucun message pour l'instant</p>
                    <p className="text-[11px]">Envoyez un message pour confirmer l'organisation avec votre client.</p>
                  </div>
                ) : (
                  messages
                    .filter((msg, idx, arr) => {
                      const id = String(msg._id || msg.id || "");
                      if (!id) return true;
                      return arr.findIndex((m) => String(m._id || m.id || "") === id) === idx;
                    })
                    .map((msg, i) => {
                      const sender = msg.sender || {};
                      const senderId = sender._id || sender.id || sender;
                      const isMe = String(senderId) === String(currentUser?._id);
                      const isSenderAdmin = Boolean(
                        msg.isAdminMessage ||
                        sender.role === "admin" ||
                        (!isMe && isPartnerAdmin)
                      );
                      const time = msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "";

                      // ── CASE A: ADMIN MESSAGE (Forme et couleur de prestige MoversGo) ──
                      if (isSenderAdmin) {
                        return (
                          <div
                            key={msg._id || i}
                            className="flex flex-col items-start my-3"
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-[#800020] border border-rose-300 text-[10px] font-black tracking-wide shadow-2xs">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#800020]" />
                                <span>🛡️ Intervention Officielle — Admin MoversGo</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{time}</span>
                            </div>

                            <div className="max-w-[85%] rounded-2xl rounded-tl-xs p-4 bg-gradient-to-br from-[#800020] via-[#73001c] to-[#4d0013] text-white shadow-lg border-2 border-rose-300/40 relative overflow-hidden">
                              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/20 text-[11px]">
                                <div className="flex items-center gap-1.5 font-bold text-amber-200">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Support Officiel MoversGo</span>
                                </div>
                                <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-white/20 text-white uppercase tracking-wider">
                                  Certifié
                                </span>
                              </div>

                              <p className="whitespace-pre-line text-xs font-normal leading-relaxed text-slate-50">
                                {msg.content}
                              </p>

                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2.5 space-y-1 pt-2 border-t border-white/20">
                                  {msg.attachments.map((att, attIdx) => (
                                    <a
                                      key={attIdx}
                                      href={att.filePath}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] underline flex items-center gap-1 text-rose-100 hover:text-white"
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
                      }

                      // ── CASE B: COMPANY (MOI) ──
                      if (isMe) {
                        return (
                          <div
                            key={msg._id || i}
                            className="flex flex-col items-end my-2"
                          >
                            <span className="text-[10px] text-slate-400 mb-1 px-1">
                              Moi (Entreprise) • {time}
                            </span>
                            <div className="max-w-md p-3.5 rounded-2xl rounded-br-none text-xs leading-relaxed shadow-xs bg-slate-900 text-white">
                              <p className="whitespace-pre-line">{msg.content}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-1 pt-2 border-t border-white/20">
                                  {msg.attachments.map((att, attIdx) => (
                                    <a
                                      key={attIdx}
                                      href={att.filePath}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] underline flex items-center gap-1 text-white hover:text-slate-100"
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
                      }

                      // ── CASE C: CLIENT PARTICULIER ──
                      const clientSenderName = `${sender.firstName || ""} ${sender.lastName || ""}`.trim() || partnerName;
                      return (
                        <div
                          key={msg._id || i}
                          className="flex flex-col items-start my-2"
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-bold">
                              <User className="w-3 h-3 text-sky-600" />
                              <span>👤 Client : {clientSenderName}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{time}</span>
                          </div>
                          <div className="max-w-md p-3.5 rounded-2xl rounded-bl-none text-xs leading-relaxed shadow-xs bg-white text-slate-800 border border-slate-200/90">
                            <p className="whitespace-pre-line">{msg.content}</p>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-1 pt-2 border-t border-slate-100">
                                {msg.attachments.map((att, attIdx) => (
                                  <a
                                    key={attIdx}
                                    href={att.filePath}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] underline flex items-center gap-1 text-slate-700 hover:text-slate-900"
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
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              {partner && isPartnerBlocked(partner._id) ? (
                <div className="p-4 border-t border-slate-100 bg-rose-50 flex items-center gap-2 text-xs text-rose-700 font-semibold">
                  <ShieldOff className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">Vous avez bloqué ce client. Les messages sont désactivés.</span>
                  <button
                    onClick={() => handleToggleBlock(partner._id)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                  >
                    Débloquer
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSend}
                  className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Écrivez votre réponse au client..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs p-8 text-center">
              Sélectionnez une conversation pour échanger avec vos clients
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
