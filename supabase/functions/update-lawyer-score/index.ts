import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lawyerId, eventType, ratingValue, resolutionDays } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get current scores
    const { data: current } = await supabase
      .from('lawyer_scores')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .single();

    if (!current) {
      // Create score row if doesn't exist
      await supabase.from('lawyer_scores').insert({ lawyer_id: lawyerId });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    switch (eventType) {
      case 'case_accepted':
        updates.total_score = (current?.total_score || 0) + 10;
        updates.cases_accepted = (current?.cases_accepted || 0) + 1;
        break;
      case 'case_won':
        updates.total_score = (current?.total_score || 0) + 50;
        updates.cases_won = (current?.cases_won || 0) + 1;
        updates.cases_resolved = (current?.cases_resolved || 0) + 1;
        break;
      case 'resolved_fast':
        updates.total_score = (current?.total_score || 0) + 20;
        updates.fast_resolutions = (current?.fast_resolutions || 0) + 1;
        if (resolutionDays) {
          const totalResolved = (current?.cases_resolved || 0);
          updates.avg_resolution_days = totalResolved > 0
            ? (((current?.avg_resolution_days || 0) * (totalResolved - 1)) + resolutionDays) / totalResolved
            : resolutionDays;
        }
        break;
      case 'rating_received':
        const rating = ratingValue || 0;
        const newRatingSum = (current?.rating_sum || 0) + rating;
        const newTotalRatings = (current?.total_ratings || 0) + 1;
        updates.rating_sum = newRatingSum;
        updates.total_ratings = newTotalRatings;
        updates.avg_rating = newRatingSum / newTotalRatings;
        updates.total_score = (current?.total_score || 0) + (rating === 5 ? 15 : rating === 4 ? 5 : 0);
        break;
      case 'pro_bono':
        updates.total_score = (current?.total_score || 0) + 25;
        updates.pro_bono_count = (current?.pro_bono_count || 0) + 1;
        break;
      case 'anonymous_case':
        updates.anonymous_cases_count = (current?.anonymous_cases_count || 0) + 1;
        break;
      default:
        break;
    }

    await supabase
      .from('lawyer_scores')
      .update(updates)
      .eq('lawyer_id', lawyerId);

    // Check badges
    const { data: updatedScores } = await supabase
      .from('lawyer_scores')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .single();

    const newBadges: string[] = [];
    const badgeChecks = [
      { name: 'Justice Rookie', condition: (updatedScores?.cases_resolved || 0) >= 1 },
      { name: "People's Defender", condition: (updatedScores?.cases_won || 0) >= 10 },
      { name: 'Streak Warrior', condition: (updatedScores?.current_streak || 0) >= 5 },
      { name: 'Whistleblower Shield', condition: (updatedScores?.anonymous_cases_count || 0) >= 3 },
      { name: 'Pro Bono Hero', condition: (updatedScores?.pro_bono_count || 0) >= 10 },
      { name: 'Speed Demon', condition: (updatedScores?.fast_resolutions || 0) >= 10 },
    ];

    for (const badge of badgeChecks) {
      if (badge.condition) {
        const { error } = await supabase
          .from('badges')
          .upsert({ lawyer_id: lawyerId, badge_name: badge.name, badge_category: 'achievement' }, { onConflict: 'lawyer_id,badge_name' });
        if (!error) newBadges.push(badge.name);
      }
    }

    return new Response(JSON.stringify({ success: true, scores: updatedScores, newBadges }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Score update error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update score' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
