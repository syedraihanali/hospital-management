# Backend Server

## Starting the server

From this directory run:

```bash
node src/server.js
```

The server listens on port `5001`, so make sure the port is available before starting the process.

Default role accounts (passwords can be changed after the first sign-in):

- Admin: `admin@hospital.com` / `Admin@123`
- Doctor: `dr.john@hospital.com` / `Doctor@123`

## Seeding default doctors and availability

The project ships with a seeding script that creates doctors for ten specializations, registers matching doctor user accounts with the password `Doctor@123`, and generates 9 AM–5 PM availability for the next seven days.

1. Ensure your `.env` file is configured with valid database credentials and JWT settings.
2. From the `backend` directory install dependencies if needed: `npm install`.
3. Run the seed script:

   ```bash
   npm run seed:doctors
   ```

The script is idempotent: running it again updates the doctor details, refreshes upcoming availability, and keeps the associated user accounts in sync.
