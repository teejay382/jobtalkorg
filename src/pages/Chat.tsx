import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Chat = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { conversations, loading, createOrGetConversation } = useChat();
  const [participantNames, setParticipantNames] = useState<Record<string, { display: string; avatar_url?: string }>>({});

  // Actual function to get user profile from profiles table
  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, role, account_type, company_name')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        console.warn('Profile not found:', error);
      return {
        id: userId,
        username: `User ${userId.slice(0, 8)}`,
        full_name: undefined,
        avatar_url: null
      };
      }
      
      return {
        id: data.user_id,
        username: data.username || data.full_name || `User ${userId.slice(0, 8)}`,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        role: data.role || data.account_type,
        account_type: data.account_type,
        company_name: data.company_name
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return {
        id: userId,
        username: `User ${userId.slice(0, 8)}`,
        full_name: undefined,
        avatar_url: null
      };
    }
  };

  // Handle URL parameter for starting new conversation
  useEffect(() => {
    const otherUserId = searchParams.get('user');
    if (otherUserId && user && otherUserId !== user.id) {
      const startConversation = async () => {
        try {
          const conversation = await createOrGetConversation(otherUserId);
          if (conversation) {
            setSelectedConversation(conversation.id);
            const otherUser = await getUserProfile(otherUserId);
            setSelectedUser(otherUser);
          }
        } catch (error) {
          console.error('Error starting conversation:', error);
        }
      };
      startConversation();
    }
  }, [searchParams, user, createOrGetConversation]);

  const handleConversationClick = async (conversation: any) => {
    setSelectedConversation(conversation.id);
    
    // Get the other participant
    const otherUserId = conversation.participant_1 === user?.id 
      ? conversation.participant_2 
      : conversation.participant_1;
      
    const otherUser = await getUserProfile(otherUserId);
    setSelectedUser(otherUser);
  };

  // Populate names for conversation list
  useEffect(() => {
    const loadNames = async () => {
      if (!user || conversations.length === 0) return;
      const updates: Record<string, { display: string; avatar_url?: string }> = {};
      await Promise.all(
        conversations.map(async (conv) => {
          const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
          if (!participantNames[otherUserId]) {
            const prof = await getUserProfile(otherUserId);
            updates[otherUserId] = {
              display: prof.full_name || prof.username || `User ${otherUserId.slice(0, 8)}`,
              avatar_url: prof.avatar_url || undefined,
            };
          }
        })
      );
      if (Object.keys(updates).length > 0) {
        setParticipantNames((prev) => ({ ...prev, ...updates }));
      }
    };
    loadNames();
  }, [conversations, user]);

  const handleBack = () => {
    setSelectedConversation(null);
    setSelectedUser(null);
  };

  if (selectedConversation && selectedUser) {
    return (
      <ChatRoom
        conversationId={selectedConversation}
        otherUser={selectedUser}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-20 px-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Conversations list */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start chatting by messaging someone!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleConversationClick(conv)}
                className="w-full bg-card rounded-xl p-4 shadow-soft border border-border hover:shadow-medium transition-shadow text-left"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={participantNames[(conv.participant_1 === user?.id ? conv.participant_2 : conv.participant_1)]?.avatar_url} />
                    <AvatarFallback className="bg-primary text-white text-sm font-bold">
                      {(participantNames[(conv.participant_1 === user?.id ? conv.participant_2 : conv.participant_1)]?.display || 'U').substring(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {participantNames[(conv.participant_1 === user?.id ? conv.participant_2 : conv.participant_1)]?.display || 'User'}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate pr-2">
                        Tap to start chatting
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Chat;