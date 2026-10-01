# Journey Queue (जर्नी क्यू)
### Smart Hospital Queue & Journey Management System for Rural & Government Hospitals
> **1 Token • 1 Unified Journey • Zero Waiting Chaos**

Built for rural and district hospitals across India (demonstrated with **Nashik District Healthcare Network**: Sinnar, Igatpuri, Dindori, Niphad, and Nashik Civil).

---

## 🌟 The Core Problem & USP
Traditional hospitals manage isolated queues (Registration, OPD Doctor, Pathology Lab, Diagnostic Reports, Pharmacy). A rural patient waits **4 to 6 hours** across 5 disjointed queues without knowing total ETA or next steps.

**Journey Queue solves this with:**
1. **Unified QR Journey**: One token assigned at check-in that tracks the whole hospital visit with a single total ETA.
2. **Parallel Queue Scheduling**: If the OPD doctor queue is backed up, the system automatically routes the patient to Blood Test / X-Ray first so diagnostics are ready when they see the doctor (saving ~1h 15m).
3. **Prescription Auto-Handoff**: Doctors enter digital prescriptions with 1 click; the pharmacy is notified instantly and packs medications in advance with a 30-minute auto-expiry alert.
4. **Visiting Specialist Calendar**: Clear weekday calendars for rotating rural specialists (Eye, Ortho, Peds, Gyn) with slot reservations and automatic patient SMS alerts if a visiting doctor cancels.
5. **Rural-First Usability**: Zero login/app installation, multilingual (Marathi default, Hindi, English), Web Speech API loudspeaker voice calls in Marathi, high-contrast large fonts, and 2G/3G SMS / Missed-call fallback simulation.
6. **100% Explainable Rules Engine**: Fully transparent deterministic routing without black-box AI claims.

---

## 🚀 Quick Start & Run Instructions

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 🏆 Hackathon Demo Script (Recommended Judge Walkthrough)

To experience the full journey flow, open two side-by-side browser windows:
- **Window 1**: Patient & TV View (`http://localhost:3000` or `/journey/patient_01` or `/display`)
- **Window 2**: Staff Dashboard (`http://localhost:3000/staff`)

### Step 1: Landing Page & Fast Check-In (`/` -> `/checkin`)
1. Open `/` to see the Calm Care design, Marathi/Hindi/English language switcher, and hospital selector.
2. Click **"नवीन टोकन घ्या (Check-in)"** (`/checkin`).
3. Enter patient name (e.g. `सखाराम शिंदे`), mobile number, toggle **Senior Citizen** or **Emergency**, and pick symptoms (e.g. Chest / Cough).
4. Click **"टोकन तयार करा"** — instant token `A-12` is generated and routes directly to the tracker.

### Step 2: Patient Journey Tracker (`/journey/patient_01`)
1. Notice the giant token number, people ahead, and **TOTAL ETA** for the whole visit.
2. Check the **Parallel Scheduling Banner**: *"डॉक्टर रांग लांब आहे (४० मि.). आधी लॅब/तपासणीला जा, तुम्ही येईपर्यंत रिपोर्ट तयार असेल!"*.
3. Click the big **"🔊 मराठीत ऐका (मोठ्याने बोला)"** button to hear Web Speech announcement in Marathi.
4. Click the **"SMS सिम्युलेटर"** button in the header or phone mock to see the live simulated SMS received on a 2G feature phone.

### Step 3: Staff Dashboard & Realtime Auto-Handoff (`/staff`)
1. View the live summary cards (Waiting, Avg wait, Bottlenecks, Load balancing alert between OPD 1 and OPD 2).
2. Click **"पुढील रुग्ण बोलवा" (Call Next)**: Notice the audio chime and announcement.
3. Switch to the **"डॉक्टर कन्सल्ट"** tab:
   - Click **"१. लॅब टेस्ट पाठवा"** -> Patient is auto-routed to Lab without re-queuing!
   - Click **"२. डिजिटल प्रिस्क्रिप्शन पाठवा"** -> Instantly appears in the Pharmacy tab!
4. Switch to the **"फार्मसी"** tab:
   - Notice the prescription in "तयार होत आहे" (Preparing) status.
   - Click **"तयार झाले (Mark Ready)"** -> Triggers a 30-minute auto-expiry countdown, sends SMS to patient, and updates `/journey/[id]`.
   - Click **"दिले (Dispense)"** -> Patient journey completes!

### Step 4: Live Waiting Hall TV Display (`/display`)
1. Open `/display` in a full tab.
2. Shows huge "Now Serving" token, next 4 tokens in queue, and automated spoken voice calls.

### Step 5: Rural Specialist Calendar & Cancellation Simulation (`/specialists`)
1. Browse visiting specialists across Nashik district rural hospitals (Sinnar, Igatpuri, Dindori, Niphad).
2. Click **"मोफत टोकन राखून ठेवा"** to book a slot.
3. Click **"डॉक्टर गैरहजर / रद्द सिमुलेशन"** -> See the cancellation banner and open the SMS Simulator to see the automatic SMS alert sent to registered patients preventing wasted travel!

### Step 6: Side-by-Side Simulation for Judges (`/demo`)
1. Open `/demo`.
2. Click **"सिम्युलेशन सुरू करा" (Play)** and set speed to **2x** or **5x**.
3. Watch 3 patients side-by-side: Traditional sequential 5-hour wait vs Journey Queue 2.5-hour parallel flow with live animated progress bars and time-saved metrics.

---

## 🛠️ Tech Stack & Architecture
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS with "Calm Care" rural health tokens
- **Realtime Sync**: Reactive memory store with `localStorage` + `BroadcastChannel` for instantaneous zero-latency updates across all open tabs
- **Speech**: Web Speech API (`speechSynthesis`) with audio chime and fallback for `mr-IN`, `hi-IN`, `en-IN`
- **PWA**: Web App Manifest ready (`/manifest.json`), mobile-first responsive layout
- **Rules Engine** (`src/lib/rulesEngine.ts`):
  - `calculatePriorityScore`: Emergency (1000) > Pregnant (500) > Senior 60+ (250) > Normal (100)
  - `estimateDepartmentWait`: `(peopleAhead * avgConsultMins) / activeStaff`
  - `evaluateParallelScheduling`: Routes to Lab first when Doctor backlog exceeds Lab wait by > 25 mins
  - `evaluateLoadBalancing`: Recommends rerouting when OPD wait difference > 20 mins
  - `checkPrescriptionExpiryStatus`: Enforces 30-minute expiry on prepared medications
