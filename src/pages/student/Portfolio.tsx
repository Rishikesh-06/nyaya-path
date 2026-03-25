import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Star, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ScrollReveal from '@/components/ScrollReveal';
import TiltCard from '@/components/TiltCard';
import PortfolioCard2D from '@/components/2d/PortfolioCard2D';
import jsPDF from 'jspdf';

const Portfolio = () => {
  const { user } = useAuth();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('internships').select('*, lawyer:users!internships_lawyer_id_fkey(full_name, specialization, bar_council_number)').eq('student_id', user.id).eq('status', 'completed').order('end_date', { ascending: false }).then(({ data }) => {
      setInternships(data || []);
      setLoading(false);
    });
  }, [user]);

  const downloadPDF = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    const profile = profileData;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;

    // ─── BACKGROUND ───
    doc.setFillColor(26, 60, 94);
    doc.rect(0, 0, pageWidth, 70, 'F');
    doc.setFillColor(201, 162, 39);
    doc.rect(0, 68, pageWidth, 3, 'F');

    // ─── HEADER CONTENT ───
    doc.setFontSize(11);
    doc.setTextColor(201, 162, 39);
    doc.setFont('helvetica', 'bold');
    doc.text('NYAYA', 20, 18);

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text('VERIFIED PORTFOLIO', 20, 25);

    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(profile?.full_name || 'Legal Intern', 20, 45);

    doc.setFontSize(12);
    doc.setTextColor(201, 162, 39);
    doc.setFont('helvetica', 'normal');
    doc.text(profile?.university || 'Law University', 20, 53);

    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(user?.email || '', pageWidth - 20, 45, { align: 'right' });
    if (profile?.phone) doc.text(profile.phone, pageWidth - 20, 51, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 20, 64, { align: 'right' });

    // ─── ABOUT / BIO SECTION ───
    let yPos = 85;

    if (profile?.bio) {
      doc.setFontSize(11);
      doc.setTextColor(26, 60, 94);
      doc.setFont('helvetica', 'bold');
      doc.text('ABOUT', 20, yPos);
      doc.setDrawColor(201, 162, 39);
      doc.setLineWidth(0.5);
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      const bioLines = doc.splitTextToSize(profile.bio, 170);
      doc.text(bioLines, 20, yPos);
      yPos += bioLines.length * 5 + 10;
    }

    // ─── PERSONAL DETAILS SECTION ───
    doc.setFontSize(11);
    doc.setTextColor(26, 60, 94);
    doc.setFont('helvetica', 'bold');
    doc.text('PERSONAL DETAILS', 20, yPos);
    doc.setDrawColor(201, 162, 39);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 12;

    const details = [
      ['City', profile?.city || '—'],
      ['State', profile?.state || '—'],
      ['Age', profile?.age ? `${profile.age} years` : '—'],
      ['Gender', profile?.gender || '—'],
      ['Specialization', profile?.specialization?.join(', ') || '—'],
      ['Bar Enrollment No.', profile?.bar_council_number || '—'],
      ['Year of Study', profile?.year_of_study ? String(profile.year_of_study) : '—'],
    ].filter(([, val]) => val !== '—');

    const col1 = details.slice(0, Math.ceil(details.length / 2));
    const col2 = details.slice(Math.ceil(details.length / 2));

    col1.forEach(([label, value], i) => {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      doc.text(String(label).toUpperCase(), 20, yPos + i * 10);
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value), 20, yPos + i * 10 + 4);
    });
    col2.forEach(([label, value], i) => {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      doc.text(String(label).toUpperCase(), 110, yPos + i * 10);
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value), 110, yPos + i * 10 + 4);
    });
    yPos += Math.max(col1.length, col2.length) * 10 + 15;

    // ─── PERSONAL OBJECTIVE ───
    if (yPos > 230) { doc.addPage(); yPos = 20; }
    doc.setFontSize(11);
    doc.setTextColor(26, 60, 94);
    doc.setFont('helvetica', 'bold');
    doc.text('PERSONAL OBJECTIVE', 20, yPos);
    doc.setDrawColor(201, 162, 39);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 12;

    const objectiveText = profile?.bio && profile.bio.trim().length > 10
      ? profile.bio
      : `I am a passionate and dedicated law student with a strong commitment to justice and legal excellence. Through my internship experience on the Nyaya platform, I have developed practical skills in legal research, case analysis, and client communication. I am eager to contribute meaningfully to the legal profession, particularly in areas affecting underprivileged communities in India. My goal is to become a skilled advocate who bridges the gap between legal knowledge and accessible justice for all citizens.`;

    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFillColor(248, 249, 252);
    doc.setDrawColor(201, 162, 39);
    doc.setLineWidth(0.3);
    const objectiveLines = doc.splitTextToSize(objectiveText, 162);
    const objectiveHeight = objectiveLines.length * 5.5 + 10;
    doc.roundedRect(18, yPos - 4, 174, objectiveHeight, 3, 3, 'FD');
    doc.setFillColor(201, 162, 39);
    doc.rect(18, yPos - 4, 3, objectiveHeight, 'F');
    doc.setTextColor(70, 70, 70);
    doc.text(objectiveLines, 28, yPos + 2);
    yPos += objectiveHeight + 12;

    // ─── INTERNSHIP EXPERIENCES ───
    doc.setFontSize(11);
    doc.setTextColor(26, 60, 94);
    doc.setFont('helvetica', 'bold');
    doc.text('INTERNSHIP EXPERIENCES', 20, yPos);
    doc.setDrawColor(201, 162, 39);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 12;

    if (internships.length > 0) {
      internships.forEach((entry) => {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(248, 249, 252);
        doc.roundedRect(18, yPos - 5, 174, 48, 3, 3, 'F');
        doc.setFillColor(201, 162, 39);
        doc.rect(18, yPos - 5, 3, 48, 'F');

        doc.setFontSize(12);
        doc.setTextColor(26, 60, 94);
        doc.setFont('helvetica', 'bold');
        doc.text(`Mentor: ${entry.lawyer?.full_name || 'Senior Lawyer'}`, 28, yPos + 4);

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Specialization: ${entry.lawyer?.specialization?.join(', ') || 'General Law'}`, 28, yPos + 11);

        const dateStr = entry.end_date
          ? new Date(entry.end_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
          : 'N/A';
        doc.text(`Period: ${dateStr}`, 28, yPos + 18);

        if (entry.supervisor_rating) {
          const ratingNum = Math.round(entry.supervisor_rating);
          const starsText = '* '.repeat(ratingNum).trim();
          doc.setTextColor(201, 162, 39);
          doc.setFontSize(10);
          doc.text(`Rating: ${starsText}  (${ratingNum}/5)`, 28, yPos + 25);
        }

        if (entry.supervisor_review) {
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.setFont('helvetica', 'italic');
          const reviewLines = doc.splitTextToSize(`"${entry.supervisor_review}"`, 155);
          doc.text(reviewLines[0], 28, yPos + 32);
        }

        if (entry.skills_demonstrated?.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(26, 60, 94);
          doc.setFont('helvetica', 'normal');
          doc.text(`Skills: ${entry.skills_demonstrated.join(', ')}`, 28, yPos + 39);
        }

        yPos += 58;
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('No internship experiences recorded yet.', 20, yPos);
      yPos += 15;
    }

    // ─── FOOTER ───
    if (yPos > 260) {
      doc.addPage();
    }

    doc.setFillColor(26, 60, 94);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    doc.setFillColor(201, 162, 39);
    doc.rect(0, pageHeight - 22, pageWidth, 2, 'F');

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text('Verified by Nyaya Legal Platform', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Document ID: NYA-${Date.now().toString(36).toUpperCase()}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

    const fileName = `Nyaya_Portfolio_${(profile?.full_name || 'Intern').replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">My Portfolio</h2>
          <p className="text-sm font-body text-muted-foreground">{internships.length} verified internship experience{internships.length !== 1 ? 's' : ''}</p>
        </div>
        <motion.button onClick={downloadPDF} className="flex items-center gap-1 px-3 py-2 rounded-[10px] text-xs font-body font-semibold btn-shine" style={{ background: '#0d7377', color: '#fff' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Download className="w-3 h-3" /> Download PDF
        </motion.button>
      </div>

      

      {loading ? (
        <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}</div>
      ) : internships.length === 0 ? (
        <p className="text-sm font-body text-muted-foreground text-center py-8">Complete internships to build your portfolio.</p>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: 'rgba(13,115,119,0.15)' }} />
          <div className="space-y-6">
            {internships.map((item, i) => (
              <ScrollReveal key={item.id} delay={i * 0.2}>
                <div className="relative pl-12">
                  <div className="absolute left-3.5 top-2 w-3 h-3 rounded-full" style={{ background: '#0d7377', boxShadow: '0 0 0 4px hsl(var(--nyaya-dark))' }} />
                  <TiltCard className="glass-card p-5 rounded-xl" maxTilt={4}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded text-xs font-body font-medium" style={{ background: 'rgba(13,115,119,0.1)', color: '#0d7377' }}>
                        {item.lawyer?.specialization?.[0] || 'General'}
                      </span>
                      <CheckCircle className="w-3.5 h-3.5 text-nyaya-teal" strokeWidth={1.5} />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-body font-medium text-foreground">{item.lawyer?.full_name || 'Supervisor'}</p>
                      {item.supervisor_rating && (
                        <div className="flex">
                          {Array.from({ length: item.supervisor_rating }).map((_, j) => (
                            <Star key={j} className="w-3 h-3 text-nyaya-gold" fill="#c9a227" />
                          ))}
                        </div>
                      )}
                    </div>
                    {item.supervisor_review && <p className="text-xs font-body text-muted-foreground italic mb-2">"{item.supervisor_review}"</p>}
                    {item.skills_demonstrated?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.skills_demonstrated.map((s: string) => (
                          <span key={s} className="px-2 py-0.5 rounded text-xs font-body" style={{ background: 'rgba(255,255,255,0.04)', color: 'hsl(var(--muted-foreground))' }}>{s}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs font-body text-muted-foreground mt-2">{item.end_date ? new Date(item.end_date).toLocaleDateString() : ''}</p>
                  </TiltCard>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
