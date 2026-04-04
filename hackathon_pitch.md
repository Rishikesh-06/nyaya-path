# Nyaya Path - Hackathon Pitch & Presentation Guide

This document contains everything you need to build your PPT and practice your pitch. It is broken down into structured slides, followed by technical deep-dives on the architecture, AI models, and business viability.

---

## 📊 Presentation Deck Structure (Slide by Slide)

### Slide 1: Title Slide
* **Title:** Nyaya Path - Illuminating the Path to Justice
* **Subtitle:** An AI-driven, blockchain-secured legal assistance platform bridging the gap between victims and legal representation.
* **Talking Point:** "Good morning judges. Today we present Nyaya Path—a platform born out of the necessity to make legal help accessible, safe, and transparent for everyone."

### Slide 2: The Problem
* **Bullet Points:**
  * Victims of abuse or crime often fear speaking out due to privacy concerns and lack of immediate support.
  * Finding the right legal help is intimidating and complex.
  * In legal cases, evidence tampering and data integrity are massive challenges.
* **Talking Point:** "Currently, victims face immense friction. They are scared to speak up, struggle to find lawyers, and face cases where evidence can be easily manipulated."

### Slide 3: The Solution (Nyaya Path)
* **Bullet Points:**
  * **Anonymous Reporting:** Secure, private case posting for victims.
  * **AI-Powered Crisis Detection:** Real-time, on-device ML to detect emergencies and trigger instant alerts.
  * **Blockchain Integrity:** Cryptographic hashing of case data on the Polygon network to prove no evidence tampering occurred.
  * **Lawyer AI Toolkit:** AI tools to instantly summarize cases and bridge language barriers.

### Slide 4: Tech Stack Overview
* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion
* **Backend & DB:** Supabase (PostgreSQL Database, Edge Functions, Auth, Storage)
* **AI & Machine Learning:** Groq Cloud API, On-Device Local NLP Models
* **Blockchain:** Polygon Network via `ethers.js`
* **Real-time / Comms:** Twilio (Voice Alerts), Resend (Emails), WebRTC
* **Deployment:** Vercel

### Slide 5: The AI Architecture (Key Differentiator)
* **Bullet Points:**
  * **Hybrid AI Approach:** We combine the brute-force speed of **Groq Cloud** with the privacy of **On-Device Local AI**.
  * **Local Privacy Engine:** NLP models run directly in the user's browser for sentiment/crisis detection. *Zero sensitive text leaves the device during initial screening.*
  * **Ultra-Fast LLM:** Llama 3.3 via Groq for complex legal document summarization, anonymization, and automatic multilingual translation (e.g., translating victim reports to Telugu for local lawyers).

### Slide 6: Blockchain Security & Integrity
* **Bullet Points:**
  * Zero-trust evidence handling.
  * Every submitted case is deterministically hashed using cryptographic standards.
  * Hashes are actively anchored to the **Polygon** blockchain via Smart Contracts.
  * Provides a forensic "Proof Verification" explorer to immediately detect and flag if case data or evidence has been tampered with in the database.

### Slide 7: Feasibility & Viability
* **Bullet Points:**
  * **Highly Scalable:** Entirely serverless architecture paired with on-device ML compute allows infinite scaling.
  * **Cost-Effective:** Offloading initial ML inference to the browser CPU drastically reduces cloud compute costs. Groq provides incredibly cheap and fast LLM inference. Polygon Layer-2 provides sub-cent transaction fees.
  * **Market Need:** Addresses a high-demand market with a unique combination of maximum user privacy and legal-grade data integrity.

---

## 🛠️ Deep Dive: Complete Technical Info

*(Study this section to answer deep technical questions from the judges)*

### 1. The Multi-Model AI Implementation
We specifically chose a **hybrid AI architecture** to balance privacy, latency, and capability.
* **Model 1: `Xenova/distilbert` (Local ML via Transformers.js)**
  * **Where it's used:** `useCrisisDetection.ts` module.
  * **Why:** We run this sentiment analysis NLP model *locally inside the user's browser using WebAssembly*. If a victim is typing out a severe threat or suicide risk, the browser detects it immediately without needing to make a server API call. This ensures maximum privacy until an actual emergency is detected.
* **Model 2: `llama-3.3-70b-versatile` (Via Groq Cloud)**
  * **Where it's used:** AI Lawyer Toolkit (`AIToolkit.tsx`), Anonymous Case Summaries (`AnonymousCasePosting.tsx`), Sahaay Chat, Law Updates.
  * **Why:** Groq's LPU (Language Processing Unit) architecture provides industry-leading Tokens-Per-Second. We leverage the massive 70 Billion parameter Llama 3.3 open-weights model to accurately parse complex legal jargon, sanitize PII (Personally Identifiable Information) for anonymity, and automatically translate cases into regional languages.

### 2. The Blockchain & Data Integrity System
* **How it works:** When a victim uploads a document or case data, we don't just blindly trust the database. We use `ethers.js` to create a deterministic cryptographic SHA hash of the exact JSON payload.
* **Anchoring:** We anchor this hash onto the Polygon testnet using an isolated Backend Edge Function, removing any vulnerability from the frontend.
* **Verification:** The platform includes an interactive "Proof Viewer" that compares the live database fields against the blockchain hash. If a single comma is changed maliciously in our Postgres database, the integrity check fails, alerting the lawyer that the evidence is compromised.

### 3. Serverless Integration & Communication Orchestration
* **Edge Functions:** We use Supabase Edge Functions (running Deno) to securely orchestrate third-party APIs without exposing secrets to the frontend.
* **Emergency Routing:** When the local AI detects a crisis, it hits a secure webhook. These Edge functions instantly trigger **Twilio** to make an automated phone call to emergency contacts and use **Resend** to blast high-priority email alerts to authorities or NGOs.

### 4. Feasibility & Business Viability
* **Technical Feasibility:** The codebase utilizes modern, stable web standards. By utilizing WebAssembly (WASM) for local AI, we bypass the need for maintaining expensive, complex GPU Kubernetes clusters. It works on low-end laptops and mobile phones purely via standard web browsers.
* **Financial Viability:** 
  * Storage and DB: Supabase serverless scales cheaply without fixed overhead.
  * AI inference: Local browser AI costs the platform exactly $0. Using the Groq API for Llama 3 is tremendously more economical and magnitudes faster than traditional OpenAI implementations.
  * Blockchain: Utilizing Polygon Layer 2 provides sub-cent transaction fees for case anchoring, making legal-grade integrity verification financially viable at scale.
* **Impact:** The solution dramatically lowers the barrier to entry for marginalized groups seeking legal guidance, while simultaneously providing enterprise-grade security and chain-of-custody that modern legal systems demand.
