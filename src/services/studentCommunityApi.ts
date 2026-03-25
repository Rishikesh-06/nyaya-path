import { supabase } from '@/integrations/supabase/client';

export interface StudentPost {
  id: string;
  author_id: string;
  content: string;
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  users: {
    full_name: string;
    university: string;
    year_of_study: number;
    city: string;
    specialization: string;
  };
}

export const fetchPosts = async (): Promise<StudentPost[]> => {
  const { data, error } = await supabase
    .from('student_posts')
    .select(`*, users:author_id(full_name, university, year_of_study, city, specialization)`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as any as StudentPost[]; // Bypass type constraints since we are missing types.ts updates
};

export const createPost = async (authorId: string, content: string, postType: string) => {
  const { data, error } = await supabase.from('student_posts').insert({
    author_id: authorId,
    content: content.trim(),
    post_type: postType,
  }).select().single();

  if (error) throw error;
  return data;
};

export const getLikedPosts = async (userId: string) => {
  if (!userId) return [];
  const { data, error } = await supabase.from('student_post_likes').select('post_id').eq('user_id', userId);
  if (error) throw error;
  return data.map(l => l.post_id);
};

export const toggleLikePost = async ({ postId, userId, authorId, myProfile, isLiked, currentLikesCount }: any) => {
  if (isLiked) {
    await supabase.from('student_post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    await supabase.from('student_posts').update({ likes_count: Math.max(0, currentLikesCount - 1) }).eq('id', postId);
  } else {
    await supabase.from('student_post_likes').insert({ post_id: postId, user_id: userId });
    await supabase.from('student_posts').update({ likes_count: currentLikesCount + 1 }).eq('id', postId);
    
    // Add notification if it's not our own post
    if (authorId !== userId) {
      await supabase.from('student_notifications').insert({
        user_id: authorId, 
        type: 'post_like', 
        from_user_id: userId,
        from_user_name: myProfile?.full_name || 'A student',
        from_user_college: myProfile?.university || '', 
        post_id: postId,
      });
    }
  }
};

export const fetchStudents = async (userId: string) => {
  if (!userId) return [];
  const { data, error } = await supabase.from('users').select('*').eq('role', 'student').neq('id', userId).limit(100);
  if (error) throw error;
  return data;
};

export const fetchConnections = async (userId: string) => {
  if (!userId) return { accepted: [], pending: [] };
  const { data: accepted, error: err1 } = await supabase
    .from('student_connections')
    .select('*')
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'accepted');
  
  if (err1) throw err1;

  const { data: pending, error: err2 } = await supabase
    .from('student_connections')
    .select('receiver_id')
    .eq('requester_id', userId)
    .eq('status', 'pending');

  if (err2) throw err2;

  return {
    accepted: accepted || [],
    pending: pending ? pending.map(p => p.receiver_id) : []
  };
};

export const fetchRequests = async (userId: string) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('student_connections')
    .select(`*, users:requester_id(full_name, university, year_of_study, city)`)
    .eq('receiver_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
  return data;
};

export const sendConnectionRequest = async ({ userId, studentId, myProfile }: any) => {
  const { error } = await supabase.from('student_connections').insert({ requester_id: userId, receiver_id: studentId, status: 'pending' });
  if (error) throw error;
  
  await supabase.from('student_notifications').insert({
    user_id: studentId, 
    type: 'connection_request', 
    from_user_id: userId,
    from_user_name: myProfile?.full_name || 'A student',
    from_user_college: myProfile?.university || '',
  });
};

export const acceptRequest = async ({ requestId, requesterId, userId, myProfile }: any) => {
  const { error } = await supabase.from('student_connections').update({ status: 'accepted' }).eq('id', requestId);
  if (error) throw error;

  await supabase.from('student_notifications').insert({
    user_id: requesterId, 
    type: 'connection_accepted', 
    from_user_id: userId,
    from_user_name: myProfile?.full_name || 'A student',
  });
};

export const rejectRequest = async (requestId: string) => {
  const { error } = await supabase.from('student_connections').update({ status: 'rejected' }).eq('id', requestId);
  if (error) throw error;
};

export const fetchNotifications = async (userId: string) => {
  if (!userId) return { notifications: [], unreadCount: 0 };
  const { data, error } = await supabase
    .from('student_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  
  return {
    notifications: data || [],
    unreadCount: data ? data.filter(n => !n.read).length : 0
  };
};

export const markNotificationsRead = async (userId: string) => {
  if (!userId) return;
  const { error } = await supabase.from('student_notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  if (error) throw error;
};

export const fetchComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('student_post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const addComment = async ({ postId, userId, content, myProfile, authorId }: any) => {
  const { error } = await supabase.from('student_post_comments').insert({
    post_id: postId,
    author_id: userId,
    author_name: myProfile?.full_name || 'Student',
    author_college: myProfile?.university || '',
    content: content.trim(),
  });
  if (error) throw error;

  if (authorId !== userId) {
    await supabase.from('student_notifications').insert({
      user_id: authorId,
      type: 'post_comment',
      from_user_id: userId,
      from_user_name: myProfile?.full_name || 'A student',
      from_user_college: myProfile?.university || '',
      post_id: postId,
    });
  }
};
