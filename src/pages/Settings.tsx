import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/useResponsive';
import { LAWYER_CATEGORIES } from '@/utils/categoryMapping';

const Settings = () => {
  const { user, refreshProfile } = useAuth();
  const { setLanguage, language } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '', email: '', phone: '', city: '', state: '',
    age: '', gender: '', preferred_language: 'English',
    bio: '', fee_range_min: 0, fee_range_max: 0,
    university: '', year_of_study: 0,
    specialization: [] as string[],
  });

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (data) {
        setProfile({
          full_name: data.full_name || '', email: data.email || '',
          phone: (data as any).phone || '', city: data.city || '',
          state: (data as any).state || '',
          age: (data as any).age ? String((data as any).age) : '',
          gender: (data as any).gender || '',
          preferred_language: data.preferred_language || 'English',
          bio: data.bio || '', fee_range_min: data.fee_range_min || 0,
          fee_range_max: data.fee_range_max || 0,
          university: data.university || '', year_of_study: data.year_of_study || 0,
          specialization: data.specialization || [],
        });
      }
    };
    load();
  }, [user?.id]);

  const l = (te: string, hi: string, en: string) => language === 'Telugu' ? te : language === 'Hindi' ? hi : en;

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const updates: any = {
        full_name: profile.full_name, phone: profile.phone || null,
        city: profile.city || null, state: profile.state || null,
        age: profile.age ? parseInt(profile.age) : null,
        gender: profile.gender || null, preferred_language: profile.preferred_language,
      };
      if (user.role === 'lawyer') {
        updates.bio = profile.bio || null;
        updates.fee_range_min = profile.fee_range_min;
        updates.fee_range_max = profile.fee_range_max;
        updates.specialization = profile.specialization;
      }
      if (user.role === 'student') {
        updates.university = profile.university || null;
        updates.year_of_study = profile.year_of_study || null;
      }
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;
      await setLanguage(profile.preferred_language as any);
      await refreshProfile();
      toast({ title: l('మార్పులు సేవ్ అయ్యాయి!', 'परिवर्तन सहेजे गए!', 'Changes saved!') });
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 16px',
    border: `1px solid ${colors.border}`,
    borderRadius: '10px', fontFamily: "'Inter', sans-serif",
    color: colors.textPrimary, background: colors.inputBg,
    boxSizing: 'border-box', outline: 'none',
    backdropFilter: 'blur(12px)',
    transition: 'all 0.2s ease',
    fontSize: '14px',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: colors.textMuted,
    marginBottom: '6px', display: 'block',
    letterSpacing: '0.5px', textTransform: 'uppercase',
  };
  const cardStyle: React.CSSProperties = {
    background: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.85)',
    borderRadius: '16px', padding: isMobile ? '16px' : '28px', marginBottom: '20px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.95)'}`,
    backdropFilter: 'blur(24px)',
    boxShadow: colors.shadowCard,
  };
  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: '16px', fontWeight: 700, color: colors.gold, margin: '0 0 20px',
    fontFamily: "'Playfair Display', serif",
  };

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.border = `1px solid ${colors.gold}`;
  };
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.border = `1px solid ${colors.border}`;
  };

  return (
    <div style={{ maxWidth: '680px' }}>
      <h1 className="text-xl md:text-[28px] font-bold mb-6 md:mb-8 font-display" style={{ color: colors.textHeading }}>
        {l('సెట్టింగులు', 'सेटिंग्स', 'Settings')}
      </h1>

      {/* Theme Section */}
      <div style={cardStyle}>
        <h2 style={sectionHeadingStyle}>{l('థీమ్', 'थीम', 'Theme')}</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => isDark && toggleTheme()}
            style={{
              flex: 1, padding: '14px', borderRadius: '12px',
              border: `2px solid ${!isDark ? colors.gold : colors.border}`,
              background: !isDark ? `${colors.gold}15` : colors.cardBg,
              color: !isDark ? colors.gold : colors.textSecondary,
              fontWeight: !isDark ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            ☀️ {l('లైట్ మోడ్', 'लाइट मोड', 'Light Mode')}
          </button>
          <button
            onClick={() => !isDark && toggleTheme()}
            style={{
              flex: 1, padding: '14px', borderRadius: '12px',
              border: `2px solid ${isDark ? colors.gold : colors.border}`,
              background: isDark ? `${colors.gold}15` : colors.cardBg,
              color: isDark ? colors.gold : colors.textSecondary,
              fontWeight: isDark ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            🌙 {l('డార్క్ మోడ్', 'डार्क मोड', 'Dark Mode')}
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionHeadingStyle}>{l('వ్యక్తిగత వివరాలు', 'व्यक्तिगत जानकारी', 'Personal Information')}</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: colors.navy, border: `2px solid ${colors.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 700, flexShrink: 0 }}>
            {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm md:text-base truncate" style={{ color: colors.textPrimary }}>{profile.full_name || 'User'}</p>
            <p className="text-xs md:text-[13px] truncate" style={{ color: colors.textSecondary }}>{profile.email}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>{l('పూర్తి పేరు', 'पूरा नाम', 'Full Name')}</label>
            <input style={inputStyle} value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} onFocus={focusHandler} onBlur={blurHandler} />
          </div>
          <div>
            <label style={labelStyle}>{l('ఫోన్ నంబర్', 'फोन नंबर', 'Phone Number')}</label>
            <input style={inputStyle} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" onFocus={focusHandler} onBlur={blurHandler} />
          </div>
          <div>
            <label style={labelStyle}>{l('నగరం', 'शहर', 'City')}</label>
            <input style={inputStyle} value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} onFocus={focusHandler} onBlur={blurHandler} />
          </div>
          <div>
            <label style={labelStyle}>{l('రాష్ట్రం', 'राज्य', 'State')}</label>
            <input style={inputStyle} value={profile.state} onChange={e => setProfile(p => ({ ...p, state: e.target.value }))} onFocus={focusHandler} onBlur={blurHandler} />
          </div>
          <div>
            <label style={labelStyle}>{l('వయసు', 'आयु', 'Age')}</label>
            <input style={inputStyle} type="number" value={profile.age} onChange={e => setProfile(p => ({ ...p, age: e.target.value }))} onFocus={focusHandler} onBlur={blurHandler} />
          </div>
          <div>
            <label style={labelStyle}>{l('లింగం', 'लिंग', 'Gender')}</label>
            <select style={{ ...inputStyle, background: colors.inputBg }} value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))} onFocus={focusHandler as any} onBlur={blurHandler as any}>
              <option value="">{l('ఎంచుకోండి', 'चुनें', 'Select')}</option>
              <option value="female">{l('స్త్రీ', 'महिला', 'Female')}</option>
              <option value="male">{l('పురుషుడు', 'पुरुष', 'Male')}</option>
              <option value="other">{l('ఇతర', 'अन्य', 'Other')}</option>
              <option value="prefer_not_to_say">{l('చెప్పడం ఇష్టం లేదు', 'बताना पसंद नहीं', 'Prefer not to say')}</option>
            </select>
          </div>
        </div>

        {user?.role === 'lawyer' && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{l('బయో', 'बायो', 'Bio')}</label>
              <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'none' } as React.CSSProperties} onFocus={focusHandler as any} onBlur={blurHandler as any} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>{l('కనీస ఫీజు', 'न्यूनतम शुल्क', 'Min Fee (₹)')}</label>
                <input style={inputStyle} type="number" value={profile.fee_range_min} onChange={e => setProfile(p => ({ ...p, fee_range_min: parseInt(e.target.value) || 0 }))} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
              <div>
                <label style={labelStyle}>{l('గరిష్ట ఫీజు', 'अधिकतम शुल्क', 'Max Fee (₹)')}</label>
                <input style={inputStyle} type="number" value={profile.fee_range_max} onChange={e => setProfile(p => ({ ...p, fee_range_max: parseInt(e.target.value) || 0 }))} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>{l('నైపుణ్యం (Specialization)', 'विशेषज्ञता (Specialization)', 'Areas of Specialization')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {LAWYER_CATEGORIES.map(cat => {
                  const isSelected = profile.specialization.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProfile(p => ({
                        ...p,
                        specialization: isSelected ? p.specialization.filter(c => c !== cat) : [...p.specialization, cat]
                      }))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: isSelected ? `2px solid ${colors.gold}` : `1px solid ${colors.border}`,
                        background: isSelected ? `${colors.gold}15` : colors.cardBg,
                        color: isSelected ? colors.gold : colors.textSecondary,
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {user?.role === 'student' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={labelStyle}>{l('విశ్వవిద్యాలయం', 'विश्वविद्यालय', 'University')}</label>
              <input style={inputStyle} value={profile.university} onChange={e => setProfile(p => ({ ...p, university: e.target.value }))} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>{l('సంవత్సరం', 'वर्ष', 'Year of Study')}</label>
              <input style={inputStyle} type="number" value={profile.year_of_study} onChange={e => setProfile(p => ({ ...p, year_of_study: parseInt(e.target.value) || 0 }))} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={sectionHeadingStyle}>{l('భాష ప్రాధాన్యత', 'भाषा प्राथमिकता', 'Language Preference')}</h2>
        <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
          {['Telugu', 'Hindi', 'English'].map(lang => (
            <button key={lang} onClick={() => setProfile(p => ({ ...p, preferred_language: lang }))} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: profile.preferred_language === lang ? `2px solid ${colors.gold}` : `1px solid ${colors.border}`, background: profile.preferred_language === lang ? `${colors.gold}15` : 'transparent', color: profile.preferred_language === lang ? colors.gold : colors.textSecondary, fontWeight: profile.preferred_language === lang ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>
              {lang === 'Telugu' ? 'తెలుగు' : lang === 'Hindi' ? 'हिंदी' : 'English'}
            </button>
          ))}
        </div>
      </div>

      <motion.button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '14px', background: saving ? '#9ca3af' : 'linear-gradient(135deg, #c9a227, #e2c97e)', color: '#1a1a2e', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: '4px', marginBottom: '20px' }} whileHover={saving ? {} : { scale: 1.01 }} whileTap={saving ? {} : { scale: 0.98 }}>
        {saving && <Loader2 className="w-4 h-4 animate-spin inline mr-2" />}
        {saving ? l('సేవ్ అవుతున్నది...', 'सहेजा जा रहा है...', 'Saving...') : l('మార్పులు సేవ్ చేయండి', 'परिवर्तन सहेजें', 'Save Changes')}
      </motion.button>

      <div style={cardStyle}>
        <h2 style={sectionHeadingStyle}>{l('పాస్‌వర్డ్ మార్చండి', 'पासवर्ड बदलें', 'Change Password')}</h2>
        <PasswordChangeSection language={language} colors={colors} />
      </div>
    </div>
  );
};

const PasswordChangeSection = ({ language, colors }: { language: string; colors: any }) => {
  const { toast } = useToast();
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' });
  const [changing, setChanging] = useState(false);
  const l = (te: string, hi: string, en: string) => language === 'Telugu' ? te : language === 'Hindi' ? hi : en;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px', fontFamily: 'inherit',
    color: colors.textPrimary, background: colors.inputBg,
    boxSizing: 'border-box', outline: 'none',
  };

  const handleChange = async () => {
    if (passwords.newPass !== passwords.confirm) { toast({ title: l('పాస్‌వర్డ్‌లు సరిపోలడం లేదు', 'पासवर्ड मेल नहीं खाते', 'Passwords do not match'), variant: 'destructive' }); return; }
    if (passwords.newPass.length < 6) { toast({ title: l('పాస్‌వర్డ్ చాలా చిన్నది', 'पासवर्ड बहुत छोटा है', 'Password too short (min 6)'), variant: 'destructive' }); return; }
    setChanging(true);
    const { error } = await (await import('@/integrations/supabase/client')).supabase.auth.updateUser({ password: passwords.newPass });
    if (error) toast({ title: error.message, variant: 'destructive' });
    else { toast({ title: l('పాస్‌వర్డ్ అప్‌డేట్ అయింది', 'पासवर्ड अपडेट हुआ', 'Password updated') }); setPasswords({ newPass: '', confirm: '' }); }
    setChanging(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input type="password" placeholder={l('కొత్త పాస్‌వర్డ్', 'नया पासवर्ड', 'New password')} value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} style={inputStyle} />
      <input type="password" placeholder={l('పాస్‌వర్డ్ నిర్ధారించండి', 'पासवर्ड की पुष्टि करें', 'Confirm password')} value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} style={inputStyle} />
      <button onClick={handleChange} disabled={changing} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: colors.cardBg, color: colors.textSecondary, border: `1px solid ${colors.border}`, cursor: changing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '14px' }}>
        {changing ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
        {l('పాస్‌వర్డ్ అప్‌డేట్ చేయండి', 'पासवर्ड अपडेट करें', 'Update Password')}
      </button>
    </div>
  );
};

export default Settings;
