# CommitteeHub - ROSCA Management System

A modern, full-stack web application for managing money-saving committees (ROSCA - Rotating Savings and Credit Association).
# Website Link:
https://comittee-manager.vercel.app/auth/login
Admin Credentials: 
email: amnashakeel606@gmail.com
password: 123456
Member credentials:
email: aliza@gmail.com
password: 
# ScreenShots:

# Admin Pannel
<img width="1906" height="892" alt="image" src="https://github.com/user-attachments/assets/2b8c67fe-322d-44c4-87bd-8fb460aae817" />
<img width="1913" height="908" alt="image" src="https://github.com/user-attachments/assets/a4091682-4469-4ef7-9fc7-3da9f5a2385a" />
<img width="1910" height="897" alt="image" src="https://github.com/user-attachments/assets/2ef18b0b-5e34-4df2-aced-af9bef5ef210" />
<img width="1918" height="891" alt="image" src="https://github.com/user-attachments/assets/796bffac-0ab0-40db-b998-0ccf52eb2793" />
<img width="1915" height="901" alt="image" src="https://github.com/user-attachments/assets/19e084dc-d990-476f-bc68-98a10f91133d" />
<img width="1919" height="922" alt="image" src="https://github.com/user-attachments/assets/6ea3604b-8a98-4168-a31d-dab1a88f4858" />
<img width="1910" height="904" alt="image" src="https://github.com/user-attachments/assets/c0af24a8-13f2-43b1-8824-d8ac4e06a006" />
<img width="1919" height="904" alt="image" src="https://github.com/user-attachments/assets/93540efc-4d8d-4898-a7de-cffbac2b8cb2" />
<img width="1911" height="927" alt="image" src="https://github.com/user-attachments/assets/47563eae-f3f7-492f-8687-265f4ab2e2b6" />
<img width="1910" height="906" alt="image" src="https://github.com/user-attachments/assets/e12f174d-ab54-4f11-bd55-5b31e4d5e453" />
<img width="1914" height="905" alt="image" src="https://github.com/user-attachments/assets/35749bd9-82eb-4df7-bc36-df5176d3fc4c" />
<img width="1919" height="916" alt="image" src="https://github.com/user-attachments/assets/533dc12c-583b-44d1-bee2-96505f0d1342" />
<img width="1919" height="905" alt="image" src="https://github.com/user-attachments/assets/070cfc44-7fe9-4352-9e02-4d18390952d2" />
<img width="1918" height="909" alt="image" src="https://github.com/user-attachments/assets/48286aee-d3f3-45ae-b7b7-62c1b0d1346d" />
<img width="1915" height="908" alt="image" src="https://github.com/user-attachments/assets/0b553a24-9492-44c4-8cb6-c1ee2be4e079" />

# Member Portal
<img width="1919" height="909" alt="image" src="https://github.com/user-attachments/assets/04ccfa06-6422-45eb-9824-db452020c06e" />
<img width="1919" height="908" alt="image" src="https://github.com/user-attachments/assets/931a880d-b565-4fad-a182-0511fe4311f1" />
<img width="1919" height="918" alt="image" src="https://github.com/user-attachments/assets/4dfb365c-bed1-4d61-bfaf-32bd8a2354aa" />
<img width="1919" height="909" alt="image" src="https://github.com/user-attachments/assets/a9cab81a-48b9-462f-8017-555b8b9b05d2" />
<img width="1919" height="908" alt="image" src="https://github.com/user-attachments/assets/97152229-d165-4f20-bad4-8244d886296a" />
<img width="1919" height="900" alt="image" src="https://github.com/user-attachments/assets/2f0c7dd2-6822-4b02-b86e-e3892db14995" />
<img width="1914" height="910" alt="image" src="https://github.com/user-attachments/assets/da6b86e7-9462-4c01-9057-6dadd45f4317" />

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
