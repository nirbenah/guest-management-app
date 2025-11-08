# Current Tasks & Progress

## 🔥 In Progress

No tasks currently in progress.

---

## ⏭️ Next Up (Priority Order)

### 1. Event CRUD API Implementation
- [ ] Implement: Create event endpoint
- [ ] Implement: Get user's events endpoint  
- [ ] Implement: Update event endpoint
- [ ] Implement: Delete event endpoint
- [ ] Add permission checks for event access
- [ ] Test event endpoints with curl/Postman

**Estimated Time:** 2-3 hours
**Dependencies:** Authentication (✅ Complete)

---

### 2. Guest Management API
- [ ] Implement: Add guest to event endpoint
- [ ] Implement: Get event guests endpoint
- [ ] Implement: Update guest information endpoint
- [ ] Implement: Delete guest endpoint
- [ ] Implement: Add companion/plus-one functionality
- [ ] Test guest management endpoints

**Estimated Time:** 3-4 hours
**Dependencies:** Event API complete

---

### 3. Table & Version Management
- [ ] Implement: Create version endpoint
- [ ] Implement: Get versions for event endpoint
- [ ] Implement: Create table in version endpoint
- [ ] Implement: Update table positions endpoint
- [ ] Implement: Assign guest to table endpoint
- [ ] Test table management functionality

**Estimated Time:** 4-5 hours
**Dependencies:** Guest management complete

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
- [x] Complete database setup and authentication system
  - [x] Set up Supabase PostgreSQL database connection
  - [x] Create all database tables using SQL migration
  - [x] Implement complete authentication service
  - [x] Create working registration endpoint (POST /api/auth/register)
  - [x] Create working login endpoint (POST /api/auth/login)
  - [x] Create protected user profile endpoint (GET /api/auth/me)
  - [x] Implement JWT token generation and verification
  - [x] Add secure password hashing with bcryptjs
  - [x] Test all authentication endpoints with curl
  - [x] Fix ESLint configuration and resolve all type errors
  - [x] Install and configure all required database dependencies

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

### Overall Progress: 45%
- [x] Backend (45%)
  - [x] Setup (100%) ✅
  - [x] Auth (100%) ✅  
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