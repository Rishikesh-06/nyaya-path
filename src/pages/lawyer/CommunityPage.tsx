import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useResponsive } from '@/hooks/useResponsive';
import { useNavigate } from 'react-router-dom';

type Tab = 'feed' | 'network' | 'requests' | 'notifications';

const BADGE_DEFINITIONS: Record<string, { icon: string; label: string; color: string }> = {
  update: { icon: '📢', label: 'Update', color: '#60a5fa' },
  win: { icon: '🏆', label: 'Case Win', color: '#c9a227' },
  question: { icon: '❓', label: 'Question', color: '#f59e0b' },
  milestone: { icon: '🎯', label: 'Milestone', color: '#22c55e' },
};

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const CommentsSection = ({ postId, colors, isDark, commentText, setCommentText, onSubmit }: any) => {
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (data) setComments(data);
    };
    load();
  }, [postId]);

  return (
    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
      {comments.map((comment: any) => (
        <div key={comment.id} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: colors.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
            {comment.author_name?.charAt(0)?.toUpperCase() || 'L'}
          </div>
          <div style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', borderRadius: '12px', padding: '8px 12px', flex: 1 }}>
            <p style={{ margin: '0 0 2px', fontWeight: 600, color: colors.textPrimary, fontSize: '12px' }}>{comment.author_name}</p>
            <p style={{ margin: 0, color: colors.textSecondary, fontSize: '13px' }}>{comment.content}</p>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <input
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e: any) => setCommentText(e.target.value)}
          onKeyDown={(e: any) => e.key === 'Enter' && onSubmit()}
          style={{
            flex: 1, padding: '8px 12px',
            background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
            border: `1px solid ${colors.border}`, borderRadius: '9999px',
            color: colors.textPrimary, fontFamily: 'inherit', fontSize: '13px', outline: 'none',
          }}
        />
        <button
          onClick={onSubmit}
          disabled={!commentText.trim()}
          style={{
            background: commentText.trim() ? colors.gold : colors.border,
            color: commentText.trim() ? '#1a1a2e' : colors.textMuted,
            border: 'none', borderRadius: '9999px', padding: '8px 16px',
            cursor: commentText.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', fontWeight: 600, fontSize: '13px',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

const CommunityPage = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [posts, setPosts] = useState<any[]>([]);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('update');
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [myProfile, setMyProfile] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadAll();
    const channel = supabase
      .channel('community')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, () => loadPosts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_notifications', filter: `user_id=eq.${user.id}` }, () => loadNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const loadAll = async () => {
    await Promise.all([loadPosts(), loadLawyers(), loadConnections(), loadRequests(), loadNotifications(), loadMyProfile()]);
  };

  const loadMyProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (data) setMyProfile(data);
  };

  const loadPosts = async () => {
    const { data } = await supabase
      .from('community_posts')
      .select(`*, author:author_id(full_name, specialization, city, avatar_url)`)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPosts(data);
    if (user?.id) {
      const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id);
      if (likes) setLikedPosts(likes.map((l: any) => l.post_id));
    }
  };

  const loadLawyers = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('users').select('*').eq('role', 'lawyer').neq('id', user.id).limit(50);
    if (data) setLawyers(data);
  };

  const loadConnections = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('lawyer_connections')
      .select('*')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted');
    if (data) setConnections(data);
    const { data: pending } = await supabase
      .from('lawyer_connections')
      .select('*')
      .eq('requester_id', user.id)
      .eq('status', 'pending');
    if (pending) setPendingRequests(pending);
  };

  const loadRequests = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('lawyer_connections')
      .select(`*, requester:requester_id(full_name, specialization, city)`)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');
    if (data) setRequests(data);
  };

  const loadNotifications = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('community_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    }
  };

  const getConnectionStatus = (lawyerId: string): 'connected' | 'pending' | null => {
    const isConnected = connections.some((c: any) =>
      (c.requester_id === user?.id && c.receiver_id === lawyerId) ||
      (c.requester_id === lawyerId && c.receiver_id === user?.id)
    );
    if (isConnected) return 'connected';
    const isPending = pendingRequests.some((c: any) => c.receiver_id === lawyerId);
    if (isPending) return 'pending';
    return null;
  };

  const sendConnectionRequest = async (lawyerId: string) => {
    if (!user?.id) return;
    await supabase.from('lawyer_connections').insert({ requester_id: user.id, receiver_id: lawyerId, status: 'pending' });
    await supabase.from('community_notifications').insert({
      user_id: lawyerId, type: 'connection_request',
      from_user_id: user.id, from_user_name: myProfile?.full_name || 'A lawyer',
    });
    loadConnections();
  };

  const acceptRequest = async (requestId: string, requesterId: string) => {
    await supabase.from('lawyer_connections').update({ status: 'accepted' }).eq('id', requestId);
    await supabase.from('community_notifications').insert({
      user_id: requesterId, type: 'connection_accepted',
      from_user_id: user?.id, from_user_name: myProfile?.full_name || 'A lawyer',
    });
    loadRequests();
    loadConnections();
  };

  const rejectRequest = async (requestId: string) => {
    await supabase.from('lawyer_connections').update({ status: 'rejected' }).eq('id', requestId);
    loadRequests();
  };

  const submitPost = async () => {
    if (!newPost.trim() || !user?.id) return;
    await supabase.from('community_posts').insert({ author_id: user.id, content: newPost.trim(), category: postType });
    setNewPost('');
    setPostType('update');
    loadPosts();
  };

  const toggleLike = async (postId: string) => {
    if (!user?.id) return;
    const isLiked = likedPosts.includes(postId);
    const post = posts.find((p: any) => p.id === postId);
    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      await supabase.from('community_posts').update({ likes_count: Math.max((post?.likes_count || 1) - 1, 0) }).eq('id', postId);
      setLikedPosts(prev => prev.filter(id => id !== postId));
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      await supabase.from('community_posts').update({ likes_count: (post?.likes_count || 0) + 1 }).eq('id', postId);
      setLikedPosts(prev => [...prev, postId]);
      if (post && post.author_id !== user.id) {
        await supabase.from('community_notifications').insert({
          user_id: post.author_id, type: 'post_like',
          from_user_id: user.id, from_user_name: myProfile?.full_name || 'A lawyer', post_id: postId,
        });
      }
    }
    loadPosts();
  };

  const submitComment = async (postId: string) => {
    if (!commentText.trim() || !user?.id) return;
    const post = posts.find((p: any) => p.id === postId);
    await supabase.from('post_comments').insert({
      post_id: postId, author_id: user.id,
      author_name: myProfile?.full_name || 'Lawyer', content: commentText.trim(),
    });
    await supabase.from('community_posts').update({ comments_count: (post?.comments_count || 0) + 1 }).eq('id', postId);
    setCommentText('');
    loadPosts();
  };

  const markNotificationsRead = async () => {
    if (!user?.id) return;
    await supabase.from('community_notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setUnreadCount(0);
    loadNotifications();
  };

  const filteredLawyers = lawyers.filter((l: any) =>
    !searchQuery ||
    l.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (Array.isArray(l.specialization) ? l.specialization.join(' ') : l.specialization || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cardStyle: React.CSSProperties = {
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    padding: isMobile ? '14px' : '20px',
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'feed', label: 'Feed', icon: '📰' },
    { key: 'network', label: 'Network', icon: '🤝' },
    { key: 'requests', label: `Requests${requests.length > 0 ? ` (${requests.length})` : ''}`, icon: '👥' },
    { key: 'notifications', label: `${unreadCount > 0 ? `(${unreadCount})` : 'Alerts'}`, icon: '🔔' },
  ];

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 700, color: colors.textHeading, margin: '0 0 6px' }}>
          ⚖️ Lawyer Community
        </h1>
        <p style={{ color: colors.textSecondary, margin: 0, fontSize: '14px' }}>
          Connect with fellow lawyers, share wins, ask questions
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); if (tab.key === 'notifications') markNotificationsRead(); }}
            style={{
              padding: isMobile ? '6px 12px' : '8px 18px',
              borderRadius: '9999px',
              border: `1px solid ${activeTab === tab.key ? colors.gold : colors.border}`,
              background: activeTab === tab.key ? `${colors.gold}20` : 'transparent',
              color: activeTab === tab.key ? colors.gold : colors.textSecondary,
              fontWeight: activeTab === tab.key ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* FEED TAB */}
      {activeTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: colors.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0, fontSize: '16px' }}>
                {myProfile?.full_name?.charAt(0)?.toUpperCase() || 'L'}
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Share a case win, ask a legal question, or post an update..."
                  rows={3}
                  style={{
                    width: '100%', background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                    border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '12px',
                    color: colors.textPrimary, fontFamily: 'inherit', fontSize: '14px',
                    resize: 'none', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Object.entries(BADGE_DEFINITIONS).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setPostType(key)}
                        style={{
                          padding: '4px 12px', borderRadius: '9999px',
                          border: `1px solid ${postType === key ? cfg.color : colors.border}`,
                          background: postType === key ? `${cfg.color}20` : 'transparent',
                          color: postType === key ? cfg.color : colors.textSecondary,
                          cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                          fontWeight: postType === key ? 600 : 400,
                        }}
                      >
                        {cfg.icon} {cfg.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={submitPost}
                    disabled={!newPost.trim()}
                    style={{
                      background: newPost.trim() ? `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})` : colors.border,
                      color: newPost.trim() ? '#1a1a2e' : colors.textMuted,
                      border: 'none', borderRadius: '9999px', padding: '8px 20px',
                      fontWeight: 700, cursor: newPost.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', fontSize: '13px',
                    }}
                  >
                    Post →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📰</p>
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post: any) => {
              const author = post.author;
              const isLiked = likedPosts.includes(post.id);
              const typeConf = BADGE_DEFINITIONS[post.category] || BADGE_DEFINITIONS.update;
              return (
                <div key={post.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', minWidth: 0 }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.navy}, ${colors.navyLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                        {author?.full_name?.charAt(0)?.toUpperCase() || 'L'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: colors.textPrimary, fontSize: '14px' }}>{author?.full_name || 'Lawyer'}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>
                          {Array.isArray(author?.specialization) ? author.specialization[0] : author?.specialization || 'Lawyer'} {author?.city ? `• ${author.city}` : ''} • {timeAgo(post.created_at)}
                        </p>
                      </div>
                    </div>
                    <span style={{ background: `${typeConf.color}20`, color: typeConf.color, fontSize: '11px', padding: '3px 10px', borderRadius: '9999px', fontWeight: 600, flexShrink: 0 }}>
                      {typeConf.icon} {typeConf.label}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 14px', color: colors.textPrimary, fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
                    <button
                      onClick={() => toggleLike(post.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: isLiked ? `${colors.error}15` : 'transparent',
                        border: `1px solid ${isLiked ? colors.error : colors.border}`,
                        borderRadius: '9999px', padding: '5px 14px', cursor: 'pointer',
                        color: isLiked ? colors.error : colors.textSecondary,
                        fontSize: '13px', fontFamily: 'inherit', fontWeight: isLiked ? 600 : 400,
                      }}
                    >
                      {isLiked ? '❤️' : '🤍'} {post.likes_count || 0}
                    </button>
                    <button
                      onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: expandedComments === post.id ? `${colors.info}15` : 'transparent',
                        border: `1px solid ${expandedComments === post.id ? colors.info : colors.border}`,
                        borderRadius: '9999px', padding: '5px 14px', cursor: 'pointer',
                        color: expandedComments === post.id ? colors.info : colors.textSecondary,
                        fontSize: '13px', fontFamily: 'inherit',
                      }}
                    >
                      💬 {post.comments_count || 0}
                    </button>
                  </div>
                  {expandedComments === post.id && (
                    <CommentsSection
                      postId={post.id} colors={colors} isDark={isDark}
                      commentText={commentText} setCommentText={setCommentText}
                      onSubmit={() => submitComment(post.id)}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* NETWORK TAB */}
      {activeTab === 'network' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <input
              placeholder="🔍 Search lawyers by name or specialization..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', background: colors.inputBg,
                border: `1px solid ${colors.border}`, borderRadius: '12px',
                color: colors.textPrimary, fontFamily: 'inherit', fontSize: '14px',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <p style={{ color: colors.textSecondary, fontSize: '13px', marginBottom: '16px' }}>
            {connections.length} connections • {filteredLawyers.length} lawyers in network
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {filteredLawyers.map((lawyer: any) => {
              const status = getConnectionStatus(lawyer.id);
              return (
                <div key={lawyer.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.navy}, ${colors.navyLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '22px', border: `3px solid ${colors.gold}` }}>
                    {lawyer.full_name?.charAt(0)?.toUpperCase() || 'L'}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 3px', fontWeight: 700, color: colors.textPrimary, fontSize: '15px' }}>{lawyer.full_name}</p>
                    <p style={{ margin: '0 0 3px', fontSize: '12px', color: colors.gold }}>{Array.isArray(lawyer.specialization) ? lawyer.specialization[0] : lawyer.specialization || 'General Law'}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>{lawyer.city || '—'}</p>
                  </div>
                  {status === 'connected' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: colors.success, fontSize: '13px', fontWeight: 600 }}>
                        ✓ Connected
                      </div>
                      <button
                        onClick={() => navigate(`/lawyer/community/chat/${lawyer.id}`)}
                        style={{
                          width: '100%', padding: '8px',
                          background: 'linear-gradient(135deg, #c9a227, #e6b830)',
                          color: '#1a1a2e', border: 'none', borderRadius: '9999px',
                          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}
                      >
                        💬 Message
                      </button>
                    </div>
                  ) : status === 'pending' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: colors.warning, fontSize: '13px', fontWeight: 600 }}>⏳ Pending</div>
                  ) : (
                    <button
                      onClick={() => sendConnectionRequest(lawyer.id)}
                      style={{
                        width: '100%', padding: '8px',
                        background: `linear-gradient(135deg, ${colors.navy}, ${colors.navyLight})`,
                        color: 'white', border: 'none', borderRadius: '9999px',
                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      }}
                    >
                      🤝 Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {filteredLawyers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: colors.textMuted }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px' }}>👥</p>
              <p>No lawyers found.</p>
            </div>
          )}
        </div>
      )}

      {/* REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: colors.textMuted }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📬</p>
              <p>No pending connection requests</p>
            </div>
          ) : (
            requests.map((req: any) => (
              <div key={req.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.navy}, ${colors.navyLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '18px' }}>
                    {req.requester?.full_name?.charAt(0)?.toUpperCase() || 'L'}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, color: colors.textPrimary }}>{req.requester?.full_name || 'Lawyer'}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>
                      {Array.isArray(req.requester?.specialization) ? req.requester.specialization[0] : req.requester?.specialization || 'Lawyer'} • {req.requester?.city || ''}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: colors.textMuted }}>{timeAgo(req.created_at)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => acceptRequest(req.id, req.requester_id)}
                    style={{ background: colors.success, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px' }}
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => rejectRequest(req.id)}
                    style={{ background: `${colors.error}15`, color: colors.error, border: `1px solid ${colors.error}40`, borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}
                  >
                    ✗ Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: colors.textMuted }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🔔</p>
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif: any) => {
              const icons: Record<string, string> = { connection_request: '🤝', connection_accepted: '✅', post_like: '❤️', post_comment: '💬' };
              const messages: Record<string, string> = { connection_request: 'sent you a connection request', connection_accepted: 'accepted your connection request', post_like: 'liked your post', post_comment: 'commented on your post' };
              return (
                <div key={notif.id} style={{
                  ...cardStyle,
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: !notif.read ? (isDark ? 'rgba(201,162,39,0.08)' : 'rgba(201,162,39,0.05)') : colors.cardBg,
                  border: `1px solid ${!notif.read ? `${colors.gold}40` : colors.border}`,
                  padding: '14px 16px',
                }}>
                  <span style={{ fontSize: '24px' }}>{icons[notif.type] || '🔔'}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary }}>
                      <strong>{notif.from_user_name}</strong> {messages[notif.type] || 'interacted with you'}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>{timeAgo(notif.created_at)}</p>
                  </div>
                  {!notif.read && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.gold, flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;