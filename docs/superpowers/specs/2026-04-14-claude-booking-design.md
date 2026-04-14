# Claude Booking — Design Spec

## Context

A small team (2-5 people) shares a single Claude subscription. They need a simple web app to coordinate usage — booking timeslots so people don't step on each other. The app will be deployed to free cloud hosting (Railway).

## Core Requirements

- **Individual accounts**: Each person registers with username/password (open self-registration)
- **Free-form booking**: Users book custom start/end times on a calendar (15-min snap intervals)
- **No overlap**: The system prevents double-booking
- **Cancel own bookings**: Users can only cancel bookings they created
- **"Who's using it now?"**: Visual indicator of the current booking at the top
- **Weekly calendar view**: Shows all bookings, scrollable by week

## Tech Stack

- **Next.js 14** (App Router)
- **better-sqlite3** for embedded database
- **JWT in httpOnly cookies** for auth
- **Tailwind CSS** for styling
- **Custom calendar grid** (no heavy library)
- **Deploy target**: Railway (free tier)

## Data Model

### Users
| Column     | Type    | Notes              |
|------------|---------|---------------------|
| id         | INTEGER | Primary key, auto   |
| username   | TEXT    | Unique, not null     |
| password   | TEXT    | bcrypt hash          |
| created_at | TEXT    | ISO 8601 timestamp   |

### Bookings
| Column     | Type    | Notes                     |
|------------|---------|----------------------------|
| id         | INTEGER | Primary key, auto          |
| user_id    | INTEGER | FK -> users.id             |
| start_time | TEXT    | ISO 8601 datetime          |
| end_time   | TEXT    | ISO 8601 datetime          |
| created_at | TEXT    | ISO 8601 timestamp         |

**Constraints:**
- No overlapping bookings (checked at API level before insert)
- start_time < end_time
- Times snap to 15-minute intervals

## Architecture

```
claudebooking/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Calendar (main page, requires auth)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── register/route.ts
│   │       │   └── me/route.ts
│   │       └── bookings/
│   │           ├── route.ts          # GET all, POST create
│   │           └── [id]/route.ts     # DELETE
│   ├── components/
│   │   ├── Calendar.tsx
│   │   ├── BookingForm.tsx
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── db.ts                 # SQLite init + helpers
│   │   └── auth.ts               # JWT sign/verify, middleware
│   └── types.ts
├── data/                         # SQLite .db file
├── package.json
├── next.config.js
└── tailwind.config.js
```

## API Endpoints

### Auth
- `POST /api/auth/register` — { username, password } -> creates user, returns JWT cookie
- `POST /api/auth/login` — { username, password } -> verifies, returns JWT cookie
- `GET /api/auth/me` — returns current user from JWT cookie (or 401)

### Bookings
- `GET /api/bookings?week=2026-04-13` — returns all bookings for the given week
- `POST /api/bookings` — { start_time, end_time } -> creates booking (user from JWT)
- `DELETE /api/bookings/[id]` — deletes booking (only if owned by current user)

## User Flow

1. Visit site -> redirected to login if not authenticated
2. Register or login -> JWT set as httpOnly cookie
3. See weekly calendar with all bookings (color-coded by user)
4. Click on a time or use a form to book a slot (start + end time)
5. Overlap check runs server-side; error shown if conflict
6. Click own booking to cancel
7. Top bar shows: current user, "Now: [person] until [time]" or "Available", logout button

## UI Design

- Clean, minimal design with Tailwind
- Calendar grid: 7 columns (days), rows for each hour (6am-midnight or similar)
- Bookings rendered as colored blocks on the grid
- Each user gets a consistent color (derived from username hash)
- Mobile-friendly: on small screens, show day view instead of week

## Verification

1. Run `npm run dev`, visit localhost
2. Register two users in separate browser sessions
3. Book a timeslot with user A, verify it shows on the calendar
4. Try to book an overlapping slot with user B — should be rejected
5. Cancel a booking as the owner — should succeed
6. Try to cancel someone else's booking — should be rejected
7. Verify "Now using" indicator shows correctly during a booking window
