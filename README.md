# Huddle: video meetings (React + Express + MongoDB + LiveKit)

Zoom-style meetings: accounts, lobby with camera/mic preview, rooms with screen share, chat, participant list, host controls and meeting history. All audio/video goes through **LiveKit Cloud** (no hand-rolled WebRTC). Join tokens are minted by the backend only after it authorizes the user.

```
video-conferencing-app/
  backend/   Express API: routes → controllers → services → models
  frontend/  React + Vite + Tailwind + React Router + LiveKit components
```

## Prerequisites
- Node.js 18+ (20 recommended)
- A MongoDB database (local install or free MongoDB Atlas cluster)
- A LiveKit Cloud account (free tier is enough for development)

## 1. Create a LiveKit Cloud project
1. Sign up at <https://cloud.livekit.io> and create a project.
2. Open **Settings → Keys** and create an API key pair.
3. Note the three values: **WebSocket URL** (`wss://<project>.livekit.cloud`), **API key**, **API secret**.

## 2. Configure MongoDB
- **Local:** install MongoDB Community and use `mongodb://127.0.0.1:27017/video-conferencing`.
- **Atlas:** create a free cluster, add a database user, allow your IP under *Network Access*, copy the `mongodb+srv://…` connection string (add a database name before the `?`).

## 3. Environment variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env   # optional in dev
```
| Variable (backend/.env) | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string signing session cookies (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `CLIENT_ORIGIN` | Frontend origin for CORS (dev: `http://localhost:5173`) |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | From step 1. **Secret stays on the server only.** |
| `PORT` | API port (default 5000) |

`VITE_API_URL` (frontend) is only needed in production when the API is on a different origin. In dev Vite proxies `/api` to `localhost:5000`.

## 4. Install and run
```bash
cd backend  && npm install && npm run dev     # http://localhost:5000
cd frontend && npm install && npm run dev     # http://localhost:5173
```

## 5. Test a meeting with two tabs
Session cookies are shared across tabs of one browser, and LiveKit identifies participants by user ID, so **two tabs logged in as the same user will kick each other out.** Use two different users:
1. Tab A (normal window): sign up as `alice@example.com`, click **Create meeting**, **Join now**.
2. Tab B (incognito window or a second browser profile): sign up as `bob@example.com`.
3. Copy the invite link from Alice's room (**Invite**), open it in Bob's window, **Join now**.
4. Verify video/audio (use headphones to avoid echo), chat, screen share, then as Alice open **People → Remove** on Bob. Bob lands on a "removed" screen and cannot rejoin that meeting.

Backend tests (no database or LiveKit account needed): `cd backend && npm test`.

## 6. Deployment
- **Backend** (Render, Railway, Fly.io, a VPS): set the env vars above with `NODE_ENV=production` and `CLIENT_ORIGIN=https://your-frontend`. Start command `npm start`. Must be served over HTTPS.
- **Frontend** (Vercel, Netlify, Cloudflare Pages): build `npm run build`, publish `dist/`, set `VITE_API_URL=https://your-api`, and add an SPA rewrite of all paths to `/index.html` (so `/meeting/abc-defg-hij` works on refresh).
- **Cookies:** in production the session cookie is `Secure; SameSite=None; HttpOnly`. Some browsers (notably Safari) block cross-site cookies, so prefer hosting both under one parent domain (`app.example.com` + `api.example.com`).
- Camera/mic access requires HTTPS (localhost is exempt).
- Atlas: allow your backend host's IP (or use a static-IP host).

## Architecture notes
- **Auth:** bcrypt (cost 12) password hashes; JWT in an httpOnly cookie; zod validation on every body; rate-limited login/register; generic login errors.
- **Authorization:** the server picks the host from the database, refuses ended meetings and users the host removed, and only then mints a 2-hour LiveKit token scoped to that one room (`roomAdmin` only for the host). Removal and "end for all" are host-only and use LiveKit's server API.
- **Chat:** delivered in real time over LiveKit data channels. Messages are also saved to MongoDB through an authorized endpoint (best effort; a `GET /api/meetings/:code/messages` endpoint exists, no UI yet).
- **Socket.IO:** deliberately not included. LiveKit already covers presence, active speakers, chat and reconnection, so a second realtime channel would add complexity without benefit. Add it if you later want features LiveKit doesn't provide (e.g. dashboard notifications).
- **History:** built from `Attendance` rows (one per join). `leftAt` is recorded when the client calls `/leave`; a closed tab or crash leaves it open until the user next joins or the host ends the meeting. **LiveKit webhooks** (`participant_left`, `room_finished`) would make this exact.

## Transcripts (free, implemented)
Uses the browser's built-in speech recognition, so there is no cost, API key or recording. Transcription starts automatically when someone joins (the lobby shows a notice, and the room shows a red "Transcribing" indicator); there is no off switch (muting your mic pauses it). Their own browser converts their unmuted mic to text and sends it to the backend, which stores it under their account name. After the meeting, anyone who joined can open **History → Transcript** and download a `.txt`.
- Works in **Chrome and Edge** only (the button is disabled elsewhere). Chrome sends the audio to Google's speech service, so it needs internet.
- Only covers people using Chrome or Edge, only while their mic is unmuted. Accuracy varies with accent and noise, and there are no summaries.
- It is on by default for everyone, so keep the lobby notice. Recording speech without telling people is not OK.

## Recording (not implemented; paid services)
Intentionally not faked. To add them:
1. **Recording:** LiveKit **Egress** (room composite or per-track) writes MP4/HLS to S3, GCS or Azure storage you own. You need a storage bucket + credentials, an Egress-capable LiveKit plan (check current LiveKit Cloud pricing; egress is billed per minute), a host-only `POST /api/meetings/:code/recording` calling `EgressClient.startRoomCompositeEgress`, a `Recording` model, and a LiveKit **webhook** endpoint (`egress_ended`) to save the file URL.
2. **Higher-quality transcripts:** after egress finishes, send the audio to a speech-to-text API (Deepgram, AssemblyAI, OpenAI, Google STT), or use **LiveKit Agents** for live captions. Store results in a `Transcript` model and show them on the history page. Costs are per audio minute; accuracy drops with overlapping speakers and accents.
3. **Legal:** recording needs participant consent/notice in many jurisdictions. Add an in-room "recording" indicator and a consent prompt.

## Known limitations
- Layout is a responsive grid; no spotlight view for screen shares, no virtual backgrounds, no waiting room or in-meeting mute-others.
- Remove is permanent for that meeting.
- Token TTL is 2 hours; a longer meeting needs a token refresh flow.
