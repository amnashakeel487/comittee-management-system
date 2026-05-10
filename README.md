# CommitteeHub - ROSCA Management System

A modern, full-stack web application for managing money-saving committees (ROSCA - Rotating Savings and Credit Association).

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 21 (Standalone Components) |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Custom SCSS (Fintech Design) |

## 📁 Project Structure

```
├── committee-management/     # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout/       # Sidebar, Navbar, Main Layout
│   │   │   ├── pages/        # All page components
│   │   │   │   ├── auth/     # Login, Register, Forgot Password
│   │   │   │   ├── dashboard/
│   │   │   │   ├── committees/
│   │   │   │   ├── create-committee/
│   │   │   │   ├── members/
│   │   │   │   ├── payments/
│   │   │   │   ├── payouts/
│   │   │   │   ├── reports/
│   │   │   │   └── profile/
│   │   │   ├── services/     # Auth, Data, Toast, Theme
│   │   │   ├── models/       # TypeScript interfaces
│   │   │   └── shared/       # Toast container
│   │   ├── environments/
│   │   └── styles.scss       # Global styles
│   └── package.json
│
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── routes/           # committees, members, payments, payouts, auth
│   │   ├── middleware/       # auth middleware
│   │   ├── supabase.js
│   │   └── index.js
│   └── package.json
│
└── database/
    └── schema.sql            # Supabase PostgreSQL schema
```

## 🎨 Features

### Dashboard
- Statistics cards (Total/Active/Completed Committees, Pending Payments)
- Upcoming payout card with release action
- Monthly collection bar chart
- Recent payments table
- Committee progress bars

### My Committees
- Card-based committee display with status badges
- Progress bars showing monthly completion
- Filter by status (All/Active/Pending/Completed)
- Search functionality
- Create/Edit/Delete actions

### Create Committee
- Form with live calculation panel
- Monthly pool = Amount × Members
- Total committee value preview
- Real-time committee card preview

### Members
- Full member management table
- Add/Edit/Remove members via modal
- Payout order assignment
- Role management (Admin/Member)

### Payments
- Payment tracking with status badges (Paid/Pending/Overdue)
- Mark as Paid functionality
- Send Reminder feature
- Filter and search

### Payouts
- Timeline-based payout schedule
- Upcoming payouts with release button
- Payout history

### Reports
- Analytics dashboard with charts
- Bar chart (Monthly Collection)
- Donut/Pie chart (Committee Status)
- Payment collection rate bars

### Profile
- Edit personal information
- Change password with strength indicator
- Account statistics

### Authentication
- Login with demo mode
- Register with terms acceptance
- Forgot Password with email reset
- Split-screen fintech design

## 🛠️ Setup Instructions

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `database/schema.sql`
3. Copy your Project URL and anon key

### 2. Frontend Setup

```bash
cd committee-management
# Update src/environments/environment.ts with your Supabase credentials
npm install
ng serve
```

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your Supabase credentials in .env
npm install
npm run dev
```

## 🔧 Environment Configuration

### Frontend (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key'
};
```

### Backend (`.env`)
```
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
NODE_ENV=development
```

## 🎨 Design System

- **Primary Color**: `#2563eb` (Blue)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Danger**: `#ef4444` (Red)
- **Font**: Inter
- **Border Radius**: 12px (cards), 8px (inputs)
- **Dark/Light Mode**: Supported via CSS variables

## 📱 Responsive Design

- Desktop: Full sidebar + content layout
- Tablet: Collapsible sidebar
- Mobile: Hidden sidebar with hamburger menu

## 🔐 Security Features

- Supabase Row Level Security (RLS) on all tables
- JWT-based authentication
- Input validation on all forms
- CORS configuration
- Helmet.js security headers

## 🚀 Running the App

```bash
# Frontend (development)
cd committee-management
ng serve
# Open http://localhost:4200

# Backend API
cd backend
npm run dev
# API at http://localhost:3000

# Build for production
cd committee-management
ng build --configuration=production
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/committees` | List committees |
| POST | `/api/committees` | Create committee |
| PUT | `/api/committees/:id` | Update committee |
| DELETE | `/api/committees/:id` | Delete committee |
| GET | `/api/members` | List members |
| POST | `/api/members` | Add member |
| GET | `/api/payments` | List payments |
| PATCH | `/api/payments/:id/mark-paid` | Mark payment paid |
| GET | `/api/payouts` | List payouts |
| PATCH | `/api/payouts/:id/release` | Release payout |

---

Built with ❤️ for university final year project
