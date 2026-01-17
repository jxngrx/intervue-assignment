import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useUser } from '../../context/UserContext';

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface ChatMessage {
  id: string;
  studentId: string;
  name: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

export const ChatWidget = ({ isOpen, onToggle }: ChatWidgetProps) => {
  const { socket, isConnected } = useSocket();
  const { studentId, studentName } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen to chat messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleChatMessage = (data: { studentId: string; name: string; message: string; timestamp: Date }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + Math.random(),
          studentId: data.studentId,
          name: data.name,
          message: data.message,
          timestamp: new Date(data.timestamp),
          isOwn: data.studentId === studentId,
        },
      ]);
    };

    socket.on('chat:message', handleChatMessage);

    return () => {
      socket.off('chat:message', handleChatMessage);
    };
  }, [socket, isConnected, studentId]);

  const handleSend = () => {
    if (!inputValue.trim() || !socket || !isConnected || !studentId || !studentName) return;

    socket.emit('chat:send', {
      studentId,
      name: studentName,
      message: inputValue.trim(),
    });
    setInputValue('');
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <span className="material-icons">chat_bubble_outline</span>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-light">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-light">
            <h3 className="font-semibold text-gray-dark">Chat</h3>
            <button
              onClick={onToggle}
              className="text-gray-dark hover:text-gray-600"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">No messages yet</p>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-lg ${
                        msg.isOwn
                          ? 'bg-primary text-white'
                          : 'bg-gray-light text-gray-dark'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1">{msg.name}</p>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-light">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <span className="material-icons text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
