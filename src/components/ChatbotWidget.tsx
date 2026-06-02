import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Bot, CornerDownRight } from "lucide-react";

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Opa! Eu sou a Tainá, sua assistente do AmazFood. 😄 O que tu tá com vontade de comer hoje? Posso te sugerir uns locais show de bola aqui em Manaus!' }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.text || 'Opa, deu um delay aqui. Pode mandar de novo?' }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Ei meu amigo, me bati toda aqui com o sinal. Repete por favor!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 font-sans" id="chatbot_widget_container">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          id="open-chatbot-btn"
          onClick={() => setIsOpen(true)}
          className="bg-manaus-orange hover:bg-manaus-orange-hover text-white p-3.5 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 group relative"
        >
          <span className="absolute -top-1.5 -left-1 bg-white text-[8px] border font-bold text-manaus-orange px-1 rounded-full animate-bounce shadow">
            IA
          </span>
          <MessageSquare size={20} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out pl-0 group-hover:pl-2 text-[10px] font-bold text-white uppercase tracking-wider">
            Falar com a Tainá
          </span>
        </button>
      )}

      {/* Chat Window Box */}
      {isOpen && (
        <div className="bg-white rounded-2xl w-80 h-[380px] flex flex-col justify-between overflow-hidden shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200">
          
          {/* Header */}
          <div className="p-3 border-b border-slate-250 bg-[#0F172A] text-white flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 bg-manaus-orange rounded-full flex items-center justify-center text-lg shadow-inner">
                👩🏽‍💻
              </div>
              <div>
                <h4 className="text-[11px] font-bold leading-none flex items-center gap-1">
                  Tainá <Sparkles size={10} className="text-[#FF6B35] animate-pulse" />
                </h4>
                <p className="text-[8px] text-slate-400 font-mono tracking-tight pt-0.5">Sua Guia Manauara</p>
              </div>
            </div>
            <button 
              id="close-chatbot-btn"
              onClick={() => setIsOpen(false)} 
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto no-scrollbar space-y-2 bg-[#F8FAFC]">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`max-w-[85%] rounded-xl p-2.5 text-[10.5px] leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? "bg-manaus-orange text-white ml-auto rounded-tr-none" 
                    : "bg-white text-[#2D3748] border rounded-tl-none"
                }`}
              >
                {msg.sender === 'bot' && (
                  <span className="text-[7.5px] font-extrabold uppercase tracking-wide text-manaus-orange block mb-0.5 font-mono">
                    Tainá • AmazFood
                  </span>
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            ))}

            {isLoading && (
              <div className="bg-white border rounded-xl p-2.5 text-[10px] max-w-[85%] rounded-tl-none shadow-sm space-y-1 animate-pulse">
                <span className="text-[7.5px] font-semibold text-slate-400 block font-mono">IA digitando...</span>
                <div className="h-1 bg-slate-200 rounded w-5/6"></div>
                <div className="h-1 bg-slate-200 rounded w-1/2"></div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chip options */}
          <div className="px-3 py-1 bg-[#EEF2F6] border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button 
              onClick={() => setInputText("Quero tambaqui assado")}
              className="bg-white hover:bg-slate-100 text-[8.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 text-slate-600"
            >
              🐠 Tambaqui
            </button>
            <button 
              onClick={() => setInputText("X-Caboquinho barato")}
              className="bg-white hover:bg-slate-100 text-[8.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 text-slate-600"
            >
              🍔 X-Caboquinho
            </button>
            <button 
              onClick={() => setInputText("Açaí no Centro")}
              className="bg-white hover:bg-slate-100 text-[8.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 text-slate-600"
            >
              🍇 Açaí Centro
            </button>
          </div>

          {/* Sender Input form */}
          <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-200 bg-white flex gap-1.5 shrink-0">
            <input
              type="text"
              placeholder="Pergunte por comidas, bairros..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-[10.5px] border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-manaus-orange"
              required
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="bg-[#0F172A] hover:bg-slate-800 disabled:opacity-40 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send size={11} />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
