# Schedules API Documentation

The Schedules API manages barber availability and scheduling for The Royal Barber application, allowing staff to set their working hours and customers to check availability for appointments.

## 📅 Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/schedules/set-schedule` | Set barber schedule | Yes | Staff/Admin |
| GET | `/schedules/barber/:barberId` | Get barber schedules | Yes | Any |
| GET | `/schedules` | Get all schedules | Yes | Staff/Admin |
| POST | `/schedules/availability` | Check availability | Yes | Any |
| PUT | `/schedules/:id` | Update schedule | Yes | Staff/Admin |
| DELETE | `/schedules/:id` | Delete schedule | Yes | Staff/Admin |

## 🕐 Set Barber Schedule

### POST `/schedules/set-schedule`

Set or update a barber's working schedule for a specific day of the week. Staff or admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Request Body:**
```json
{
  "barberId": "uuid",
  "dayOfWeek": "monday",
  "availableTimeSlots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
}
```

**Field Validation:**
- `barberId`: Valid UUID, required
- `dayOfWeek`: One of `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`
- `availableTimeSlots`: Array of time slots, minimum 1 slot, required

**Available Time Slots:**
- `08:00`, `09:00`, `10:00`, `11:00`, `12:00`, `13:00`, `14:00`, `15:00`, `16:00`, `17:00`, `18:00`, `19:00`, `20:00`, `21:00`, `22:00`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "barberId": "uuid",
    "dayOfWeek": "monday",
    "availableTimeSlots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Schedule set successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data or missing required fields
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions or user is not a barber
- `404 Not Found`: Barber not found
- `500 Internal Server Error`: Database error

## 👨‍💼 Get Barber Schedules

### GET `/schedules/barber/:barberId`

Retrieve all schedules for a specific barber. Any authenticated user can view barber schedules.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `barberId`: Barber UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "barberId": "uuid",
      "dayOfWeek": "monday",
      "availableTimeSlots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "barberId": "uuid",
      "dayOfWeek": "tuesday",
      "availableTimeSlots": ["10:00", "11:00", "12:00", "13:00", "14:00"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Barber schedules retrieved successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing barber ID
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: No schedules found for barber
- `500 Internal Server Error`: Database error

## 📋 Get All Schedules

### GET `/schedules`

Retrieve all schedules in the system. Staff or admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "barberId": "uuid",
      "barberName": "John Doe",
      "dayOfWeek": "monday",
      "availableTimeSlots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "All schedules retrieved successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not staff or admin)
- `404 Not Found`: No schedules found
- `500 Internal Server Error`: Database error

## 🔍 Check Availability

### POST `/schedules/availability`

Check barber availability for a specific date. Any authenticated user can check availability.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Request Body:**
```json
{
  "barberId": "uuid",
  "date": "15/01/2024"
}
```

**Field Validation:**
- `barberId`: Valid UUID, required
- `date`: Date in dd/mm/yyyy format, required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "barberId": "uuid",
    "barberName": "John Doe",
    "date": "15/01/2024",
    "dayOfWeek": "monday",
    "availableTimeSlots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    "bookedTimeSlots": ["10:00", "14:00"],
    "availableSlots": ["09:00", "11:00", "15:00", "16:00"]
  },
  "message": "Availability retrieved successfully"
}
```

**Response Fields:**
- `availableTimeSlots`: All time slots the barber works on this day
- `bookedTimeSlots`: Time slots already booked for this date
- `availableSlots`: Time slots available for booking (available - booked)

**Error Responses:**
- `400 Bad Request`: Invalid input data or invalid date format
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: No schedule found for this barber and date
- `500 Internal Server Error`: Database error

## ✏️ Update Schedule

### PUT `/schedules/:id`

Update an existing schedule. Staff or admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `id`: Schedule UUID

**Request Body:**
```json
{
  "availableTimeSlots": ["09:00", "10:00", "11:00", "12:00", "13:00"],
  "isActive": true
}
```

**Field Validation:**
- `availableTimeSlots`: Array of time slots, optional
- `isActive`: Boolean, optional

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "barberId": "uuid",
    "dayOfWeek": "monday",
    "availableTimeSlots": ["09:00", "10:00", "11:00", "12:00", "13:00"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Schedule updated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data or missing schedule ID
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not staff or admin)
- `404 Not Found`: Schedule not found
- `500 Internal Server Error`: Database error

## 🗑️ Delete Schedule

### DELETE `/schedules/:id`

Delete a schedule. Staff or admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `id`: Schedule UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Schedule deleted successfully"
  },
  "message": "Schedule deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing schedule ID
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not staff or admin)
- `404 Not Found`: Schedule not found
- `500 Internal Server Error`: Database error

## 📅 Scheduling Logic

### Day of Week Mapping
The API uses standard day names for scheduling:
- `monday` through `sunday`
- Case-insensitive input validation
- Consistent storage format

### Time Slot System
- **Format**: HH:MM (24-hour format)
- **Interval**: 1-hour slots
- **Range**: 08:00 to 22:00
- **Business Hours**: 8 AM to 10 PM

### Availability Calculation
1. **Base Schedule**: Barber's working hours for the day
2. **Existing Bookings**: Appointments already scheduled
3. **Available Slots**: Base schedule minus existing bookings

### Date Validation
- **Format**: dd/mm/yyyy
- **Validation**: Checks for valid date, not in past
- **Business Logic**: Only future dates are valid for booking

## 📱 Mobile App Integration

### Schedule Management
```javascript
// Set barber schedule (staff/admin only)
const setSchedule = async (scheduleData) => {
  const response = await fetch('/schedules/set-schedule', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(scheduleData)
  });
  return response.json();
};

// Get barber schedules
const getBarberSchedules = async (barberId) => {
  const response = await fetch(`/schedules/barber/${barberId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });
  return response.json();
};
```

### Availability Checking
```javascript
// Check barber availability
const checkAvailability = async (barberId, date) => {
  const response = await fetch('/schedules/availability', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ barberId, date })
  });
  return response.json();
};

// Example usage for appointment booking
const bookAppointment = async (barberId, date, timeSlot) => {
  // First check availability
  const availability = await checkAvailability(barberId, date);
  
  if (availability.data.availableSlots.includes(timeSlot)) {
    // Proceed with booking
    const appointment = await createAppointment({
      barberId,
      appointmentDate: date,
      timeSlot
    });
    return appointment;
  } else {
    throw new Error('Time slot not available');
  }
};
```

## 🛡️ Security Features

### Authentication
- All endpoints require valid JWT token
- Role-based access control for management operations
- Users can view schedules but only staff/admin can modify

### Authorization
- Staff and admins can manage schedules
- Any authenticated user can view schedules and check availability
- Barber validation ensures only barbers can have schedules

### Data Validation
- Input validation with Zod schemas
- Date format validation
- Time slot validation
- Business logic validation

## 🚨 Error Handling

### Common Error Codes
- `400`: Invalid input data or missing parameters
- `401`: Authentication failed
- `403`: Insufficient permissions or user is not a barber
- `404`: Resource not found
- `500`: Internal server error

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": "validation error details"
  }
}
```

## 🔧 Development Notes

### Database Schema
Schedules are stored in the `schedules` table:
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID REFERENCES users(id) NOT NULL,
  day_of_week day_of_week NOT NULL,
  available_time_slots JSON NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Environment Variables
```env
JWT_SECRET=your-secret-key
```

### Testing
Test schedule management functionality:
- `tests/api.test.ts` - General API tests
- `tests/test-endpoints.js` - Endpoint-specific tests
- Verify CRUD operations
- Test availability calculations
- Test permission boundaries

## 📊 Performance Considerations

### Caching
- Barber schedules can be cached for frequently accessed data
- Availability calculations can be cached for popular dates
- Implement cache invalidation on schedule updates

### Database Indexing
- Index on `barber_id` for fast barber lookups
- Index on `day_of_week` for day-based queries
- Index on `is_active` for filtering active schedules

### API Optimization
- Efficient availability calculations
- Minimal data transfer for schedule lists
- Proper database query optimization

## 💡 Best Practices

### Schedule Management
- Set realistic working hours
- Consider service duration when setting time slots
- Plan for breaks between appointments
- Keep schedules updated regularly

### Availability Checking
- Always check availability before booking
- Consider timezone differences
- Handle edge cases (holidays, special hours)
- Provide clear feedback on availability

### Data Integrity
- Validate all input data
- Maintain referential integrity with appointments
- Handle schedule conflicts gracefully
- Regular backup of schedule data

### Business Logic
- Respect business hours
- Handle recurring schedules efficiently
- Consider seasonal schedule changes
- Implement schedule templates for common patterns 