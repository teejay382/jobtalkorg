import { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

interface ChatRoomProps {
  conversationId: string;
  otherUser: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  onBack: () => void;
}

export const ChatRoom = ({ conversationId, otherUser, onBack }: ChatRoomProps) => {
  const { user } = useAuth();
  const { messages, sendMessage, fetchMessages, sendTypingIndicator } = useChat();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const conversationMessages = messages[conversationId] || [];

  // Fetch messages for this conversation
  useEffect(() => {
    fetchMessages(conversationId);
  }, [conversationId, fetchMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSendMessage = async () => {
    if (message.trim() && user) {
      await sendMessage(conversationId, message);
      setMessage('');
      
      // Stop typing indicator
      setIsTyping(false);
      sendTypingIndicator(conversationId, false);
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      sendTypingIndicator(conversationId, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(conversationId, false);
    }, 1000);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Chat header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-border shadow-soft z-40">
        <div className="flex items-center justify-between px-4 py-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              ←
            </button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser.avatar_url} />
              <AvatarFallback className="bg-primary text-white text-sm font-bold">
                {(otherUser.full_name || otherUser.username || 'U').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">{otherUser.full_name || otherUser.username || 'Anonymous'}</h2>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile?.account_type === 'employer' && (
              <button
                onClick={async () => {
                    try {
                      // Insert a hire record for this employer -> otherUser
                      const { error } = await supabase.from('hires').insert({
                        employer_id: user?.id,
                        freelancer_id: otherUser.id,
                        status: 'initiated',
                        created_at: new Date().toISOString()
                      } as any);

                      if (error) throw error;

                      toast({ title: 'Hire sent', description: 'A hire request was created.' });
                    } catch (err) {
                      console.error('Error creating hire:', err);
                      toast({ title: 'Error', description: 'Failed to create hire.' });
                    }
                }}
                className="px-3 py-1 rounded-md bg-primary text-white text-sm"
              >
                Hire
              </button>
            )}

            <button className="w-8 h-8 flex items-center justify-center text-muted-foreground">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 pt-20 pb-20 px-4 max-w-md mx-auto w-full">
        <div className="space-y-4">
          {conversationMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={msg.sender_id === user?.id ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender_id === user?.id ? 'text-white/70' : 'text-muted-foreground'
                }`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-40">
        <div className="flex gap-3 max-w-md mx-auto">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            size="sm"
            className="w-10 h-10 p-0 rounded-full"
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};