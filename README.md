# Hospital Management Platform

A full-stack hospital management platform that supports digital onboarding for patients and doctors, appointment scheduling, secure document storage, and role-based dashboards for administrators, clinicians, and patients.

## Key Features

- **Doctor onboarding** – Prospective doctors can submit applications with verified identification and license documents. Admins review, approve, or reject applications and automatically provision approved doctor accounts.
- **Patient registration** – Patients can register with Bangladeshi phone/NID validation and upload multiple medical records (PDF or image).
- **Role-based navigation & dashboards** – Dynamic navigation menus and protected routes tailored for admins, doctors, and patients.
- **Appointment lifecycle** – Patients book appointments from doctor availability, doctors confirm/cancel, and can upload prescriptions or reports.
- **Medical history hub** – Patients can review appointments, uploaded documents, and doctor reports in a unified searchable timeline.
- **File storage with MinIO** – All sensitive files (documents, avatars, prescriptions) are stored in object storage with generated public URLs.
- **Floating support actions** – Configurable call and WhatsApp buttons are always available for visitors and logged-in users.
- **Seed data** – Automatic schema creation and seed scripts populate doctors, patients, service packages, and site content for quick demos.

## Project Structure

```
/README.md                Project overview and setup instructions
/backend                  Node.js (Express) API, MySQL access, MinIO uploads
/frontend                 React SPA with Tailwind CSS styling
```

### Backend Highlights
- Express 5 with JWT-based auth, role authorization, and centralized error handling.
- Automatic schema setup in `backend/src/database/schema.js` (tables, constraints, seed data).
- Services for doctor applications, appointment workflows, patient documents, and content management.
- MinIO client setup in `backend/src/config/storage.js` with utility helpers for uploads.

### Frontend Highlights
- React Router v6 with guarded routes per role and nested dashboards.
- Tailwind utility classes for responsive design across devices.
- Context providers for authentication and site settings (including floating support links).
- Dedicated pages/components for doctor applications, booking, admin management, and support buttons.

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+
- Access to a MinIO (or S3-compatible) object storage endpoint

### Environment Variables

Create `backend/.env` with values suited to your environment:

```
PORT=5001
JWT_SECRET=change-me
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hospital
DB_CONNECTION_LIMIT=10
DB_CONNECT_TIMEOUT_MS=10000
DB_RETRY_ATTEMPTS=5
DB_RETRY_DELAY_MS=2000

MINIO_ENDPOINT=128.199.31.100
MINIO_PORT=9000
MINIO_ACCESS_KEY=tahir
MINIO_SECRET_KEY=Raihan12
MINIO_BUCKET=hospital-data
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://128.199.31.100:9000
```

> **Note:** On first run the server will verify that the configured bucket exists and will attempt to create it if missing.
> Adjust the optional database timeout and retry variables if your MySQL service takes longer to become available.

### Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Database Setup

1. Create the target database (`DB_NAME`) in MySQL if it does not exist.
2. Start the backend server once – it will automatically create/alter tables and seed:
   - sample doctors, patients, and users
   - default admin account (`admin@hospital.com` / `Admin@123`)
   - service packages and site content
3. Update credentials/passwords from within the app as needed.

### Running the Apps

```bash
# Terminal 1 – start the API
cd backend
npm start

# Terminal 2 – start the React dev server
cd frontend
npm start
```

The React app defaults to `http://localhost:3000` and proxies API calls to the URL configured via `REACT_APP_API_URL` (configure in `frontend/.env` if required).

### Configuring Floating Support Buttons

- Open the admin dashboard → **Site Settings** tab.
- Update the "Support phone number" and "WhatsApp support URL" fields.
- Saved values immediately drive the floating buttons visible to all visitors.

## Testing & Quality Checks

- Use the seeded data to log in as patients, doctors, or the admin to explore full workflows.
- Ensure MinIO credentials are reachable; failed uploads will raise clear error messages in the UI.
- Run `npm run build` in the frontend to validate compilation when deploying.

## Additional Notes

- Password policies enforce a minimum length of 8 characters for patient and doctor updates.
- Doctor applications are deduplicated by email/license/NID and cannot be re-submitted while pending or approved.
- Uploaded files are limited to 10 MB per upload via middleware (`multer`). Adjust limits if your deployment requires larger documents.

Happy building!
