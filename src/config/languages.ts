export const LANGUAGES = {
  Telugu: {
    code: 'Telugu',
    nativeLabel: 'తెలుగు',
    speechCode: 'te-IN' as const,
    placeholder: 'మీ సమస్య చెప్పండి లేదా మాట్లాడండి...',
    listeningLabel: 'వింటున్నాను...',
    thinkingLabel: 'ఆలోచిస్తున్నాను...',
    sections: {
      right: 'మీ హక్కు',
      say: 'మీరు ఏమి చెప్పాలి',
      step: 'తదుపరి చర్య',
    },
  },
  Hindi: {
    code: 'Hindi',
    nativeLabel: 'हिंदी',
    speechCode: 'hi-IN' as const,
    placeholder: 'अपनी समस्या बताएं या बोलें...',
    listeningLabel: 'सुन रहा हूं...',
    thinkingLabel: 'सोच रहा हूं...',
    sections: {
      right: 'आपका अधिकार',
      say: 'आप क्या कहें',
      step: 'अगला कदम',
    },
  },
  English: {
    code: 'English',
    nativeLabel: 'English',
    speechCode: 'en-IN' as const,
    placeholder: 'Type or speak your legal question...',
    listeningLabel: 'Listening...',
    thinkingLabel: 'Thinking...',
    sections: {
      right: 'YOUR RIGHT',
      say: 'WHAT TO SAY',
      step: 'NEXT STEP',
    },
  },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const QUICK_QUESTIONS: Record<LanguageCode, string[]> = {
  Telugu: [
    'నా ఇంట్లో నుండి అక్రమంగా వేరే చేయడం చట్టబద్ధమేనా?',
    'నా యజమాని జీతం ఇవ్వడం లేదు, నేను ఏమి చేయాలి?',
    'గృహహింస విషయంలో నాకు ఏ హక్కులు ఉన్నాయి?',
    'FIR ఎలా నమోదు చేయాలి?',
    'వినియోగదారుడిగా నాకు ఏ హక్కులు ఉన్నాయి?',
  ],
  Hindi: [
    'क्या मुझे मेरे घर से गैरकानूनी तरीके से बेदखल किया जा सकता है?',
    'मेरा मालिक तनख्वाह नहीं दे रहा, मैं क्या करूं?',
    'घरेलू हिंसा में मेरे क्या अधिकार हैं?',
    'FIR कैसे दर्ज करें?',
    'उपभोक्ता के रूप में मेरे क्या अधिकार हैं?',
  ],
  English: [
    'Can my landlord evict me without notice?',
    'My employer is not paying my salary, what can I do?',
    'What are my rights in a domestic violence situation?',
    'How do I file an FIR at a police station?',
    'What are my rights as a consumer in India?',
  ],
};
