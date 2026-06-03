# DailyOS - Self-Hosted Life-Tracking Dashboard

DailyOS is a dark-themed, dense, productivity-focused personal dashboard inspired by Notion and Linear. It integrates daily tasks, a workout logger, horizontal schedules, long-term goals tracking, macro calorie tracking, and mood-check daily reviews in a single-user system.

---

## ⚡ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v3 + React Router v6 + Zustand (with persistence) + React Hook Form + Zod
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose
- **Charts**: Recharts
- **Icons**: Lucide React
- **Dates**: Date-fns

---

## 📁 Repository Structure

```text
/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── api/            # Typed Axios wrappers
│   │   ├── components/     # Shared UI (Sidebar, TopBar, ProgressRings, Charts)
│   │   ├── pages/          # Dashboard page modules
│   │   ├── store/          # Zustand store state management
│   │   ├── types/          # Shared type definitions
│   │   ├── App.tsx         # Routing configuration
│   │   └── index.css       # Tailwind configuration & animations
│   ├── tailwind.config.js  # Styling variables and themes
│   └── package.json
│
└── server/                 # Express backend server
    ├── src/
    │   ├── models/         # Mongoose Schemas (Logs, Gym, Meals, Goals)
    │   ├── routes/         # REST Controllers
    │   ├── middleware/     # JWT authentication & error interceptors
    │   ├── server.ts       # Server entry file
    │   └── seed.ts         # Database pre-population script
    ├── package.json
    └── tsconfig.json
```

---

## ⚙️ Environment Configuration

Create a `.env` file inside the `/server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/dailyos
JWT_SECRET=supersecretjwtkeyforlocaldevelopmentonly
DEFAULT_USER=admin
DEFAULT_PASS=password123
```

- **Note**: The login panel automatically defaults to the credentials supplied in `DEFAULT_USER` and `DEFAULT_PASS` (defaults to `admin` / `password123`). If the database has no user records on boot, the login router will automatically seed this account.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) and MongoDB installed and running on your local machine.

### 2. Install Dependencies
Run `npm install` in both `/server` and `/client` directories:

```bash
# Install server modules
cd server
npm install

# Install client modules
cd ../client
npm install
```

### 3. Seed the Database
To clear the collections and pre-populate 30 days of realistic task logs, gym logs, meals, goals, and journal entries:

```bash
cd server
npm run seed
```

### 4. Running the Application
Launch both components in parallel.

**Start the Server (API)**:
```bash
cd server
npm run dev
```
*API runs at `http://localhost:5000`.*

**Start the Client (Vite)**:
```bash
cd client
npm run dev
```
*App is active at `http://localhost:5173`.*

---

## 🎹 Navigation & Features

- **Command Palette (`Ctrl + K` or `Cmd + K`)**: Activate the quick navigation overlays from anywhere in the application. Use Arrow keys to navigate, `Enter` to select, and `Esc` to close.
- **Synchronized Date navigation**: The arrow selector in the top bar adjusts the selected date app-wide. Shifting the date automatically loads task lists, gym logs, meal items, and day reviews for that specific calendar date.
- **Offline Resilience**: Zustand's persistent storage saves authentication tokens and app states, enabling smooth recovery during page updates.
- **Optimistic UI Updates**: Checking a daily task immediately ticks off the card and recalculates points on the client while syncing with the MongoDB database asynchronously.
