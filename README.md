# Vasantham Tiles & Sanitary Wares — Customer CRM Module

Production-ready, highly dynamic Customer CRM system for **Vasantham Tiles & Sanitary Wares**.
Includes:
1. **Desktop App (React + Tauri 2)**: Dynamic Form Builder (15 field types), drag-and-drop reordering, interactive preview, dynamic customer list, dynamic customer details, atomic sequence configurator.
2. **Mobile App (React Native)**: Dynamic form rendering engine that consumes active MongoDB schema without hardcoding or requiring code updates.
3. **Backend API (Node.js / Express / MongoDB Atlas)**: Dynamic validation engine, atomic sequence generator, JWT auth & role management.

---

## Quick Start Guide

### 1. Unified Desktop Mode (Native Desktop Window + Backend)
To launch the desktop application in a **Native Desktop Window** (`.exe` / WebView view) with the backend API automatically running in parallel:
```bash
# From workspace root:
npm install
npm run dev          # Automatically starts Backend (port 5000) & opens Native Desktop Window

# Or from desktop directory:
cd desktop
npm install
npm run dev          # Starts Backend & opens Native Desktop Window
```

### 2. Alternative Execution Modes
- **Browser Mode** (runs backend & opens in standard web browser):
  ```bash
  npm run dev:browser
  ```
- **Tauri Native Mode** (Tauri 2 build if Rust/Cargo is installed):
  ```bash
  npm run dev:tauri
  ```

### 3. Database Seeding & Testing
```bash
npm run seed         # Seeds default Owner, Employee, Sequence (VAS-000001) & Form Schema v1
npm test             # Runs Backend integration and validation test suite
```

### 4. Mobile Application (React Native Showroom App)
```bash
# From workspace root:
npm run dev:mobile

# Or from mobile directory:
cd mobile
npm install
npm start            # Runs Expo development server
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


in the mobile form while adding new customer make sure there is no too much emoji as it look clumsy. make in a minimistic in clear way to enter data.  make the setings page look minimistic and with good colour that look professionall. also make the shift kpi look minimilistic in dessign with less emoji. dont use too dark colours