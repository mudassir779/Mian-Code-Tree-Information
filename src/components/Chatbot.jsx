import React, { useState, useRef, useEffect } from 'react';
import {
  X, Send, User, TreePine,
  Paperclip, Phone, Volume2, VolumeX,
  Image as ImageIcon, Loader, CalendarDays, AlertTriangle, DollarSign
} from 'lucide-react';
import Vapi from '@vapi-ai/web';
import { sendTreeAnalysisEmail } from '../utils/emailService';

const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// FAQ Knowledge Base - Local responses based on client's Q&A content
const faqResponses = [
  // --- Greetings ---
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    response: "Hello! Thank you for reaching out to American Tree Experts. How can I help you today? Whether you need tree trimming, removal, stump grinding, or an emergency service — I'm here to assist!"
  },
  // --- Customer needs help with a tree ---
  {
    keywords: ['need help', 'help with a tree', 'tree on my property', 'worried', 'concerned about', 'problem with tree', 'issue with tree'],
    response: "Thank you for reaching out. I understand your concern. We can definitely help with that. Could you tell me a little more about the tree and its location? For example — what kind of tree is it, how tall, and is it near any structures or power lines?"
  },
  // --- Tree near power lines / leaning ---
  {
    keywords: ['power line', 'leaning', 'leaning over', 'touching wire', 'near wires', 'electrical', 'utility line'],
    response: "That's a serious safety concern and we handle these situations regularly. We'll need to take a closer look to determine the best course of action — we may need to trim the branches or remove the entire tree. We ensure safe work practices around power lines. Would you like to schedule a free assessment?"
  },
  // --- Tree species / details ---
  {
    keywords: ['oak', 'maple', 'pine', 'crepe myrtle', 'elm', 'ash', 'birch', 'willow', 'species', 'what kind', 'type of tree'],
    response: "Thanks for that detail! Knowing the tree species helps us plan the right approach. Different trees have different wood densities, growth patterns, and removal considerations. We'll assess it on-site to determine the best and safest method. Would you like to schedule a free visit?"
  },
  // --- Tree size ---
  {
    keywords: ['size', 'how tall', 'big tree', 'small tree', 'large tree', 'medium tree', 'feet', 'height', '20 feet', '30 feet', '60 feet'],
    response: "Tree size is an important factor in determining the approach and cost:\n\n🌱 Small trees (up to 30 ft): Easier to manage, lower cost\n🌳 Medium trees (30-60 ft): May need specialized equipment\n🌲 Large trees (over 60 ft): Require crane or advanced rigging\n\nWe'll need to take a closer look to give you the most accurate assessment. Want to schedule a free visit?"
  },
  // --- Pricing / Cost / How much ---
  {
    keywords: ['price', 'pricing', 'cost', 'how much', 'charge', 'rate', 'expensive', 'affordable', 'budget'],
    response: "We can give you a more accurate estimate once we've assessed the situation on-site. However, here are typical ranges based on complexity and tree size:\n\n🌿 Tree Trimming: $200 - $800\n🪓 Tree Removal: $500 - $2,000+\n🪵 Stump Grinding: $150 - $500\n\nWe offer FREE on-site assessments with no obligation. Would you like to schedule one?"
  },
  // --- Free estimate / quote ---
  {
    keywords: ['estimate', 'quote', 'free estimate', 'give me a quote', 'come out', 'assessment'],
    response: "Absolutely! We can schedule a time to come out and assess the situation. We'll discuss all the details of the job with you and provide a written quote — no obligation. Please share your address and a time that works for you, or call us at 812-457-3433!"
  },
  // --- Insurance ---
  {
    keywords: ['insurance', 'insured', 'covered', 'coverage', 'liability'],
    response: "Yes, we are fully insured! We carry comprehensive liability insurance and workers' compensation. Our insurance policy covers any damage to your property during the work. We also work with you throughout the entire process to ensure you're comfortable with everything."
  },
  // --- Certified arborists ---
  {
    keywords: ['certified', 'arborist', 'license', 'licensed', 'qualification', 'trained', 'experience', 'credentials'],
    response: "Yes! We have certified arborists on staff who are trained and experienced in working with all types of trees. We've been in business since 1997, and our team follows industry best practices and all required safety standards and certifications."
  },
  // --- Safety measures ---
  {
    keywords: ['safety', 'safe', 'precaution', 'safety measures', 'safety equipment', 'helmets', 'glasses'],
    response: "We take safety very seriously. All our crews are trained in safety procedures, and we use proper safety equipment including helmets, safety glasses, and gloves. We also take precautions to protect your property by using drop cloths and ensuring that no debris damages your fences or landscaping."
  },
  // --- Property protection during work ---
  {
    keywords: ['protect my property', 'property during', 'fence', 'landscaping', 'yard damage', 'lawn', 'driveway', 'debris', 'cleanup', 'clean up', 'drop cloth'],
    response: "We take extra precautions to protect your property. Our crews use drop cloths, careful rigging techniques, and controlled cutting methods to prevent any damage to your fences, landscaping, driveway, and structures. We also do a thorough cleanup after every job — your property will look great when we're done!"
  },
  // --- What if tree falls on house / something goes wrong ---
  {
    keywords: ['fall on house', 'fall on my', 'what if', 'goes wrong', 'something goes wrong', 'accident', 'damage my house', 'damage my property', 'what happens if'],
    response: "We understand your concerns completely. Our insurance policy covers any damage to your property during the work. We also have a policy of working with you throughout the entire process to ensure that you are comfortable with our work. Every job is carefully planned to minimize risks using controlled cutting and rigging techniques."
  },
  // --- Schedule appointment ---
  {
    keywords: ['schedule', 'appointment', 'book', 'visit', 'when', 'available', 'availability', 'time', 'come out and give'],
    response: "Sounds good! We'll need to know your address and a time that works for you. We can come out and assess the situation, discuss all the details, and provide a written quote. Please share your details or call us at 812-457-3433 to set it up!"
  },
  // --- Tree trimming / pruning ---
  {
    keywords: ['trim', 'trimming', 'prune', 'pruning', 'cut branches', 'shape', 'branches touching'],
    response: "We offer professional tree trimming and pruning services! Our certified arborists can trim branches that are interfering with power lines, your roof, or just improve the tree's shape and health. Pricing depends on tree size and complexity. Would you like to schedule a free on-site assessment?"
  },
  // --- Tree removal ---
  {
    keywords: ['remove', 'removal', 'take down', 'cut down', 'fell', 'get rid of'],
    response: "We provide safe and efficient tree removal services. Whether it's a hazardous tree, storm damage, or a construction project requiring tree removal — we handle it all. We may need to trim branches first or remove the entire tree depending on the situation. We'd love to come out and give you a free estimate!"
  },
  // --- Stump grinding ---
  {
    keywords: ['stump', 'stump grinding', 'stump removal', 'grind'],
    response: "Yes, we offer stump grinding and removal services! After a tree is removed, we can grind the stump below ground level so you can reclaim your yard. Pricing varies based on stump size. Want us to come take a look?"
  },
  // --- Emergency services ---
  {
    keywords: ['emergency', 'urgent', 'storm', 'fallen', 'dangerous', 'immediate', 'right away', 'asap'],
    response: "We understand emergencies can't wait! We offer 24/7 emergency tree services for storm damage, fallen trees, and hazardous situations. If this is an emergency, please call us immediately at 812-457-3433 for the fastest response. Safety is our top priority!"
  },
  // --- Tree health / disease ---
  {
    keywords: ['health', 'disease', 'sick', 'dying', 'dead tree', 'inspect', 'assessment', 'health check', 'condition', 'damaged', 'diseased'],
    response: "Our certified arborists can assess your tree's health and diagnose diseases or damage. We provide tree health assessments, disease treatment, and preventive care recommendations. Is the tree healthy, diseased, or showing signs of damage? Let us know and we'll recommend the best approach!"
  },
  // --- Dead / decaying branches ---
  {
    keywords: ['dead branch', 'decaying', 'falling branch', 'broken branch', 'hanging branch', 'dead limb', 'rotting', 'dead branches'],
    response: "Dead or decaying branches are a serious safety hazard — they can fall unexpectedly and damage property or injure someone. We recommend having them removed as soon as possible. Are you concerned about specific branches that could fall? Our arborists can assess and safely remove them. Call us at 812-457-3433 for quick scheduling!"
  },
  // --- All services overview ---
  {
    keywords: ['what service', 'what do you', 'services', 'offer', 'provide', 'do you do', 'what can you'],
    response: "We offer a full range of professional tree services:\n\n🌿 Tree Trimming & Pruning\n🪓 Tree Removal\n🪵 Stump Grinding & Removal\n🏥 Tree Health Assessments\n⚡ Emergency Tree Services (24/7)\n🌱 Tree Planting\n\nAll performed by certified, insured professionals since 1997. What service are you looking for?"
  },
  // --- Construction / land clearing ---
  {
    keywords: ['construction', 'building', 'renovation', 'land clearing', 'clear lot', 'new build', 'project'],
    response: "Planning a construction project that requires tree removal? We provide tree removal and land clearing services to prepare your site. We can selectively remove trees or clear entire lots depending on your project needs. Would you like a free site assessment?"
  },
  // --- Payment methods ---
  {
    keywords: ['payment', 'pay', 'cash', 'credit card', 'check', 'finance', 'how to pay', 'payment method', 'payment plan'],
    response: "We accept multiple payment methods for your convenience including cash, checks, and major credit cards. Payment terms are discussed when we provide your written quote. For larger projects, we can discuss payment arrangements. Feel free to ask about specifics when we visit!"
  },
  // --- Written quote / contract ---
  {
    keywords: ['written quote', 'written estimate', 'formal quote', 'detailed quote', 'paperwork', 'contract', 'agreement'],
    response: "After our free on-site assessment, we provide a detailed written quote that includes:\n\n📋 Detailed description of services\n💰 Breakdown of costs (labor, materials, equipment)\n📅 Project timeline\n💳 Payment terms and methods\n📄 Proof of insurance & licensing\n\nNo hidden fees — everything is transparent. Would you like to schedule an assessment?"
  },
  // --- Contact info ---
  {
    keywords: ['phone', 'call', 'contact', 'reach', 'number', 'talk', 'email'],
    response: "You can reach us at:\n\n📞 Phone: 812-457-3433\n📧 Email: Thetreexperts@gmail.com\n📍 Location: Evansville, IN\n\nWe'd love to hear from you!"
  },
  // --- Service area ---
  {
    keywords: ['service area', 'location', 'where', 'area', 'evansville', 'indiana', 'do you serve'],
    response: "We're based in Evansville, IN and serve the surrounding tri-state area. Call us at 812-457-3433 to confirm if we service your location!"
  },
  // --- Tree planting ---
  {
    keywords: ['plant', 'planting', 'new tree', 'grow'],
    response: "Yes, we offer tree planting services! Our arborists can help you choose the right tree species for your property and soil conditions, and ensure it's planted properly for healthy long-term growth. Would you like a consultation?"
  },
  // --- Number of trees ---
  {
    keywords: ['how many', 'multiple tree', 'several tree', 'few tree', 'number of tree', 'more than one'],
    response: "No problem! We handle jobs of all sizes — from a single tree to multiple trees on your property. The more details you can provide (number of trees, types, sizes, and locations), the more accurate our estimate will be. Would you like to schedule a free on-site assessment?"
  },
  // --- Branches on roof ---
  {
    keywords: ['roof', 'branches on roof', 'over my house', 'hanging over', 'touching my roof', 'above my house'],
    response: "Branches hanging over or touching your roof can cause serious damage, especially during storms. We can safely trim those branches back to protect your home. Our crews are experienced in working near structures with precision. Would you like us to come take a look?"
  },
  // --- Comfortable / ready to proceed ---
  {
    keywords: ['comfortable', 'ready', 'let\'s do it', 'go ahead', 'proceed', 'sounds good', 'let\'s schedule', 'i\'m in', 'okay let\'s'],
    response: "Sounds great! We'll need your address and a preferred time for us to come out and assess the situation. We'll discuss everything in detail and provide a written quote on the spot. Please share your details or call us at 812-457-3433!"
  },
  // --- Thank you ---
  {
    keywords: ['thank', 'thanks', 'appreciate'],
    response: "You're welcome! If you have any more questions, feel free to ask. You can also call us anytime at 812-457-3433. We look forward to helping you with your tree service needs! 🌳"
  },
];

const getLocalResponse = (message) => {
  const lower = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const faq of faqResponses) {
    let score = 0;
    for (const keyword of faq.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.split(' ').length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  if (bestMatch) return bestMatch.response;

  return "Thank you for your question! For detailed assistance, I'd recommend speaking with our team directly. Please call us at 812-457-3433 or share your contact details and we'll reach out to you. We're here to help with all your tree service needs!";
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled] = useState(false);
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
        text: "This is Abdias from American Tree Experts.\nHow may I assist you today?",
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

    const botMessageId = Date.now() + 1;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-10)
        })
      });

      if (!response.ok) throw new Error('API failed');

      setIsTyping(false);

      // Add empty bot message that will fill in real-time
      setMessages(prev => [...prev, {
        id: botMessageId,
        text: '',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageId
                      ? { ...msg, text: msg.text + parsed.content }
                      : msg
                  )
                );
              }
            } catch (parseErr) {
              // Skip invalid JSON chunks
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming failed, using local FAQ:', error);
      setIsTyping(false);

      // Fallback to local FAQ if API fails
      const responseText = getLocalResponse(textToSend);
      setMessages(prev => [...prev, {
        id: botMessageId,
        text: responseText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
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
      setShowQuickReplies(false);
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
              {!isCallActive && !isConnecting && (
                <button
                  onClick={toggleCall}
                  className="relative px-4 py-2.5 rounded-full text-[12px] font-bold tracking-wide flex items-center gap-2 transition-all duration-300 overflow-hidden bg-gradient-to-r from-emerald-500 to-green-500 text-white cb-glow-call hover:scale-105"
                >
                  {showRipple && <span className="absolute inset-0 rounded-full bg-white/30 animate-ping"></span>}
                  <span className="relative z-10 flex items-center gap-2">
                    <Phone size={15} />
                    Voice Call
                  </span>
                </button>
              )}

              {isConnecting && (
                <button
                  disabled
                  className="relative px-4 py-2.5 rounded-full text-[12px] font-bold tracking-wide flex items-center gap-2 bg-yellow-500 text-white cursor-wait"
                >
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connecting...
                </button>
              )}

              {isCallActive && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 rounded-full text-[11px] font-bold bg-green-500/20 text-green-300 flex items-center gap-1.5 border border-green-400/30">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Live Call
                  </span>
                  <button
                    onClick={toggleCall}
                    className="px-4 py-2.5 rounded-full text-[12px] font-bold flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/40 hover:scale-105 transition-all"
                  >
                    <Phone size={15} />
                    End Call
                  </button>
                </div>
              )}

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
