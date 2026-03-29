import { supabase } from '@/integrations/supabase/client';

export const updateCaseWithAudit = async (caseId: string, updates: Record<string, any>) => {
  try {
    // 1. Fetch current case values
    const { data: existingCase, error: fetchError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (fetchError || !existingCase) {
      console.warn("Could not fetch case for auditing", fetchError);
      return await supabase.from('cases').update(updates as any).eq('id', caseId).select().single();
    }

    // 2. Identify changed fields and insert audit logs
    const logsToInsert = [];
    for (const [key, newValue] of Object.entries(updates)) {
      if (existingCase[key] !== newValue && newValue !== undefined) {
        logsToInsert.push({
          case_id: caseId,
          field_name: key,
          old_value: existingCase[key] !== null ? String(existingCase[key]) : null,
          new_value: newValue !== null ? String(newValue) : null,
        });
      }
    }

    if (logsToInsert.length > 0) {
      await (supabase as any).from('case_audit_logs').insert(logsToInsert);
    }

    // 3. Perform the actual update
    return await supabase.from('cases').update(updates as any).eq('id', caseId).select().single();
    
  } catch (error) {
    console.error("Audit logging wrapped update failed:", error);
    // Fallback to regular update just in case audit strictly fails so we don't break features
    return await supabase.from('cases').update(updates as any).eq('id', caseId).select().single();
  }
};
