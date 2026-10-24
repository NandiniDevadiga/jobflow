# ⚡ JobFlow AI — Intelligent Job Aggregator & Auto-Apply Copilot

An autonomous multi-platform job scanner, AI match evaluator, and automated application assistant tailored for **LinkedIn**, **Naukri.com**, **Indeed**, and **Company Portals (Greenhouse & Lever ATS)**.

---

## 🌟 Core Features

1. **Multi-Source Job Radar**:
   - **LinkedIn**: Real-time job search feed with Easy Apply badge detection and 1-click apply links.
   - **Naukri.com**: Dedicated India tech hub search parser (Bengaluru, Hyderabad, Pune, Mumbai, Remote).
   - **Indeed**: Global search queries with salary and remote filters.
   - **Company Portals (Greenhouse & Lever)**: Direct public ATS API integration for top tech employers (Stripe, Figma, Airbnb, Vercel, GitLab, etc.).
   - **Aggregator / RapidAPI JSearch Support**: Optional 1-click access to over 50+ portals via unified API.

2. **AI Resume & Skill Match Engine**:
   - Computes real-time **Match Score (0 - 100%)** based on your profile skills and experience.
   - Highlights **Matched Skills** and identifies **Missing Keywords** to boost interview callbacks.
   - Automatically writes a **Tailored Cover Letter** customized to the company and role.
   - Pre-generates smart responses to common screening questions (*"Why work here?"*, *"Notice period"*, *"Expected CTC"*, *"Relevant experience"*).

3. **Intelligent Playwright Browser Auto-Fill Agent**:
   - Runs on Windows using native Microsoft Edge or Chrome.
   - Automatically navigates to the job listing and scans form fields.
   - Fills in Full Name, Email, Phone, Location, Current Company, Title, LinkedIn URL, Portfolio, and uploads Resume.
   - **Review & Assist Mode**: Leaves the browser open so you can review filled details and hit final submit with 100% confidence, completely eliminating the risk of bot account bans or incorrect submissions.

4. **Application Pipeline & Kanban Tracker**:
   - Track every job across 4 stages: `Saved / To Apply` → `Applied` → `Interview` → `Offer`.
   - Update statuses with a single click.

---

## 🚀 Quick Start

### 1. Start the Server
The application is already installed and running. If you ever need to restart:

```powershell
npm start
```
Then open your browser at: **[http://localhost:3000](http://localhost:3000)**

---

## ⚙️ How to Customize Your Preferences & Profile

1. Open **[http://localhost:3000](http://localhost:3000)**.
2. Go to the **👤 Profile & Resume** tab:
   - Fill in your Name, Email, Phone, LinkedIn, GitHub, Portfolio.
   - Set your **Notice Period**, **Current & Expected CTC (LPA)**, and **Years of Experience**.
   - Enter your **Skills** (e.g. `React, Node.js, TypeScript, Python, SQL, AWS, Docker`).
   - Click **Save Profile Details**.
3. Go to the **⚡ Job Radar** tab:
   - Type your target role (e.g. `Full Stack Developer` or `Software Engineer`).
   - Select your target location (e.g. `Bengaluru, India` or `Remote`).
   - Choose which portals to scan (LinkedIn, Naukri, Indeed, Company ATS).
   - Click **⚡ Scan & Match Jobs**.

---

## 📋 Direct Apply vs Auto-Fill Options

- **⚡ Auto-Fill & Assist**: Click this on any job card. It launches the Playwright browser automation agent on your screen, opens the target job, and automatically fills all candidate inputs for you.
- **📝 AI Tailor**: Click this to view and copy a tailored cover letter and pre-filled answers to recruiter screening questions.
- **🌐 Direct**: Opens the direct application page in a new browser tab.
- **📌 Pipeline**: Saves the job to your Kanban board to keep track of interviews and offers.

---

## 🔑 Optional API Keys (Settings Tab)
- **RapidAPI JSearch**: (Optional) Add your key in the **API & Portals** tab to aggregate jobs from 50+ websites in a single API call.
