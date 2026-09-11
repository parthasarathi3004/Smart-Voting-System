<div align="center">

# 🗳️ Smart Voting System (Voting_SM)
### *Next-Gen Biometric-Secured Anti-Fraud E-Voting & Real-Time Analytics Platform*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://smart-voting-system-wyty.onrender.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

### 🔗 **Live Application URL:**
### 👉 [https://smart-voting-system-wyty.onrender.com/](https://smart-voting-system-wyty.onrender.com/) 👈

<br/>

> **A high-security, tamper-resistant digital voting solution featuring real-time webcam facial biometrics, cryptographic single-vote ledgers, and comprehensive coverage across all 234 Assembly Constituencies of Tamil Nadu.**

<br/>

[🌐 Live Demo](https://smart-voting-system-wyty.onrender.com/) • [Key Features](#-key-features) • [Workflow & Security](#-security--biometric-workflow) • [Tech Stack](#-technology-stack) • [Quick Start](#-quick-start-guide) • [API Reference](#-api-documentation) • [Screens & Portals](#-portal-walkthrough)

---

</div>

## 📌 Overview

The **Smart Voting System** is engineered to eliminate voting fraud, eliminate impersonation, and provide transparent, real-time election monitoring. Designed with modern web technologies, it features an interactive EVM ballot booth, strict administrative session guards, live voter turnout tracking, and executive analytics powered by interactive charts.

Modeled for large-scale elections like the **Tamil Nadu Legislative Assembly General Election 2026**, the system comes pre-loaded with official data for all **38 Districts**, **234 Constituencies**, and major political candidates (including TVK, DMK, AIADMK, BJP, NTK, PMK, Congress, and Independents).

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 👁️ **Facial Biometric Recognition** | Real-time live camera capture, facial descriptor extraction, anti-spoofing validation, and instant facial verification at the voting booth. |
| 🛡️ **Cryptographic Anti-Fraud Ledger** | Immutable audit trail (`votesAudit`) preventing double voting, proxy voting, and unauthorized ballot injection. |
| 🗳️ **Digital EVM Voting Booth** | Clean, accessible touch interface displaying candidates, high-resolution party symbols, photo verification, and NOTA support with celebratory confetti feedback. |
| 🏛️ **All 234 TN Constituencies Covered** | Full dataset mapping of Tamil Nadu's 38 districts and 234 legislative assembly seats, with automated Excel/JSON ingestion. |
| 📊 **Executive Analytics Center** | Live Recharts dashboard tracking seat tallies, vote share percentages, voter turnout metrics, and demographic trends. |
| 🔒 **Admin Session Guard** | Automatic session revocation on tab exit or navigation away from administrative workspaces, ensuring zero officer credential hijacking. |
| 🎫 **Integrated HelpDesk Dispatcher** | Live floating support modal dispatching election issue tickets to election officers via automated Nodemailer email notifications. |

---

## 🔒 Security & Biometric Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Voter
    participant Web as Voter Booth (Client)
    participant API as Election Backend (Node/Express)
    participant Bio as Biometric Engine
    participant DB as Electoral Ledger

    Voter->>Web: Enter Voter ID (EPIC) & Aadhaar
    Web->>API: Fetch voter profile & check status
    API-->>Web: Voter verified (Has not voted)
    
    rect rgb(20, 30, 50)
        Note over Voter,Bio: Step 1: Biometric Verification
        Voter->>Web: Face Camera Scan
        Web->>API: Transmit Live Snapshot (Base64)
        API->>Bio: Compare Facial Descriptor Embeddings
        Bio-->>API: Facial Match Verified (Confidence >= 85%)
    end

    rect rgb(50, 30, 30)
        Note over Voter,DB: Step 2: Confidential Ballot
        Web->>Voter: Render Digital Ballot (Candidates of Constituency)
        Voter->>Web: Cast Ballot for Selected Candidate / NOTA
        Web->>API: Submit Encrypted Vote Payload
        API->>DB: Record Anonymous Vote & Mark Voter as "Voted"
        API->>DB: Append to Tamper-Proof Audit Trail
        API-->>Web: Confirmation + Digital Receipt Generated
    end
