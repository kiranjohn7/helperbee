# HelperBee (React + Express + MongoDB + Firebase Auth)

Full-stack marketplace (free, INR) with OTP email verification, role-based dashboards, job posting/apply, chat, and image uploads (Firebase Storage).

## 1) Setup

### Server
cd server
cp .env.example .env   # fill Mongo, Firebase Admin, SMTP, CORS
npm i
npm run dev

### Client
cd client
cp .env.example .env   # fill Firebase client keys; optional VITE_API_BASE
npm i
npm run dev

Open http://localhost:5173

## 2) Test flow
1) Register with email or Google, choose role (hirer/worker)
2) OTP arrives via email → verify
3) Hirer: post a job
4) Worker: open job → apply
5) Hirer: accept application (via PATCH /api/jobs/:id with applicationId)
6) Chat at /chat/:conversationId

## Notes
- Auth: Client uses Firebase Auth; server verifies ID token via Firebase Admin in `Authorization: Bearer <token>`.
- Images: Uploaded to Firebase Storage from client; store public URL in profile.
- Emails: Nodemailer SMTP (use Gmail app password or any SMTP).
- Currency: INR via `formatINR()` util.