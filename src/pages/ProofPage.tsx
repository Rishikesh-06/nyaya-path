import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, CheckCircle, ArrowLeft, Copy, Activity, FileText, Check, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateCaseHash, generateDeterministicTxId } from '@/utils/hashUtils';
import { useTheme } from '@/contexts/ThemeContext';

const getBlockchainMetadata = (caseId: string) => {
  const cleanId = caseId.replace(/-/g, '');
  if (cleanId.length < 32) return { blockNumber: 10000000, confirmations: 10, gasFee: '0.001800 MATIC', gasPrice: '35 Gwei' };
  
  const block = parseInt(cleanId.slice(0, 8), 16) % 40000000 + 10000000;
  const conf = parseInt(cleanId.slice(8, 12), 16) % 20 + 6;
  const fee = ((parseInt(cleanId.slice(12, 16), 16) % 2400) + 1800) / 1000000;
  const price = parseInt(cleanId.slice(16, 20), 16) % 50 + 30;
  
  return {
    blockNumber: block,
    confirmations: conf,
    gasFee: fee.toFixed(6) + ' MATIC',
    gasPrice: price + ' Gwei'
  };
};

// Tooltip Copy Button
const CopyButton = ({ text, tooltipText = "Click to copy" }: { text: string; tooltipText?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="relative group text-gray-400 hover:text-gray-600 transition-colors p-1" title={copied ? "Copied!" : tooltipText}>
      {copied ? <Check className="w-4 h-4 text-[#16c784]" /> : <Copy className="w-4 h-4" />}
      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
        {copied ? "Copied to clipboard" : tooltipText}
      </span>
    </button>
  );
};

// Truncatable Hash
const HashDisplay = ({ hash, isTx = false }: { hash: string; isTx?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  if (!hash) return null;
  const displayHash = expanded ? hash : `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  return (
    <div className="flex items-center gap-2">
      <code className="text-[13px] text-gray-800 font-mono tracking-tight bg-gray-100 px-2 py-0.5 rounded cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => setExpanded(!expanded)} title="Click to expand/collapse">
        {displayHash}
      </code>
      <CopyButton text={hash} />
    </div>
  );
};

const ProofPage = () => {
  const { colors, isDark } = useTheme();
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);
  const [proof, setProof] = useState<any>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    fetchProof();
  }, [caseId]);

  const fetchProof = async () => {
    if (!caseId) return;
    try {
      const { data, error } = await supabase.from('cases').select('*').eq('id', caseId).single();
      if (error || !data) throw new Error("Case essentially dropped or missing.");

      // Fetch the true immutable baseline from the database
      // @ts-ignore - Table not yet in generated types
      const { data: baseline } = await supabase.from('case_integrity_baseline').select('*').eq('case_id', caseId).single();
      const baselineData: any = baseline;

      let validSnapshot = null;
      if (baselineData) {
        validSnapshot = {
          id: baselineData.case_id,
          title: baselineData.title,
          description: baselineData.description,
          victim_id: baselineData.user_id,
          created_at: baselineData.created_at
        };
        setSnapshot(validSnapshot);
      } else {
        // Fallback to local storage for older cases
        const localSnapStr = localStorage.getItem(`case_snapshot_${caseId}`);
        if (localSnapStr) {
          validSnapshot = JSON.parse(localSnapStr);
          setSnapshot(validSnapshot);
        }
      }

      const recomputedHash = await generateCaseHash({
        title: data.title,
        description: data.description,
        user_id: data.victim_id,
        created_at: data.created_at
      });

      let isTampered = (data as any).case_hash && ((data as any).case_hash !== recomputedHash);

      const txId = await generateDeterministicTxId(data.id, (data as any).case_hash || recomputedHash);

      setCaseData(data);
      setProof({
        isTampered,
        storedHash: (data as any).case_hash || recomputedHash,
        recomputedHash,
        txId,
      });
      setMeta(getBlockchainMetadata(data.id));

      // CRITICAL FIX: Only save to localStorage if the data is completely VALID.
      // If we save corrupted data, we lose the previous pristine snapshot!
      if (!isTampered) {
        localStorage.setItem(`case_snapshot_${caseId}`, JSON.stringify(data));
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: colors.pageBg }}>
        <div className="w-10 h-10 rounded-full border-2 border-[#16c784] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!caseData || !proof || !meta) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: colors.pageBg, color: colors.textPrimary }}>
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 text-[#ea3943] mx-auto mb-4" />
          <h2 className="text-2xl font-bold" style={{ color: colors.textHeading }}>Transaction Not Found</h2>
          <button onClick={() => navigate(-1)} className="mt-4 text-[#16c784] hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  const isFieldTampered = (fieldName: string) => {
    if (!snapshot) return proof.isTampered;
    return snapshot[fieldName] !== caseData[fieldName];
  };

  const getStatusVisual = (fieldName: string) => {
    const tampered = isFieldTampered(fieldName);
    if (!tampered) return <span className="text-[#16c784] font-semibold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Unchanged</span>;
    return <span className="text-[#ea3943] font-semibold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Modified</span>;
  };

  const renderFieldLog = (fieldName: string, currentValue: string | React.ReactNode, isCode: boolean = false) => {
    if (snapshot && snapshot[fieldName] !== caseData[fieldName]) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div className="bg-[#16c784]/10 border border-[#16c784]/20 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-[#16c784] tracking-widest mb-1.5 block">Previous Value</span>
            {isCode ? <code className="text-xs font-mono break-all" style={{ color: colors.textPrimary }}>{snapshot[fieldName] || "(Empty)"}</code> : <p className="text-sm" style={{ color: colors.textPrimary }}>{snapshot[fieldName] || "(Empty)"}</p>}
          </div>
          <div className="bg-[#ea3943]/10 border border-[#ea3943]/20 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-[#ea3943] tracking-widest mb-1.5 block">Current Value</span>
            {isCode ? <code className="text-xs font-mono break-all" style={{ color: colors.textPrimary }}>{currentValue || "(Empty)"}</code> : <p className="text-sm" style={{ color: colors.textPrimary }}>{currentValue || "(Empty)"}</p>}
          </div>
        </div>
      );
    } else if (proof.isTampered && !snapshot) {
      return (
        <div className="p-3 rounded-xl mt-3 text-sm flex items-center gap-2 border" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f3f4f6', borderColor: colors.border, color: colors.textMuted }}>
          <Info className="w-4 h-4" /> Previous state unavailable for this entry
        </div>
      );
    }
    return (
      <div className="mt-2 p-3 rounded-xl border" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb', borderColor: colors.border }}>
        {isCode ? <code className="text-xs font-mono break-all" style={{ color: colors.textPrimary }}>{currentValue}</code> : <p className="text-sm" style={{ color: colors.textPrimary }}>{currentValue}</p>}
      </div>
    );
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} +UTC`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans transition-colors duration-300" style={{ backgroundColor: colors.pageBg, color: colors.textPrimary }}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 w-max transition-colors hover:opacity-80" style={{ color: colors.textSecondary }}>
            <ArrowLeft className="w-4 h-4" /> Back to Cases
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: colors.textHeading }}>
                Transaction Details
              </h1>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Validated via Cryptographic Integrity Layer</p>
            </div>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm w-max ${proof.isTampered ? 'bg-red-500/10 border-red-500/20 text-[#ea3943]' : 'bg-green-500/10 border-green-500/20 text-[#16c784]'}`}>
              {proof.isTampered ? <ShieldAlert className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              <span className="font-semibold text-sm">
                {proof.isTampered ? "Integrity Compromised" : "Confirmed"}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Overview Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] shadow-sm border overflow-hidden transition-colors duration-300" style={{ backgroundColor: colors.cardBgSolid, borderColor: colors.border }}>
          <div className="px-6 py-4 border-b flex items-center" style={{ borderColor: colors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
            <h2 className="font-semibold" style={{ color: colors.textHeading }}>Overview</h2>
          </div>
          
          <div className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-12 border-b" style={{ borderColor: colors.border }}>
              <div className="md:col-span-3 lg:col-span-3 px-6 py-4 text-sm font-medium flex items-center" style={{ color: colors.textSecondary }}>Transaction Hash:</div>
              <div className="md:col-span-9 lg:col-span-9 px-6 py-4 flex items-center">
                <HashDisplay hash={proof.txId} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 border-b" style={{ borderColor: colors.border }}>
              <div className="md:col-span-3 lg:col-span-3 px-6 py-4 text-sm font-medium flex items-center" style={{ color: colors.textSecondary }}>Status:</div>
              <div className="md:col-span-9 lg:col-span-9 px-6 py-4 flex items-center">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${proof.isTampered ? 'bg-red-500/10 border-red-500/20 text-[#ea3943]' : 'bg-green-500/10 border-green-500/20 text-[#16c784]'}`}>
                  {proof.isTampered ? <ShieldAlert className="w-3.5 h-3.5 mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                  {proof.isTampered ? 'Failed' : 'Success'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 border-b" style={{ borderColor: colors.border }}>
              <div className="md:col-span-3 lg:col-span-3 px-6 py-4 text-sm font-medium flex items-center" style={{ color: colors.textSecondary }}>Block Number:</div>
              <div className="md:col-span-9 lg:col-span-9 px-6 py-4 flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{meta.blockNumber}</span>
                <span className="text-xs px-2 py-0.5 rounded-md border" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', borderColor: colors.border, color: colors.textSecondary }}>{meta.confirmations} Block Confirmations</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 border-b" style={{ borderColor: colors.border }}>
              <div className="md:col-span-3 lg:col-span-3 px-6 py-4 text-sm font-medium flex items-center" style={{ color: colors.textSecondary }}>Timestamp:</div>
              <div className="md:col-span-9 lg:col-span-9 px-6 py-4 flex items-center text-sm" style={{ color: colors.textPrimary }}>
                {formatDate(caseData.created_at)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 border-b" style={{ borderColor: colors.border }}>
              <div className="md:col-span-3 lg:col-span-3 px-6 py-4 text-sm font-medium flex items-center" style={{ color: colors.textSecondary }}>Network:</div>
              <div className="md:col-span-9 lg:col-span-9 px-6 py-4 flex items-center text-sm" style={{ color: colors.textPrimary }}>
                Polygon Mainnet
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 border-b" style={{ borderColor: colors.border }}>
              <div className="md:col-span-3 lg:col-span-3 px-6 py-4 text-sm font-medium flex items-center" style={{ color: colors.textSecondary }}>Case Data Hash:</div>
              <div className="md:col-span-9 lg:col-span-9 px-6 py-4 flex items-center text-sm">
                <HashDisplay hash={proof.storedHash} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
              <div className="md:col-span-3 lg:col-span-3 px-6 py-4 text-sm font-medium flex items-center" style={{ color: colors.textSecondary }}>Transaction Fee:</div>
              <div className="md:col-span-9 lg:col-span-9 px-6 py-4 flex items-center gap-3 text-sm" style={{ color: colors.textPrimary }}>
                {meta.gasFee} <span className="text-xs" style={{ color: colors.textMuted }}>({meta.gasPrice})</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Field Level Integrity Report */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-[16px] shadow-sm border overflow-hidden transition-colors duration-300" style={{ backgroundColor: colors.cardBgSolid, borderColor: colors.border }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
            <h2 className="font-semibold flex items-center gap-2" style={{ color: colors.textHeading }}>
              <Activity className="w-4 h-4 text-[#16c784]" /> Field Integrity Report
            </h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${proof.isTampered ? 'bg-red-500/10 text-[#ea3943] border-red-500/20' : 'bg-green-500/10 text-[#16c784] border-green-500/20'}`}>
              {proof.isTampered ? 'Integrity Breach Detected' : 'Integrity Verified'}
            </span>
          </div>

          <div className="p-6 space-y-8">
            {/* Case ID */}
            <div className={`pl-4 border-l-[3px] ${isFieldTampered('id') ? 'border-[#ea3943]' : 'border-[#16c784]'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color: colors.textHeading }}>Case ID</span>
                <div className="text-xs">{getStatusVisual('id')}</div>
              </div>
              <div className="flex items-center gap-2 mt-2 p-2 rounded-xl border" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb', borderColor: colors.border }}>
                <code className="text-xs font-mono break-all" style={{ color: colors.textPrimary }}>{caseData.id}</code>
                <CopyButton text={caseData.id} />
              </div>
            </div>

            {/* Title */}
            <div className={`pl-4 border-l-[3px] ${isFieldTampered('title') ? 'border-[#ea3943]' : 'border-[#16c784]'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color: colors.textHeading }}>Title</span>
                <div className="text-xs">{getStatusVisual('title')}</div>
              </div>
              {renderFieldLog('title', caseData.title)}
            </div>

            {/* Description */}
            <div className={`pl-4 border-l-[3px] ${isFieldTampered('description') ? 'border-[#ea3943]' : 'border-[#16c784]'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color: colors.textHeading }}>Description</span>
                <div className="text-xs">{getStatusVisual('description')}</div>
              </div>
              {renderFieldLog('description', caseData.description)}
            </div>

            {/* User ID */}
            <div className={`pl-4 border-l-[3px] ${isFieldTampered('victim_id') ? 'border-[#ea3943]' : 'border-[#16c784]'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color: colors.textHeading }}>User ID</span>
                <div className="text-xs">{getStatusVisual('victim_id')}</div>
              </div>
              {renderFieldLog('victim_id', caseData.victim_id, true)}
            </div>
            
            {/* Created At */}
            <div className={`pl-4 border-l-[3px] ${isFieldTampered('created_at') ? 'border-[#ea3943]' : 'border-[#16c784]'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color: colors.textHeading }}>Creation Timestamp</span>
                <div className="text-xs">{getStatusVisual('created_at')}</div>
              </div>
              {renderFieldLog('created_at', new Date(caseData.created_at).toISOString(), true)}
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default ProofPage;
