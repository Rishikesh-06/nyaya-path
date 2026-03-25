import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/studentCommunityApi';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Custom hook to fetch user's own profile 
export const useMyProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['myProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });
};

export const usePosts = () => {
  return useQuery({
    queryKey: ['student_posts'],
    queryFn: api.fetchPosts,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: ({ content, postType }: { content: string, postType: string }) => 
      api.createPost(user!.id, content, postType),
    onMutate: async (newPost) => {
      await queryClient.cancelQueries({ queryKey: ['student_posts'] });
      
      const previousPosts = queryClient.getQueryData(['student_posts']);
      
      queryClient.setQueryData(['student_posts'], (old: any) => {
        const optimisticPost = {
          id: `temp-${Date.now()}`,
          author_id: user?.id,
          content: newPost.content,
          post_type: newPost.postType,
          likes_count: 0,
          comments_count: 0,
          created_at: new Date().toISOString(),
          users: {
            full_name: 'You', // Optimistic name
            university: '',
            year_of_study: '',
            city: '',
            specialization: ''
          }
        };
        return [optimisticPost, ...(old || [])];
      });
      
      return { previousPosts };
    },
    onError: (err: any, newPost, context) => {
      console.error("Failed to create post mutation:", err);
      toast.error(err.message || 'Failed to create post');
      queryClient.setQueryData(['student_posts'], context?.previousPosts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['student_posts'] });
    },
  });
};

export const useLikedPosts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['liked_posts', userId],
    queryFn: () => api.getLikedPosts(userId!),
    enabled: !!userId,
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.toggleLikePost(data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['liked_posts', variables.userId] });
      await queryClient.cancelQueries({ queryKey: ['student_posts'] });
      
      const previousLiked = queryClient.getQueryData(['liked_posts', variables.userId]) as string[];
      const previousPosts = queryClient.getQueryData(['student_posts']) as any[];
      
      queryClient.setQueryData(['liked_posts', variables.userId], (old: any) => {
        const oldLiked = old || [];
        if (variables.isLiked) {
          return oldLiked.filter((id: string) => id !== variables.postId);
        } else {
          return [...oldLiked, variables.postId];
        }
      });
      
      queryClient.setQueryData(['student_posts'], (old: any) => {
        if (!old) return old;
        return old.map((post: any) => {
          if (post.id === variables.postId) {
            return {
              ...post,
              likes_count: variables.isLiked 
                ? Math.max(0, post.likes_count - 1) 
                : post.likes_count + 1
            };
          }
          return post;
        });
      });
      
      return { previousLiked, previousPosts, userId: variables.userId };
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['liked_posts', context.userId], context.previousLiked);
      queryClient.setQueryData(['student_posts'], context.previousPosts);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['liked_posts', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['student_posts'] });
    },
  });
};

export const useStudents = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['students', userId],
    queryFn: () => api.fetchStudents(userId!),
    enabled: !!userId,
  });
};

export const useConnections = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['connections', userId],
    queryFn: () => api.fetchConnections(userId!),
    enabled: !!userId,
  });
};

export const useRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['requests', userId],
    queryFn: () => api.fetchRequests(userId!),
    enabled: !!userId,
  });
};

export const useNotifications = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => api.fetchNotifications(userId!),
    enabled: !!userId,
  });
};

// Post Comments
export const useComments = (postId: string) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => api.fetchComments(postId),
    enabled: !!postId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.addComment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
    }
  });
};
