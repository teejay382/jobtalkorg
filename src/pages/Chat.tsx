import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

const Chat = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { user } = useAuth();
  const { conversations, loading } = useChat();

  // Mock function to get user profile (replace with actual profile fetch)
  const getUserProfile = async (userId: string) => {
    // This should fetch from profiles table
    return {
      id: userId,
      username: 'User',
      avatar_url: null
    };
  };

  const handleConversationClick = async (conversation: any) => {
    setSelectedConversation(conversation.id);
    
    // Get the other participant
    const otherUserId = conversation.participant_1 === user?.id 
      ? conversation.participant_2 
      : conversation.participant_1;
      
    const otherUser = await getUserProfile(otherUserId);
    setSelectedUser(otherUser);
  };

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
                    <AvatarFallback className="bg-primary text-white text-sm font-bold">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        User
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