# Guest Management App - Backend

REST API for event seating arrangement management built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (we recommend Supabase)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database connection string and other settings
```

3. Set up the database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Health Check
- `GET /api/health` - Server health status ✅

### Authentication (✅ WORKING)
- `POST /api/auth/register` - Register new user ✅
- `POST /api/auth/login` - Login user ✅  
- `GET /api/auth/me` - Get current user (protected) ✅

### Events (Ready for Implementation)
- `GET /api/events` - Get user's events (stub ready)
- `POST /api/events` - Create new event (stub ready)
- `GET /api/events/:id` - Get event details (stub ready)
- `PUT /api/events/:id` - Update event (stub ready)
- `DELETE /api/events/:id` - Delete event (stub ready)

### Guests (Ready for Implementation)
- `GET /api/events/:eventId/guests` - Get event guests (stub ready)
- `POST /api/events/:eventId/guests` - Add guest (stub ready)
- `GET /api/guests/:id` - Get guest details (stub ready)
- `PUT /api/guests/:id` - Update guest (stub ready)
- `DELETE /api/guests/:id` - Delete guest (stub ready)

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## 🏗️ Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Migration files
├── src/
│   ├── routes/              # API endpoints
│   ├── middleware/          # Express middleware
│   ├── services/            # Business logic
│   ├── repositories/        # Database access
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   └── server.ts           # Express app entry point
├── tests/                   # Test files (TODO)
├── .env                    # Environment variables
└── README.md               # This file
```

## 🗄️ Database Schema

The app uses PostgreSQL with Prisma ORM. Key entities:
- **User** - Authentication and ownership
- **Event** - Wedding, party, etc.
- **Guest** - People attending event
- **Table** - Physical tables in venue
- **Version** - Different seating arrangements
- **Group** - Guest organization (family, friends)
- **SeatingConstraint** - Must/must-not sit together rules

See `prisma/schema.prisma` for detailed schema.

## 🔐 Authentication

Uses JWT tokens for authentication. Include in requests as:
```
Authorization: Bearer <token>
```

## 🌍 Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS

## ✅ Current Status

**Authentication System: 100% Complete and Working**
- ✅ User registration with secure password hashing
- ✅ JWT-based login system  
- ✅ Protected routes with token authentication
- ✅ Input validation and error handling
- ✅ Database operations tested and verified

## 📈 Next Steps

- [ ] Implement event CRUD operations (next priority)
- [ ] Add guest management endpoints
- [ ] Implement table and version management
- [ ] Add permission system for event collaborators
- [ ] Implement seating algorithm
- [ ] Add comprehensive API tests
- [ ] Add API documentation (OpenAPI/Swagger)

## 🧪 Test the Working Authentication

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "displayName": "Test User"}'

# Login  
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Use the token from login response to access protected route
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 🤝 Contributing

This is a personal project but feedback is welcome!

---

**Last Updated:** 2025-11-08