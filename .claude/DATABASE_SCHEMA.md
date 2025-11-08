# Database Schema - Detailed Reference

## 📍 Schema Location
`backend/prisma/schema.prisma`

## 🗄️ Complete Schema

### User
**Purpose:** Authentication and event ownership
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  displayName   String   @map("display_name")
  phone         String?
  avatarUrl     String?  @map("avatar_url")
  createdAt     DateTime @default(now()) @map("created_at")
  lastLoginAt   DateTime? @map("last_login_at")
  isActive      Boolean  @default(true) @map("is_active")

  // Relations
  ownedEvents      Event[]  @relation("EventOwner")
  collaborations   EventCollaborator[]

  @@map("users")
}
```

**Fields:**
- `id`: UUID, primary key
- `email`: Unique login identifier
- `passwordHash`: bcrypt hashed password (NEVER plain text!)
- `displayName`: User's visible name
- `phone`: Optional contact number
- `avatarUrl`: Optional profile picture URL
- `createdAt`: Account creation timestamp
- `lastLoginAt`: Last successful login
- `isActive`: Soft delete flag

---

### Event
**Purpose:** Wedding, party, corporate event, etc.
```prisma
model Event {
  id          String   @id @default(uuid())
  name        String
  date        DateTime
  location    String?
  status      String   @default("planning")  // planning, active, completed, archived
  ownerUserId String   @map("owner_user_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  owner         User     @relation("EventOwner", fields: [ownerUserId], references: [id], onDelete: Cascade)
  collaborators EventCollaborator[]
  guests        Guest[]
  tables        Table[]
  versions      Version[]
  groups        Group[]
  constraints   SeatingConstraint[]

  @@map("events")
}
```

**Fields:**
- `id`: UUID, primary key
- `name`: "Sarah's Wedding", "Company Gala"
- `date`: Event date
- `location`: Venue name/address
- `status`: Current planning state
- `ownerUserId`: Foreign key to User
- `createdAt`/`updatedAt`: Audit timestamps

---

### EventCollaborator
**Purpose:** Share events with other users
```prisma
model EventCollaborator {
  id         String   @id @default(uuid())
  eventId    String   @map("event_id")
  userId     String   @map("user_id")
  role       String   // viewer, editor, admin
  invitedBy  String   @map("invited_by")
  invitedAt  DateTime @default(now()) @map("invited_at")
  acceptedAt DateTime? @map("accepted_at")
  status     String   @default("active")  // invited, active, removed
  
  // Relations
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
  @@map("event_collaborators")
}
```

**Roles:**
- `viewer`: Read-only access
- `editor`: Can modify guests/tables
- `admin`: Can invite others, full control except delete event
- (owner role is implicit via Event.ownerUserId)

---

### Guest
**Purpose:** People attending the event
```prisma
model Guest {
  id                   String   @id @default(uuid())
  eventId              String   @map("event_id")
  name                 String
  lastName             String?  @map("last_name")
  email                String?
  phone                String?
  guestType            String   @default("primary")  // primary, companion, child
  primaryGuestId       String?  @map("primary_guest_id")
  dietaryRestrictions  String[] @map("dietary_restrictions")
  allergies            String?  // Free text for medical allergies
  hasSevereAllergies   Boolean  @default(false) @map("has_severe_allergies")
  mealNotes            String?  @map("meal_notes")
  currentGroup         String?  @map("current_group")
  side                 String?  // bride, groom (for weddings)
  rsvpStatus           String   @default("pending")  // pending, confirmed, declined
  addedByUser          String   @map("added_by_user")
  approved             Boolean  @default(true)  // For approval workflows
  notes                String?
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  // Relations
  event          Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  group          Group?   @relation(fields: [currentGroup], references: [id])
  primaryGuest   Guest?   @relation("GuestCompanions", fields: [primaryGuestId], references: [id])
  companions     Guest[]  @relation("GuestCompanions")
  assignments    TableAssignment[]
  constraintsAs1 SeatingConstraint[] @relation("Guest1")
  constraintsAs2 SeatingConstraint[] @relation("Guest2")

  @@map("guests")
}
```

**Key Fields:**
- `guestType`: primary (main guest), companion (+1), child
- `primaryGuestId`: Links companion to primary guest
- `dietaryRestrictions`: Array like ["Vegan", "GlutenFree"]
- `allergies`: Free text for medical info
- `rsvpStatus`: Invitation response tracking

---

### Group
**Purpose:** Organize guests (family, friends, colleagues)
```prisma
model Group {
  id                String   @id @default(uuid())
  eventId           String   @map("event_id")
  name              String
  color             String   @default("blue")
  seatingPreference String   @default("no_preference")  // must_sit_together, prefer_together, can_split, no_preference
  preferAdjacent    Boolean  @default(false)  @map("prefer_adjacent")
  priority          String   @default("medium")  // high, medium, low
  notes             String?
  createdAt         DateTime @default(now()) @map("created_at")

  // Relations
  event   Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  members Guest[]

  @@map("groups")
}
```

**Seating Preferences:**
- `must_sit_together`: All at ONE table (hard constraint)
- `prefer_together`: Try to keep at one table
- `can_split`: OK to split across tables
- `no_preference`: Treat as individuals

---

### Version
**Purpose:** Different seating arrangements for same event
```prisma
model Version {
  id              String   @id @default(uuid())
  eventId         String   @map("event_id")
  versionNumber   Int      @map("version_number")
  name            String
  description     String?
  isActive        Boolean  @default(false)  @map("is_active")
  hallDimensions  Json?    @map("hall_dimensions")  // { width: 1000, height: 800, unit: "pixels" }
  createdByUser   String   @map("created_by_user")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  event       Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tables      Table[]
  assignments TableAssignment[]

  @@unique([eventId, versionNumber])
  @@map("versions")
}
```

**Purpose:** Compare different seating layouts
- "Version 1: Round Tables"
- "Version 2: Long Tables"
- "Version 3: VIP Section Expanded"

---

### Table
**Purpose:** Physical tables in venue
```prisma
model Table {
  id           String   @id @default(uuid())
  versionId    String   @map("version_id")
  eventId      String   @map("event_id")
  name         String
  number       Int
  totalSeats   Int      @map("total_seats")
  shape        String   @default("Circle")  // Circle, Rectangle, Square
  section      String?  // "Main Hall", "Balcony", "VIP"
  position     Json     // { x: 100, y: 200 }
  color        String?
  adjacentTables String[] @map("adjacent_tables")  // Array of table IDs
  isReserved   Boolean  @default(false)  @map("is_reserved")
  notes        String?
  createdAt    DateTime @default(now()) @map("created_at")

  // Relations
  version     Version           @relation(fields: [versionId], references: [id], onDelete: Cascade)
  event       Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  assignments TableAssignment[]

  @@map("tables")
}
```

**Position Format:**
```json
{
  "x": 100,
  "y": 200
}
```

**Adjacent Tables:** Array of neighboring table IDs for algorithm

---

### TableAssignment
**Purpose:** Link guest to table in specific version
```prisma
model TableAssignment {
  id          String   @id @default(uuid())
  versionId   String   @map("version_id")
  guestId     String   @map("guest_id")
  tableId     String   @map("table_id")
  seatNumber  Int?     @map("seat_number")
  isAttending Boolean  @default(true)  @map("is_attending")  // Can exclude guest from version
  assignedAt  DateTime @default(now()) @map("assigned_at")
  assignedBy  String?  @map("assigned_by")

  // Relations
  version Version @relation(fields: [versionId], references: [id], onDelete: Cascade)
  guest   Guest   @relation(fields: [guestId], references: [id], onDelete: Cascade)
  table   Table   @relation(fields: [tableId], references: [id], onDelete: Cascade)

  @@unique([versionId, guestId])  // Guest can only be at one table per version
  @@map("table_assignments")
}
```

**Key Points:**
- Links guest to table IN SPECIFIC VERSION
- `isAttending`: false = guest excluded from this version
- Unique constraint: guest can only be at ONE table per version

---

### SeatingConstraint
**Purpose:** Guest relationships (must/must-not sit together)
```prisma
model SeatingConstraint {
  id             String   @id @default(uuid())
  eventId        String   @map("event_id")
  guest1Id       String   @map("guest_1_id")
  guest2Id       String   @map("guest_2_id")
  constraintType String   @map("constraint_type")  // must_sit_together, must_not_sit_together
  priority       String   @default("medium")  // high, medium, low
  reason         String?
  createdAt      DateTime @default(now()) @map("created_at")

  // Relations
  event  Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  guest1 Guest @relation("Guest1", fields: [guest1Id], references: [id], onDelete: Cascade)
  guest2 Guest @relation("Guest2", fields: [guest2Id], references: [id], onDelete: Cascade)

  @@unique([guest1Id, guest2Id])  // Can't have duplicate constraints
  @@map("seating_constraints")
}
```

**Constraint Types:**
- `must_sit_together`: Married couple, parent+child
- `must_not_sit_together`: Feuding relatives, exes

---

## 🔄 Migrations History

### Migration 1: Initial Schema
```bash
npx prisma migrate dev --name init
```
**Date:** 2025-11-08
**Changes:** Created all base tables

### Migration 2: Add Guest Types
```bash
npx prisma migrate dev --name add_guest_types
```
**Date:** TBD
**Changes:** Added guest_type, primary_guest_id for companions

[Add more as you create them]

---

## 📊 Common Queries

### Get All Guests in Event
```typescript
const guests = await prisma.guest.findMany({
  where: { eventId: 'event-uuid' },
  include: {
    group: true,
    companions: true,
    assignments: {
      where: { versionId: 'version-uuid' },
      include: { table: true }
    }
  }
});
```

### Get Unseated Guests in Version
```typescript
const unseated = await prisma.guest.findMany({
  where: {
    eventId: 'event-uuid',
    assignments: {
      none: { versionId: 'version-uuid' }
    }
  }
});
```

### Get Guests at Table
```typescript
const guests = await prisma.guest.findMany({
  where: {
    assignments: {
      some: {
        versionId: 'version-uuid',
        tableId: 'table-uuid'
      }
    }
  }
});
```

### Check Constraint Violations
```typescript
const violations = await prisma.seatingConstraint.findMany({
  where: {
    eventId: 'event-uuid',
    constraintType: 'must_sit_together',
    AND: [
      {
        guest1: {
          assignments: {
            some: { versionId: 'version-uuid', tableId: { not: null } }
          }
        }
      },
      {
        guest2: {
          assignments: {
            some: {
              versionId: 'version-uuid',
              tableId: { not: { equals: /* guest1's tableId */ } }
            }
          }
        }
      }
    ]
  }
});
```

---

## 🎯 Indexing Strategy (Performance)
```prisma
// Already indexed (Prisma does this automatically):
- All @id fields
- All @unique fields
- All @relation foreign keys

// Consider adding if slow:
@@index([eventId, updatedAt])  // For sync queries
@@index([versionId, guestId])  // For assignment lookups
@@index([currentGroup])         // For group queries
```

---

**Last Updated:** 2025-11-08
**Schema Version:** 1
**Total Tables:** 9