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
  ArrowLeft,
  Calendar,
  Truck,
  RefreshCw,
  AlertCircle,
  ShieldOff,
  ShieldCheck,
  MoreVertical,
} from "lucide-react";

function avatarUrl(img) {
  return getLogoUrl(img);
}

export function ClientMessagesPage() {
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

  // 1. Load Conversations
  const fetchConversations = async () => {
    setLoadingConvs(true);
    try {
      const res = await messageService.getConversations();
      // messageService.getConversations() returns { conversations: [...] }
      const list = Array.isArray(res) ? res : (res?.conversations || []);
      setConversations(Array.isArray(list) ? list : []);

      // If a targetConvId is specified or default to first conversation
      if (list && list.length > 0) {
        if (targetConvId) {
          const match = list.find((c) => String(c._id) === String(targetConvId));
          if (match) {
            setSelectedConv(match);
          } else {
            setSelectedConv(list[0]);
          }
        } else if (!selectedConv) {
          setSelectedConv(list[0]);
        }
      }
    } catch (err) {
      console.error("Erreur chargement conversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [targetConvId]);

  // 2. Load Messages for Selected Conversation
  useEffect(() => {
    if (!selectedConv?._id) return;

    let isMounted = true;
    async function loadMsgs() {
      setLoadingMessages(true);
      try {
        const res = await messageService.getMessages(selectedConv._id, { limit: 100 });
        // messageService.getMessages returns the messages array directly (paginated response)
        const list = Array.isArray(res) ? res : (res?.messages || res?.data || []);
        if (isMounted) {
          setMessages(Array.isArray(list) ? list : []);
        }
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
        if (String(newMsg.conversation) === String(selectedConv._id)) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
          });
          // Also update conversation list lastMessage
          setConversations((prev) =>
            prev.map((c) =>
              String(c._id) === String(selectedConv._id)
                ? { ...c, lastMessage: newMsg, lastMessageAt: new Date() }
                : c
            )
          );
        }
      };

      // Handle incoming messages when this conversation is open
      socket.on("message:new", handleNewMessage);

      // Handle new messages from OTHER conversations (update unread badge)
      const handleMessageReceived = (newMsg) => {
        if (String(newMsg.conversation) !== String(selectedConv._id)) {
          setConversations((prev) =>
            prev.map((c) =>
              String(c._id) === String(newMsg.conversation)
                ? { ...c, lastMessage: newMsg, lastMessageAt: new Date() }
                : c
            )
          );
          // If conversation not in list yet, refresh all
          if (!conversations.some((c) => String(c._id) === String(newMsg.conversation))) {
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
      if (createdMsg?._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === createdMsg._id)) return prev;
          return [...prev, createdMsg];
        });
      }
      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConv._id
            ? { ...c, lastMessage: createdMsg || { content: contentToSend }, lastMessageAt: new Date() }
            : c
        )
      );
    } catch (err) {
      console.error("Erreur envoi message:", err);
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

  // Load blocked list when component mounts
  useEffect(() => {
    messageService.getBlockedList().then((res) => {
      const list = res?.data?.blockedUsers || [];
      setBlockedUsers(list.map((u) => u._id || u));
    }).catch(() => { });
  }, []);

  const filteredConversations = conversations.filter((c) => {
    const partner = getPartner(c);
    const name = partner
      ? `${partner.company?.companyName || partner.firstName || ""} ${partner.lastName || ""}`.toLowerCase()
      : "";
    return name.includes(searchTerm.toLowerCase());
  });

  const partner = getPartner(selectedConv);
  const partnerName = partner
    ? partner.company?.companyName || `${partner.firstName} ${partner.lastName}`
    : "Déménageur Partenaire";
  const partnerPhoto = avatarUrl(partner?.profileImage || partner?.company?.logo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messagerie directe</h1>
          <p className="text-xs text-slate-500">
            Communiquez en temps réel avec vos déménageurs partenaires
          </p>
        </div>
        <button
          onClick={fetchConversations}
          title="Actualiser les conversations"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loadingConvs ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row h-[680px] overflow-hidden">
        {/* Left Sidebar: Conversations List */}
        <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un déménageur..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConvs ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Chargement des échanges...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">Aucune conversation</p>
                <p className="text-[11px]">
                  Vos échanges avec les transporteurs apparaîtront ici dès qu'un devis est accepté.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedConv?._id === c._id;
                const p = getPartner(c);
                const pName = p
                  ? p.company?.companyName || `${p.firstName} ${p.lastName}`
                  : "Déménageur";
                const pImg = avatarUrl(p?.profileImage || p?.company?.logo);
                const lastMsg = c.lastMessage?.content || "Nouvelle conversation";

                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setSelectedConv(c)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${isSelected ? "bg-white shadow-xs" : "hover:bg-slate-100/60"
                      }`}
                  >
                    {pImg ? (
                      <img
                        src={pImg}
                        alt={pName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 font-bold border border-brand-100">
                        <Building2 className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{pName}</h4>
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

        {/* Right Chat Main Window */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                <div className="flex items-center gap-3">
                  {partnerPhoto ? (
                    <img
                      src={partnerPhoto}
                      alt={partnerName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{partnerName}</h3>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Déménageur certifié MoversGo</span>
                    </p>
                  </div>
                </div>

                {selectedConv.booking && (
                  <Link
                    to={`/client/bookings/${selectedConv.booking._id || selectedConv.booking}`}
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
                          className={`w-full px-4 py-3 text-xs font-semibold text-left flex items-center gap-2 transition-colors ${
                            isPartnerBlocked(partner._id)
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-rose-600 hover:bg-rose-50"
                          }`}
                        >
                          {isPartnerBlocked(partner._id) ? (
                            <><ShieldCheck className="w-4 h-4" /> Débloquer cet utilisateur</>
                          ) : (
                            <><ShieldOff className="w-4 h-4" /> Bloquer cet utilisateur</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Messages Stream */}
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
                    <p className="text-[11px]">Envoyez votre premier message pour lancer la discussion.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const senderId = msg.sender?._id || msg.sender;
                    const isMe = String(senderId) === String(currentUser?._id);
                    const senderName = isMe
                      ? "Moi"
                      : partnerName;
                    const time = msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "";

                    return (
                      <div
                        key={msg._id || Math.random()}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[10px] text-slate-400 mb-1 px-1">
                          {senderName} • {time}
                        </span>
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${isMe
                            ? "bg-brand-600 text-white rounded-br-none"
                            : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-none"
                            }`}
                        >
                          {msg.content}
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
                  <span className="flex-1">Vous avez bloqué cet utilisateur. Les messages sont désactivés.</span>
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
                  placeholder="Écrivez votre message au déménageur..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="p-3 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-brand disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs p-8 text-center">
              Sélectionnez une conversation pour afficher vos messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
