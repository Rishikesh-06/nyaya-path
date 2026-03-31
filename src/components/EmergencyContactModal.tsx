import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, User, Mail, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContact {
    id?: string;
    name: string;
    phone: string;
    email: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (contact: EmergencyContact) => void;
}

const EmergencyContactModal = ({ isOpen, onClose, onSaved }: Props) => {
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [contact, setContact] = useState<EmergencyContact>({
        name: '',
        phone: '',
        email: '',
    });

    useEffect(() => {
        if (!isOpen || !user) return;
        setFetching(true);
        (supabase as any)
            .from('emergency_contacts')
            .select('*')
            .eq('user_id', user.id)
            .single()
            .then(({ data }: any) => {
                if (data) {
                    setContact({ id: data.id, name: data.name, phone: data.phone, email: data.email || '' });
                }
                setFetching(false);
            });
    }, [isOpen, user]);

    const handleSave = async () => {
        if (!contact.name.trim() || !contact.phone.trim()) {
            toast({ title: 'Please enter name and phone number', variant: 'destructive' });
            return;
        }
        if (!user) return;
        setLoading(true);
        try {
            if (contact.id) {
                await (supabase as any)
                    .from('emergency_contacts')
                    .update({ name: contact.name, phone: contact.phone, email: contact.email, updated_at: new Date().toISOString() })
                    .eq('id', contact.id);
            } else {
                const { data } = await (supabase as any)
                    .from('emergency_contacts')
                    .insert({ user_id: user.id, name: contact.name, phone: contact.phone, email: contact.email })
                    .select()
                    .single();
                if (data) setContact(prev => ({ ...prev, id: data.id }));
            }
            toast({ title: '✅ Emergency contact saved!' });
            onSaved(contact);
            onClose();
        } catch (err) {
            toast({ title: 'Failed to save contact', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-md rounded-2xl p-6"
                        style={{ background: isDark ? '#1a1a2e' : '#fff', border: `1px solid ${colors.border}` }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                                    <Shield className="w-5 h-5" style={{ color: '#ef4444' }} />
                                </div>
                                <div>
                                    <h2 className="font-display font-semibold text-base" style={{ color: colors.textPrimary }}>Emergency Contact</h2>
                                    <p className="text-xs font-body" style={{ color: colors.textMuted }}>They'll be called if you're in crisis</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${colors.border}` }}>
                                <X className="w-4 h-4" style={{ color: colors.textMuted }} />
                            </button>
                        </div>

                        {fetching ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="text-xs font-body font-semibold mb-1.5 block" style={{ color: colors.textSecondary }}>
                                        Full Name *
                                    </label>
                                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${colors.border}`, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                                        <User className="w-4 h-4 flex-shrink-0" style={{ color: colors.textMuted }} />
                                        <input
                                            value={contact.name}
                                            onChange={e => setContact(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g. Ravi Kumar"
                                            className="flex-1 bg-transparent outline-none text-sm font-body"
                                            style={{ color: colors.textPrimary }}
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="text-xs font-body font-semibold mb-1.5 block" style={{ color: colors.textSecondary }}>
                                        Phone Number * (with country code)
                                    </label>
                                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${colors.border}`, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                                        <Phone className="w-4 h-4 flex-shrink-0" style={{ color: colors.textMuted }} />
                                        <input
                                            value={contact.phone}
                                            onChange={e => setContact(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="+91 98765 43210"
                                            className="flex-1 bg-transparent outline-none text-sm font-body"
                                            style={{ color: colors.textPrimary }}
                                        />
                                    </div>
                                    <p className="text-[11px] font-body mt-1" style={{ color: colors.textMuted }}>
                                        ⚠️ This number will receive a phone call in emergency
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="text-xs font-body font-semibold mb-1.5 block" style={{ color: colors.textSecondary }}>
                                        Email (optional)
                                    </label>
                                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${colors.border}`, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                                        <Mail className="w-4 h-4 flex-shrink-0" style={{ color: colors.textMuted }} />
                                        <input
                                            value={contact.email}
                                            onChange={e => setContact(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="contact@email.com"
                                            className="flex-1 bg-transparent outline-none text-sm font-body"
                                            style={{ color: colors.textPrimary }}
                                        />
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl font-body font-semibold text-sm nyaya-transition mt-2"
                                    style={{ background: '#ef4444', color: '#fff', opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? 'Saving...' : contact.id ? 'Update Contact' : 'Save Emergency Contact'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EmergencyContactModal;