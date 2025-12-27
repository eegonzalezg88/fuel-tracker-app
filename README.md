# Fuel Tracker App 🚗⛽

A Progressive Web App (PWA) for tracking fuel consumption with cloud sync via Google Sheets.

## Features

- 📊 Track fuel records (date, gas station, price, gallons, odometer)
- 📈 Analytics with fuel efficiency and price trends
- ☁️ Cloud sync with Google Sheets
- 💾 Offline support with local storage fallback
- 📱 PWA - Install on any device
- 🔄 Real-time data sync across multiple devices

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install --legacy-peer-deps`
3. Set up Google Sheets integration (see below)
4. Run locally: `npx expo start --web`
5. Deploy to Vercel (see deployment section)

---

## Google Sheets Integration Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "Fuel Tracker" and click "Create"
4. Wait for the project to be created

### Step 2: Enable Google Sheets API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

### Step 3: Create a Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in the details:
   - **Name**: fuel-tracker-service
   - **Description**: Service account for Fuel Tracker app
4. Click "Create and Continue"
5. Skip "Grant this service account access to project" (click "Continue")
6. Skip "Grant users access to this service account" (click "Done")

### Step 4: Create Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create" - A JSON file will download
6. **Keep this file safe and NEVER commit it to Git!**

### Step 5: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "Fuel Tracker Data"
4. Copy the **Sheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
   - Example: If URL is `https://docs.google.com/spreadsheets/d/1ABC123xyz/edit`
   - Then SHEET_ID is: `1ABC123xyz`

### Step 6: Share Sheet with Service Account

1. In your Google Sheet, click "Share" button (top right)
2. Paste the **service account email** from your JSON key file
   - Format: `fuel-tracker-service@your-project.iam.gserviceaccount.com`
3. Give it "Editor" permissions
4. Uncheck "Notify people"
5. Click "Share"

### Step 7: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and fill in these values from your JSON key file:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEET_ID=your-sheet-id-from-url
   ```

   **Important Notes:**
   - For `GOOGLE_PRIVATE_KEY`: Copy the entire private key from the JSON file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts
   - Keep the `\n` characters (they represent line breaks)
   - Wrap the entire key in double quotes

---

## Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npx expo start --web

# The app will be available at http://localhost:8081
```

---

## Deployment to Vercel

### Prerequisites
- [Vercel account](https://vercel.com/signup) (free)
- [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`

### Step 1: Install Vercel CLI (if not installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
# From your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? fuel-tracker-app
# - In which directory is your code located? ./
```

### Step 4: Add Environment Variables in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add these three variables:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` → Value from your JSON key file
   - `GOOGLE_PRIVATE_KEY` → Value from your JSON key file (entire key with \n)
   - `GOOGLE_SHEET_ID` → Your sheet ID from the Google Sheets URL

### Step 5: Redeploy
```bash
vercel --prod
```

Your app is now live! 🎉

Vercel will give you a URL like: `https://fuel-tracker-app.vercel.app`

---

## Using the PWA on Mobile

### iPhone (Safari)
1. Open your deployed URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. The app icon will appear on your home screen

### Android (Chrome)
1. Open your deployed URL in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen"
4. Tap "Add"

---

## App Structure

```
fuel-tracker-app/
├── api/                    # Vercel serverless functions
│   ├── lib/
│   │   └── sheetsService.ts   # Google Sheets integration
│   ├── records.ts             # GET/POST /api/records
│   └── records/
│       └── [id].ts            # PUT/DELETE /api/records/:id
├── src/
│   ├── screens/            # App screens
│   ├── services/
│   │   └── storageService.ts  # Data layer with API + local storage
│   └── types/
│       └── FuelRecord.ts      # TypeScript interfaces
├── .env.example           # Environment variables template
├── vercel.json            # Vercel configuration
└── package.json
```

---

## How Data Sync Works

1. **On Save/Update/Delete**: 
   - Data is saved to local storage first (optimistic update)
   - Then synced to Google Sheets via API
   - If API fails, data remains in local storage

2. **On Load**:
   - App tries to fetch from Google Sheets first
   - If successful, updates local storage cache
   - If API fails, falls back to local storage

3. **Benefits**:
   - ✅ Works offline
   - ✅ Fast (optimistic updates)
   - ✅ Reliable (local storage fallback)
   - ✅ Synced across devices (via Google Sheets)

---

## Troubleshooting

### API errors when testing locally
- Make sure `.env` file exists with correct credentials
- Verify the Google Sheet is shared with the service account email
- Check that Google Sheets API is enabled in Google Cloud Console

### "Failed to sync" warnings
- These are normal if you're offline
- Data is still saved locally and will sync when online

### Delete button not working
- This is a known issue in the current version
- Will be fixed in a future update

---

## Tech Stack

- React Native + Expo (SDK 54)
- TypeScript
- Google Sheets API (via google-spreadsheet)
- AsyncStorage (local persistence)
- Recharts (analytics)
- Vercel (hosting + serverless functions)

---

## License

MIT

---

## Support

For issues or questions, please create an issue on the repository.
