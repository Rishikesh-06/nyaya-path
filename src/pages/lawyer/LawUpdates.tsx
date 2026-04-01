import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { Newspaper, RefreshCw, ExternalLink, Calendar, MapPin, Filter, ChevronDown, Search, Globe } from 'lucide-react';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

type LanguageCode = 'English' | 'Telugu' | 'Hindi';
type CategoryKey = 'all' | 'supreme_court' | 'amendment' | 'high_court' | 'ipc' | 'consumer' | 'labour';

interface Article {
    id: string;
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    source: { name: string };
    category: CategoryKey;
    translatedTitle?: string;
    translatedDescription?: string;
}

const CATEGORIES: { key: CategoryKey; label: string; color: string; query: string }[] = [
    { key: 'all', label: 'All Updates', color: '#c9a227', query: 'India law legal court judgment amendment advocate' },
    { key: 'supreme_court', label: 'Supreme Court', color: '#1a3c5e', query: 'Supreme Court India judgment ruling' },
    { key: 'high_court', label: 'High Court', color: '#0a9e6e', query: 'High Court India verdict order' },
    { key: 'amendment', label: 'Amendments', color: '#7c3aed', query: 'India law amendment bill parliament legal' },
    { key: 'ipc', label: 'IPC / BNS', color: '#dc2626', query: 'IPC BNS CrPC BNSS India criminal law' },
    { key: 'consumer', label: 'Consumer', color: '#f97316', query: 'consumer protection India court NCDRC' },
    { key: 'labour', label: 'Labour Law', value: '#0891b2', query: 'labour law India workers rights employment' } as any,
];

const SORT_OPTIONS = [
    { key: 'publishedAt', label: 'Latest First' },
    { key: 'oldest', label: 'Oldest First' },
    { key: 'relevancy', label: 'Most Relevant' },
];

const translateText = async (text: string, targetLang: LanguageCode): Promise<string> => {
    if (targetLang === 'English' || !text) return text;
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: `Translate the following legal news text to ${targetLang}. Return ONLY the translated text, nothing else.` },
                    { role: 'user', content: text }
                ],
                temperature: 0.1,
                max_tokens: 256,
            }),
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || text;
    } catch { return text; }
};

const LawUpdates = () => {
    const { colors, isDark } = useTheme();
    const { toast } = useToast();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
    const [selectedSort, setSelectedSort] = useState('publishedAt');
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('English');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [translating, setTranslating] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    const fetchNews = useCallback(async (category: CategoryKey = selectedCategory) => {
        setLoading(true);
        try {
            const cat = CATEGORIES.find(c => c.key === category) || CATEGORIES[0];
            const sortBy = selectedSort === 'oldest' ? 'publishedAt' : selectedSort;
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(cat.query)}&language=en&sortBy=${sortBy}&pageSize=20&apiKey=${NEWS_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.status !== 'ok') throw new Error(data.message || 'NewsAPI error');
            let arts: Article[] = (data.articles || [])
                .filter((a: any) => a.title && a.title !== '[Removed]' && a.description)
                .map((a: any, i: number) => ({
                    id: `${i}-${a.publishedAt}`,
                    title: a.title,
                    description: a.description,
                    url: a.url,
                    urlToImage: a.urlToImage,
                    publishedAt: a.publishedAt,
                    source: a.source,
                    category,
                }));
            if (selectedSort === 'oldest') arts = arts.reverse();
            setArticles(arts);
        } catch (err: any) {
            toast({ title: 'Failed to fetch news', description: err.message, variant: 'destructive' });
        } finally { setLoading(false); }
    }, [selectedCategory, selectedSort, toast]);

    useEffect(() => { fetchNews(selectedCategory); }, [selectedCategory, selectedSort]);

    const handleCategoryChange = (cat: CategoryKey) => {
        setSelectedCategory(cat);
        setArticles([]);
    };

    const handleArticleClick = async (article: Article) => {
        setSelectedArticle(article);
        if (selectedLanguage !== 'English' && !article.translatedTitle) {
            setTranslating(true);
            const [tTitle, tDesc] = await Promise.all([
                translateText(article.title, selectedLanguage),
                translateText(article.description, selectedLanguage),
            ]);
            setSelectedArticle(prev => prev ? { ...prev, translatedTitle: tTitle, translatedDescription: tDesc } : prev);
            setTranslating(false);
        }
    };

    const handleLanguageChange = async (lang: LanguageCode) => {
        setSelectedLanguage(lang);
        if (selectedArticle && lang !== 'English' && !selectedArticle.translatedTitle) {
            setTranslating(true);
            const [tTitle, tDesc] = await Promise.all([
                translateText(selectedArticle.title, lang),
                translateText(selectedArticle.description, lang),
            ]);
            setSelectedArticle(prev => prev ? { ...prev, translatedTitle: tTitle, translatedDescription: tDesc } : prev);
            setTranslating(false);
        }
    };

    const filteredArticles = articles.filter(a => {
        if (!searchQuery.trim()) return true;
        return a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="max-w-5xl space-y-5">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="p-5 md:p-7 rounded-2xl relative overflow-hidden"
                style={{
                    background: isDark
                        ? 'linear-gradient(135deg, rgba(26,60,94,0.4) 0%, rgba(201,162,39,0.08) 100%)'
                        : 'linear-gradient(135deg, rgba(26,60,94,0.08) 0%, rgba(201,162,39,0.05) 100%)',
                    border: `1px solid ${isDark ? 'rgba(201,162,39,0.12)' : 'rgba(26,60,94,0.1)'}`,
                }}>
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, rgba(201,162,39,0.15), transparent)`, filter: 'blur(40px)' }} />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.15)' }}>
                        <Newspaper className="w-5 h-5" style={{ color: '#c9a227' }} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-display font-bold" style={{ color: colors.textHeading }}>Law Updates</h1>
                        <p className="text-xs font-body" style={{ color: colors.textSecondary }}>Live Indian legal news • Supreme Court • Amendments • Judgments</p>
                    </div>
                </div>
            </motion.div>

            {/* Controls */}
            <div className="space-y-3">
                {/* Search + Sort + Language */}
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Search */}
                    <div className="flex-1 min-w-[180px] flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ border: `1px solid ${colors.border}`, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)' }}>
                        <Search className="w-4 h-4 flex-shrink-0" style={{ color: colors.textMuted }} />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search news..." className="flex-1 bg-transparent outline-none text-sm font-body"
                            style={{ color: colors.textPrimary }} />
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <button onClick={() => setShowSortMenu(v => !v)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-body"
                            style={{ border: `1px solid ${colors.border}`, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)', color: colors.textSecondary }}>
                            <Filter className="w-4 h-4" />
                            {SORT_OPTIONS.find(s => s.key === selectedSort)?.label}
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        <AnimatePresence>
                            {showSortMenu && (
                                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                                    className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-20 min-w-[160px]"
                                    style={{ border: `1px solid ${colors.border}`, background: isDark ? '#1a1a2e' : '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                                    {SORT_OPTIONS.map(opt => (
                                        <button key={opt.key} onClick={() => { setSelectedSort(opt.key); setShowSortMenu(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm font-body hover:bg-white/5"
                                            style={{ color: selectedSort === opt.key ? '#c9a227' : colors.textSecondary, fontWeight: selectedSort === opt.key ? 600 : 400 }}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Language */}
                    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ border: `1px solid ${colors.border}`, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)' }}>
                        {(['English', 'Telugu', 'Hindi'] as LanguageCode[]).map(l => (
                            <button key={l} onClick={() => handleLanguageChange(l)}
                                className="px-2.5 py-1 rounded-lg text-xs font-body font-medium transition-all"
                                style={{ background: selectedLanguage === l ? '#c9a227' : 'transparent', color: selectedLanguage === l ? '#fff' : colors.textSecondary }}>
                                {l === 'Telugu' ? 'తె' : l === 'Hindi' ? 'हि' : 'EN'}
                            </button>
                        ))}
                    </div>

                    {/* Refresh */}
                    <button onClick={() => fetchNews(selectedCategory)} disabled={loading}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ border: `1px solid ${colors.border}`, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)' }}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: colors.textMuted }} />
                    </button>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button key={cat.key} onClick={() => handleCategoryChange(cat.key)}
                            className="px-3 py-1.5 rounded-full text-xs font-body font-semibold transition-all"
                            style={{
                                background: selectedCategory === cat.key ? cat.color : 'transparent',
                                color: selectedCategory === cat.key ? '#fff' : colors.textSecondary,
                                border: `1px solid ${selectedCategory === cat.key ? cat.color : colors.border}`,
                            }}>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* News Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-nyaya-gold border-t-transparent animate-spin" />
                    <p className="text-sm font-body" style={{ color: colors.textMuted }}>Fetching latest legal updates...</p>
                </div>
            ) : filteredArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Newspaper className="w-10 h-10" style={{ color: colors.textMuted }} />
                    <p className="text-sm font-body" style={{ color: colors.textMuted }}>No articles found. Try a different category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredArticles.map((article, i) => (
                        <motion.div key={article.id}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            onClick={() => handleArticleClick(article)}
                            className="rounded-2xl overflow-hidden cursor-pointer group"
                            style={{ border: `1px solid ${colors.border}`, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)' }}
                            whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}>
                            {/* Image */}
                            {article.urlToImage && (
                                <div className="w-full h-44 overflow-hidden">
                                    <img src={article.urlToImage} alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                </div>
                            )}
                            <div className="p-4 space-y-2">
                                {/* Source + Date */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-body font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: 'rgba(201,162,39,0.1)', color: '#c9a227' }}>
                                        {article.source.name}
                                    </span>
                                    <div className="flex items-center gap-1 text-[11px] font-body" style={{ color: colors.textMuted }}>
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(article.publishedAt)}
                                    </div>
                                </div>
                                {/* Title */}
                                <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2" style={{ color: colors.textPrimary }}>
                                    {article.title}
                                </h3>
                                {/* Description */}
                                <p className="text-xs font-body line-clamp-2" style={{ color: colors.textSecondary }}>
                                    {article.description}
                                </p>
                                {/* Read More */}
                                <div className="flex items-center gap-1 text-xs font-body font-semibold pt-1" style={{ color: '#c9a227' }}>
                                    Read More <ExternalLink className="w-3 h-3" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Article Detail Modal */}
            <AnimatePresence>
                {selectedArticle && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
                        onClick={() => setSelectedArticle(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl"
                            style={{ background: isDark ? '#0f0f1a' : '#fff', border: `1px solid ${colors.border}` }}>
                            {selectedArticle.urlToImage && (
                                <div className="w-full h-56 overflow-hidden rounded-t-2xl">
                                    <img src={selectedArticle.urlToImage} alt={selectedArticle.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-6 space-y-4">
                                {/* Language toggle inside modal */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className="text-xs font-body font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: 'rgba(201,162,39,0.1)', color: '#c9a227' }}>
                                        {selectedArticle.source.name}
                                    </span>
                                    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ border: `1px solid ${colors.border}` }}>
                                        <Globe className="w-3.5 h-3.5 ml-1" style={{ color: colors.textMuted }} />
                                        {(['English', 'Telugu', 'Hindi'] as LanguageCode[]).map(l => (
                                            <button key={l} onClick={() => handleLanguageChange(l)}
                                                className="px-2.5 py-1 rounded-lg text-xs font-body font-medium transition-all"
                                                style={{ background: selectedLanguage === l ? '#c9a227' : 'transparent', color: selectedLanguage === l ? '#fff' : colors.textSecondary }}>
                                                {l === 'Telugu' ? 'తె' : l === 'Hindi' ? 'हि' : 'EN'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {translating ? (
                                    <div className="flex items-center gap-2 py-4">
                                        <div className="w-4 h-4 rounded-full border-2 border-nyaya-gold border-t-transparent animate-spin" />
                                        <span className="text-sm font-body" style={{ color: colors.textMuted }}>Translating...</span>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="font-display font-bold text-lg leading-snug" style={{ color: colors.textPrimary }}>
                                            {selectedLanguage !== 'English' && selectedArticle.translatedTitle
                                                ? selectedArticle.translatedTitle
                                                : selectedArticle.title}
                                        </h2>
                                        <div className="flex items-center gap-2 text-xs font-body" style={{ color: colors.textMuted }}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(selectedArticle.publishedAt)}
                                        </div>
                                        <p className="text-sm font-body leading-relaxed" style={{ color: colors.textSecondary }}>
                                            {selectedLanguage !== 'English' && selectedArticle.translatedDescription
                                                ? selectedArticle.translatedDescription
                                                : selectedArticle.description}
                                        </p>
                                    </>
                                )}

                                <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-body font-semibold text-sm"
                                    style={{ background: '#1a3c5e', color: '#fff' }}>
                                    Read Full Article <ExternalLink className="w-4 h-4" />
                                </a>
                                <button onClick={() => setSelectedArticle(null)}
                                    className="w-full py-2.5 rounded-xl font-body text-sm"
                                    style={{ border: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LawUpdates;