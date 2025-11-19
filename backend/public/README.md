# Guest Management App - Demo Frontend

This is a simple HTML/JavaScript demo frontend to test all the backend API functionality.

## 🚀 Quick Start

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on http://localhost:3000

2. **Start the frontend server:**
   ```bash
   cd demo-frontend
   python3 -m http.server 8000
   ```
   The frontend will be available at http://localhost:8000

3. **Open your browser and navigate to:**
   http://localhost:8000

## 📱 How to Use

### 1. Authentication
- **Register**: Create a new account with email, password, and display name
- **Login**: Use existing credentials to access the app

### 2. Events Management
- Create events with name, date, and location
- View all your events
- Select an event to access its features
- Delete events (warning: this removes all associated data)

### 3. Guests Management  
- Add guests with personal information (name, email, phone, etc.)
- Set guest type (primary/companion/child)
- Specify side (bride/groom) for weddings
- Update RSVP status (pending/confirmed/declined)
- Delete guests

### 4. Groups Management
- Create groups to organize guests (families, friend groups)
- Set seating preferences (together/separate/VIP/no preference)
- Set priority levels (high/medium/low)
- Delete groups

### 5. Layout Versions
- Create multiple seating arrangement versions
- Add descriptions to versions
- Activate specific versions (only one can be active)
- Delete versions (removes all tables in that version)

### 6. Tables & Seating
- Add tables with specific shapes (circle/rectangle/square/oval)
- Set table numbers and seat capacity
- View simple seating layout visualization
- Delete tables

### 7. Collaboration
- Invite collaborators by email
- Set roles (admin/editor/viewer)
- Manage collaborator permissions
- Remove collaborators

## 🎯 Testing Workflow

1. **Register/Login** with a test account
2. **Create an Event** (e.g., "Test Wedding", future date)
3. **Add Guests** (try different types and sides)
4. **Create Groups** (organize guests into families)
5. **Create Version** (e.g., "Main Layout")
6. **Add Tables** (try different shapes and sizes)
7. **Invite Collaborators** (test with different emails/roles)
8. **Test Updates** (change RSVP status, activate versions)

## 🔧 Features Tested

- ✅ User registration and authentication
- ✅ Event CRUD operations
- ✅ Guest management with RSVP tracking
- ✅ Group creation and management
- ✅ Multiple layout versions
- ✅ Table creation and positioning
- ✅ Collaboration and permissions
- ✅ Error handling and validation
- ✅ Real-time UI updates

## 📊 Technical Details

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Node.js + Express + PostgreSQL
- **Authentication**: JWT tokens
- **API**: RESTful endpoints with full CRUD operations
- **Database**: Prisma ORM with PostgreSQL

## 🐛 Troubleshooting

- **Backend not responding**: Ensure PostgreSQL is running and backend server is started
- **CORS errors**: Backend includes CORS middleware for localhost
- **Authentication issues**: Check JWT token handling in browser dev tools
- **Form validation errors**: Backend provides detailed error messages

Enjoy testing your Guest Management App! 🎉