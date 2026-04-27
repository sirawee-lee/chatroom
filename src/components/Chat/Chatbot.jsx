import React, { useState, useRef, useEffect } from 'react';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export default function Chatbot({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: '👋 Hi! I\'m your AI assistant powered by Gemini. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const history = useRef([]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    history.current.push({ role: 'user', parts: [{ text: userText }] });

    if (!GEMINI_KEY) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: 'Please set VITE_GEMINI_API_KEY in your .env file to enable the AI chatbot.',
        }]);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: history.current,
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const candidate = data.candidates?.[0];
      const reply = candidate?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
      history.current.push({ role: 'model', parts: [{ text: reply }] });
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="chatbot-panel">
      <div className="chatbot-header">
        <h3>🤖 AI Assistant</h3>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      <div className="chatbot-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chatbot-msg ${m.role}`}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="chatbot-msg bot" style={{ display: 'flex', gap: 4 }}>
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chatbot-input-row">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything…"
          rows={1}
          disabled={loading}
        />
        <button className="btn-send" onClick={send} disabled={!input.trim() || loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
