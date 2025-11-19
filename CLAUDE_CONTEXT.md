# Guest Management App - Claude Code Session Context

## Project Status
- **Backend**: Complete Node.js/Express API with JWT auth, Prisma ORM, PostgreSQL
- **Demo Frontend**: Fully functional HTML/JS interface for testing
- **Current State**: All CRUD operations working, persistent login implemented

## Recent Work Completed
1. ✅ Fixed API endpoint mismatches (PUT vs PATCH)
2. ✅ Implemented persistent login with localStorage
3. ✅ Fixed section display issues when selecting events
4. ✅ Resolved guest edit button null element errors
5. ✅ All CRUD functionality working in demo frontend

## Key Files & Structure
```
/backend/
├── src/
│   ├── server.ts           # Main server setup
│   ├── routes/             # API endpoints (auth, events, guests, etc.)
│   ├── services/           # Business logic layer
│   ├── middleware/         # Auth & error handling
│   └── utils/              # Validation schemas
├── public/                 # Serves demo frontend
└── prisma/schema.prisma    # Database schema

/demo-frontend/
├── index.html              # Complete UI for all CRUD operations
└── app.js                  # JavaScript API integration
```

## API Endpoints Working
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Events: `/api/events` (GET, POST, PUT, DELETE)
- Guests: `/api/guests/event/:eventId`, `/api/guests/:id`
- Groups: `/api/groups/event/:eventId`, `/api/groups/:id`
- Versions: `/api/versions/event/:eventId`, `/api/versions/:id`
- Tables: `/api/tables/version/:versionId`, `/api/tables/:id`
- Collaborators: `/api/collaborators/event/:eventId`, `/api/collaborators/:id`

## Technical Issues Resolved
1. **CORS Configuration**: Multiple origins supported (localhost:3000, 8000, 5173)
2. **Authentication Flow**: JWT tokens with localStorage persistence
3. **API Response Structure**: All endpoints return `{success: boolean, data: {...}}`
4. **Frontend-Backend Sync**: Demo files synced between `/demo-frontend/` and `/backend/public/`

## Demo Frontend Features Working
- ✅ User registration/login with persistence
- ✅ Event management (create, edit, delete, select)
- ✅ Guest management with RSVP updates
- ✅ Group creation and management
- ✅ Layout versions and table arrangements
- ✅ Collaborator invitations and management
- ✅ All sections display simultaneously when event selected

## Environment
- Working Directory: `/home/nirbenaharon/guest-management-app/backend`
- Git Status: Clean on main branch
- Backend running on: `npm run dev` (port 3000)
- Demo accessible at: `http://localhost:3000` and `http://localhost:8000`

## Next Development Phase
Ready to implement production frontend or enhance existing features. All backend infrastructure and demo testing complete.

## Conversation Key Points
- User requested simple demo frontend for testing before production frontend
- Multiple debugging sessions for API endpoints and authentication
- Focus on complete CRUD functionality across all entities
- Emphasis on robust error handling and user experience