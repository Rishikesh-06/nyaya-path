import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, X, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Props {
  lawyer: any;
  onClose: () => void;
}

const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

const BookAppointment = ({ lawyer, onClose }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate next 30 days (excluding Sundays)
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  }).filter(d => d.getDay() !== 0);

  useEffect(() => {
    if (!selectedDate) return;
    supabase.from('appointments')
      .select('time_slot')
      .eq('lawyer_id', lawyer.id)
      .eq('date', selectedDate)
      .neq('status', 'cancelled')
      .then(({ data }) => {
        setBookedSlots((data || []).map((a: any) => a.time_slot));
      });
  }, [selectedDate, lawyer.id]);

  const handleBook = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('appointments').insert({
        victim_id: user.id,
        lawyer_id: lawyer.id,
        date: selectedDate,
        time_slot: selectedSlot,
        fee: lawyer.fee_range_min || 0,
        notes: notes || null,
      });
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: lawyer.id,
        type: 'appointment_update',
        title: 'New Appointment Request',
        body: `${user.full_name} booked for ${new Date(selectedDate).toLocaleDateString()} at ${selectedSlot}.`,
        related_id: lawyer.id,
      });

      toast({ title: 'Appointment booked successfully!' });
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to book appointment. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-md rounded-2xl p-6 relative" style={{ background: 'rgba(255,255,255,0.95)', color: '#1a3c5e' }} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5" style={{ color: '#6b7280' }} /></button>
        <h3 className="font-display text-xl font-bold mb-1" style={{ color: '#1a3c5e' }}>Book Appointment</h3>
        <p className="text-xs font-body mb-4" style={{ color: '#6b7280' }}>with {lawyer.full_name}</p>

        {step === 1 && (
          <div>
            <p className="text-sm font-body font-semibold mb-3" style={{ color: '#1a3c5e' }}>Select a Date</p>
            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
              {dates.map(d => {
                const ds = d.toISOString().split('T')[0];
                const isSelected = selectedDate === ds;
                return (
                  <button key={ds} onClick={() => setSelectedDate(ds)} className="p-2 rounded-lg text-center nyaya-transition" style={isSelected ? { background: '#1a3c5e', color: '#fff' } : { background: 'rgba(26,60,94,0.06)', color: '#4b5563' }}>
                    <p className="text-[10px] font-body">{d.toLocaleDateString('en', { weekday: 'short' })}</p>
                    <p className="text-sm font-body font-semibold">{d.getDate()}</p>
                  </button>
                );
              })}
            </div>
            {selectedDate && (
              <motion.button onClick={() => setStep(2)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-body font-semibold" style={{ background: '#1a3c5e', color: '#fff' }} whileHover={{ scale: 1.01 }}>
                Next
              </motion.button>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-sm font-body font-semibold mb-3" style={{ color: '#1a3c5e' }}>Select Time Slot — {new Date(selectedDate).toLocaleDateString()}</p>
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map(slot => {
                const booked = bookedSlots.includes(slot);
                const isSelected = selectedSlot === slot;
                return (
                  <button key={slot} onClick={() => !booked && setSelectedSlot(slot)} disabled={booked} className="px-3 py-2.5 rounded-lg text-sm font-body nyaya-transition" style={booked ? { background: 'rgba(239,68,68,0.08)', color: '#ef4444', opacity: 0.5 } : isSelected ? { background: '#1a3c5e', color: '#fff' } : { background: 'rgba(26,60,94,0.06)', color: '#4b5563' }}>
                    <Clock className="w-3 h-3 inline mr-1" />{slot} {booked && '(Booked)'}
                  </button>
                );
              })}
            </div>
            {selectedSlot && (
              <motion.button onClick={() => setStep(3)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-body font-semibold" style={{ background: '#1a3c5e', color: '#fff' }} whileHover={{ scale: 1.01 }}>
                Next
              </motion.button>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-sm font-body font-semibold mb-3" style={{ color: '#1a3c5e' }}>Confirm Booking</p>
            <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(26,60,94,0.04)' }}>
              <p className="text-xs font-body" style={{ color: '#6b7280' }}>Date: <span className="font-semibold" style={{ color: '#1a3c5e' }}>{new Date(selectedDate).toLocaleDateString()}</span></p>
              <p className="text-xs font-body" style={{ color: '#6b7280' }}>Time: <span className="font-semibold" style={{ color: '#1a3c5e' }}>{selectedSlot}</span></p>
              <p className="text-xs font-body" style={{ color: '#6b7280' }}>Fee: <span className="font-semibold" style={{ color: '#1a3c5e' }}>₹{lawyer.fee_range_min || 0} - ₹{lawyer.fee_range_max || 0}</span></p>
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} className="w-full px-3 py-2 rounded-xl text-sm font-body resize-none mb-3" style={{ background: 'rgba(26,60,94,0.04)', border: '1px solid rgba(26,60,94,0.1)', color: '#1a3c5e' }} />
            <motion.button onClick={handleBook} disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-body font-semibold flex items-center justify-center gap-2" style={{ background: '#c9a227', color: '#0d1f35' }} whileHover={{ scale: 1.01 }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm Booking
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BookAppointment;
