import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useQueryClient } from '@tanstack/react-query';
import { 
  usePosts, 
  useCreatePost, 
  useToggleLike, 
  useLikedPosts,
  useStudents,
  useConnections,
  useRequests,
  useNotifications,
  useMyProfile,
  useComments,
  useAddComment
} from '@/hooks/useStudentCommunity';
import { 
  sendConnectionRequest, 
  acceptRequest, 
  rejectRequest, 
  markNotificationsRead 
} from '@/services/studentCommunityApi';
import { toast } from 'sonner';

type Tab = 'feed' | 'network' | 'requests' | 'notifications' | 'trending';

const POST_TYPES: Record<string, { icon: string; label: string; color: string }> = {
  update: { icon: '📢', label: 'Update', color: '#60a5fa' },
  achievement: { icon: '🏆', label: 'Achievement', color: '#c9a227' },
  question: { icon: '❓', label: 'Question', color: '#f59e0b' },
  opportunity: { icon: '💼', label: 'Opportunity', color: '#34d399' },
  resource: { icon: '📚', label: 'Resource', color: '#a78bfa' },
  moot_win: { icon: '⚖️', label: 'Moot Win', color: '#fb923c' },
};

const timeAgo = (date: string) => {
  if (!date) return 'just now';
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const CommentsSection = ({ postId, colors, isDark, myProfile, authorId, userId }: any) => {
  const [text, setText] = useState('');
  const { data: comments = [], isLoading } = useComments(postId);
  const addCommentMutation = useAddComment();

  const submit = async () => {
    if (!text.trim() || !userId) return;
    await addCommentMutation.mutateAsync({ postId, userId, content: text, myProfile, authorId });
    setText('');
  };

  const c = colors;
  return (
    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${c.border}` }}>
      {isLoading && <p style={{ fontSize: '13px', color: c.textMuted }}>Loading comments...</p>}
      {!isLoading && comments.map((comment: any) => (
        <div key={comment.id} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0d7377, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
            {comment.author_name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div style={{ flex: 1, background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', borderRadius: '12px', padding: '10px 14px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '3px', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, fontWeight: 700, color: c.textPrimary, fontSize: '13px' }}>{comment.author_name}</p>
              {comment.author_college && <p style={{ margin: 0, fontSize: '11px', color: c.textMuted }}>{comment.author_college}</p>}
            </div>
            <p style={{ margin: 0, color: c.textSecondary, fontSize: '13px', lineHeight: '1.5' }}>{comment.content}</p>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0d7377, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
          {myProfile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
        </div>
        <input
          placeholder="Add a comment..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{
            flex: 1, padding: '9px 16px',
            background: isDark ? 'rgba(255,255,255,0.06)' : '#f9fafb',
            border: `1px solid ${c.border}`, borderRadius: '9999px',
            color: c.textPrimary, fontFamily: 'inherit', fontSize: '13px', outline: 'none',
          }}
        />
        <button onClick={submit} disabled={!text.trim()} style={{
          background: text.trim() ? c.gold : c.border,
          color: text.trim() ? '#1a1a2e' : c.textMuted,
          border: 'none', borderRadius: '9999px', padding: '9px 16px',
          cursor: text.trim() ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit', fontWeight: 700, fontSize: '13px',
        }}>↑</button>
      </div>
    </div>
  );
};

const StudentCommunityPage = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('update');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showPostBox, setShowPostBox] = useState(false);

  // React Query Hooks
  const { data: myProfile } = useMyProfile();
  const { data: posts = [], isLoading: isPostsLoading, isError: isPostsError } = usePosts();
  const { data: likedPosts = [] } = useLikedPosts(user?.id);
  const { data: students = [], isLoading: isStudentsLoading } = useStudents(user?.id);
  const { data: connectionData, isLoading: isConnectionsLoading } = useConnections(user?.id);
  const { data: requests = [], isLoading: isRequestsLoading } = useRequests(user?.id);
  const { data: notifData, isLoading: isNotificationsLoading } = useNotifications(user?.id);

  const connections = connectionData?.accepted || [];
  const pendingSent = connectionData?.pending || [];
  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  // Mutations
  const createPostMutation = useCreatePost();
  const toggleLikeMutation = useToggleLike();

  const submitPost = async () => {
    if (!newPost.trim() || !user?.id) return;
    try {
      await createPostMutation.mutateAsync({ content: newPost, postType });
      setNewPost('');
      setPostType('update');
      setShowPostBox(false);
      toast.success("Post created successfully!");
    } catch (err) {
      console.error("SubmitPost error:", err);
      // The toast is also triggered by the hook
    }
  };

  const handleToggleLike = (postId: string, authorId: string, currentLikesCount: number) => {
    if (!user?.id) return;
    const isLiked = likedPosts.includes(postId);
    toggleLikeMutation.mutate({
      postId,
      userId: user.id,
      authorId,
      myProfile,
      isLiked,
      currentLikesCount
    });
  };

  const handleSendConnectionRequest = async (studentId: string) => {
    if (!user?.id) return;
    try {
      await sendConnectionRequest({ userId: user.id, studentId, myProfile });
      queryClient.invalidateQueries({ queryKey: ['connections', user.id] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptRequest = async (requestId: string, requesterId: string) => {
    if (!user?.id) return;
    try {
      await acceptRequest({ requestId, requesterId, userId: user.id, myProfile });
      queryClient.invalidateQueries({ queryKey: ['requests', user.id] });
      queryClient.invalidateQueries({ queryKey: ['connections', user.id] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectRequest(requestId);
      queryClient.invalidateQueries({ queryKey: ['requests', user?.id] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkNotificationsRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    try {
      await markNotificationsRead(user.id);
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    } catch (e) {
      console.error(e);
    }
  };

  const isConnected = (studentId: string) => connections.some((c: any) =>
    (c.requester_id === user?.id && c.receiver_id === studentId) ||
    (c.requester_id === studentId && c.receiver_id === user?.id)
  );

  const filteredPosts = activeFilter === 'all' ? posts : posts.filter((p: any) => p.post_type === activeFilter);
  const filteredStudents = students.filter((s: any) =>
    !searchQuery ||
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.university?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const c = colors;
  const card: React.CSSProperties = { background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '16px', padding: isMobile ? '14px' : '20px' };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'feed', label: 'Feed', icon: '🏠' },
    { key: 'network', label: 'Network', icon: '🌐' },
    { key: 'requests', label: `Requests${requests.length > 0 ? ` (${requests.length})` : ''}`, icon: '👥' },
    { key: 'notifications', label: `${unreadCount > 0 ? `(${unreadCount})` : 'Alerts'}`, icon: '🔔' },
    { key: 'trending', label: 'Trending', icon: '🔥' },
  ];

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: isMobile ? '20px 14px 60px' : '32px 20px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 800, color: c.textHeading, margin: '0 0 6px', letterSpacing: '-0.3px', fontFamily: "'Playfair Display', serif", display: 'flex', alignItems: 'center', gap: '10px' }}>
          🎓 Student Community
        </h1>
        <p style={{ color: c.textSecondary, margin: 0, fontSize: '14px' }}>
          Connect · Learn · Grow with law students across India
        </p>
      </div>

      {/* Profile Strip / Create Post Trigger */}
      {myProfile && !showPostBox && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer' }} onClick={() => setShowPostBox(true)}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #0d7377, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '17px', flexShrink: 0, border: `2px solid ${c.gold}` }}>
            {myProfile.full_name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div style={{ flex: 1, padding: '10px 16px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', borderRadius: '9999px', color: c.textMuted, fontSize: '14px' }}>
            Share a win, ask a question, or post a resource...
          </div>
        </div>
      )}

      {/* Expanded Post Box */}
      {showPostBox && (
        <div style={{ ...card, marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0d7377, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
              {myProfile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: c.textPrimary, fontSize: '14px' }}>{myProfile?.full_name}</p>
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder="What's on your mind? Share your legal journey..."
                rows={4}
                autoFocus
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  color: c.textPrimary, fontFamily: 'inherit', fontSize: '15px',
                  resize: 'none', lineHeight: '1.6', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${c.border}` }}>
                {Object.entries(POST_TYPES).map(([key, cfg]) => (
                  <button key={key} onClick={() => setPostType(key)} style={{
                    padding: '4px 12px', borderRadius: '9999px',
                    border: `1px solid ${postType === key ? cfg.color : c.border}`,
                    background: postType === key ? `${cfg.color}25` : 'transparent',
                    color: postType === key ? cfg.color : c.textSecondary,
                    cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                    fontWeight: postType === key ? 700 : 400,
                  }}>
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button onClick={() => { setShowPostBox(false); setNewPost(''); }} style={{
                  background: 'transparent', color: c.textSecondary, border: `1px solid ${c.border}`,
                  borderRadius: '9999px', padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
                }}>Cancel</button>
                <button onClick={submitPost} disabled={!newPost.trim() || createPostMutation.isPending} style={{
                  background: newPost.trim() ? `linear-gradient(135deg, ${c.gold}, ${c.goldLight})` : c.border,
                  color: newPost.trim() ? '#1a1a2e' : c.textMuted,
                  border: 'none', borderRadius: '9999px', padding: '8px 24px',
                  fontWeight: 700, cursor: newPost.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', fontSize: '13px', opacity: createPostMutation.isPending ? 0.7 : 1
                }}>{createPostMutation.isPending ? 'Posting...' : 'Post'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '2px' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); if (tab.key === 'notifications') handleMarkNotificationsRead(); }} style={{
            padding: isMobile ? '7px 14px' : '8px 18px', borderRadius: '9999px', whiteSpace: 'nowrap',
            border: `1px solid ${activeTab === tab.key ? c.gold : c.border}`,
            background: activeTab === tab.key ? (isDark ? 'rgba(201,162,39,0.15)' : 'rgba(201,162,39,0.1)') : 'transparent',
            color: activeTab === tab.key ? c.gold : c.textSecondary,
            fontWeight: activeTab === tab.key ? 700 : 500,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
            transition: 'all 0.2s ease',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── FEED ── */}
      {activeTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Filter pills */}
          <div className="hide-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', marginBottom: '6px' }}>
            {[{ key: 'all', label: '✨ All' }, ...Object.entries(POST_TYPES).map(([key, cfg]) => ({ key, label: `${cfg.icon} ${cfg.label}` }))].map(f => (
              <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
                padding: '5px 14px', borderRadius: '9999px', whiteSpace: 'nowrap', flexShrink: 0,
                border: `1px solid ${activeFilter === f.key ? c.gold : c.border}`,
                background: activeFilter === f.key ? (isDark ? 'rgba(201,162,39,0.15)' : 'rgba(201,162,39,0.1)') : 'transparent',
                color: activeFilter === f.key ? c.gold : c.textMuted,
                cursor: 'pointer', fontSize: '12px', fontFamily: 'Inter, sans-serif',
                fontWeight: activeFilter === f.key ? 600 : 400,
                transition: 'all 0.15s ease',
              }}>
                {f.label}
              </button>
            ))}
          </div>

          {isPostsLoading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: c.textMuted }}>
              <p style={{ fontSize: '14px' }}>Loading posts...</p>
            </div>
          )}

          {isPostsError && (
             <div style={{ textAlign: 'center', padding: '40px 20px', color: c.error }}>
              <p style={{ fontSize: '14px' }}>Error loading posts. Please try again.</p>
            </div>
          )}

          {!isPostsLoading && !isPostsError && filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: c.textMuted }}>
              <p style={{ fontSize: '48px', margin: '0 0 12px' }}>📰</p>
              <p style={{ fontWeight: 600 }}>No posts yet!</p>
              <p style={{ fontSize: '13px' }}>Be the first to share something with the community.</p>
            </div>
          ) : filteredPosts.map((post: any) => {
            const author = post.users;
            const typeCfg = POST_TYPES[post.post_type as keyof typeof POST_TYPES] || POST_TYPES.update;
            const isLiked = likedPosts.includes(post.id);
            const showComments = expandedPost === post.id;

            return (
              <div key={post.id} style={card} className={post.id.startsWith('temp') ? 'opacity-70' : ''}>
                {/* Author */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #0d7377, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '18px', flexShrink: 0, border: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e4e4e7'}` }}>
                      {author?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: c.textPrimary, fontSize: '14px' }}>{author?.full_name || 'Law Student'}</p>
                        {author?.year_of_study && (
                          <span style={{ fontSize: '11px', background: `${c.gold}20`, color: c.gold, padding: '1px 7px', borderRadius: '9999px', fontWeight: 600 }}>
                            Year {author.year_of_study}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: c.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {author?.university || 'Law University'}{author?.city ? ` • ${author.city}` : ''} • {timeAgo(post.created_at)}
                      </p>
                    </div>
                  </div>
                  <span style={{ background: `${typeCfg.color}20`, color: typeCfg.color, fontSize: '11px', padding: '3px 10px', borderRadius: '9999px', fontWeight: 700, flexShrink: 0, marginLeft: '8px' }}>
                    {typeCfg.icon} {!isMobile && typeCfg.label}
                  </span>
                </div>

                {/* Content */}
                <p style={{ margin: '0 0 14px', color: c.textPrimary, fontSize: '15px', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${c.border}`, flexWrap: 'wrap' }}>
                  <button onClick={() => handleToggleLike(post.id, post.author_id, post.likes_count || 0)} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: isLiked ? `${c.error}15` : 'transparent',
                    border: `1px solid ${isLiked ? c.error : c.border}`,
                    borderRadius: '9999px', padding: '6px 14px',
                    cursor: 'pointer', color: isLiked ? c.error : c.textSecondary,
                    fontSize: '13px', fontFamily: 'inherit', fontWeight: isLiked ? 600 : 400,
                  }}>
                    {isLiked ? '❤️' : '🤍'} {post.likes_count || 0}
                  </button>
                  <button onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: showComments ? '#60a5fa20' : 'transparent',
                    border: `1px solid ${showComments ? '#60a5fa' : c.border}`,
                    borderRadius: '9999px', padding: '6px 14px',
                    cursor: 'pointer', color: showComments ? '#60a5fa' : c.textSecondary,
                    fontSize: '13px', fontFamily: 'inherit',
                  }}>
                    💬 {post.comments_count || 0}
                  </button>
                  {post.author_id !== user?.id && !isConnected(post.author_id) && !pendingSent.includes(post.author_id) && (
                    <button onClick={() => handleSendConnectionRequest(post.author_id)} style={{
                      display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto',
                      background: 'transparent', border: `1px solid ${c.border}`,
                      borderRadius: '9999px', padding: '6px 14px',
                      cursor: 'pointer', color: c.textSecondary, fontSize: '13px', fontFamily: 'inherit',
                    }}>🤝 Connect</button>
                  )}
                  {pendingSent.includes(post.author_id) && post.author_id !== user?.id && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: c.textMuted, padding: '6px 14px' }}>⏳ Pending</span>
                  )}
                  {isConnected(post.author_id) && post.author_id !== user?.id && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: c.success, padding: '6px 14px', fontWeight: 600 }}>✓ Connected</span>
                  )}
                </div>

                {showComments && (
                  <CommentsSection
                    postId={post.id}
                    colors={c}
                    isDark={isDark}
                    myProfile={myProfile}
                    userId={user?.id}
                    authorId={post.author_id}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── NETWORK ── */}
      {activeTab === 'network' && (
        <div>
          <input
            placeholder="🔍 Search students by name or college..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px',
              background: c.inputBg, border: `1px solid ${c.border}`,
              borderRadius: '12px', color: c.textPrimary,
              fontFamily: 'inherit', fontSize: '14px', outline: 'none',
              boxSizing: 'border-box', marginBottom: '16px',
            }}
          />
          <p style={{ color: c.textSecondary, fontSize: '13px', marginBottom: '16px' }}>
            {connections.length} connections • {filteredStudents.length} students
          </p>
          
          {isStudentsLoading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: c.textMuted }}>
              <p style={{ fontSize: '14px' }}>Loading network...</p>
            </div>
          )}

          {!isStudentsLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {filteredStudents.map((student: any) => {
                const connected = isConnected(student.id);
                const pending = pendingSent.includes(student.id);
                return (
                  <div key={student.id} style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, #0d7377, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '20px', border: `3px solid ${c.gold}` }}>
                      {student.full_name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div style={{ width: '100%', overflow: 'hidden' }}>
                      <p style={{ margin: '0 0 3px', fontWeight: 700, color: c.textPrimary, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.full_name || 'Student'}</p>
                      <p style={{ margin: '0 0 2px', fontSize: '12px', color: c.gold, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.university || 'Law University'}</p>
                      {student.year_of_study && <p style={{ margin: 0, fontSize: '11px', color: c.textMuted }}>Year {student.year_of_study}</p>}
                    </div>
                    {connected ? (
                      <span style={{ color: c.success, fontSize: '12px', fontWeight: 600 }}>✓ Connected</span>
                    ) : pending ? (
                      <span style={{ color: c.textMuted, fontSize: '12px' }}>⏳ Pending</span>
                    ) : (
                      <button onClick={() => handleSendConnectionRequest(student.id)} style={{
                        width: '100%', padding: '7px', background: 'linear-gradient(135deg, #0d7377, #14b8a6)',
                        color: 'white', border: 'none', borderRadius: '9999px',
                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '12px',
                      }}>🤝 Connect</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!isStudentsLoading && filteredStudents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: c.textMuted }}>
              <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🎓</p>
              <p>No students found yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ── REQUESTS ── */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isRequestsLoading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: c.textMuted }}>
              <p style={{ fontSize: '14px' }}>Loading requests...</p>
            </div>
          )}
          
          {!isRequestsLoading && requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: c.textMuted }}>
              <p style={{ fontSize: '48px', margin: '0 0 12px' }}>📬</p>
              <p>No pending connection requests</p>
            </div>
          ) : requests.map((req: any) => (
            <div key={req.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #0d7377, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '18px' }}>
                  {req.users?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, color: c.textPrimary, fontSize: '14px' }}>{req.users?.full_name || 'Student'}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: c.textSecondary }}>{req.users?.university || 'Law University'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleAcceptRequest(req.id, req.requester_id)} style={{ background: c.success, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px' }}>
                  ✓ Accept
                </button>
                <button onClick={() => handleRejectRequest(req.id)} style={{ background: `${c.error}15`, color: c.error, border: `1px solid ${c.error}40`, borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
                  ✗
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isNotificationsLoading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: c.textMuted }}>
              <p style={{ fontSize: '14px' }}>Loading notifications...</p>
            </div>
          )}
          {!isNotificationsLoading && notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: c.textMuted }}>
              <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🔔</p>
              <p>No notifications yet</p>
            </div>
          ) : notifications.map((notif: any) => {
            const icons: Record<string, string> = { connection_request: '🤝', connection_accepted: '✅', post_like: '❤️', post_comment: '💬' };
            const messages: Record<string, string> = { connection_request: 'sent you a connection request', connection_accepted: 'accepted your connection', post_like: 'liked your post', post_comment: 'commented on your post' };
            return (
              <div key={notif.id} style={{
                ...card, display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                background: !notif.read ? (isDark ? 'rgba(13,115,119,0.08)' : 'rgba(13,115,119,0.05)') : c.cardBg,
                border: `1px solid ${!notif.read ? 'rgba(13,115,119,0.3)' : c.border}`,
              }}>
                <span style={{ fontSize: '24px' }}>{icons[notif.type] || '🔔'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '14px', color: c.textPrimary }}>
                    <strong>{notif.from_user_name}</strong> {messages[notif.type] || 'interacted with you'}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: c.textMuted }}>{timeAgo(notif.created_at)}</p>
                </div>
                {!notif.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d7377', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TRENDING ── */}
      {activeTab === 'trending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ color: c.textSecondary, fontSize: '13px', margin: '0 0 8px' }}>🔥 Most liked posts this week</p>
          
          {isPostsLoading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: c.textMuted }}>
              <p style={{ fontSize: '14px' }}>Loading trending...</p>
            </div>
          )}

          {!isPostsLoading && [...posts].sort((a: any, b: any) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 10).map(post => {
            const author = post.users;
            const typeCfg = POST_TYPES[post.post_type as keyof typeof POST_TYPES] || POST_TYPES.update;
            return (
              <div key={post.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #0d7377, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
                      {author?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: c.textPrimary, fontSize: '13px' }}>{author?.full_name || 'Student'}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: c.textSecondary }}>{author?.university || ''} • {timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: c.error, fontWeight: 700, fontSize: '13px' }}>
                    ❤️ {post.likes_count || 0}
                  </div>
                </div>
                <p style={{ margin: 0, color: c.textPrimary, fontSize: '14px', lineHeight: '1.6' }}>
                  {post.content.length > 200 ? post.content.slice(0, 200) + '...' : post.content}
                </p>
                <span style={{ display: 'inline-block', marginTop: '10px', background: `${typeCfg.color}20`, color: typeCfg.color, fontSize: '11px', padding: '3px 10px', borderRadius: '9999px', fontWeight: 600 }}>
                  {typeCfg.icon} {typeCfg.label}
                </span>
              </div>
            );
          })}
          {!isPostsLoading && posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: c.textMuted }}>
              <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🔥</p>
              <p>No trending posts yet. Start sharing!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentCommunityPage;
