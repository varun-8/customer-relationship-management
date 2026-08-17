# Vasantham Tiles & Sanitary Wares — Customer CRM Module

Production-ready, highly dynamic Customer CRM system for **Vasantham Tiles & Sanitary Wares**.
Includes:
1. **Desktop App (React + Tauri 2)**: Dynamic Form Builder (15 field types), drag-and-drop reordering, interactive preview, dynamic customer list, dynamic customer details, atomic sequence configurator.
2. **Mobile App (React Native)**: Dynamic form rendering engine that consumes active MongoDB schema without hardcoding or requiring code updates.
3. **Backend API (Node.js / Express / MongoDB Atlas)**: Dynamic validation engine, atomic sequence generator, JWT auth & role management.

---

## Quick Start Guide

### 1. Backend Setup & Seeder
```bash
cd backend
npm install
npm run seed     # Seeds default Owner, Employee, Sequence (VAS-000001) & Form Schema v1
npm start        # Runs on http://localhost:5000
```

### 2. Desktop Application (React + Tauri 2)
```bash
cd desktop
npm install
npm run dev      # Runs on http://localhost:5173
# For Tauri 2 desktop native build:
# npm run tauri dev
```

### 3. Mobile Application (React Native Showroom App)
```bash
cd mobile
npm install
npm start        # Runs Expo development server
```

---

## Default Login Credentials

- **Showroom Owner / Admin** (Full Form Builder & Sequence access):
  - Email: `owner@vasantham.com`
  - Password: `admin123`
- **Showroom Employee / Staff** (Customer CRM entry):
  - Email: `employee@vasantham.com`
  - Password: `employee123`

---

## Supported 15 Field Types
1. Single-Line Text
2. Paragraph / Long Text (Multi-line)
3. Number
4. Phone Number (10-digit validation)
5. Email Address (RFC 5322 format)
6. Date Picker
7. Time Picker
8. Date & Time Picker
9. Checkbox (Boolean)
10. Radio Button Group
11. Single Dropdown Select
12. Multi-Select Chips
13. Currency Amount (₹ Indian Rupee with customizable symbol)
14. Website / URL
15. Auto-Generated Number (Backend atomic increment)
