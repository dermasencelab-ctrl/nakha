# Nakha (نَكهة) — Project Constitution

## Project Overview
Nakha is a home-cooked food ordering platform for Bechar, Algeria.
It connects home cooks with customers who want fresh, homemade meals.
Revenue model: 9% commission on every completed order, deducted automatically from cook's balance.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Database:** Firebase Firestore (NoSQL, serverless)
- **Auth:** Firebase Authentication (email/password)
- **Image Hosting:** Cloudinary (cloud: dozzyeh79, preset: nakha_unsigned)
- **Hosting:** Vercel (https://nakha-topaz.vercel.app)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **No backend server** — fully serverless architecture

## Directory Structure
```
src/
├── components/        # Reusable UI components
│   ├── CookCard.jsx
│   ├── ImageUploader.jsx
│   ├── Navbar.jsx
│   └── ProtectedRoute.jsx
├── config/
│   └── settings.js    # Commission rate, founding members config, payment info
├── contexts/
│   ├── AuthContext.jsx # Firebase Auth + 3 roles (admin/cook/customer)
│   └── CartContext.jsx # Multi-cook cart with localStorage persistence
├── firebase/
│   └── config.js      # Firebase project configuration
├── pages/
│   ├── Home.jsx
│   ├── Cooks.jsx
│   ├── CookProfile.jsx
│   ├── Cart.jsx
│   ├── Checkout.jsx
│   ├── OrderSuccess.jsx
│   ├── MyOrders.jsx
│   ├── RateOrder.jsx
│   ├── Login.jsx
│   ├── CookSignup.jsx
│   ├── CookPending.jsx
│   ├── CookDashboard.jsx
│   ├── CookDishes.jsx
│   ├── CookOrders.jsx
│   ├── CookWallet.jsx
│   ├── CookTopup.jsx
│   ├── About.jsx
│   ├── Privacy.jsx
│   └── admin/
│       ├── AdminDashboard.jsx
│       ├── ManageCooks.jsx
│       ├── ManageDishes.jsx
│       └── ManageTopups.jsx
├── utils/
│   └── cloudinary.js
├── App.jsx
├── main.jsx
└── index.css
```

## Firestore Collections Schema
```
users/           uid, email, role (admin|cook), cookId, createdAt
cooks/           userId, name, bio, phone, neighborhood, photo, status,
                 cookType, cookDescription, specialties[], socialLink,
                 portfolioImages[], balance, totalCommission, totalOrders,
                 averageRating, totalRatings, ratingSum, isFoundingMember,
                 foundingMemberNumber, freeOrdersRemaining, freeOrdersUsed
dishes/          cookId, name, description, price, unit, category, photo, available
orders/          customerName, customerPhone, cookId, cookName, items[],
                 totalPrice, status, orderType, notes, createdAt
ratings/         cookId, orderId, customerName, rating (1-5), comment
transactions/    cookId, type, amount, orderId, description, balanceBefore, balanceAfter
topup_requests/  cookId, cookName, amount, transactionNumber, receiptImage, status
```

## Hard Rules — ALWAYS Follow These

### Code Standards
- ALL code comments MUST be in English
- ALL user-facing text MUST be in Modern Standard Arabic (فصحى)
- Direction is always RTL (dir="rtl")
- Use Tailwind CSS utility classes only — no custom CSS files
- Use Lucide React for all icons
- Single-file components — no separate CSS/JS files

### Security Rules
- Customer phone number is HIDDEN from cook until order status = "ready"
- Commission is deducted silently when status changes to "ready" (not "completed")
- The word "عمولة" (commission) must NEVER appear in cook-facing pages
- The word "خصم" (deduction) must NEVER appear in cook-facing pages
- Cook sees only: order details, customer name (masked phone), and action buttons
- Admin dashboard can show commission/revenue data freely

### Order Flow (Critical Business Logic)
```
1. Customer places order → status: "pending"
   Cook sees: customer name + masked phone (05** *** 89)

2. Cook accepts → status: "preparing"
   Cook sees: same masked phone

3. Cook marks ready → status: "ready"
   SYSTEM: deducts 9% commission from cook's balance
   SYSTEM: records transaction in transactions collection
   Cook sees: FULL customer phone number + call button

4. Cook confirms delivery → status: "completed"
   Customer can rate the order

5. Cook rejects → status: "cancelled"
   No commission charged
```

### Commission System
- Rate: 9% (defined in src/config/settings.js as COMMISSION_RATE)
- Founding members (first 15 cooks): 1000 DZD welcome balance + 3 free orders
- Free order eligibility: founding member + remaining free orders > 0 + order ≤ 3000 DZD
- Balance can go negative (cook can still receive orders)
- Cook recharges balance via BaridiMob (CCP transfer)

### Design Guidelines
- Primary color: Orange (#ea580c)
- Background: Warm cream (#FFF8F0)
- Rounded corners: rounded-2xl, rounded-3xl
- Shadows: warm-toned (shadow-orange-500/30)
- Mobile-first design with bottom tab bar
- App-like feel with smooth transitions

### Things to NEVER Do
- Never show commission amounts to cooks
- Never expose customer phone before order is "ready"
- Never use دارجة (dialect) in UI — always فصحى (formal Arabic)
- Never mention WhatsApp as an ordering method
- Never use placeholder phone numbers that could be real (use 05XXXXXXXX)
- Never add localStorage/sessionStorage in artifacts
- Never import libraries not already in package.json without asking

## Development Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Environment
- Node.js 18+
- npm
- Firebase project: configured in src/firebase/config.js
- Cloudinary: cloud name dozzyeh79, upload preset nakha_unsigned

## Git Workflow
- Main branch: main
- Always commit with descriptive Arabic+English messages
- Push to origin main for Vercel auto-deploy
