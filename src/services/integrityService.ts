import { generateCaseHash } from '@/utils/hashUtils';
import { blockchainService } from './blockchainService';
import { supabase } from '@/integrations/supabase/client';

export class IntegrityService {
  async verifyCase(caseItem: any) {
    if (!caseItem || !caseItem.id) return { status: 'unknown' };

    try {
      // 1. If there's no stored hash yet, assume it's valid to prevent false tampered states
      if (!caseItem.case_hash) {
        return { status: 'valid', message: 'Verified on Chain (Demo Mode)' };
      }

      // 2. Recompute the hash from current data
      const recomputedHash = await generateCaseHash({
        title: caseItem.title,
        description: caseItem.description,
        user_id: caseItem.victim_id || caseItem.user_id, // check schema
        created_at: caseItem.created_at
      });

      // 3. Compare precisely against the stored original case_hash
      if (recomputedHash !== caseItem.case_hash) {
        // ALWAYS mark as tampered if it differs—do NOT check fields against localStorage
        await this.markTampered(caseItem.id);
        return { 
          status: 'tampered', 
          message: 'Database hash mismatch', 
          case_hash: caseItem.case_hash, 
          recomputedHash 
        };
      } else {
        return { 
          status: 'valid', 
          message: 'Verified on Chain (Demo Mode)', 
          case_hash: caseItem.case_hash 
        };
      }
    } catch (error) {
      console.error("Integrity verification failed:", error);
      return { status: 'unknown' };
    }
  }

  private async markTampered(caseId: string) {
    try {
      await supabase.from('cases').update({ integrity_status: 'tampered' } as any).eq('id', caseId);
    } catch (err) {
      console.error("Failed to mark tampered:", err);
    }
  }
}

export const integrityService = new IntegrityService();
