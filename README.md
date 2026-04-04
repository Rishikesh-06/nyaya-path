⚖️ Nyaya Path — Privacy-First Legal Intelligence Platform
Nyaya Path connects victims to legal help through anonymous reporting, AI-powered assistance, and cryptographic evidence integrity.
It ensures that justice is not just accessible — but also safe, private, and provably trustworthy.
"Justice should not depend on courage alone."
🚨 The Problem
Millions hesitate to seek legal help — not because the law fails, but because the system around it does.
Core gaps we address:
Victims fear exposure and retaliation
Legal help is difficult to access and navigate
Evidence can be manipulated or disputed
Language barriers limit understanding
No unified, secure legal platform exists
The issue is not law.
It is privacy, accessibility, and trust.
💡 What We Built
A unified legal platform with three interconnected interfaces:
Victim
Lawyer
Student
A victim reports a case anonymously.
AI detects urgency instantly.
The system structures the case for legal use.
Evidence is secured and made verifiable.
Not just assistance — a trust layer for justice.
🧩 Key Features
👤 Victim Interface
Anonymous case reporting — zero identity exposure
Real-time AI crisis detection
Emergency alerts (call + email automation)
Secure evidence upload
Multilingual support
Safe lawyer communication
⚖️ Lawyer Interface
AI-generated case summaries
Automatic language translation
Evidence integrity verification
Case dashboard and management
Secure client communication
🎓 Student Interface
Access to anonymized real-world cases
AI-powered legal explanations
Structured case breakdowns
Practical learning environment
⚡ Core Innovation
Nyaya Path is built on three pillars:
🔒 Privacy-First AI
Sensitive inputs are processed locally before any cloud interaction.
🧠 Hybrid Intelligence
Local AI → instant detection
Cloud AI → deep legal processing
⛓️ Verifiable Integrity
We don’t just store evidence — we prove it hasn’t been altered.
🔄 How It Works
Victim submits case → Local AI checks urgency →
Data stored securely → Hash generated → Anchored to blockchain →
AI processes case → Lawyer receives structured case
If even a single character changes → integrity check fails

graph TD
    subgraph Victim_Interface
        V1[Anonymous Reporting]
        V2[Crisis Detection]
        V3[Evidence Upload]
        V4[Emergency Alerts]
        V5[Secure Chat]
    end

    subgraph Lawyer_Interface
        L1[Case Dashboard]
        L2[AI Summary]
        L3[Translation]
        L4[Verification]
    end

    subgraph Student_Interface
        S1[Case Learning]
        S2[AI Explanation]
    end

    subgraph Backend
        B1[Supabase DB]
        B2[Auth]
        B3[Edge Functions]
    end

    subgraph AI
        A1[Local NLP]
        A2[Groq LLM]
    end

    subgraph Blockchain
        BL1[SHA-256]
        BL2[Polygon]
    end

    Victim_Interface --> Backend
    Backend --> AI
    Backend --> Blockchain
    AI --> Lawyer_Interface
    Blockchain --> Lawyer_Interface

    🧪 Tech Stack
Layer
Technology
Purpose
Frontend
React + TypeScript
Scalable UI
Styling
Tailwind + Shadcn + Framer Motion
Clean UX
Backend
Supabase
Realtime + Auth + Storage
Local AI
DistilBERT (Transformers.js)
Privacy-first detection
Cloud AI
Llama 3.3 (Groq)
Legal processing
Blockchain
Polygon + ethers.js
Integrity anchoring
Hashing
SHA-256
Data verification
Communication
Twilio + Resend + WebRTC
Alerts & calls
Deployment
Vercel
Serverless hosting
🔐 Integrity System
Case data is converted into deterministic format
SHA-256 hash is generated
Hash is anchored to Polygon
Live data is continuously verified
If modified → mismatch detected → flagged
This creates a tamper-evident legal system.
📈 Impact
Challenge
Nyaya Path
Fear of reporting
Anonymous system
Evidence tampering
Cryptographic proof
Legal complexity
AI simplification
Language barriers
Multilingual support
🚀 Vision
Start with India’s legal access gap
Expand into global legal infrastructure
👥 Team — EliteOrbit, BVRIT Narsapur
Gurrala Rishikesh — Lead, Full Stack
K. Pooja Sisira — Frontend
K. Vijaya Sri — Backend
