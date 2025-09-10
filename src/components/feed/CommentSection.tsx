import { useState, useEffect, useCallback } from 'react';
import { Send, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import InfiniteScroll from 'react-infinite-scroll-component';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface CommentSectionProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
}

export const CommentSection = ({ videoId, isOpen, onClose, onCommentAdded }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const COMMENTS_PER_PAGE = 10;

  const fetchComments = useCallback(async (currentOffset = 0, append = false) => {
    if (!append) setLoading(true);
    try {
      console.log('[CommentSection] Fetching comments', { videoId, offset: currentOffset, limit: COMMENTS_PER_PAGE });

      const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + COMMENTS_PER_PAGE - 1);

      if (error) throw error;

      if (!data || data.length === 0) {
        if (!append) setComments([]);
        setHasMore(false);
        return;
      }

      // Batch fetch user profiles to avoid N+1 queries
      const userIds = data.map(comment => comment.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(profile => [profile.user_id, profile]) || []);

      const commentsWithUsers = data.map(comment => ({
        ...comment,
        user: profileMap.get(comment.user_id) || undefined
      }));

      if (append) {
        setComments(prev => [...prev, ...commentsWithUsers]);
      } else {
        setComments(commentsWithUsers);
      }

      setHasMore(data.length === COMMENTS_PER_PAGE);
      setOffset(currentOffset + data.length);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      if (!append) setLoading(false);
    }
  }, [videoId, toast, COMMENTS_PER_PAGE]);

  useEffect(() => {
    if (isOpen) {
      setComments([]);
      setOffset(0);
      setHasMore(true);
      fetchComments(0, false);
    }
  }, [isOpen, fetchComments]);

  const loadMoreComments = useCallback(() => {
    if (hasMore && !loading) {
      fetchComments(offset, true);
    }
  }, [hasMore, loading, offset, fetchComments]);

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    const commentContent = newComment.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update - add comment immediately to UI
    const tempComment = {
      id: tempId,
      content: commentContent,
      created_at: new Date().toISOString(),
      user_id: user.id,
      user: {
        full_name: user.user_metadata?.full_name,
        username: user.user_metadata?.username,
        avatar_url: user.user_metadata?.avatar_url
      }
    };
    
    setComments(prev => [...prev, tempComment]);
    setNewComment('');
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content: commentContent
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp comment with real one
      setComments(prev => 
        prev.map(comment => 
          comment.id === tempId 
            ? { ...data, user: tempComment.user }
            : comment
        )
      );

      // Update video comments count
      await supabase
        .from('videos')
        .update({ 
          comments_count: comments.length + 1 
        })
        .eq('id', videoId);

      onCommentAdded();
      
    } catch (error) {
      console.error('Error adding comment:', error);
      // Remove temp comment on error
      setComments(prev => prev.filter(comment => comment.id !== tempId));
      setNewComment(commentContent); // Restore comment text
      
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto bg-background rounded-t-3xl md:rounded-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg">Comments</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Comments List */}
        <div id="comments-scrollable-div" className="flex-1 overflow-auto p-4">
          {loading && comments.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={comments.length}
              next={loadMoreComments}
              hasMore={hasMore}
              loader={
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              }
              scrollableTarget="comments-scrollable-div"
              endMessage={
                <p className="text-center text-muted-foreground text-sm py-4">
                  No more comments to load
                </p>
              }
            >
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={comment.user?.avatar_url} />
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {(comment.user?.full_name || comment.user?.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {comment.user?.full_name || comment.user?.username || 'Anonymous'}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </InfiniteScroll>
          )}
        </div>

        {/* Comment Input - Fixed at bottom */}
        <div className="mt-auto bg-background border-t border-border">
          {user ? (
            <div className="p-4">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-white text-xs">
                    {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !submitting && handleSubmitComment()}
                    className="flex-1 border-input focus:ring-2 focus:ring-primary"
                    disabled={submitting}
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                    size="sm"
                    className="px-3 bg-primary hover:bg-primary/90"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => window.location.href = '/login'}
              >
                Sign in to comment
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};