# EduHub — Track A: Core Governance & Multi-Tenancy
## Complete Technical Specification & API Documentation

**Author:** Idrees (Lead Backend Developer — Track A)  
**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api/v1`  
**Architecture:** Layered Pattern (Routes → Middleware → Controllers → Services → Models)

---

## Table of Contents
1. [Architecture Overview & Tenancy Model](#1-architecture-overview--tenancy-model)
2. [Data Models Specification](#2-data-models-specification)
3. [Security, Authentication & Scoping](#3-security-authentication--scoping)
4. [Unified API Response Structure](#4-unified-api-response-structure)
5. [Complete API Endpoints Reference](#5-complete-api-endpoints-reference)
   - [A. Authentication Endpoints](#a-authentication-endpoints)
   - [B. Super Admin Endpoints](#b-super-admin-endpoints)
   - [C. Institute Admin Endpoints](#c-institute-admin-endpoints)
6. [Status Codes & Error Handling](#6-status-codes--error-handling)
7. [Postman Testing Runbook](#7-postman-testing-runbook)

---

## 1. Architecture Overview & Tenancy Model

EduHub employs a **logical multi-tenant architecture** with a 3-tier administrative hierarchy:

```
                      ┌──────────────────────┐
                      │     Super Admin      │ (Platform Owner)
                      └──────────┬───────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
      ┌──────────────────────┐        ┌──────────────────────┐
      │  Institute Admin A   │        │  Institute Admin B   │ (Tenant Level)
      └──────────┬───────────┘        └──────────┬───────────┘
                 │                               │
        ┌────────┴────────┐             ┌────────┴────────┐
        ▼                 ▼             ▼                 ▼
 ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
 │Campus Mgr 1 │   │Campus Mgr 2 │   │Campus Mgr 3 │   │Campus Mgr 4 │ (Branch Level)
 └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
        │                 │                 │                 │
   [Students &       [Students &       [Students &       [Students &
    Teachers]         Teachers]         Teachers]         Teachers]
```

### Strict Tenancy Enforcement:
- **Institute Admins** can only see, update, and manage data where `instituteId === req.user.instituteId`.
- **Campus Managers** are locked to `campusId === req.user.campusId`.
- Data isolation is enforced at the **middleware layer** (`scope.middleware.js`) and **service layer** (`instituteAdmin.service.js`).

---

## 2. Data Models Specification

### 2.1 User Model (`src/models/user.model.js`)
| Field | Type | Required | Constraints / Notes |
|---|---|:---:|---|
| `name` | String | Yes | Trimmed |
| `email` | String | Yes | Unique, lowercase, trimmed, email regex |
| `passwordHash` | String | Yes | Min 6 chars, `select: false` (hidden by default) |
| `role` | String | Yes | Enum: `super_admin`, `institute_admin`, `campus_admin`, `campus_manager`, `teacher`, `student` (default: `student`) |
| `instituteId` | ObjectId | Dynamic | Ref: `Institute`. Required when `role === 'institute_admin'` |
| `campusId` | ObjectId | Dynamic | Ref: `Campus`. Required when role is `campus_manager`, `teacher`, or `student` |
| `phone` | String | No | Trimmed |
| `avatar` | String | No | Image URL |
| `isActive` | Boolean | Yes | Default: `true` |
| `createdAt` / `updatedAt` | Date | Auto | Timestamps enabled |

**Instance Methods:**
- `comparePassword(candidatePassword)`: Uses `bcrypt.compare` to safely verify credentials.

---

### 2.2 Institute Model (`src/models/institute.model.js`)
| Field | Type | Required | Constraints / Notes |
|---|---|:---:|---|
| `name` | String | Yes | Unique, trimmed, max 150 chars |
| `board` | String | Yes | Affiliated educational board (e.g., "Federal", "Punjab Board", "HEC") |
| `type` | String | Yes | Enum: `School`, `College`, `University`, `Institute` |
| `email` | String | Yes | Lowercase, valid email regex |
| `phone` | String | Yes | Contact phone number |
| `address` | Subdocument | Yes | `{ street, city, province, postalCode, country }` |
| `rating` | Number | No | Min: 0, Max: 5, Default: 0 |
| `image` | String | No | Cover image URL |
| `status` | String | Yes | Enum: `Active`, `Pending`, `Inactive` (Default: `Pending`) |
| `adminId` | ObjectId | No | Ref: `User` (Primary Institute Administrator) |
| `createdAt` / `updatedAt` | Date | Auto | Timestamps enabled |

---

### 2.3 Campus Model (`src/models/campus.model.js`)
| Field | Type | Required | Constraints / Notes |
|---|---|:---:|---|
| `instituteId` | ObjectId | Yes | Ref: `Institute`, indexed for fast tenant queries |
| `name` | String | Yes | Trimmed, max 150 chars |
| `address` | Subdocument | Yes | `{ street, city, province, postalCode, country }` |
| `phone` | String | No | Front desk phone |
| `email` | String | No | Branch email |
| `managerId` | ObjectId | No | Ref: `User` (Appointed Campus Manager) |
| `status` | String | Yes | Enum: `Active`, `Pending`, `Inactive` (Default: `Pending`) |
| `createdAt` / `updatedAt` | Date | Auto | Timestamps enabled |

---

## 3. Security, Authentication & Scoping

1. **`protect` Middleware:**
   - Reads `Authorization: Bearer <token>`.
   - Verifies JWT against `process.env.JWT_SECRET`.
   - Loads user from DB (excluding `passwordHash`).
   - Verifies `user.isActive !== false` (blocks deactivated accounts).
   - Attaches authenticated user to `req.user`.

2. **`restrictTo(...roles)` Middleware:**
   - Verifies `roles.includes(req.user.role)`.
   - Returns `403 Forbidden` if role is unauthorized.

3. **`instituteAdminScope` Middleware:**
   - Verifies `req.user.instituteId` exists.
   - Attaches verified tenant boundary to `req.instituteId`.
   - Automatically bypasses for `super_admin` when managing institutes.

---

## 4. Unified API Response Structure

Every single API response strictly follows this uniform JSON contract:

### Success Response:
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "count": 10,       // (Included on array listings)
  "data": { ... }    // Object or Array of data
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Detailed and human-readable error explanation."
}
```

---

## 5. Complete API Endpoints Reference

### A. Authentication Endpoints

#### 1. Register User (Public)
* **`POST /api/v1/auth/register`**
* **Access:** Public
* **Security Rule:** Role is strictly forced to `"student"`. Users cannot self-assign privileged roles.
* **Request Body:**
  ```json
  {
    "name": "Hamza Ali",
    "email": "hamza@gmail.com",
    "password": "password123",
    "phone": "+92 300 1234567"
  }
  ```
* **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Registration successful. Welcome to EduHub!",
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "_id": "664b...",
        "name": "Hamza Ali",
        "email": "hamza@gmail.com",
        "role": "student",
        "isActive": true
      }
    }
  }
  ```

#### 2. Login User (Public)
* **`POST /api/v1/auth/login`**
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "hamza@gmail.com",
    "password": "password123"
  }
  ```
* **Response (`200 OK`):** Returns signed JWT token and user details.

#### 3. Get Current User Profile
* **`GET /api/v1/auth/me`**
* **Access:** Private (`protect`)
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Response (`200 OK`):** Populates user details, assigned `instituteId` and `campusId`.

#### 4. Update Profile
* **`PUT /api/v1/auth/profile`**
* **Access:** Private (`protect`)
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Request Body:**
  ```json
  {
    "name": "Hamza Ali Khan",
    "phone": "+92 321 9876543",
    "avatar": "https://example.com/avatar.jpg"
  }
  ```

---

### B. Super Admin Endpoints
*All routes require: `Authorization: Bearer <SUPER_ADMIN_TOKEN>`*

#### 1. Global Platform Analytics
* **`GET /api/v1/super-admin/stats`**
* **Description:** Platform-wide counts of institutes, campuses, and users by role.

#### 2. List All Institutes
* **`GET /api/v1/super-admin/institutes`**
* **Query Parameters:** `?status=Active&type=University&board=HEC&search=NUST`

#### 3. Register a New Institute (With Optional Inline Admin)
* **`POST /api/v1/super-admin/institutes`**
* **Request Body:**
  ```json
  {
    "name": "National University of Technology",
    "board": "HEC",
    "type": "University",
    "email": "info@nutech.edu.pk",
    "phone": "+92 51 9200000",
    "address": {
      "street": "Sector H-12",
      "city": "Islamabad",
      "province": "Federal",
      "postalCode": "44000",
      "country": "Pakistan"
    },
    "status": "Active",
    "admin": {
      "name": "Dr. Tariq Mahmood",
      "email": "tariq.admin@nutech.edu.pk",
      "password": "AdminPassword123",
      "phone": "+92 333 5554443"
    }
  }
  ```

#### 4. Manage Single Institute
* **`GET /api/v1/super-admin/institutes/:id`** — Get institute details + total campus count.
* **`PUT /api/v1/super-admin/institutes/:id`** — Update institute information.
* **`DELETE /api/v1/super-admin/institutes/:id`** — Deletes institute and cascades removal of child campuses.

#### 5. Assign or Reassign Institute Admin
* **`POST /api/v1/super-admin/institutes/:id/assign-admin`**
* **Request Body (Accepts `userId`, `email`, OR `newAdminData`):**
  ```json
  {
    "email": "existing_user@gmail.com"
  }
  ```

#### 6. Institute Admins Standalone Management
* **`GET /api/v1/super-admin/institute-admins`** — List all Institute Admins with their institute details.
* **`POST /api/v1/super-admin/institute-admins`** — Create an Institute Admin directly:
  ```json
  {
    "name": "Prof. Zahid",
    "email": "zahid@university.edu.pk",
    "password": "securePassword123",
    "instituteId": "664b38d9f521a002bc45e12a",
    "phone": "+92 300 9988776"
  }
  ```

#### 7. Global Campuses Management
* **`GET /api/v1/super-admin/campuses`** — List all campuses platform-wide (Filter: `?instituteId=...&status=Active`).
* **`POST /api/v1/super-admin/campuses`** — Create a campus under any institute.
* **`PUT /api/v1/super-admin/campuses/:id`** — Update campus details.
* **`DELETE /api/v1/super-admin/campuses/:id`** — Delete a campus.

#### 8. Global User Governance
* **`GET /api/v1/super-admin/users`** — Global user directory (Filter: `?role=student&isActive=true&search=ali`).
* **`PATCH /api/v1/super-admin/users/:id/toggle-status`** — Inverts `isActive` status (Activates or Suspends user account).

---

### C. Institute Admin Endpoints
*All routes require: `Authorization: Bearer <INSTITUTE_ADMIN_TOKEN>`*  
*Enforces: `instituteAdminScope` (Operations are automatically and strictly locked to the caller's `instituteId`)*

#### 1. Institute Statistics
* **`GET /api/v1/institute-admin/stats`**
* **Returns:** Total campuses, active campuses, total managers, teachers, and enrolled students for this institute.

#### 2. Institute Profile
* **`GET /api/v1/institute-admin/profile`**
* **Returns:** Full details of the caller's own institute and its assigned primary admin.

#### 3. Campus Branch Management
* **`GET /api/v1/institute-admin/campuses`** — List all campus branches belonging to this institute.
* **`POST /api/v1/institute-admin/campuses`** — Create a new campus branch:
  ```json
  {
    "name": "Lahore Campus",
    "phone": "+92 42 35789000",
    "email": "lahore@nutech.edu.pk",
    "address": {
      "street": "Gulberg III",
      "city": "Lahore",
      "province": "Punjab",
      "postalCode": "54000"
    },
    "status": "Active"
  }
  ```
* **`GET /api/v1/institute-admin/campuses/:id`** — Get branch details, including student count and teacher count.
* **`PUT /api/v1/institute-admin/campuses/:id`** — Update branch information.
* **`DELETE /api/v1/institute-admin/campuses/:id`** — Delete a campus branch.

#### 4. Appoint Campus Manager
* **`POST /api/v1/institute-admin/campuses/:id/assign-manager`**
* **Request Body:**
  ```json
  {
    "email": "manager_candidate@gmail.com"
  }
  ```

#### 5. List & Create Campus Managers
* **`GET /api/v1/institute-admin/managers`** — Lists all managers across this institute's campuses.
* **`POST /api/v1/institute-admin/managers`** — Appoint and register a new Campus Manager in one call:
  ```json
  {
    "name": "Usman Ghani",
    "email": "usman.manager@nutech.edu.pk",
    "password": "managerPassword123",
    "campusId": "664c1234567890abcdef1234",
    "phone": "+92 312 8887766"
  }
  ```

---

## 6. Status Codes & Error Handling

| Code | Status | When returned |
|:---:|---|---|
| **200** | OK | Successful GET, PUT, PATCH, DELETE operations |
| **201** | Created | Resource successfully created (POST) |
| **400** | Bad Request | Missing required fields, invalid ObjectId, or schema validation failure |
| **401** | Unauthorized | Missing or expired JWT token |
| **403** | Forbidden | Insufficient permissions or accessing another tenant's data |
| **404** | Not Found | Resource not found |
| **409** | Conflict | Duplicate unique key (e.g. duplicate email or institute name) |
| **500** | Server Error | Unhandled server exception |

---

## 7. Postman Testing Runbook

Follow these sequential steps in Postman to test the full lifecycle:

### Step 1: Register a Super Admin (Or use seed script)
* `POST http://localhost:5000/api/v1/auth/register`
* Body:
  ```json
  { "name": "Super Admin", "email": "superadmin@eduhub.com", "password": "SuperSecretPassword123" }
  ```
*(Manually set `role: "super_admin"` in MongoDB Compass or shell for the initial seed)*.

### Step 2: Login as Super Admin
* `POST http://localhost:5000/api/v1/auth/login`
* Body:
  ```json
  { "email": "superadmin@eduhub.com", "password": "SuperSecretPassword123" }
  ```
* Copy the returned `token`.

### Step 3: Register an Institute with Inline Admin
* `POST http://localhost:5000/api/v1/super-admin/institutes`
* Auth: Bearer Token (Super Admin)
* Body: (Use Section 5.B.3 payload)
* Note down:
  - Institute Admin Email: `tariq.admin@nutech.edu.pk`
  - Password: `AdminPassword123`

### Step 4: Login as the New Institute Admin
* `POST http://localhost:5000/api/v1/auth/login`
* Body:
  ```json
  { "email": "tariq.admin@nutech.edu.pk", "password": "AdminPassword123" }
  ```
* Copy this Institute Admin `token`.

### Step 5: Test Multi-Tenant Campus Creation
* `POST http://localhost:5000/api/v1/institute-admin/campuses`
* Auth: Bearer Token (Institute Admin)
* Body: (Use Section 5.C.3 payload)
* Verified: The campus is automatically and permanently attached to NUTECH University.

### Step 6: Verify Tenancy Isolation
* Call `GET http://localhost:5000/api/v1/institute-admin/campuses` using another institute admin's token.
* Verified: Empty array or only that tenant's campuses appear. Other institutes' data is 100% hidden.
