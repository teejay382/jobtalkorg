import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  file_url?: string;
}

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
}

export const useChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string[] }>({});

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (!error && data) {
      setConversations(data);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(prev => ({
        ...prev,
        [conversationId]: data
      }));
    }
  };

  // Send message
  const sendMessage = async (conversationId: string, content: string, fileUrl?: string) => {
    if (!user || !content.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        file_url: fileUrl
      });

    if (!error) {
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    return { error };
  };

  // Create or get conversation
  const createOrGetConversation = async (otherUserId: string) => {
    if (!user) return null;

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
      .single();

    if (existing) {
      return existing;
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant_1: user.id,
        participant_2: otherUserId
      })
      .select()
      .single();

    return error ? null : data;
  };

  // Send typing indicator
  const sendTypingIndicator = (conversationId: string, isTyping: boolean) => {
    if (!user) return;

    const channel = supabase.channel(`conversation:${conversationId}`);
    
    if (isTyping) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user.id, typing: true }
      });
    } else {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user.id, typing: false }
      });
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messageChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => ({
            ...prev,
            [newMessage.conversation_id]: [
              ...(prev[newMessage.conversation_id] || []),
              newMessage
            ]
          }));
        }
      )
      .subscribe();

    // Subscribe to conversation updates
    const conversationChannel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(conversationChannel);
    };
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchConversations().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    conversations,
    messages,
    loading,
    typingUsers,
    fetchMessages,
    sendMessage,
    createOrGetConversation,
    sendTypingIndicator
  };
};