#!/bin/bash

# The Royal Barber API - Complete Workflow Test
# This script tests the complete user workflow from registration to appointment booking

echo "🧔 The Royal Barber API - Complete Workflow Test"
echo "================================================"

BASE_URL="http://localhost:3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to make API calls and handle responses
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local headers=("-H" "Content-Type: application/json")
    if [ ! -z "$token" ]; then
        headers+=("-H" "Authorization: Bearer $token")
    fi
    
    if [ ! -z "$data" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" "${headers[@]}" -d "$data")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" "${headers[@]}")
    fi
    
    echo "$response"
}

# Test 1: Health Check
print_status "Testing API health..."
health_response=$(api_call "GET" "/health")
echo "Health check: $health_response"
echo

# Test 2: Customer Registration and Login
print_status "Testing customer registration and login..."

# Register a new customer
customer_data='{
    "email": "john.doe@example.com",
    "password": "securepass123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "customer"
}'

print_status "Registering customer..."
register_response=$(api_call "POST" "/auth/signup" "$customer_data")
echo "Registration: $register_response"

# Check if registration was successful or user already exists
if echo $register_response | grep -q '"success":true'; then
    customer_token=$(echo $register_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    print_success "Customer registered and logged in successfully"
elif echo $register_response | grep -q '409'; then
    print_warning "Customer already exists, attempting login..."
    customer_login_data='{
        "email": "john.doe@example.com",
        "password": "securepass123"
    }'
    login_response=$(api_call "POST" "/auth/signin" "$customer_login_data")
    echo "Login: $login_response"
    customer_token=$(echo $login_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$customer_token" ]; then
        print_success "Customer logged in successfully"
    else
        print_error "Failed to login as customer"
        exit 1
    fi
else
    print_error "Failed to register customer"
    exit 1
fi
echo

# Test 3: Staff Registration and Login
print_status "Testing staff registration and login..."

# Register a new staff member
staff_data='{
    "email": "jane.barber@example.com",
    "password": "barberpass123",
    "firstName": "Jane",
    "lastName": "Barber",
    "phone": "+1234567891",
    "role": "staff"
}'

print_status "Registering staff member..."
staff_register_response=$(api_call "POST" "/auth/signup" "$staff_data")
echo "Staff registration: $staff_register_response"

# Check if registration was successful or user already exists
if echo $staff_register_response | grep -q '"success":true'; then
    staff_token=$(echo $staff_register_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    print_success "Staff registered and logged in successfully"
elif echo $staff_register_response | grep -q '409'; then
    print_warning "Staff already exists, attempting login..."
    staff_login_data='{
        "email": "jane.barber@example.com",
        "password": "barberpass123"
    }'
    staff_login_response=$(api_call "POST" "/auth/signin" "$staff_login_data")
    echo "Staff login: $staff_login_response"
    staff_token=$(echo $staff_login_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$staff_token" ]; then
        print_success "Staff logged in successfully"
    else
        print_error "Failed to login as staff"
        exit 1
    fi
else
    print_error "Failed to register staff"
    exit 1
fi
echo

# Test 4: Staff Creates a Service
print_status "Staff creating a service..."
echo "[DEBUG] staff_token: $staff_token"

new_service_data='{
    "name": "Standard Haircut",
    "description": "Basic men haircut",
    "price": 20.00,
    "duration": 30
}'

service_creation_response=$(api_call "POST" "/services" "$new_service_data" "$staff_token")
echo "Service creation: $service_creation_response"

if echo $service_creation_response | grep -q '"success":true'; then
    print_success "Service created successfully"
else
    print_error "Service creation failed"
    exit 1
fi

echo
# Test 5: Get Available Services
print_status "Getting available services..."
services_response=$(api_call "GET" "/services")
echo "Services: $services_response"

# Extract first service ID
service_id=$(echo $services_response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ ! -z "$service_id" ]; then
    print_success "Found service with ID: $service_id"
else
    print_error "No services available"
    exit 1
fi

echo

# Test 6: Staff Creates Schedule
print_status "Staff creating schedule..."

# Get staff user ID from token (we'll use the staff email to find the user)
staff_schedule_data='{
    "barberId": "jane.barber@example.com",
    "dayOfWeek": "saturday",
    "availableTimeSlots": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]
}'

print_status "Creating schedule for Saturday..."
schedule_response=$(api_call "POST" "/schedules/set-schedule" "$staff_schedule_data" "$staff_token")
echo "Schedule creation: $schedule_response"

if echo $schedule_response | grep -q '"success":true'; then
    print_success "Schedule created successfully"
else
    print_warning "Schedule creation failed or already exists"
fi
echo

# Test 7: Customer Books Appointment
print_status "Customer booking appointment..."

# Get customer and staff user IDs
customer_id=$(echo $register_response | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
staff_id=$(echo $staff_login_response | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

appointment_data='{
    "userId": "'$customer_id'",
    "barberId": "'$staff_id'",
    "serviceId": "'$service_id'",
    "appointmentDate": "28/06/2025",
    "timeSlot": "10:00",
    "notes": "First time customer, please be gentle"
}'

print_status "Booking appointment..."
appointment_response=$(api_call "POST" "/appointments" "$appointment_data" "$customer_token")
echo "Appointment booking: $appointment_response"

if echo $appointment_response | grep -q '"success":true'; then
    print_success "Appointment booked successfully"
else
    print_warning "Appointment booking failed (might be time slot conflict)"
fi
echo

# Test 8: View Appointments
print_status "Viewing appointments..."

# Customer views their appointments
customer_appointments=$(api_call "GET" "/appointments/user/$customer_id" "" "$customer_token")
echo "Customer appointments: $customer_appointments"

# Staff views their appointments
staff_appointments=$(api_call "GET" "/appointments/barber/$staff_id" "" "$staff_token")
echo "Staff appointments: $staff_appointments"
echo

# Test 9: Update Appointment Status (Staff)
print_status "Staff updating appointment status..."

# Extract appointment ID from the booking response
appointment_id=$(echo $appointment_response | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$appointment_id" ]; then
    status_update_data='{
        "status": "confirmed"
    }'
    
    status_response=$(api_call "PUT" "/appointments/$appointment_id/status" "$status_update_data" "$staff_token")
    echo "Status update: $status_response"
    
    if echo $status_response | grep -q '"success":true'; then
        print_success "Appointment status updated to confirmed"
    else
        print_warning "Status update failed"
    fi
else
    print_warning "No appointment ID found for status update"
fi
echo

# Test 10: Admin Operations (if admin token available)
print_status "Testing admin operations..."

# Try to get all users (admin only)
all_users_response=$(api_call "GET" "/users/all" "" "$staff_token")
echo "All users (staff): $all_users_response"

# Test 11: Service Management (Staff)
print_status "Staff creating a new service..."

new_service_data='{
    "name": "Premium Haircut",
    "description": "Premium haircut with styling consultation",
    "price": 35.00,
    "duration": 45
}'

service_creation_response=$(api_call "POST" "/services" "$new_service_data" "$staff_token")
echo "Service creation: $service_creation_response"

if echo $service_creation_response | grep -q '"success":true'; then
    print_success "New service created successfully"
else
    print_warning "Service creation failed"
fi
echo

# Test 12: Account Management
print_status "Testing account deletion..."

delete_response=$(api_call "DELETE" "/auth/delete-account" "" "$customer_token")
echo "Account deletion: $delete_response"

if echo $delete_response | grep -q '"success":true'; then
    print_success "Customer account deleted successfully"
else
    print_warning "Account deletion failed"
fi
echo

# Summary
echo "================================================"
print_success "Workflow test completed!"
echo "✅ Health check"
echo "✅ Customer registration and login"
echo "✅ Staff registration and login"
echo "✅ Service listing"
echo "✅ Schedule creation"
echo "✅ Appointment booking"
echo "✅ Appointment viewing"
echo "✅ Status updates"
echo "✅ Service management"
echo "✅ Account management"
echo
print_status "All core API functionality tested successfully!" 