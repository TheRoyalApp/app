# Appointments API Documentation

The Appointments API manages the complete appointment lifecycle for The Royal Barber application, including booking, status management, rescheduling, and appointment tracking.

## 📅 Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/appointments` | Create appointment | Yes | Any |
| GET | `/appointments/:status` | Get appointments by status | Yes | Staff/Admin |
| PUT | `/appointments/:id/status` | Update appointment status | Yes | Staff/Admin |
| GET | `/appointments/user/:userId` | Get user appointments | Yes | Owner/Admin |
| GET | `/appointments/barber/:barberId` | Get barber appointments | Yes | Staff/Admin |
| DELETE | `/appointments/:id` | Delete appointment | Yes | Staff/Admin |
| PUT | `/appointments/:id/reschedule` | Reschedule appointment | Yes | Owner/Admin |

## 🔄 Automatic Appointment Confirmation

### Payment-Triggered Appointments

When a customer completes payment through Stripe checkout, appointments are automatically created with **"confirmed"** status (not "pending"). This happens through the payment webhook system.

**Automatic Process:**
1. Customer completes payment on Stripe
2. Webhook receives `checkout.session.completed` event
3. System automatically creates appointment with status "confirmed"
4. Payment is linked to the appointment
5. Time slot is marked as booked in real-time

**Benefits:**
- ✅ **Immediate Confirmation**: No manual approval needed
- ✅ **Seamless Experience**: Customer gets instant confirmation
- ✅ **Real-time Updates**: Availability updated immediately
- ✅ **Payment Integration**: Automatic linking of payment and appointment

**Status Flow:**
- **Manual Creation**: `pending` → `confirmed` (requires staff approval)
- **Payment Creation**: `confirmed` (automatic, no approval needed)

## ➕ Create Appointment

### POST `/appointments`

Create a new appointment booking. Any authenticated user can create appointments.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Request Body:**
```json
{
  "userId": "uuid",
  "barberId": "uuid",
  "serviceId": "uuid",
  "appointmentDate": "15/01/2024",
  "timeSlot": "10:00",
  "notes": "Please bring reference photos"
}
```

**Field Validation:**
- `userId`: Valid UUID, required
- `barberId`: Valid UUID, required
- `serviceId`: Valid UUID, required
- `appointmentDate`: Date in dd/mm/yyyy format, required
- `timeSlot`: Valid time slot (HH:MM), required
- `notes`: Maximum 500 characters, optional

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "barberId": "uuid",
    "serviceId": "uuid",
    "appointmentDate": "2024-01-15T00:00:00.000Z",
    "timeSlot": "10:00",
    "status": "pending",
    "notes": "Please bring reference photos",
    "rescheduleCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Appointment created successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data or missing required fields
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User, barber, or service not found
- `409 Conflict`: Time slot not available
- `500 Internal Server Error`: Database error

## 📋 Get Appointments by Status

### GET `/appointments/:status`

Retrieve appointments filtered by status. Staff or admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `status`: One of `pending`, `confirmed`, `cancelled`, `completed`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "barberId": "uuid",
      "barberName": "Mike Smith",
      "serviceId": "uuid",
      "serviceName": "Classic Haircut",
      "appointmentDate": "2024-01-15T00:00:00.000Z",
      "timeSlot": "10:00",
      "status": "pending",
      "notes": "Please bring reference photos",
      "rescheduleCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Appointments retrieved successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status parameter
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not staff or admin)
- `404 Not Found`: No appointments found with this status
- `500 Internal Server Error`: Database error

## ✏️ Update Appointment Status

### PUT `/appointments/:id/status`

Update the status of an appointment. Staff or admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `id`: Appointment UUID

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Field Validation:**
- `status`: One of `pending`, `confirmed`, `cancelled`, `completed`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "barberId": "uuid",
    "serviceId": "uuid",
    "appointmentDate": "2024-01-15T00:00:00.000Z",
    "timeSlot": "10:00",
    "status": "confirmed",
    "notes": "Please bring reference photos",
    "rescheduleCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Appointment status updated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status or missing appointment ID
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not staff or admin)
- `404 Not Found`: Appointment not found
- `500 Internal Server Error`: Database error

## 👤 Get User Appointments

### GET `/appointments/user/:userId`

Retrieve all appointments for a specific user. Users can view their own appointments, admins can view any user's appointments.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `userId`: User UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "barberId": "uuid",
      "barberName": "Mike Smith",
      "serviceId": "uuid",
      "serviceName": "Classic Haircut",
      "servicePrice": "25.00",
      "appointmentDate": "2024-01-15T00:00:00.000Z",
      "timeSlot": "10:00",
      "status": "confirmed",
      "notes": "Please bring reference photos",
      "rescheduleCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "User appointments retrieved successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing user ID
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not owner or admin)
- `404 Not Found`: No appointments found for user
- `500 Internal Server Error`: Database error

## 👨‍💼 Get Barber Appointments

### GET `/appointments/barber/:barberId`

Retrieve all appointments for a specific barber. Staff or admin access required.

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
      "userId": "uuid",
      "userName": "John Doe",
      "userPhone": "+1234567890",
      "barberId": "uuid",
      "serviceId": "uuid",
      "serviceName": "Classic Haircut",
      "serviceDuration": 30,
      "appointmentDate": "2024-01-15T00:00:00.000Z",
      "timeSlot": "10:00",
      "status": "confirmed",
      "notes": "Please bring reference photos",
      "rescheduleCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Barber appointments retrieved successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing barber ID
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not staff or admin)
- `404 Not Found`: No appointments found for barber
- `500 Internal Server Error`: Database error

## 🗑️ Delete Appointment

### DELETE `/appointments/:id`

Delete an appointment. Staff or admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `id`: Appointment UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Appointment deleted successfully"
  },
  "message": "Appointment deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing appointment ID
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not staff or admin)
- `404 Not Found`: Appointment not found
- `500 Internal Server Error`: Database error

## 🔄 Reschedule Appointment

### PUT `/appointments/:id/reschedule`

Reschedule an appointment. Users can reschedule their own appointments (max 3 times), admins can reschedule any appointment.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `id`: Appointment UUID

**Request Body:**
```json
{
  "appointmentDate": "20/01/2024",
  "timeSlot": "14:00"
}
```

**Field Validation:**
- `appointmentDate`: Date in dd/mm/yyyy format, required
- `timeSlot`: Valid time slot (HH:MM), required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "barberId": "uuid",
    "serviceId": "uuid",
    "appointmentDate": "2024-01-20T00:00:00.000Z",
    "timeSlot": "14:00",
    "status": "pending",
    "notes": "Please bring reference photos",
    "rescheduleCount": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Appointment rescheduled successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data or missing appointment ID
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions or reschedule limit exceeded
- `404 Not Found`: Appointment not found
- `409 Conflict`: New time slot not available
- `500 Internal Server Error`: Database error

## 📊 Appointment Status Lifecycle

### Status Flow
1. **pending**: Initial status when appointment is created
2. **confirmed**: Staff confirms the appointment
3. **completed**: Service has been provided
4. **cancelled**: Appointment has been cancelled

### Status Transitions
- `pending` → `confirmed` (staff action)
- `pending` → `cancelled` (staff or user action)
- `confirmed` → `completed` (staff action)
- `confirmed`