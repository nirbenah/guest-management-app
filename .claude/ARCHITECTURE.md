# System Architecture

## 📁 Directory Structure
```
guest-management-app/
├── .claude/                      # Project context files
│   ├── PROJECT_CONTEXT.md       # Main context (you are here)
│   ├── ARCHITECTURE.md          # This file
│   ├── DATABASE_SCHEMA.md       # Detailed schema
│   ├── TODO.md                  # Current tasks
│   └── SESSIONS.md              # Session history
│
├── backend/                      # Node.js API
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── migrations/          # Migration files
│   │       └── 20250108_init/
│   │           └── migration.sql
│   ├── src/
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.ts          # POST /auth/register, /auth/login
│   │   │   ├── events.ts        # Event CRUD
│   │   │   ├── guests.ts        # Guest CRUD
│   │   │   ├── tables.ts        # Table CRUD
│   │   │   ├── versions.ts      # Version management
│   │   │   └── groups.ts        # Group CRUD
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT verification
│   │   │   ├── permissions.ts   # Role checking
│   │   │   └── errorHandler.ts  # Global error handling
│   │   ├── services/            # Business logic
│   │   │   ├── authService.ts
│   │   │   ├── guestService.ts
│   │   │   ├── tableService.ts
│   │   │   ├── seatingAlgorithm.ts
│   │   │   └── syncService.ts
│   │   ├── repositories/        # Database access
│   │   │   ├── guestRepository.ts
│   │   │   ├── tableRepository.ts
│   │   │   └── eventRepository.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   └── validation.ts
│   │   ├── types/               # TypeScript types
│   │   │   └── index.ts
│   │   └── server.ts            # Express app entry point
│   ├── tests/                   # Tests (add later)
│   ├── .env                     # Environment variables (not committed)
│   ├── .env.example             # Template (committed)
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── frontend/                     # React app
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── ui/              # Base components (Button, Input, etc.)
│   │   │   ├── GuestList.tsx
│   │   │   ├── GuestCard.tsx
│   │   │   ├── TableCanvas.tsx
│   │   │   ├── DraggableTable.tsx
│   │   │   ├── GroupPanel.tsx
│   │   │   └── VersionSelector.tsx
│   │   ├── pages/               # Route components
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── EventList.tsx
│   │   │   ├── EventEditor.tsx
│   │   │   └── NotFound.tsx
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── usePermissions.ts
│   │   │   ├── useSync.ts
│   │   │   └── useLocalDB.ts
│   │   ├── services/            # API & local storage
│   │   │   ├── api.ts           # Axios wrapper
│   │   │   ├── localDB.ts       # IndexedDB via Dexie
│   │   │   └── syncService.ts   # Sync logic
│   │   ├── store/               # State management (Zustand)
│   │   │   ├── authStore.ts
│   │   │   ├── eventStore.ts
│   │   │   └── guestStore.ts
│   │   ├── types/               # TypeScript types (shared with backend)
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   ├── App.tsx              # Root component
│   │   ├── main.tsx             # Entry point
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── .gitignore
├── README.md
└── package.json                  # Root package (optional monorepo setup)
```

## 🌐 API Structure

### Authentication Routes
```
POST   /api/auth/register        # Create new user account
POST   /api/auth/login           # Login and get JWT token
POST   /api/auth/logout          # Logout (optional)
GET    /api/auth/me              # Get current user info
```

### Event Routes
```
GET    /api/events                    # Get user's events (owned + collaborated)
POST   /api/events                    # Create new event
GET    /api/events/:id                # Get event details
PUT    /api/events/:id                # Update event
DELETE /api/events/:id                # Delete event (owner only)
POST   /api/events/:id/collaborators  # Invite collaborator
DELETE /api/events/:id/collaborators/:collabId  # Remove collaborator
GET    /api/events/:id/stats          # Get event statistics
```

### Guest Routes
```
GET    /api/events/:eventId/guests           # Get all guests in event
POST   /api/events/:eventId/guests           # Add guest
GET    /api/guests/:id                       # Get guest details
PUT    /api/guests/:id                       # Update guest
DELETE /api/guests/:id                       # Delete guest
POST   /api/guests/:id/companion             # Add companion (+1)
GET    /api/events/:eventId/guests/export   # Export guest list CSV
POST   /api/events/:eventId/guests/import   # Bulk import from CSV
```

### Table Routes
```
GET    /api/versions/:versionId/tables      # Get all tables in version
POST   /api/versions/:versionId/tables      # Create table
GET    /api/tables/:id                      # Get table details
PUT    /api/tables/:id                      # Update table (position, seats, etc.)
DELETE /api/tables/:id                      # Delete table
POST   /api/tables/:id/assign               # Assign guest to table
DELETE /api/tables/:id/guests/:guestId      # Remove guest from table
```

### Version Routes
```
GET    /api/events/:eventId/versions        # Get all versions
POST   /api/events/:eventId/versions        # Create new version
GET    /api/versions/:id                    # Get version details
PUT    /api/versions/:id                    # Update version name/description
DELETE /api/versions/:id                    # Delete version
POST   /api/versions/:id/clone              # Clone version
PUT    /api/versions/:id/activate           # Set as active version
GET    /api/versions/:id/stats              # Get seating statistics
POST   /api/versions/:id/auto-assign        # Run seating algorithm
```

### Group Routes
```
GET    /api/events/:eventId/groups             # Get all groups
POST   /api/events/:eventId/groups             # Create group
GET    /api/groups/:id                         # Get group details
PUT    /api/groups/:id                         # Update group
DELETE /api/groups/:id                         # Delete group
POST   /api/groups/:id/members                 # Add guest to group
DELETE /api/groups/:id/members/:guestId        # Remove guest from group
POST   /api/groups/:id/create-tables           # Create dedicated tables from group
```

### Constraint Routes
```
GET    /api/events/:eventId/constraints        # Get all seating constraints
POST   /api/events/:eventId/constraints        # Create constraint
DELETE /api/constraints/:id                    # Delete constraint
GET    /api/versions/:versionId/validate       # Validate constraints for version
```

### Sync Routes
```
POST   /api/sync/push                          # Push local changes to cloud
POST   /api/sync/pull                          # Get changes since timestamp
GET    /api/sync/status/:eventId               # Get sync status
```

## 🔐 Authentication Flow
```
1. User registers:
   POST /api/auth/register
   → Create user with hashed password
   → Return JWT token
   
2. User logs in:
   POST /api/auth/login
   → Verify email + password
   → Generate JWT token (expires 7 days)
   → Return { user, token }
   
3. Protected requests:
   GET /api/events
   Headers: { Authorization: "Bearer <token>" }
   → Middleware verifies token
   → Attaches user to request
   → Route handler has access to req.user
```

## 🗄️ Database Relationships
```
User ─────(owns)──────> Event
User ─(collaborates)──> Event [via EventCollaborator]

Event ────(has)────> Guest
Event ────(has)────> Version
Event ────(has)────> Group

Version ──(has)────> Table
Version ──(has)────> TableAssignment

Guest ────(in)─────> Group
Guest ──(assigned)─> Table [via TableAssignment]
Guest ─(constrained)> Guest [via SeatingConstraint]
```

## 🔄 Data Flow

### Creating a Guest
```
Frontend                    Backend                      Database
   │                           │                            │
   │ POST /api/guests         │                            │
   ├──────────────────────────>│                            │
   │                           │ 1. Verify JWT              │
   │                           │ 2. Check permissions       │
   │                           │ 3. Validate data           │
   │                           │                            │
   │                           │ prisma.guest.create()     │
   │                           ├───────────────────────────>│
   │                           │                            │
   │                           │<───────────────────────────┤
   │                           │ Return created guest       │
   │<──────────────────────────┤                            │
   │                           │                            │
   │ 4. Save to IndexedDB      │                            │
   │ 5. Update UI              │                            │
```

### Sync Process
```
Device                     Backend                    PostgreSQL
   │                          │                           │
   │ 1. User edits offline    │                           │
   │    (saved to IndexedDB)  │                           │
   │                          │                           │
   │ 2. Internet returns      │                           │
   │ POST /api/sync/push      │                           │
   ├─────────────────────────>│                           │
   │ { changes: [...] }       │                           │
   │                          │ 3. Validate changes       │
   │                          │ 4. Check conflicts        │
   │                          │                           │
   │                          │ 5. Apply changes          │
   │                          ├──────────────────────────>│
   │                          │<──────────────────────────┤
   │                          │ 6. Return success         │
   │<─────────────────────────┤                           │
   │ 7. Update synced_at      │                           │
```

## 🎨 Frontend State Management

### Zustand Stores
```typescript
// authStore.ts - User authentication state
{
  user: User | null,
  token: string | null,
  login: (email, password) => Promise<void>,
  logout: () => void,
  isAuthenticated: boolean
}

// eventStore.ts - Current event state
{
  currentEvent: Event | null,
  events: Event[],
  loadEvents: () => Promise<void>,
  selectEvent: (id) => void
}

// guestStore.ts - Guest management
{
  guests: Guest[],
  addGuest: (guest) => void,
  updateGuest: (id, data) => void,
  deleteGuest: (id) => void
}
```

## 💾 Local Storage (IndexedDB via Dexie)

### Database Schema
```typescript
const db = new Dexie('GuestManagementDB');

db.version(1).stores({
  users: 'id, email',
  events: 'id, ownerUserId',
  guests: 'id, eventId, currentGroup',
  tables: 'id, versionId',
  versions: 'id, eventId',
  assignments: 'id, versionId, guestId, tableId',
  groups: 'id, eventId',
  constraints: 'id, eventId',
  syncQueue: '++id, entityType, action',  // Pending sync operations
  metadata: 'key'  // lastSyncTime, etc.
});
```

## 🔄 Sync Strategy

### Incremental Sync
```typescript
1. Track last sync time: lastSyncTime

2. Find local changes:
   - WHERE updated_at > synced_at
   
3. Push to backend:
   - POST /api/sync/push with changes
   
4. Pull from backend:
   - GET /api/sync/pull?since=lastSyncTime
   
5. Merge changes:
   - Apply backend changes to local DB
   - Update synced_at timestamps
   
6. Update lastSyncTime
```

### Conflict Resolution (MVP: Last Write Wins)
```typescript
if (cloudRecord.updated_at > localRecord.synced_at) {
  // Cloud is newer - use cloud version
  localDB.update(localRecord.id, cloudRecord);
} else {
  // Local is newer or same - keep local
}

// Later: Show conflict UI for user to choose
```

## 🧪 Testing Strategy (Future)
```
backend/tests/
├── unit/
│   ├── services/
│   └── repositories/
├── integration/
│   └── routes/
└── e2e/
    └── scenarios/
```

---

**Last Updated:** 2025-11-08
**Claude Session:** Initial setup