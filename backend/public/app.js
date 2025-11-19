// Guest Management App - Demo Frontend JavaScript

const API_BASE = 'http://localhost:3000/api';
let authToken = null;
let currentUser = null;
let currentEventId = null;
let currentVersionId = null;

// Utility Functions
function showMessage(message, type = 'success') {
    const messageArea = document.getElementById('message-area');
    messageArea.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        messageArea.innerHTML = '';
    }, 5000);
}

function showSection(sectionId) {
    // Hide all sections first
    const sections = ['guests-section', 'groups-section', 'versions-section', 'tables-section', 'collaborators-section'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = 'none';
    });
    
    // Show the requested section
    const section = document.getElementById(sectionId);
    if (section) section.style.display = 'block';
}

async function makeRequest(endpoint, method = 'GET', body = null) {
    try {
        console.log(`Making ${method} request to ${API_BASE}${endpoint}`);
        
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        };

        if (authToken) {
            config.headers['Authorization'] = `Bearer ${authToken}`;
        }

        if (body) {
            config.body = JSON.stringify(body);
            console.log('Request body:', body);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, config);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Response data:', data);
        return data;
        
    } catch (error) {
        console.error('Request failed:', error);
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to server. Make sure the backend is running on http://localhost:3000');
        }
        throw error;
    }
}

// Authentication Functions
async function register() {
    try {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const displayName = document.getElementById('auth-name').value;

        const userData = { email, password, displayName };
        const response = await makeRequest('/auth/register', 'POST', userData);
        
        authToken = response.data.token;
        currentUser = response.data.user;
        
        showAuthenticatedState();
        showMessage('Registration successful!');
        clearAuthForm();
    } catch (error) {
        showMessage(`Registration failed: ${error.message}`, 'error');
    }
}

async function login() {
    try {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;

        console.log('Login attempt with:', { email, password: password ? '[PASSWORD PROVIDED]' : '[NO PASSWORD]' });

        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const credentials = { email, password };
        const response = await makeRequest('/auth/login', 'POST', credentials);
        
        console.log('Login response:', response);
        console.log('Setting authToken to:', response.data.token);
        console.log('Setting currentUser to:', response.data.user);
        
        authToken = response.data.token;
        currentUser = response.data.user;
        
        // Store in localStorage for persistence
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        console.log('After setting - authToken:', authToken ? 'SET' : 'NOT SET');
        console.log('After setting - currentUser:', currentUser ? currentUser.displayName : 'NOT SET');
        
        showAuthenticatedState();
        showMessage('Login successful!');
        clearAuthForm();
    } catch (error) {
        showMessage(`Login failed: ${error.message}`, 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    currentEventId = null;
    currentVersionId = null;
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
    clearAuthForm();
    showMessage('Logged out successfully');
}

function showAuthenticatedState() {
    console.log('showAuthenticatedState called - authToken:', authToken ? 'SET' : 'NOT SET');
    console.log('showAuthenticatedState called - currentUser:', currentUser);
    
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    document.getElementById('user-info').innerHTML = `
        <strong>Welcome, ${currentUser.displayName}!</strong><br>
        Email: ${currentUser.email}
    `;
    
    // Only load events if we have a valid auth token
    if (authToken) {
        console.log('Has authToken, calling loadEvents');
        loadEvents();
    } else {
        console.log('No authToken found!');
        showMessage('Please log in to manage events', 'error');
    }
}

function clearAuthForm() {
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-name').value = '';
    document.getElementById('auth-message').innerHTML = '';
}

// Event Functions
async function createNewEvent() {
    console.log('createNewEvent called - authToken:', authToken ? 'SET' : 'NOT SET');
    
    if (!authToken) {
        showMessage('Please log in to create events', 'error');
        return;
    }
    
    try {
        const name = document.getElementById('event-name').value;
        const date = document.getElementById('event-date').value;
        const location = document.getElementById('event-location').value;

        if (!name || !date) {
            throw new Error('Name and date are required');
        }

        const eventData = { name, date, location };
        const response = await makeRequest('/events', 'POST', eventData);
        
        showMessage('Event created successfully!');
        clearEventForm();
        loadEvents();
    } catch (error) {
        showMessage(`Failed to create event: ${error.message}`, 'error');
    }
}

async function loadEvents() {
    if (!authToken) {
        showMessage('Please log in to view events', 'error');
        return;
    }
    
    try {
        const response = await makeRequest('/events');
        displayEvents(response.data.events);
    } catch (error) {
        if (error.message.includes('token')) {
            showMessage('Session expired. Please log in again.', 'error');
            logout();
        } else {
            showMessage(`Failed to load events: ${error.message}`, 'error');
        }
    }
}

function displayEvents(events) {
    const eventsContainer = document.getElementById('events-list');
    
    if (events.length === 0) {
        eventsContainer.innerHTML = '<p>No events found. Create your first event above!</p>';
        return;
    }

    eventsContainer.innerHTML = events.map(event => `
        <div class="item">
            <h4>${event.name}</h4>
            <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
            <p><strong>Location:</strong> ${event.location || 'Not specified'}</p>
            <p><strong>Created:</strong> ${new Date(event.createdAt).toLocaleDateString()}</p>
            <div class="item-actions">
                <button onclick="selectEvent('${event.id}', '${event.name}')">Select Event</button>
                <button onclick="editEvent('${event.id}', '${event.name}', '${event.date}', '${event.location || ''}')">Edit</button>
                <button onclick="deleteEvent('${event.id}')" class="btn-danger">Delete</button>
            </div>
        </div>
    `).join('');
}

function selectEvent(eventId, eventName) {
    currentEventId = eventId;
    showMessage(`Selected event: ${eventName}`);
    
    // Show all sections now that an event is selected
    const sections = ['guests-section', 'groups-section', 'versions-section', 'collaborators-section'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        }
    });
    
    loadGuests();
    loadGroups();
    loadVersions();
    loadCollaborators();
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This will delete all associated data.')) return;
    
    try {
        await makeRequest(`/events/${eventId}`, 'DELETE');
        showMessage('Event deleted successfully!');
        loadEvents();
        
        if (currentEventId === eventId) {
            currentEventId = null;
            currentVersionId = null;
            // Hide all sections
            const sections = ['guests-section', 'groups-section', 'versions-section', 'tables-section', 'collaborators-section'];
            sections.forEach(id => {
                const section = document.getElementById(id);
                if (section) section.style.display = 'none';
            });
        }
    } catch (error) {
        showMessage(`Failed to delete event: ${error.message}`, 'error');
    }
}

function editEvent(eventId, name, date, location) {
    // Fill the form with current values
    document.getElementById('event-name').value = name;
    document.getElementById('event-date').value = new Date(date).toISOString().slice(0, 16);
    document.getElementById('event-location').value = location;
    
    // Change the create button to update button
    const createButton = document.querySelector('button[onclick="createNewEvent()"]');
    createButton.textContent = 'Update Event';
    createButton.setAttribute('onclick', `updateEvent('${eventId}')`);
    
    showMessage('Editing event. Modify fields and click Update Event.', 'success');
}

async function updateEvent(eventId) {
    if (!authToken) {
        showMessage('Please log in to update events', 'error');
        return;
    }
    
    try {
        const name = document.getElementById('event-name').value;
        const date = document.getElementById('event-date').value;
        const location = document.getElementById('event-location').value;

        if (!name || !date) {
            throw new Error('Name and date are required');
        }

        const eventData = { name, date, location };
        await makeRequest(`/events/${eventId}`, 'PATCH', eventData);
        
        showMessage('Event updated successfully!');
        clearEventForm();
        resetEventForm();
        loadEvents();
    } catch (error) {
        showMessage(`Failed to update event: ${error.message}`, 'error');
    }
}

function resetEventForm() {
    // Reset the button back to create mode
    const updateButton = document.querySelector('button[onclick^="updateEvent"]');
    if (updateButton) {
        updateButton.textContent = 'Create Event';
        updateButton.setAttribute('onclick', 'createNewEvent()');
    }
}

function clearEventForm() {
    document.getElementById('event-name').value = '';
    document.getElementById('event-date').value = '';
    document.getElementById('event-location').value = '';
    resetEventForm();
}

// Guest Functions
async function createGuest() {
    if (!currentEventId) {
        showMessage('Please select an event first', 'error');
        return;
    }

    try {
        const name = document.getElementById('guest-name').value;
        const lastName = document.getElementById('guest-lastname').value;
        const email = document.getElementById('guest-email').value;
        const phone = document.getElementById('guest-phone').value;
        const guestType = document.getElementById('guest-type').value;
        const side = document.getElementById('guest-side').value;

        if (!name) {
            throw new Error('First name is required');
        }

        const guestData = {
            eventId: currentEventId,
            name,
            lastName: lastName || undefined,
            email: email || undefined,
            phone: phone || undefined,
            guestType,
            side: side || undefined
        };

        await makeRequest('/guests', 'POST', guestData);
        showMessage('Guest added successfully!');
        clearGuestForm();
        loadGuests();
    } catch (error) {
        showMessage(`Failed to add guest: ${error.message}`, 'error');
    }
}

async function loadGuests() {
    if (!currentEventId) return;

    try {
        const response = await makeRequest(`/guests/event/${currentEventId}`);
        displayGuests(response.data.guests);
    } catch (error) {
        showMessage(`Failed to load guests: ${error.message}`, 'error');
    }
}

function displayGuests(guests) {
    const guestsContainer = document.getElementById('guests-list');
    
    if (guests.length === 0) {
        guestsContainer.innerHTML = '<p>No guests found. Add your first guest above!</p>';
        return;
    }

    guestsContainer.innerHTML = guests.map(guest => `
        <div class="item">
            <h4>${guest.name} ${guest.lastName || ''}</h4>
            <p><strong>Type:</strong> ${guest.guestType}</p>
            ${guest.email ? `<p><strong>Email:</strong> ${guest.email}</p>` : ''}
            ${guest.phone ? `<p><strong>Phone:</strong> ${guest.phone}</p>` : ''}
            ${guest.side ? `<p><strong>Side:</strong> ${guest.side}</p>` : ''}
            <p><strong>RSVP:</strong> <span class="status-${guest.rsvpStatus}">${guest.rsvpStatus}</span></p>
            <div class="item-actions">
                <button onclick="editGuest('${guest.id}', '${guest.name}', '${guest.lastName || ''}', '${guest.email || ''}', '${guest.phone || ''}', '${guest.guestType}', '${guest.side || ''}')" class="btn-secondary">Edit</button>
                <button onclick="updateRSVP('${guest.id}', 'confirmed')" class="btn-secondary">Confirm</button>
                <button onclick="updateRSVP('${guest.id}', 'declined')" class="btn-secondary">Decline</button>
                <button onclick="deleteGuest('${guest.id}')" class="btn-danger">Delete</button>
            </div>
        </div>
    `).join('');
}

async function updateRSVP(guestId, status) {
    try {
        await makeRequest(`/guests/${guestId}`, 'PUT', { rsvpStatus: status });
        showMessage(`RSVP updated to ${status}`);
        loadGuests();
    } catch (error) {
        showMessage(`Failed to update RSVP: ${error.message}`, 'error');
    }
}

async function deleteGuest(guestId) {
    if (!confirm('Are you sure you want to delete this guest?')) return;
    
    try {
        await makeRequest(`/guests/${guestId}`, 'DELETE');
        showMessage('Guest deleted successfully!');
        loadGuests();
    } catch (error) {
        showMessage(`Failed to delete guest: ${error.message}`, 'error');
    }
}

function editGuest(guestId, name, lastName, email, phone, guestType, side) {
    // Fill the form with current values
    document.getElementById('guest-name').value = name;
    document.getElementById('guest-lastname').value = lastName;
    document.getElementById('guest-email').value = email;
    document.getElementById('guest-phone').value = phone;
    document.getElementById('guest-type').value = guestType;
    document.getElementById('guest-side').value = side;
    
    // Change the create button to update button
    const createButton = document.querySelector('#guests-section button[onclick*="createGuest"]') || 
                         document.querySelector('#guests-section button:contains("Add Guest")') ||
                         document.querySelector('#guests-section button');
    if (createButton) {
        createButton.textContent = 'Update Guest';
        createButton.setAttribute('onclick', `updateGuest('${guestId}')`);
    }
    
    showMessage('Editing guest. Modify fields and click Update Guest.', 'success');
}

async function updateGuest(guestId) {
    if (!currentEventId) {
        showMessage('Please select an event first', 'error');
        return;
    }

    try {
        const name = document.getElementById('guest-name').value;
        const lastName = document.getElementById('guest-lastname').value;
        const email = document.getElementById('guest-email').value;
        const phone = document.getElementById('guest-phone').value;
        const guestType = document.getElementById('guest-type').value;
        const side = document.getElementById('guest-side').value;

        if (!name) {
            throw new Error('First name is required');
        }

        const guestData = {
            name,
            lastName: lastName || undefined,
            email: email || undefined,
            phone: phone || undefined,
            guestType,
            side: side || undefined
        };

        await makeRequest(`/guests/${guestId}`, 'PATCH', guestData);
        showMessage('Guest updated successfully!');
        clearGuestForm();
        resetGuestForm();
        loadGuests();
    } catch (error) {
        showMessage(`Failed to update guest: ${error.message}`, 'error');
    }
}

function resetGuestForm() {
    // Reset the button back to create mode
    const updateButton = document.querySelector('button[onclick^="updateGuest"]');
    if (updateButton) {
        updateButton.textContent = 'Add Guest';
        updateButton.setAttribute('onclick', 'createGuest()');
    }
}

function clearGuestForm() {
    document.getElementById('guest-name').value = '';
    document.getElementById('guest-lastname').value = '';
    document.getElementById('guest-email').value = '';
    document.getElementById('guest-phone').value = '';
    document.getElementById('guest-type').value = 'primary';
    document.getElementById('guest-side').value = '';
    resetGuestForm();
}

// Group Functions
async function createGroup() {
    if (!currentEventId) {
        showMessage('Please select an event first', 'error');
        return;
    }

    try {
        const name = document.getElementById('group-name').value;
        const seatingPreference = document.getElementById('group-preference').value;
        const priority = document.getElementById('group-priority').value;

        if (!name) {
            throw new Error('Group name is required');
        }

        const groupData = {
            eventId: currentEventId,
            name,
            seatingPreference,
            priority
        };

        await makeRequest('/groups', 'POST', groupData);
        showMessage('Group created successfully!');
        clearGroupForm();
        loadGroups();
    } catch (error) {
        showMessage(`Failed to create group: ${error.message}`, 'error');
    }
}

async function loadGroups() {
    if (!currentEventId) return;

    try {
        const response = await makeRequest(`/groups/event/${currentEventId}`);
        displayGroups(response.data.groups);
    } catch (error) {
        showMessage(`Failed to load groups: ${error.message}`, 'error');
    }
}

function displayGroups(groups) {
    const groupsContainer = document.getElementById('groups-list');
    
    if (groups.length === 0) {
        groupsContainer.innerHTML = '<p>No groups found. Create your first group above!</p>';
        return;
    }

    groupsContainer.innerHTML = groups.map(group => `
        <div class="item">
            <h4>${group.name}</h4>
            <p><strong>Seating Preference:</strong> ${group.seatingPreference}</p>
            <p><strong>Priority:</strong> ${group.priority}</p>
            <p><strong>Members:</strong> ${group.guests ? group.guests.length : 0}</p>
            <div class="item-actions">
                <button onclick="editGroup('${group.id}', '${group.name}', '${group.seatingPreference}', '${group.priority}')" class="btn-secondary">Edit</button>
                <button onclick="deleteGroup('${group.id}')" class="btn-danger">Delete</button>
            </div>
        </div>
    `).join('');
}

async function deleteGroup(groupId) {
    if (!confirm('Are you sure you want to delete this group?')) return;
    
    try {
        await makeRequest(`/groups/${groupId}`, 'DELETE');
        showMessage('Group deleted successfully!');
        loadGroups();
    } catch (error) {
        showMessage(`Failed to delete group: ${error.message}`, 'error');
    }
}

function editGroup(groupId, name, seatingPreference, priority) {
    // Fill the form with current values
    document.getElementById('group-name').value = name;
    document.getElementById('group-preference').value = seatingPreference;
    document.getElementById('group-priority').value = priority;
    
    // Change the create button to update button
    const createButton = document.querySelector('button[onclick="createGroup()"]');
    createButton.textContent = 'Update Group';
    createButton.setAttribute('onclick', `updateGroup('${groupId}')`);
    
    showMessage('Editing group. Modify fields and click Update Group.', 'success');
}

async function updateGroup(groupId) {
    if (!currentEventId) {
        showMessage('Please select an event first', 'error');
        return;
    }

    try {
        const name = document.getElementById('group-name').value;
        const seatingPreference = document.getElementById('group-preference').value;
        const priority = document.getElementById('group-priority').value;

        if (!name) {
            throw new Error('Group name is required');
        }

        const groupData = {
            name,
            seatingPreference,
            priority
        };

        await makeRequest(`/groups/${groupId}`, 'PATCH', groupData);
        showMessage('Group updated successfully!');
        clearGroupForm();
        resetGroupForm();
        loadGroups();
    } catch (error) {
        showMessage(`Failed to update group: ${error.message}`, 'error');
    }
}

function resetGroupForm() {
    // Reset the button back to create mode
    const updateButton = document.querySelector('button[onclick^="updateGroup"]');
    if (updateButton) {
        updateButton.textContent = 'Create Group';
        updateButton.setAttribute('onclick', 'createGroup()');
    }
}

function clearGroupForm() {
    document.getElementById('group-name').value = '';
    document.getElementById('group-preference').value = 'no_preference';
    document.getElementById('group-priority').value = 'medium';
    resetGroupForm();
}

// Version Functions
async function createVersion() {
    if (!currentEventId) {
        showMessage('Please select an event first', 'error');
        return;
    }

    try {
        const name = document.getElementById('version-name').value;
        const description = document.getElementById('version-description').value;

        if (!name) {
            throw new Error('Version name is required');
        }

        const versionData = {
            eventId: currentEventId,
            name,
            description: description || undefined
        };

        await makeRequest('/versions', 'POST', versionData);
        showMessage('Version created successfully!');
        clearVersionForm();
        loadVersions();
    } catch (error) {
        showMessage(`Failed to create version: ${error.message}`, 'error');
    }
}

async function loadVersions() {
    if (!currentEventId) return;

    try {
        const response = await makeRequest(`/versions/event/${currentEventId}`);
        displayVersions(response.data.versions);
    } catch (error) {
        showMessage(`Failed to load versions: ${error.message}`, 'error');
    }
}

function displayVersions(versions) {
    const versionsContainer = document.getElementById('versions-list');
    
    if (versions.length === 0) {
        versionsContainer.innerHTML = '<p>No versions found. Create your first layout version above!</p>';
        return;
    }

    versionsContainer.innerHTML = versions.map(version => `
        <div class="item">
            <h4>${version.name} ${version.isActive ? '(Active)' : ''}</h4>
            <p>${version.description || 'No description'}</p>
            <p><strong>Tables:</strong> ${version.tables ? version.tables.length : 0}</p>
            <div class="item-actions">
                <button onclick="selectVersion('${version.id}', '${version.name}')">Select Version</button>
                ${!version.isActive ? `<button onclick="activateVersion('${version.id}')" class="btn-secondary">Activate</button>` : ''}
                <button onclick="deleteVersion('${version.id}')" class="btn-danger">Delete</button>
            </div>
        </div>
    `).join('');
}

function selectVersion(versionId, versionName) {
    currentVersionId = versionId;
    showMessage(`Selected version: ${versionName}`);
    showSection('tables-section');
    loadTables();
}

async function activateVersion(versionId) {
    try {
        await makeRequest(`/versions/${versionId}/activate`, 'PATCH');
        showMessage('Version activated successfully!');
        loadVersions();
    } catch (error) {
        showMessage(`Failed to activate version: ${error.message}`, 'error');
    }
}

async function deleteVersion(versionId) {
    if (!confirm('Are you sure you want to delete this version? This will delete all tables in this version.')) return;
    
    try {
        await makeRequest(`/versions/${versionId}`, 'DELETE');
        showMessage('Version deleted successfully!');
        loadVersions();
        
        if (currentVersionId === versionId) {
            currentVersionId = null;
            document.getElementById('tables-section').style.display = 'none';
        }
    } catch (error) {
        showMessage(`Failed to delete version: ${error.message}`, 'error');
    }
}

function clearVersionForm() {
    document.getElementById('version-name').value = '';
    document.getElementById('version-description').value = '';
}

// Table Functions
async function createTable() {
    if (!currentVersionId) {
        showMessage('Please select a version first', 'error');
        return;
    }

    try {
        const name = document.getElementById('table-name').value;
        const number = parseInt(document.getElementById('table-number').value);
        const totalSeats = parseInt(document.getElementById('table-seats').value);
        const shape = document.getElementById('table-shape').value;

        if (!name || !number || !totalSeats) {
            throw new Error('Name, number, and seats are required');
        }

        const tableData = {
            versionId: currentVersionId,
            eventId: currentEventId,
            name,
            number,
            totalSeats,
            shape,
            position: { x: Math.floor(Math.random() * 400) + 100, y: Math.floor(Math.random() * 200) + 100 }
        };

        await makeRequest('/tables', 'POST', tableData);
        showMessage('Table created successfully!');
        clearTableForm();
        loadTables();
    } catch (error) {
        showMessage(`Failed to create table: ${error.message}`, 'error');
    }
}

async function loadTables() {
    if (!currentVersionId) return;

    try {
        const tables = await makeRequest(`/versions/${currentVersionId}/tables`);
        displayTables(tables);
    } catch (error) {
        showMessage(`Failed to load tables: ${error.message}`, 'error');
    }
}

function displayTables(tables) {
    const tablesContainer = document.getElementById('tables-list');
    const layoutArea = document.getElementById('layout-area');
    
    if (tables.length === 0) {
        tablesContainer.innerHTML = '<p>No tables found. Create your first table above!</p>';
        layoutArea.innerHTML = '<p>No tables to display</p>';
        return;
    }

    tablesContainer.innerHTML = tables.map(table => `
        <div class="item">
            <h4>${table.name} (${table.shape})</h4>
            <p><strong>Number:</strong> ${table.number}</p>
            <p><strong>Seats:</strong> ${table.totalSeats}</p>
            <p><strong>Occupied:</strong> ${table.assignments ? table.assignments.length : 0}/${table.totalSeats}</p>
            <div class="item-actions">
                <button onclick="editTable('${table.id}', '${table.name}', '${table.number}', '${table.totalSeats}', '${table.shape}')" class="btn-secondary">Edit</button>
                <button onclick="deleteTable('${table.id}')" class="btn-danger">Delete</button>
            </div>
        </div>
    `).join('');

    // Simple layout visualization
    layoutArea.innerHTML = tables.map(table => `
        <div class="table-visual" style="left: ${table.position.x}px; top: ${table.position.y}px; position: absolute;" 
             title="${table.name} - ${table.assignments ? table.assignments.length : 0}/${table.totalSeats} seats">
            <strong>${table.number}</strong><br>
            <small>${table.assignments ? table.assignments.length : 0}/${table.totalSeats}</small>
        </div>
    `).join('');
}

async function deleteTable(tableId) {
    if (!confirm('Are you sure you want to delete this table?')) return;
    
    try {
        await makeRequest(`/tables/${tableId}`, 'DELETE');
        showMessage('Table deleted successfully!');
        loadTables();
    } catch (error) {
        showMessage(`Failed to delete table: ${error.message}`, 'error');
    }
}

function editTable(tableId, name, number, totalSeats, shape) {
    // Fill the form with current values
    document.getElementById('table-name').value = name;
    document.getElementById('table-number').value = number;
    document.getElementById('table-seats').value = totalSeats;
    document.getElementById('table-shape').value = shape;
    
    // Change the create button to update button
    const createButton = document.querySelector('button[onclick="createTable()"]');
    createButton.textContent = 'Update Table';
    createButton.setAttribute('onclick', `updateTable('${tableId}')`);
    
    showMessage('Editing table. Modify fields and click Update Table.', 'success');
}

async function updateTable(tableId) {
    if (!currentVersionId) {
        showMessage('Please select a version first', 'error');
        return;
    }

    try {
        const name = document.getElementById('table-name').value;
        const number = parseInt(document.getElementById('table-number').value);
        const totalSeats = parseInt(document.getElementById('table-seats').value);
        const shape = document.getElementById('table-shape').value;

        if (!name || !number || !totalSeats) {
            throw new Error('Name, number, and seats are required');
        }

        const tableData = {
            name,
            number,
            totalSeats,
            shape
        };

        await makeRequest(`/tables/${tableId}`, 'PATCH', tableData);
        showMessage('Table updated successfully!');
        clearTableForm();
        resetTableForm();
        loadTables();
    } catch (error) {
        showMessage(`Failed to update table: ${error.message}`, 'error');
    }
}

function resetTableForm() {
    // Reset the button back to create mode
    const updateButton = document.querySelector('button[onclick^="updateTable"]');
    if (updateButton) {
        updateButton.textContent = 'Add Table';
        updateButton.setAttribute('onclick', 'createTable()');
    }
}

function clearTableForm() {
    document.getElementById('table-name').value = '';
    document.getElementById('table-number').value = '';
    document.getElementById('table-seats').value = '';
    document.getElementById('table-shape').value = 'Circle';
    resetTableForm();
}

// Collaborator Functions
async function inviteCollaborator() {
    if (!currentEventId) {
        showMessage('Please select an event first', 'error');
        return;
    }

    try {
        const email = document.getElementById('collab-email').value;
        const role = document.getElementById('collab-role').value;

        if (!email) {
            throw new Error('Email is required');
        }

        const collabData = {
            eventId: currentEventId,
            email,
            role
        };

        await makeRequest('/collaborators', 'POST', collabData);
        showMessage('Collaborator invited successfully!');
        clearCollaboratorForm();
        loadCollaborators();
    } catch (error) {
        showMessage(`Failed to invite collaborator: ${error.message}`, 'error');
    }
}

async function loadCollaborators() {
    if (!currentEventId) return;

    try {
        const response = await makeRequest(`/collaborators/event/${currentEventId}`);
        displayCollaborators(response.data.collaborators);
    } catch (error) {
        showMessage(`Failed to load collaborators: ${error.message}`, 'error');
    }
}

function displayCollaborators(collaborators) {
    const collabContainer = document.getElementById('collaborators-list');
    
    if (collaborators.length === 0) {
        collabContainer.innerHTML = '<p>No collaborators found. Invite your first collaborator above!</p>';
        return;
    }

    collabContainer.innerHTML = collaborators.map(collab => `
        <div class="item">
            <h4>${collab.user.displayName}</h4>
            <p><strong>Email:</strong> ${collab.user.email}</p>
            <p><strong>Role:</strong> ${collab.role}</p>
            <p><strong>Status:</strong> ${collab.status}</p>
            <div class="item-actions">
                <button onclick="removeCollaborator('${collab.id}')" class="btn-danger">Remove</button>
            </div>
        </div>
    `).join('');
}

async function removeCollaborator(collabId) {
    if (!confirm('Are you sure you want to remove this collaborator?')) return;
    
    try {
        await makeRequest(`/collaborators/${collabId}`, 'DELETE');
        showMessage('Collaborator removed successfully!');
        loadCollaborators();
    } catch (error) {
        showMessage(`Failed to remove collaborator: ${error.message}`, 'error');
    }
}

function clearCollaboratorForm() {
    document.getElementById('collab-email').value = '';
    document.getElementById('collab-role').value = 'viewer';
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    // Check for stored authentication
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);
        showAuthenticatedState();
        showMessage('Restored login session');
    }
    
    // Set minimum date to today for event creation
    const eventDateInput = document.getElementById('event-date');
    if (eventDateInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        eventDateInput.min = now.toISOString().slice(0, 16);
    }
    
    // Test backend connection
    try {
        console.log('Testing backend connection...');
        const response = await fetch(`${API_BASE}/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend connected successfully:', data);
            showMessage('✅ Backend connected successfully', 'success');
        } else {
            console.error('❌ Backend responded with error:', response.status);
            showMessage('⚠️ Backend connection issue', 'error');
        }
    } catch (error) {
        console.error('❌ Cannot connect to backend:', error);
        showMessage('❌ Cannot connect to backend. Make sure it\'s running on http://localhost:3000', 'error');
    }
});