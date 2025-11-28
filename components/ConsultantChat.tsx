import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Ruler, MessageSquare } from 'lucide-react';
import { ChatMessage, ConsultantType, UserProfile } from '../types';
import { getConsultantResponse } from '../services/geminiService';

interface ConsultantChatProps {
  consultantType: ConsultantType;
  setConsultantType: (type: ConsultantType) => void;
  userProfile: UserProfile | null;
}

export const ConsultantChat: React.FC<ConsultantChatProps> = ({ 
  consultantType, 
  setConsultantType,
  userProfile
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize Greeting based on profile if available
  useEffect(() => {
    let greeting = `Hello. I am your personal ${consultantType}. How can I assist with your wardrobe today?`;
    if (userProfile) {
        if (consultantType === ConsultantType.STYLE) {
            greeting = `Hello. I see you have a ${userProfile.styleProfile.toLowerCase()} vibe. I've curated some pieces that fit your style. How can I help you refine your look?`;
        } else {
            greeting = `Hello. Based on your profile, I can help ensure the perfect fit for your ${userProfile.fitNotes.toLowerCase()}. What items are you interested in?`;
        }
    }

    setMessages([{
        id: 'welcome',
        role: 'model',
        text: greeting,
        timestamp: new Date()
    }]);
  }, [consultantType, userProfile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
        const history = messages.map(m => ({ role: m.role, text: m.text }));
        const responseText = await getConsultantResponse(history, input, consultantType, userProfile);
        
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        console.error(error);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "I apologize, I'm having trouble connecting to my style database momentarily.",
            timestamp: new Date()
        }]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800">
      {/* Header / Toggle */}
      <div className="p-4 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between">
        <h3 className="text-sm font-serif text-accent tracking-widest uppercase">Consultation</h3>
        <div className="flex bg-neutral-900 rounded-full p-1 border border-neutral-700">
            <button 
                onClick={() => setConsultantType(ConsultantType.STYLE)}
                className={`p-2 rounded-full transition-colors ${consultantType === ConsultantType.STYLE ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                title="Style Consultant"
            >
                <Sparkles size={16} />
            </button>
            <button 
                onClick={() => setConsultantType(ConsultantType.FIT)}
                className={`p-2 rounded-full transition-colors ${consultantType === ConsultantType.FIT ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                title="Fit Specialist"
            >
                <Ruler size={16} />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${
                msg.role === 'user' 
                ? 'bg-neutral-700 text-white rounded-br-none' 
                : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-none'
            }`}>
                {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
             <div className="flex justify-start">
             <div className="bg-neutral-800 p-3 rounded-lg rounded-bl-none border border-neutral-700">
                 <div className="flex space-x-1">
                     <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                     <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                     <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-neutral-800 border-t border-neutral-700">
        <div className="flex items-center gap-2">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Ask the ${consultantType}...`}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-accent"
            />
            <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-2 bg-accent text-black rounded-full hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
            >
                <Send size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};