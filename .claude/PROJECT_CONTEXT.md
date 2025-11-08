# Guest Management App - Project Context

## 🎯 Project Purpose
Event seating arrangement application for weddings, parties, and corporate events.
Users can manage guests, create table layouts, and generate optimal seating arrangements.

## 📊 Current Status

### Completed ✅
- [ ] Project structure initialized
- [ ] Tech stack decided
- [ ] Database schema designed
- [ ] Git repository set up

### In Progress 🔄
- [ ] Backend setup (Express + Prisma)
- [ ] Database migrations
- [ ] Authentication implementation

### Not Started ⏳
- [ ] Guest CRUD API
- [ ] Table management API
- [ ] Version system
- [ ] Frontend development
- [ ] Seating algorithm

## 🛠️ Tech Stack Decisions

### Backend
- **Language:** Node.js + TypeScript
- **Framework:** Express
- **ORM:** Prisma
- **Database:** PostgreSQL (hosted on Supabase)
- **Authentication:** JWT tokens with bcrypt

**Why:** Same language as frontend, type-safe with Prisma, mature ecosystem

### Frontend
- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State:** Zustand (simple, not overkill)
- **Local Cache:** IndexedDB via Dexie
- **Drag & Drop:** react-dnd

**Why:** Fast development, modern tooling, offline-first capability

### Database
- **Provider:** Supabase (PostgreSQL)
- **Connection:** Direct via Prisma

**Why:** Free tier sufficient, easy setup, can use just the database

## 🧠 Key Design Decisions

### Decision 1: Data Structure
**Date:** 2025-11-08
**Decision:** Guests at EVENT level, Tables at VERSION level

**Rationale:**
- Same guests exist across all versions
- Different table arrangements per version
- TableAssignment links guest to table in specific version
- Allows comparing different seating arrangements

**Schema:**
```
Event (1) → (N) Guest
Event (1) → (N) Version
Version (1) → (N) Table
Version (1) → (N) TableAssignment (links Guest to Table)
```

### Decision 2: ID Strategy
**Date:** 2025-11-08
**Decision:** UUIDs for all IDs

**Rationale:**
- Generate offline without server
- No collisions across devices
- Enables local-first architecture

**Implementation:** `id: uuidv4()` in application code

### Decision 3: Sync Strategy
**Date:** 2025-11-08
**Decision:** Use both `updated_at` and `synced_at` fields

**Rationale:**
- `updated_at`: when data changed
- `synced_at`: when device last synced
- Enables incremental sync (only changes since last sync)
- Enables conflict detection

### Decision 4: User Permissions
**Date:** 2025-11-08
**Decision:** Role-based only (viewer/editor/admin/owner)

**Rationale:**
- Simple to understand
- Covers 90% of use cases
- Can add granular permissions later if needed

**Roles:**
- Owner: Full control
- Admin: Everything except delete event
- Editor: Can modify content, can't invite others
- Viewer: Read-only

### Decision 5: Group Seating Preferences
**Date:** 2025-11-08
**Decision:** Simple enum for MVP (must_sit_together, prefer_together, can_split, no_preference)

**Rationale:**
- Keep it simple for MVP
- Skip max_tables/min_per_table initially
- Use automatic splitting algorithm
- Can add advanced options later if users request

### Decision 6: Plus-Ones / Companions
**Date:** 2025-11-08
**Decision:** Create separate Guest records with guest_type field

**Rationale:**
- Each person is a real guest (can track diet, RSVP, seating)
- Can assign to different tables if needed
- Automatic must_sit_together constraint created
- More flexible than just a counter

**Schema:**
```javascript
Guest: {
  guest_type: "primary" | "companion" | "child"
  primary_guest_id: uuid | null  // Links companion to primary
}
```

### Decision 7: Dietary Preferences
**Date:** 2025-11-08
**Decision:** Array of strings (not enum, not boolean map)

**Rationale:**
- Flexible: guest can be Vegan + GlutenFree
- Simple to query
- Easy to add new restrictions
- No wasted storage

**Implementation:**
```javascript
dietary_restrictions: ["Vegan", "GlutenFree", "NutAllergy"]
```

## 🗄️ Database Schema Summary

### Core Tables
- **User** - Authentication and ownership
- **Event** - Wedding, party, etc.
- **EventCollaborator** - Sharing events with other users
- **Guest** - People attending event
- **Group** - Organizing guests (family, friends, etc.)
- **Version** - Different seating arrangements
- **Table** - Physical tables in a version
- **TableAssignment** - Links guest to table in version
- **SeatingConstraint** - Guest pairs (must/must-not sit together)

### Key Relationships
```
User (1) → (N) Event [owner]
Event (1) → (N) Guest
Event (1) → (N) Version
Version (1) → (N) Table
Version (1) → (N) TableAssignment
Guest (N) ↔ (1) Table [via TableAssignment]
Guest (N) ↔ (1) Group
Guest (N) ↔ (N) Guest [via SeatingConstraint]
```

## 📝 Important Implementation Notes

### Always Use Migrations
```bash
# Never manually edit database!
npx prisma migrate dev --name descriptive_name
```

### ID Generation
```javascript
// In application code, not database
import { v4 as uuidv4 } from 'uuid';
const guestId = uuidv4();
```

### Sync Fields
```javascript
// Every entity that syncs needs:
created_at: DateTime
updated_at: DateTime

// Local database also needs:
synced_at: DateTime  // Track sync status
```

### Permissions Check Pattern
```javascript
// Every protected route:
async function requireEventAccess(userId, eventId) {
  const role = await getUserRoleForEvent(userId, eventId);
  if (!role) throw new Error("No access");
  return role;
}
```

## 🚀 Next Steps (Priority Order)

### Phase 1: Backend Foundation (This Week)
1. [ ] Initialize backend project structure
2. [ ] Set up Prisma with PostgreSQL (Supabase)
3. [ ] Create complete schema
4. [ ] Run initial migration
5. [ ] Set up Express server with CORS

### Phase 2: Authentication (This Week)
1. [ ] Implement user registration endpoint
2. [ ] Implement login endpoint with JWT
3. [ ] Create auth middleware
4. [ ] Test with Postman/curl

### Phase 3: Core API (Next Week)
1. [ ] Event CRUD endpoints
2. [ ] Guest CRUD endpoints
3. [ ] Table CRUD endpoints
4. [ ] Version management endpoints
5. [ ] Group management endpoints

### Phase 4: Advanced Features (Week 3)
1. [ ] Create tables from group feature
2. [ ] Clone version functionality
3. [ ] Seating algorithm implementation
4. [ ] Constraint validation

### Phase 5: Frontend (Week 4+)
1. [ ] Authentication UI
2. [ ] Event list and creation
3. [ ] Guest management interface
4. [ ] Drag-and-drop table canvas
5. [ ] Version comparison

## ❓ Open Questions / Decisions Needed

### Question 1: CSV Import
**Status:** Undecided
**Question:** Should we add bulk guest import from CSV?
**Considerations:**
- Pros: Fast data entry for large events
- Cons: More complexity, validation needed
**Decision:** TBD after MVP

### Question 2: Email Provider
**Status:** Undecided
**Question:** Which email service for invitations?
**Options:** SendGrid (free tier: 100/day), AWS SES, Resend
**Decision:** Defer until invitation feature

### Question 3: Real-time Collaboration
**Status:** Undecided
**Question:** Should multiple users see real-time updates?
**Considerations:**
- Pros: Better collaboration UX
- Cons: Significantly more complex (WebSockets)
**Decision:** No for MVP, poll every 30 seconds instead

## 🐛 Known Issues / Technical Debt
- None yet (just starting!)

## 📚 Resources & References
- Prisma Docs: https://www.prisma.io/docs
- Express Best Practices: https://expressjs.com/en/advanced/best-practice-performance.html
- React DnD: https://react-dnd.github.io/react-dnd/
- Supabase Docs: https://supabase.com/docs

## 👤 Team & Contact
- **Developer:** Nir
- **Start Date:** 2025-11-08
- **Repository:** [Add GitHub URL when created]

---

**Last Updated:** 2025-11-08 by Nir
**Last Computer Used:** [Work/Home/etc]
**Claude Code Session:** [Session number or date]