# 🛡️ NETWORK TRAFFIC ANALYZER

> **Third-Year Computer Science and Engineering (CSE) Mini Project**  
> A web-based network packet monitoring, protocol distribution analyzer, and heuristic intrusion detection system (IDS).

[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 1. Project Abstract

Modern network security relies on rapid packet telemetry inspection to preempt reconnaissance probes, denial-of-service barrages, and command-and-control (C2) exfiltration. 

The **Network Traffic Analyzer** is an educational, interactive web application developed as a college mini project. It models real-time network flow telemetry, provides OSI Layer 2–7 header dissection, evaluates transparent heuristic intrusion detection rules (port scanning, SYN flood, ICMP sweeps, malware port access), and parses external packet trace files (CSV).

> **Academic Sandbox Notice:** Modern web browsers run in a strict security sandbox that isolates the client from raw kernel-level network sockets (`AF_PACKET`, `SOCK_RAW`) and promiscuous NIC mode (`libpcap/WinPcap`). Accordingly, this application utilizes a stochastic network packet generator alongside a CSV trace ingestion engine to model and dissect network traffic safely in client-side TypeScript.

---

## 🚀 2. Key Features

### 📊 1. Comprehensive Telemetry Dashboard
- **Real-Time KPIs**: Total packets analyzed, active throughput (KB/MB), ingress vs. egress ratio, and flagged security incidents.
- **Activity Over Time**: Dynamic Area chart illustrating packet rate and cumulative payload volume over sliding time windows.
- **Protocol Distribution**: Donut and bar charts displaying proportions of TCP, UDP, ICMP, HTTP, HTTPS, DNS, SSH, and ARP frames.
- **Top Talkers Matrix**: Ranks highest-volume source IP addresses and classifies them (Internal Host, Gateway, External Cloud, Suspicious Actor).

### 📡 2. Live Traffic Monitor
- **Continuous Stream**: Streaming packet logs with timestamp, source/destination IP and ports, protocol, TCP flags, packet size, and payload summary.
- **Live Controls**: Start, Stop, Pause, and Resume stream controls with adjustable rates (0.5x, 1x, 3x).
- **Packet Dissector Modal**: Click any packet to inspect OSI Layer 2 (Ethernet frame), Layer 3 (IPv4 header), Layer 4 (Transport), and Layer 7 along with a formatted hexadecimal and ASCII packet dump.
- **Interactive Threat Injector**: Viva demonstration buttons to trigger simulated **Nmap Port Scans**, **TCP SYN Floods**, **ICMP Ping Sweeps**, and **C2 Reverse Shell Beacons**.

### 🔬 3. Traffic Analysis & Metrics
- **Packet Size Histogram**: Classification across MTU tiers:
  - *Small Control Frames* (< 128 B): TCP ACKs, SYNs, ARP requests.
  - *Medium Payloads* (128–512 B): DNS resolution, SSH commands, HTTP headers.
  - *Large Packets* (512–1024 B): Standard application payloads.
  - *MTU / Jumbo Frames* (> 1024 B): Full TLS 1.3 encrypted data and bulk streams.
- **Ingress vs. Egress Flow Breakdown**: Quantitative visualization of incoming vs. outgoing vs. internal LAN traffic.
- **Port Entropy & Service Mapping**: Activity tracking across well-known ports (80, 443, 53, 22, 21, 3389, 4444).

### 🚨 4. Security & Heuristic Intrusion Detection (IDS)
- **Deterministic Heuristic Rules**:
  - `RULE_PORT_SCAN_RECONNAISSANCE`: Flags single IP probing $\ge 4$ distinct destination ports.
  - `RULE_TCP_SYN_FLOOD_DOS`: Detects excessive unacknowledged SYN packets without handshake completion.
  - `RULE_HIGH_RATE_TRAFFIC_SPIKE`: Identifies volumetric bursts from single originators.
  - `RULE_SUSPICIOUS_PORT_ACCESS`: Flags connections to known exploit/trojan listener ports (e.g. Metasploit 4444, Backdoor 1337, Back Orifice 31337, IRC botnet 6667).
  - `RULE_ICMP_PING_SWEEP_SURVEILLANCE`: Detects subnet host reconnaissance sweeps.
- **Severity Levels**: Color-coded badges for Critical, High, Medium, and Low alerts.
- **Remediation Commands**: Generates copyable firewall rules (e.g. `iptables -A INPUT -s <ip> -j DROP`) for every flagged incident.

### 📁 5. CSV Trace Ingestion & Validation
- **Dropzone Parser**: Drag-and-drop or select any network traffic CSV file.
- **Strict Format Validation**: Validates IP addresses, port ranges (0–65535), packet sizes (20–65535 bytes), and required columns:
  ```
  timestamp,source_ip,destination_ip,protocol,source_port,destination_port,packet_size
  ```
- **1-Click Demo Datasets**: Load pre-packaged enterprise day traces or multi-stage cyberattack incidents immediately during reviews.
- **Downloadable Sample CSVs**: Bundled with realistic sample CSV files.

### 📑 6. Reports & Viva Defense Guide
- **Printable HTML Audit Report**: Clean, self-contained executive audit report formatted for printing or PDF export.
- **CSV Data Export**: Export active packet logs or security alert histories.
- **Viva Voce Defense Guide**: Dedicated tab with common examiner questions and technically rigorous answers regarding OSI layers, sockets, and IDS heuristics.

---

## 🛠️ 3. Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | React.js (v19) | Modular functional architecture, fast reconciliation |
| **Bundler & Dev Server** | Vite (v8) | Sub-millisecond HMR, lightning-fast production builds |
| **Styling** | Tailwind CSS (v4) | Modern, responsive dark-mode cybersecurity theme |
| **Data Visualization** | Recharts (v3) | Accessible, responsive SVG Area, Bar, and Pie charts |
| **Iconography** | Lucide React | Crisp, semantic SVG iconography |
| **Audio Alerts** | Web Audio API | Client-synthesized audio pings (no external audio assets) |
| **Language** | TypeScript | Strong typing for networking schemas and packet headers |
| **Persistence** | Browser `localStorage` | Zero external databases required; completely offline capable |

---

## 📂 4. Project Directory Structure

```
network-traffic-analyzer/
├── data/
│   ├── sample_network_traffic.csv    # 50+ enterprise day traffic records
│   └── attack_traffic_sample.csv     # Nmap port scan + SYN flood incident
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx            # Navigation bar & live status indicator
│   │   │   ├── Sidebar.tsx           # Module selector & quick attack buttons
│   │   │   ├── SimulatedBanner.tsx   # Academic sandbox disclaimer
│   │   │   └── PacketDetailModal.tsx # OSI Layers 2-7 packet dissector & hex dump
│   │   ├── dashboard/
│   │   │   └── DashboardView.tsx     # KPI metrics & primary charts
│   │   ├── live/
│   │   │   └── LiveMonitorView.tsx   # Real-time streaming table & controls
│   │   ├── analysis/
│   │   │   └── AnalysisView.tsx      # Deep packet size & port telemetry
│   │   ├── security/
│   │   │   └── SecurityThreatsView.tsx # Rule-based IDS engine & mitigation
│   │   ├── csv/
│   │   │   └── CsvUploadView.tsx     # CSV drag-and-drop parser & schema guide
│   │   ├── reports/
│   │   │   └── ReportsView.tsx       # Printable HTML report & viva defense guide
│   │   └── settings/
│   │       └── SettingsView.tsx      # Rate controls, thresholds & reset
│   ├── context/
│   │   └── TrafficContext.tsx        # Central React state & simulation timer
│   ├── services/
│   │   ├── trafficSimulator.ts       # Stochastic packet generation & attack vectors
│   │   ├── threatDetector.ts         # Heuristic IDS correlation rules
│   │   ├── csvParser.ts              # CSV parser, validator & export engine
│   │   └── soundEffects.ts           # Web Audio API alert synthesizer
│   ├── types/
│   │   └── traffic.ts                # TypeScript interfaces (Packet, Alert, etc.)
│   ├── App.tsx                       # Root view router & layout
│   ├── main.tsx                      # DOM entry point
│   └── index.css                     # Global Tailwind & cyber styling
├── index.html                        # HTML entry point with metadata
├── package.json                      # Project dependencies & scripts
├── tsconfig.json                     # TypeScript compiler configuration
├── vite.config.ts                    # Vite bundler config with base: './'
└── README.md                         # Comprehensive documentation
```

---

## ⚡ 5. Installation & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.x, 20.x, or newer recommended)
- `npm` (bundled with Node.js)

### Step 1: Clone or Extract the Repository
```bash
git clone https://github.com/<your-username>/network-traffic-analyzer.git
cd network-traffic-analyzer
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### Step 4: Build for Production
```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

---

## 🌐 6. How to Upload to GitHub

Follow these steps from your terminal to publish this project to your GitHub account:

```bash
# 1. Initialize local Git repository (if not already initialized)
git init

# 2. Add all files to staging
git add .

# 3. Create your first commit
git commit -m "feat: complete Network Traffic Analyzer college mini project"

# 4. Rename default branch to main
git branch -M main

# 5. Create a new repository on https://github.com/new named 'network-traffic-analyzer'
# Then link your local repository:
git remote add origin https://github.com/<your-github-username>/network-traffic-analyzer.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🚀 7. GitHub Pages Deployment Guide

This project is configured with `base: './'` in `vite.config.ts`, ensuring it runs on GitHub Pages regardless of repository path.

### Option A: Using the `gh-pages` package (Easiest)
1. Install `gh-pages`:
   ```bash
   npm install --save-dev gh-pages
   ```
2. Add deploy script to `package.json`:
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```
3. Run deploy:
   ```bash
   npm run predeploy
   npm run deploy
   ```

### Option B: Using GitHub Actions (Automated CI/CD)
1. In your GitHub repository, go to **Settings** > **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4
         - name: Set up Node.js
           uses: actions/setup-node@v4
           with:
             node-version: 20
         - name: Install dependencies
           run: npm install
         - name: Build project
           run: npm run build
         - name: Setup Pages
           uses: actions/configure-pages@v4
         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: './dist'
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

---

## 🎓 8. College Project Review & Viva FAQ

### Q1: What is the objective of this project?
> **Answer**: To demonstrate the mechanisms of network traffic monitoring, protocol distribution analysis, packet frame dissection, and rule-based heuristic intrusion detection within a modern web-based dashboard suitable for educational evaluation.

### Q2: How does the application identify a Port Scan?
> **Answer**: The application tracks destination ports contacted by each unique source IP. If a single IP initiates connection attempts across 4 or more distinct destination ports in short succession, `RULE_PORT_SCAN_RECONNAISSANCE` triggers an alert.

### Q3: What is the significance of the 3-Way Handshake in SYN flood detection?
> **Answer**: A normal TCP handshake requires `SYN -> SYN-ACK -> ACK`. A SYN flood sends high volumes of initial `SYN` packets without sending the concluding `ACK`. The analyzer flags source IPs exhibiting high SYN-to-ACK ratios as suspected DoS attempts.

---

## 📄 9. License

This project is licensed under the **MIT License**. Created for academic evaluation and educational demonstrations.
