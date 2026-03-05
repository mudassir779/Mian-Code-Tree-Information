import React, { useState, useRef, useEffect } from 'react';
import {
  X, Send, User, TreePine,
  Paperclip, Phone, Volume2, VolumeX,
  Image as ImageIcon, Loader, CalendarDays, AlertTriangle, DollarSign
} from 'lucide-react';
import Vapi from '@vapi-ai/web';
import { sendTreeAnalysisEmail } from '../utils/emailService';

const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const vapiRef = useRef(null);

  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Initialize Vapi
  useEffect(() => {
    try {
      const vapi = new Vapi('7649bce6-4568-49ed-bd41-b8665a5a583a');
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        setIsCallActive(true);
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: "Voice call started. Listening...",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      });

      vapi.on('call-end', () => {
        setIsCallActive(false);
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: "Voice call ended.",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      });

      vapi.on('error', (e) => {
        console.error("Vapi Error:", e);
        setIsCallActive(false);
      });

    } catch (error) {
      console.error("Failed to initialize Vapi:", error);
    }

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  const toggleCall = () => {
    if (vapiRef.current) {
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 600);

      if (isCallActive) {
        vapiRef.current.stop();
      } else {
        setIsConnecting(true);
        vapiRef.current.start('1db96221-98c5-4ef3-a4c7-f60c999a4883');
        setTimeout(() => setIsConnecting(false), 2000);
      }
    }
  };

  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: "Hi there! \ud83d\udc4b I'm Abdias from American Tree Experts. Whether it's trimming, removal, or a health check \u2014 I'm here to help your trees thrive!",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].sender === 'bot' && soundEnabled) {
      notificationSound.volume = 0.5;
      notificationSound.play().catch(e => console.log("Audio play failed", e));
    }
  }, [messages, soundEnabled]);

  const handleSendMessage = async (e, overrideText = null) => {
    if (e) e.preventDefault();
    const textToSend = overrideText || inputText;

    if (!textToSend.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setShowQuickReplies(false);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history: messages }),
      });

      const data = await response.json();

      if (response.ok) {
        const botMessage = {
          id: Date.now() + 1,
          text: data.response,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting to the server right now. Please call us at 812-457-3433 for immediate assistance.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const userMessage = {
        id: Date.now(),
        text: `Sent an image: ${file.name}`,
        sender: 'user',
        isImage: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: "I've received your photo. This helps us assess the situation better. Could you provide a brief description of what we're looking at?",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSendingEmail(true);

    const emailData = {
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone,
      analysis: "Customer requested a quote via chatbot. Please review chat history for details.",
      price: "$500 - $2000 (Estimate)",
      imageUrl: "Image available in chat"
    };

    const result = await sendTreeAnalysisEmail(emailData);
    setIsSendingEmail(false);
    setShowContactForm(false);

    const botMessage = {
      id: Date.now(),
      text: result.success
        ? "Thank you! Your request has been sent to our team. We will contact you shortly to schedule your assessment."
        : "I apologize, but there was an issue sending your request. Please try again or call us directly.",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, botMessage]);
    setContactForm({ name: '', email: '', phone: '' });
  };

  const handleQuickReply = (reply) => {
    if (reply === "Free Estimate" || reply === "Schedule Visit") {
      const botMessage = {
        id: Date.now(),
        text: "I can help with that! Please provide your contact details so we can reach you.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
      setShowContactForm(true);
    } else {
      handleSendMessage(null, reply);
    }
  };

  const serviceCards = [
    { label: "Free Estimate", icon: <TreePine size={18} className="text-green-700" />, bg: "bg-green-50", border: "border-green-200" },
    { label: "Schedule Visit", icon: <CalendarDays size={18} className="text-amber-600" />, bg: "bg-amber-50", border: "border-amber-200" },
    { label: "Emergency", icon: <AlertTriangle size={18} className="text-red-500" />, bg: "bg-red-50", border: "border-red-200" },
    { label: "Pricing", icon: <DollarSign size={18} className="text-blue-600" />, bg: "bg-blue-50", border: "border-blue-200" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <style>{`
        @keyframes cb-slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cb-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes cb-spinRing {
          to { transform: rotate(360deg); }
        }
        @keyframes cb-pulseDot {
          0%, 100% { box-shadow: 0 0 6px rgba(74,222,128,0.5); }
          50% { box-shadow: 0 0 14px rgba(74,222,128,0.9); }
        }
        @keyframes cb-typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes cb-floatPulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes cb-glowCall {
          0%, 100% { box-shadow: 0 4px 16px rgba(16,185,129,0.35); }
          50% { box-shadow: 0 4px 24px rgba(16,185,129,0.6); }
        }
        .cb-open { animation: cb-slideUp 0.35s ease-out forwards; }
        .cb-float { animation: cb-float 3s ease-in-out infinite; }
        .cb-ring::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #4ade80, #22c55e, #15803d, #166534, #4ade80);
          animation: cb-spinRing 8s linear infinite;
          z-index: 0;
        }
        .cb-dot-pulse { animation: cb-pulseDot 2s ease-in-out infinite; }
        .cb-typing-dot { animation: cb-typingBounce 1.4s ease-in-out infinite; }
        .cb-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .cb-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        .cb-float-pulse { animation: cb-floatPulse 2s ease-in-out infinite; }
        .cb-glow-call { animation: cb-glowCall 2s ease-in-out infinite; }
        .cb-scroll::-webkit-scrollbar { width: 5px; }
        .cb-scroll::-webkit-scrollbar-track { background: transparent; }
        .cb-scroll::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 10px; }
        .cb-scroll::-webkit-scrollbar-thumb:hover { background: #86efac; }
        .cb-svc-cards { -ms-overflow-style: none; scrollbar-width: none; }
        .cb-svc-cards::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ===== FLOAT BUTTON ===== */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-16 h-16 rounded-full bg-gradient-to-br from-green-800 via-green-700 to-green-600 text-white shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 flex items-center justify-center"
          aria-label="Open chat"
        >
          <span className="absolute inset-[-6px] rounded-full bg-green-400/20 cb-float-pulse"></span>
          <span className="absolute inset-[-3px] rounded-full bg-gradient-to-br from-green-400/30 to-green-600/30 blur-sm"></span>
          <span className="relative text-3xl cb-float drop-shadow-md">🌲</span>
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-md">1</span>
        </button>
      )}

      {/* ===== CHAT WINDOW ===== */}
      {isOpen && (
        <div className="cb-open rounded-[28px] shadow-2xl w-[370px] sm:w-[400px] flex flex-col overflow-hidden ring-1 ring-black/5 bg-[#f8faf5]" style={{ height: '620px', maxHeight: '88vh' }}>

          {/* ===== HEADER ===== */}
          <div className="bg-gradient-to-br from-[#1a3a1a] via-[#2d5a27] to-[#1e4d1e] px-5 py-4 flex justify-between items-center relative overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 C35 15 45 20 40 30 C35 40 25 35 20 40' stroke='white' fill='none' stroke-width='1'/%3E%3C/svg%3E")`, backgroundSize: '40px 40px'}}></div>
            <div className="absolute top-[-30px] right-[-20px] w-[120px] h-[120px] bg-green-400/10 rounded-full blur-2xl"></div>

            <div className="flex items-center gap-3.5 z-10">
              <div className="cb-ring relative w-[52px] h-[52px] flex items-center justify-center">
                <div className="relative w-[52px] h-[52px] rounded-full bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center border-[3px] border-[#1a3a1a] z-[1]">
                  <span className="text-[26px] drop-shadow-md">🌲</span>
                </div>
                <span className="absolute bottom-[2px] right-[2px] w-3 h-3 rounded-full bg-green-400 border-[2.5px] border-[#1a3a1a] z-[2] cb-dot-pulse"></span>
              </div>
              <div>
                <h3 className="font-extrabold text-[17px] text-white tracking-wide drop-shadow-md">Abdias</h3>
                <p className="text-[11.5px] text-green-300 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px]">🌿</span>
                  Tree Specialist &bull; Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 z-10">
              <button
                onClick={toggleCall}
                disabled={isConnecting}
                className={`relative px-4 py-2.5 rounded-full text-[12px] font-bold tracking-wide flex items-center gap-2 transition-all duration-300 overflow-hidden ${
                  isConnecting
                    ? 'bg-yellow-500 text-white cursor-wait'
                    : isCallActive
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-xl shadow-red-500/40 hover:scale-105'
                      : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white cb-glow-call hover:scale-105'
                }`}
              >
                {showRipple && <span className="absolute inset-0 rounded-full bg-white/30 animate-ping"></span>}
                {isCallActive && <span className="absolute inset-0 rounded-full bg-red-300/40 animate-pulse"></span>}
                <span className="relative z-10 flex items-center gap-2">
                  {isConnecting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Phone size={15} className={isCallActive ? 'animate-pulse' : ''} />
                  )}
                  {isConnecting ? 'Connecting...' : isCallActive ? 'End Call' : 'Voice Call'}
                </span>
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white hover:bg-white/15 p-2 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ===== TREE BANNER ===== */}
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 px-5 py-2.5 flex items-center gap-3 border-b border-green-200 shrink-0">
            <span className="text-base">🌳</span>
            <span className="text-[11.5px] text-green-800 font-semibold flex-1">Licensed, Trained & Insured since 1997</span>
            <span className="bg-green-800 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">5-STAR</span>
          </div>

          {/* ===== MESSAGES ===== */}
          <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4 bg-gradient-to-b from-green-50/60 via-[#fafff8] to-white relative cb-scroll">
            <div className="absolute bottom-5 right-5 w-[180px] h-[180px] pointer-events-none opacity-[0.04]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='100' cy='100' r='20' stroke='%2322c55e' stroke-width='1' fill='none'/%3E%3Ccircle cx='100' cy='100' r='45' stroke='%2322c55e' stroke-width='1' fill='none'/%3E%3Ccircle cx='100' cy='100' r='70' stroke='%2322c55e' stroke-width='1' fill='none'/%3E%3Ccircle cx='100' cy='100' r='95' stroke='%2322c55e' stroke-width='1' fill='none'/%3E%3C/svg%3E")`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat'}}></div>

            {/* Day Divider */}
            <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
              <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></span>
              <span>Today</span>
              <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 border-[1.5px] border-green-300 flex items-center justify-center flex-shrink-0 shadow-sm self-end">
                    <span className="text-sm">🌲</span>
                  </div>
                )}

                <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[270px] px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-green-800 to-green-700 text-white rounded-[20px] rounded-br-[6px] shadow-md shadow-green-800/20'
                        : 'bg-white text-gray-800 rounded-[20px] rounded-bl-[6px] shadow-sm border border-gray-100/80'
                    }`}
                  >
                    {msg.text}
                    {msg.isImage && (
                      <div className="mt-2 flex items-center gap-2 bg-white/20 p-2 rounded-lg text-xs">
                        <ImageIcon size={14} />
                        <span>Image attached</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1.5">{msg.timestamp}</span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm self-end">
                    <User size={15} className="text-gray-500" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 border-[1.5px] border-green-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-sm">🌲</span>
                </div>
                <div className="bg-white px-5 py-3.5 rounded-[20px] rounded-bl-[6px] border border-gray-100 shadow-sm flex gap-[6px] items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full cb-typing-dot"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full cb-typing-dot"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full cb-typing-dot"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ===== CONTACT FORM OVERLAY ===== */}
          {showContactForm && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col justify-center p-7 rounded-[28px]">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg text-green-800 flex items-center gap-2">
                  <span>🌿</span> Contact Details
                </h3>
                <button onClick={() => setShowContactForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm bg-green-50/50"
                    value={contactForm.name}
                    onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full p-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm bg-green-50/50"
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    required
                    className="w-full p-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm bg-green-50/50"
                    value={contactForm.phone}
                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full bg-gradient-to-r from-green-700 to-green-600 text-white p-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSendingEmail ? (
                    <><Loader size={18} className="animate-spin" /> Sending...</>
                  ) : (
                    <><Send size={18} /> Submit Request</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ===== SERVICE CARDS ===== */}
          {showQuickReplies && !isTyping && !showContactForm && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto cb-svc-cards shrink-0 bg-white/60">
              {serviceCards.map((svc, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(svc.label)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-[1.5px] ${svc.border} ${svc.bg} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm">
                    {svc.icon}
                  </div>
                  <span className="text-[12px] font-bold text-green-800 whitespace-nowrap">{svc.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ===== INPUT ===== */}
          <form onSubmit={(e) => handleSendMessage(e)} className="px-4 py-3.5 bg-white border-t border-gray-100 shrink-0">
            <div className="flex gap-2 items-center bg-green-50 border-2 border-green-200 rounded-full px-2 py-1 focus-within:border-green-500 focus-within:shadow-[0_0_0_4px_rgba(34,197,94,0.1)] transition-all">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-gray-400 hover:text-green-700 transition-colors rounded-full hover:bg-green-100/50"
              >
                <Paperclip size={18} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about tree services..."
                className="flex-1 bg-transparent px-1 text-[13.5px] focus:outline-none text-gray-800 placeholder:text-gray-400 font-medium"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-11 h-11 rounded-full bg-gradient-to-br from-green-800 to-green-600 hover:from-green-900 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-green-800/25 transform active:scale-90 flex items-center justify-center flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </form>

          {/* ===== FOOTER ===== */}
          <div className="px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100 flex justify-between items-center shrink-0">
            <div>
              <p className="text-[9px] text-gray-500 font-semibold tracking-[1.2px] uppercase">Call for more info</p>
              <a href="tel:812-457-3433" className="text-[14px] font-extrabold text-green-800 flex items-center gap-1.5 hover:text-green-700 transition-colors mt-0.5">
                <span className="w-6 h-6 rounded-full bg-green-800 text-white flex items-center justify-center shadow-md shadow-green-800/25">
                  <Phone size={12} />
                </span>
                812-457-3433
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold">
              <span className="text-base">🌲</span>
              American Tree Experts
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Chatbot;
