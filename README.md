# ChatApp — Real-Time Chat Application

![Node.js](https://img.shields.io/badge/Node.js-20-green)
![React](https://img.shields.io/badge/React-19-blue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-black)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

A production-ready real-time chat application with OAuth authentication, room-based messaging, and a modern React frontend.

## Features

- **OAuth Authentication** — Sign in with Google or GitHub
- **Real-time Messaging** — Powered by Socket.IO with WebSocket transport
- **Room-based Chat** — Create and join multiple chat rooms
- **Active Users** — Live presence tracking per room
- **Message History** — Persistent messages stored in MongoDB
- **Production Hardened** — Rate limiting, security headers, input validation, graceful shutdown
- **Dockerized** — Multi-stage Docker build, single-command deployment

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Client (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Login   │  │  Chat    │  │  Zustand  │  │  Socket.IO    │  │
│  │  Page    │  │  Page    │  │  Store    │  │  Client       │  │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └───────┬───────┘  │
│       │              │                              │          │
└───────┼──────────────┼──────────────────────────────┼──────────┘
        │ OAuth        │ REST API                     │ WebSocket
        │ Redirect     │ (HTTP)                       │ (WS)
┌───────┼──────────────┼──────────────────────────────┼──────────┐
│       ▼              ▼                              ▼          │
│  ┌──────────┐  ┌──────────┐                  ┌───────────────┐ │
│  │  Passport│  │  Express │                  │  Socket.IO    │ │
│  │  OAuth   │  │  Routes  │                  │  Server       │ │
│  └────┬─────┘  └────┬─────┘                  └───────┬───────┘ │
│       │              │                               │         │
│       ▼              ▼                               ▼         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                            │   │
│  │  JWT Auth · Rate Limiter · Helmet · Validation          │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                   │
│                            ▼                                   │
│                    ┌───────────────┐                            │
│                    │   MongoDB     │                            │
│                    │  (Mongoose)   │                            │
│                    └───────────────┘                            │
│                     Server (Express)                           │
└────────────────────────────────────────────────────────────────┘
```

### OAuth Authentication Flow

```
User                  Client              Server             Google/GitHub
 │                      │                    │                     │
 │  Click "Sign in"     │                    │                     │
 │─────────────────────>│                    │                     │
 │                      │  GET /auth/google  │                     │
 │                      │───────────────────>│                     │
 │                      │                    │  OAuth Redirect     │
 │                      │                    │────────────────────>│
 │                      │                    │                     │
 │         Consent Screen                    │                     │
 │<───────────────────────────────────────────────────────────────│
 │                      │                    │                     │
 │  Grant Permission    │                    │  Callback + Code    │
 │────────────────────────────────────────────────────────────────>│
 │                      │                    │                     │
 │                      │                    │  User Profile       │
 │                      │                    │<────────────────────│
 │                      │                    │                     │
 │                      │                    │  Find/Create User   │
 │                      │                    │  Sign JWT           │
 │                      │                    │  Set httpOnly Cookie│
 │                      │                    │                     │
 │                      │  Redirect to /chat │                     │
 │                      │<───────────────────│                     │
 │  Chat Interface      │                    │                     │
 │<─────────────────────│                    │                     │
```

---

## System Design Decisions & Tradeoffs

### 1. JWT in httpOnly Cookies vs localStorage

**Chose: httpOnly cookies**

| | httpOnly Cookie | localStorage |
|---|---|---|
| XSS protection | Token inaccessible to JavaScript | Token readable by any script |
| CSRF risk | Vulnerable (mitigated by SameSite=Lax) | Not vulnerable |
| Server-side logout | Requires token blocklist or short expiry | Same |
| Cross-domain | Requires CORS credentials | Works with any origin |

**Why:** In a chat app where users render other users' content, XSS is the primary threat. httpOnly cookies eliminate token theft via XSS entirely. CSRF is mitigated by `SameSite=Lax` (the cookie isn't sent on cross-origin POST requests). The tradeoff is slightly more complex CORS configuration, but security wins.

### 2. In-Memory User Tracking vs Database

**Chose: In-memory `Map<roomName, Map<userId, userInfo>>`**

| | In-Memory Map | Database Tracking |
|---|---|---|
| Accuracy | Always correct | Stale on crash/restart |
| Speed | O(1) lookup | Network round-trip |
| Persistence | Lost on restart | Survives restart |
| Scalability | Single-server only | Multi-server capable |

**Why:** The old code stored `socketId` in the User document, but this created permanently stale data when the server restarted — socketIds become invalid but remain in MongoDB. In-memory tracking is always accurate because it starts empty and builds from live connections. The tradeoff is that it doesn't survive restarts, but Socket.IO clients automatically reconnect and re-register within seconds. For multi-server scaling, this would need Redis pub/sub — documented as a future improvement, not premature complexity.

### 3. References (Normalized) vs Embedded Arrays (Denormalized)

**Chose: References — query messages by `room` field**

| | References | Embedded Arrays |
|---|---|---|
| Document size | Fixed (each message is its own doc) | Unbounded (room document grows forever) |
| Query flexibility | Index-powered range queries | Must load entire array |
| Write contention | No contention between rooms | `$push` on hot room documents |
| MongoDB limit | No risk | 16MB document limit hit eventually |

**Why:** The old schema pushed every message ID into `Room.messages[]` and every user ID into `Room.users[]`. In a chat app, these arrays grow without bound. A moderately active room would hit MongoDB's 16MB document limit. References with a compound index on `{ room, createdAt }` give efficient paginated queries without document size risk.

### 4. Single Container vs Microservices

**Chose: Single multi-stage Docker container**

| | Single Container | Separate Frontend/Backend |
|---|---|---|
| Deployment complexity | One service to deploy | Two services, more config |
| Free tier compatibility | Works on any platform | Need two free-tier slots |
| Independent scaling | Cannot scale separately | Can scale frontend CDN independently |
| WebSocket routing | No proxy needed | Need WebSocket-aware proxy |

**Why:** Free-tier platforms (Render, Railway, Fly.io) give you one service. A multi-stage Dockerfile builds React in stage 1, copies the static output into the Express server's `public/` directory in stage 2. Express serves both the API and static files. This is the simplest path to deployment. The tradeoff is that you can't put the frontend on a CDN independently, but for a portfolio project with low traffic, this is the right call.

### 5. Zustand vs Redux vs React Context

**Chose: Zustand**

| | Zustand | Redux | React Context |
|---|---|---|---|
| Boilerplate | ~10 lines | ~50+ lines (actions, reducers, store) | ~20 lines |
| Re-renders | Selective subscriptions | Selective (with selectors) | Entire subtree |
| DevTools | Optional add-on | Built-in | None |
| Learning curve | Minimal | Significant | Low |

**Why:** The app has exactly two pieces of global state: auth user and socket connection status. Redux's ceremony (action types, reducers, middleware, store configuration) is unjustified for this scope. React Context with `useState` would trigger re-renders on the entire component subtree whenever auth state changes. Zustand gives selective subscriptions (only components reading `user` re-render when `user` changes) with minimal code — one file, no providers, no reducers.

### 6. Passport.js (session: false) vs Full Session Support

**Chose: Passport with `{ session: false }`**

**Why:** Passport is used only for the OAuth handshake — redirect to provider, receive callback with profile data. After the callback, we sign our own JWT and set it as a cookie. We don't use Passport's session serialization at all. This avoids needing `express-session`, a session store (Redis/MongoDB), and session configuration. The tradeoff is that we can't use `req.isAuthenticated()` or `req.user` from Passport — but our own JWT middleware provides `req.user` from the token, which is simpler.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19, Tailwind CSS, Vite | UI framework, styling, build tool |
| State | Zustand | Auth state management |
| Real-time | Socket.IO Client | WebSocket communication |
| Routing | React Router v7 | Client-side navigation |
| Backend | Express.js, Node.js 20 | HTTP server, API |
| Real-time | Socket.IO Server | WebSocket server |
| Auth | Passport.js, JWT | Google/GitHub OAuth |
| Database | MongoDB, Mongoose | Data persistence, ODM |
| Security | Helmet, express-rate-limit | Headers, rate limiting |
| DevOps | Docker, docker-compose | Containerization |

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/google` | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | Google OAuth callback |
| GET | `/auth/github` | Initiate GitHub OAuth flow |
| GET | `/auth/github/callback` | GitHub OAuth callback |
| POST | `/auth/logout` | Clear auth cookie |

### REST API (requires authentication)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Get current user profile |
| GET | `/api/rooms` | List all rooms |
| GET | `/api/rooms/:roomName/messages` | Get message history (last 100) |

### Socket.IO Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join-room` | Client → Server | `roomName` | Join a chat room |
| `leave-room` | Client → Server | `roomName` | Leave a chat room |
| `send-message` | Client → Server | `roomName, text` | Send a message |
| `room-joined` | Server → Client | `{ roomName }` | Confirm room joined |
| `message` | Server → Client | `{ id, text, user, avatar, createdAt }` | New message |
| `user-joined` | Server → Client | `{ displayName }` | User entered room |
| `user-left` | Server → Client | `{ displayName }` | User left room |
| `active-users` | Server → Client | `[{ displayName, avatar }]` | Updated user list |
| `error-message` | Server → Client | `{ error }` | Error notification |

---

## Project Structure

```
chatApp/
├── server/                     # Backend
│   ├── index.js                # Entry point — wires Express, Socket.IO, middleware
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   ├── env.js              # Environment config with defaults
│   │   └── passport.js         # Google + GitHub OAuth strategies
│   ├── middleware/
│   │   ├── auth.js             # JWT verification for HTTP routes
│   │   ├── socketAuth.js       # JWT verification for Socket.IO
│   │   ├── validate.js         # express-validator result checker
│   │   └── errorHandler.js     # Global error handler
│   ├── routes/
│   │   ├── auth.js             # OAuth routes
│   │   ├── rooms.js            # Room and message endpoints
│   │   └── users.js            # User profile endpoint
│   ├── controllers/
│   │   ├── authController.js   # JWT signing, cookie management
│   │   ├── roomController.js   # Room queries, message history
│   │   └── userController.js   # User profile queries
│   ├── socket/
│   │   ├── index.js            # Socket.IO server setup
│   │   └── chatHandler.js      # Real-time event handlers + in-memory tracking
│   └── models/
│       ├── User.js             # OAuth user schema
│       ├── Message.js          # Chat message schema (indexed)
│       └── Room.js             # Chat room schema
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── main.jsx            # React entry point
│   │   ├── App.jsx             # Router setup
│   │   ├── pages/
│   │   │   ├── Login.jsx       # OAuth sign-in page
│   │   │   └── Chat.jsx        # Main chat interface
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── RoomList.jsx
│   │   │   ├── ChatRoom.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   └── UserList.jsx
│   │   ├── store/
│   │   │   └── useAuthStore.js # Zustand auth state
│   │   ├── hooks/
│   │   │   └── useSocket.js    # Socket.IO React hook
│   │   └── lib/
│   │       ├── api.js          # Fetch wrapper
│   │       └── socket.js       # Socket.IO client instance
│   └── vite.config.js          # Vite + Tailwind + dev proxy
├── Dockerfile                  # Multi-stage production build
├── docker-compose.yml          # App + MongoDB for local dev
├── .env.example                # Environment variables reference
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Google OAuth credentials ([Console](https://console.cloud.google.com/apis/credentials))
- GitHub OAuth credentials ([Settings](https://github.com/settings/developers))

### Local Development

1. **Clone and install dependencies**

```bash
git clone <your-repo-url>
cd chatApp

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

2. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start development servers**

```bash
# Terminal 1: Start backend
cd server && npm run dev

# Terminal 2: Start frontend
cd client && npm run dev
```

4. Open `http://localhost:5173`

### Docker

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your credentials

# Build and run
docker-compose up --build
```

Open `http://localhost:3000`

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | Secret key for JWT signing |
| `GOOGLE_CLIENT_ID` | Yes | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | — | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | Yes | — | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | Yes | — | GitHub OAuth client secret |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL (for CORS in dev) |

---

## Deployment

### Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Set **Environment** to `Docker`
4. Add environment variables from `.env.example`
5. Set `GOOGLE_CALLBACK_URL` and `GITHUB_CALLBACK_URL` to your Render URL (e.g., `https://your-app.onrender.com/auth/google/callback`)

### Railway

```bash
railway login
railway init
railway up
# Set env vars in Railway dashboard
```

### Fly.io

```bash
fly launch
fly secrets set JWT_SECRET=... GOOGLE_CLIENT_ID=... # etc
fly deploy
```

---

## Future Improvements

- **Redis pub/sub** for multi-server horizontal scaling
- **Message pagination** with cursor-based infinite scroll
- **File/image sharing** with cloud storage (S3/Cloudinary)
- **Typing indicators** via Socket.IO transient events
- **Read receipts** and unread message counts
- **E2E encryption** for private rooms
- **Push notifications** for mobile web

---

## License

MIT
