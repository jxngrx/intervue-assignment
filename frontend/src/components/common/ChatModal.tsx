import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  studentId: string;
  name: string;
  message: string;
  timestamp: Date;
}

interface Participant {
  studentId: string;
  name: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  chatMessages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendChat: () => void;
  onKickOut: (studentId: string) => void;
}

export const ChatModal = ({
  isOpen,
  onClose,
  participants,
  chatMessages,
  chatInput,
  onChatInputChange,
  onSendChat,
  onKickOut,
}: ChatModalProps) => {
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (!showParticipants) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showParticipants]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-light">
            <h3 className="font-semibold text-lg text-gray-dark">Chat & Participants</h3>
            <button
              onClick={onClose}
              className="text-gray-dark hover:text-gray-600 transition-colors"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-light">
            <button
              onClick={() => setShowParticipants(false)}
              className={`flex-1 py-4 text-sm font-semibold transition-colors border-b-2 ${
                !showParticipants
                  ? 'text-primary border-primary'
                  : 'text-gray-500 border-transparent hover:text-primary'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setShowParticipants(true)}
              className={`flex-1 py-4 text-sm font-semibold transition-colors border-b-2 ${
                showParticipants
                  ? 'text-primary border-primary'
                  : 'text-gray-500 border-transparent hover:text-primary'
              }`}
            >
              Participants ({participants.length})
            </button>
          </div>

          {/* Content */}
          {showParticipants ? (
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 px-6 py-3 bg-gray-light text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <span>Name</span>
                <span className="text-right">Action</span>
              </div>
              <div className="space-y-1">
                {participants.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No participants yet</p>
                ) : (
                  participants.map((participant) => (
                    <div
                      key={participant.studentId}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-light transition-colors"
                    >
                      <span className="font-medium text-sm">{participant.name}</span>
                      <button
                        onClick={() => onKickOut(participant.studentId)}
                        className="text-xs font-bold text-sky-500 hover:text-sky-600 underline"
                      >
                        Kick out
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No messages yet</p>
                ) : (
                  <>
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.studentId === 'teacher' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-lg ${
                            msg.studentId === 'teacher'
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
              <div className="p-4 border-t border-gray-light">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => onChatInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && onSendChat()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-gray-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={onSendChat}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <span className="material-icons text-sm">send</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
