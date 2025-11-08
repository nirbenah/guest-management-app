# Current Tasks & Progress

## 🔥 In Progress

No tasks currently in progress.

---

## ⏭️ Next Up (Priority Order)

### 1. Database Setup
- [ ] Create Supabase account
- [ ] Get PostgreSQL connection string
- [ ] Configure `.env` file
- [ ] Initialize Prisma
- [ ] Create schema.prisma based on DATABASE_SCHEMA.md
- [ ] Run first migration

**Estimated Time:** 1-2 hours
**Dependencies:** Backend structure complete

---

### 2. Authentication Implementation
- [ ] Create User model (already in schema)
- [ ] Implement registration endpoint
- [ ] Implement login endpoint
- [ ] Create JWT utility functions
- [ ] Create auth middleware
- [ ] Test with Postman

**Estimated Time:** 3-4 hours
**Dependencies:** Database setup

---

### 3. Event CRUD API
- [ ] Create Event routes
- [ ] Implement: Create event
- [ ] Implement: Get user's events
- [ ] Implement: Update event
- [ ] Implement: Delete event
- [ ] Add permission checks

**Estimated Time:** 2-3 hours
**Dependencies:** Authentication

---

## 📅 Backlog (Future Tasks)

### Backend
- [ ] Guest CRUD endpoints
- [ ] Table management endpoints
- [ ] Version cloning functionality
- [ ] Group management
- [ ] Seating constraints CRUD
- [ ] "Create tables from group" feature
- [ ] Seating algorithm implementation
- [ ] Sync endpoints
- [ ] CSV import/export

### Frontend
- [ ] Project setup (Vite + React)
- [ ] Authentication UI (Login/Register)
- [ ] Event list page
- [ ] Event editor page
- [ ] Guest list component
- [ ] Table canvas (drag & drop)
- [ ] Version selector
- [ ] Group management UI
- [ ] Seating algorithm trigger
- [ ] IndexedDB setup
- [ ] Sync implementation

### DevOps
- [ ] Set up CI/CD
- [ ] Deploy backend to Railway/Render
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Set up monitoring
- [ ] Add logging

---

## ✅ Completed

### 2025-11-08
- [x] Decided on tech stack (Node.js + Express + Prisma + PostgreSQL)
- [x] Created project context files
- [x] Designed complete database schema
- [x] Set up Git repository
- [x] Initialize backend project structure
  - [x] Initialize Node.js project (`npm init`)
  - [x] Install dependencies (Express, Prisma, TypeScript, Zod, etc.)
  - [x] Set up TypeScript configuration with strict mode
  - [x] Create folder structure (routes, middleware, services, utils, types)
  - [x] Set up ESLint & Prettier configuration
  - [x] Create basic Express server with security middleware
  - [x] Set up environment configuration files (.env, .env.example)
  - [x] Create complete Prisma schema matching DATABASE_SCHEMA.md
  - [x] Create authentication middleware (JWT-based)
  - [x] Create error handling middleware
  - [x] Create validation utilities with Zod
  - [x] Set up API route stubs for auth, events, and guests
  - [x] Verify TypeScript compilation and code formatting

---

## 🚫 Blocked

No blocked tasks currently.

---

## ❓ Questions / Decisions Needed

### Question 1: TypeScript Configuration
**Asked:** 2025-11-08
**Question:** Should we use strict mode or relaxed TypeScript?
**Decision:** Use strict mode - catch more errors early
**Decided by:** Nir

### Question 2: Testing Framework
**Asked:** 2025-11-08
**Question:** Jest vs Vitest for testing?
**Decision:** Defer until after MVP, then choose Vitest (matches Vite on frontend)
**Decided by:** Nir

---

## 📊 Progress Tracker

### Overall Progress: 25%
- [x] Backend (25%)
  - [x] Setup (100%) ✅
  - [ ] Auth (0%)
  - [ ] Core APIs (0%)
  - [ ] Advanced features (0%)
- [ ] Frontend (0%)
- [ ] Deployment (0%)

---

## 🎯 This Week's Goal
**Goal:** Complete backend setup + authentication + event CRUD

**Definition of Done:**
- Backend server running
- Can register/login via API
- Can create/read/update/delete events
- All endpoints tested with Postman

---

**Last Updated:** 2025-11-08
**Updated by:** Nir
**Current Computer:** [Work/Home]