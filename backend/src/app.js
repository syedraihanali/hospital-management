const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contentRoutes = require('./routes/contentRoutes');
const errorHandler = require('./middleware/errorHandler');
const publicPatientRoutes = require('./routes/publicPatientRoutes');
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/patient-access', publicPatientRoutes);
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
app.use(errorHandler);

module.exports = { app, config };
