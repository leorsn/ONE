import { supabase } from '@/src/supabase/client';
import type { OneAIInterpretationProvider } from './intelligence';

export const remoteCaptureIntelligenceProvider: OneAIInterpretationProvider = {
  provider: 'openai-via-supabase',
  model: 'gpt-5.6-luna',
  async interpret(input) {
    const { data, error } = await supabase.functions.invoke('interpret-one-capture', {
      body: input
    });

    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
    if (!data?.interpretation) throw new Error('missing_capture_interpretation');
    return data.interpretation;
  }
};
