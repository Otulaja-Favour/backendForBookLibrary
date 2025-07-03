const express = require('express');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateAppointment } = require('../middleware/validation');
const { generateAppointmentId, formatResponse } = require('../utils/helpers');

const router = express.Router();

// Create new appointment
router.post('/', authMiddleware, validateAppointment, async (req, res) => {
  try {
    const { subject, details, date } = req.body;
    const userId = req.user.id;

    const appointmentId = generateAppointmentId(userId);
    
    const appointment = new Appointment({
      id: appointmentId,
      subject: subject.trim(),
      details: details.trim(),
      date: new Date(date),
      status: 'pending',
      userId,
      createdAt: new Date()
    });

    await appointment.save();

    // Add to user's appointments
    const user = await User.findOne({ id: userId });
    user.appointments.push({
      subject: appointment.subject,
      details: appointment.details,
      date: appointment.date,
      status: appointment.status,
      userId: appointment.userId,
      id: appointment.id,
      createdAt: appointment.createdAt
    });
    user.updatedAt = new Date();
    await user.save();

    res.status(201).json(formatResponse(true, 'Appointment created successfully', appointment));
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json(formatResponse(false, 'Error creating appointment'));
  }
});

// Get all appointments (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (userId) query.userId = userId;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const appointments = await Appointment.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: 1 }); // Sort by appointment date

    const total = await Appointment.countDocuments(query);

    // Enrich with user information
    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        const user = await User.findOne({ id: appointment.userId }).select('firstName lastName email');
        return {
          ...appointment.toObject(),
          user: user ? {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email
          } : null
        };
      })
    );

    res.json(formatResponse(true, 'Appointments retrieved successfully', {
      appointments: enrichedAppointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }));
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving appointments'));
  }
});

// Get user's appointments
router.get('/my-appointments', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user.id;
    const query = { userId };

    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const appointments = await Appointment.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: 1 });

    const total = await Appointment.countDocuments(query);

    res.json(formatResponse(true, 'Your appointments retrieved successfully', {
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }));
  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving your appointments'));
  }
});

// Get appointment by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findOne({ id });

    if (!appointment) {
      return res.status(404).json(formatResponse(false, 'Appointment not found'));
    }

    // Users can only view their own appointments unless they're admin
    if (req.user.role !== 'admin' && appointment.userId !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'Access denied'));
    }

    // If admin, include user information
    let enrichedAppointment = appointment.toObject();
    if (req.user.role === 'admin') {
      const user = await User.findOne({ id: appointment.userId }).select('firstName lastName email phoneNumber');
      enrichedAppointment.user = user ? {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phoneNumber: user.phoneNumber
      } : null;
    }

    res.json(formatResponse(true, 'Appointment retrieved successfully', enrichedAppointment));
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving appointment'));
  }
});

// Update appointment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, details, date } = req.body;

    const appointment = await Appointment.findOne({ id });
    if (!appointment) {
      return res.status(404).json(formatResponse(false, 'Appointment not found'));
    }

    // Users can only update their own appointments
    if (appointment.userId !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'Access denied'));
    }

    // Don't allow updates to completed or cancelled appointments
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json(formatResponse(false, 'Cannot update completed or cancelled appointments'));
    }

    // Update appointment
    if (subject) appointment.subject = subject.trim();
    if (details) appointment.details = details.trim();
    if (date) appointment.date = new Date(date);
    appointment.updatedAt = new Date();

    await appointment.save();

    // Update in user's appointments array
    const user = await User.findOne({ id: appointment.userId });
    const userAppointmentIndex = user.appointments.findIndex(apt => apt.id === id);
    if (userAppointmentIndex !== -1) {
      user.appointments[userAppointmentIndex] = {
        ...user.appointments[userAppointmentIndex],
        subject: appointment.subject,
        details: appointment.details,
        date: appointment.date
      };
      user.updatedAt = new Date();
      await user.save();
    }

    res.json(formatResponse(true, 'Appointment updated successfully', appointment));
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json(formatResponse(false, 'Error updating appointment'));
  }
});

// Update appointment status (admin only)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled', 'successful'].includes(status)) {
      return res.status(400).json(formatResponse(false, 'Invalid status value'));
    }

    const appointment = await Appointment.findOneAndUpdate(
      { id },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json(formatResponse(false, 'Appointment not found'));
    }

    // Update in user's appointments array
    const user = await User.findOne({ id: appointment.userId });
    const userAppointmentIndex = user.appointments.findIndex(apt => apt.id === id);
    if (userAppointmentIndex !== -1) {
      user.appointments[userAppointmentIndex].status = status;
      user.updatedAt = new Date();
      await user.save();
    }

    res.json(formatResponse(true, 'Appointment status updated successfully', appointment));
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json(formatResponse(false, 'Error updating appointment status'));
  }
});

// Delete appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOne({ id });
    if (!appointment) {
      return res.status(404).json(formatResponse(false, 'Appointment not found'));
    }

    // Users can only delete their own appointments unless they're admin
    if (req.user.role !== 'admin' && appointment.userId !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'Access denied'));
    }

    // Don't allow deletion of confirmed or completed appointments unless admin
    if (req.user.role !== 'admin' && ['confirmed', 'completed'].includes(appointment.status)) {
      return res.status(400).json(formatResponse(false, 'Cannot delete confirmed or completed appointments'));
    }

    await Appointment.findOneAndDelete({ id });

    // Remove from user's appointments array
    const user = await User.findOne({ id: appointment.userId });
    user.appointments = user.appointments.filter(apt => apt.id !== id);
    user.updatedAt = new Date();
    await user.save();

    res.json(formatResponse(true, 'Appointment deleted successfully'));
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json(formatResponse(false, 'Error deleting appointment'));
  }
});

// Get appointment statistics (admin only)
router.get('/stats/overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });

    // Upcoming appointments (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingAppointments = await Appointment.countDocuments({
      date: { $gte: new Date(), $lte: nextWeek },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Recent appointments
    const recentAppointments = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(formatResponse(true, 'Appointment statistics retrieved successfully', {
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      upcomingAppointments,
      recentAppointments
    }));
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving appointment statistics'));
  }
});

module.exports = router;
