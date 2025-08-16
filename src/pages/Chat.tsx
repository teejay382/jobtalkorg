import { useState } from 'react';
import { Send, Search, MoreVertical } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const conversations = [
    {
      id: '1',
      name: 'TechCorp',
      lastMessage: 'Thanks for your application! We\'d love to schedule an interview.',
      timestamp: '2 min ago',
      unread: 2,
      isEmployer: true,
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      lastMessage: 'Hey! Saw your React video, really impressive work.',
      timestamp: '1 hour ago',
      unread: 0,
      isEmployer: false,
    },
    {
      id: '3',
      name: 'StartupXYZ',
      lastMessage: 'Are you available for a quick call tomorrow?',
      timestamp: '3 hours ago',
      unread: 1,
      isEmployer: true,
    },
  ];

  const currentChatMessages = [
    {
      id: '1',
      sender: 'TechCorp',
      message: 'Hi Sarah! We saw your video showcasing your React skills.',
      timestamp: '10:30 AM',
      isOwn: false,
    },
    {
      id: '2',
      sender: 'You',
      message: 'Thank you for reaching out! I\'m very interested in learning more about the position.',
      timestamp: '10:32 AM',
      isOwn: true,
    },
    {
      id: '3',
      sender: 'TechCorp',
      message: 'Great! We have a senior React developer position that seems perfect for your background. Would you be interested in a brief interview?',
      timestamp: '10:35 AM',
      isOwn: false,
    },
    {
      id: '4',
      sender: 'You',
      message: 'Absolutely! I\'d love to discuss the opportunity.',
      timestamp: '10:36 AM',
      isOwn: true,
    },
    {
      id: '5',
      sender: 'TechCorp',
      message: 'Thanks for your application! We\'d love to schedule an interview.',
      timestamp: '10:40 AM',
      isOwn: false,
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Mock sending message
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  if (selectedChat) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Chat header */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-border shadow-soft z-40">
          <div className="flex items-center justify-between px-4 py-4 max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ←
              </button>
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-white text-sm font-bold">
                  TC
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-foreground">TechCorp</h2>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <button className="w-8 h-8 flex items-center justify-center text-muted-foreground">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 pt-20 pb-20 px-4 max-w-md mx-auto w-full">
          <div className="space-y-4">
            {currentChatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={msg.isOwn ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message input */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-40">
          <div className="flex gap-3 max-w-md mx-auto">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedChat(conv.id)}
              className="w-full bg-card rounded-xl p-4 shadow-soft border border-border hover:shadow-medium transition-shadow text-left"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className={`text-white text-sm font-bold ${
                    conv.isEmployer ? 'bg-primary' : 'bg-accent'
                  }`}>
                    {conv.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {conv.name}
                      {conv.isEmployer && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Employer
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate pr-2">
                      {conv.lastMessage}
                    </p>
                    {conv.unread > 0 && (
                      <span className="bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Chat;