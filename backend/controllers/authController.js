const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Team = require('../models/Team');

// Register admin
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: role || 'Admin',
      phone,
      isActive: true
    });

    const savedAdmin = await newAdmin.save();

    // Generate token
    const token = jwt.sign(
      { id: savedAdmin._id, role: savedAdmin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      admin: {
        id: savedAdmin._id,
        name: savedAdmin.name,
        email: savedAdmin.email,
        role: savedAdmin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login admin
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Team Member Login
exports.teamLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[TeamLogin] Attempting login for email: ${email}`);

    // Team members log in with email and phone (as password)
    const teamMember = await Team.findOne({ email });
    if (!teamMember) {
      return res.status(401).json({ message: 'Team member not found' });
    }

    // Compare phone number (stored as password for team members as per request)
    if (teamMember.phone !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: teamMember._id, role: 'Team Member' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Team Login successful',
      token,
      user: {
        id: teamMember._id,
        name: teamMember.name,
        email: teamMember.email,
        role: 'Team Member',
        phone: teamMember.phone
      }
    });
  } catch (error) {
    console.error('[TeamLogin] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Unified Get Current User (Admin or Team Member)
exports.getCurrentUser = async (req, res) => {
  try {
    let userData;
    if (req.userRole === 'Team Member') {
      userData = await Team.findById(req.userId).select('-password');
      if (userData) {
        userData = userData.toObject();
        userData.role = 'Team Member';
      }
    } else {
      userData = await Admin.findById(req.userId).select('-password');
    }

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Compatibility export
exports.getCurrentAdmin = exports.getCurrentUser;

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const Model = req.userRole === 'Team Member' ? Team : Admin;
    const user = await Model.findByIdAndUpdate(
      req.userId,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const Model = req.userRole === 'Team Member' ? Team : Admin;
    const user = await Model.findById(req.userId);

    // Filter current password check
    if (req.userRole !== 'Team Member') {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await Admin.findByIdAndUpdate(req.userId, { password: hashedPassword });
    } else {
      // Team members use phone as password
      if (user.phone !== currentPassword) {
        return res.status(401).json({ message: 'Current password (phone) is incorrect' });
      }
      await Team.findByIdAndUpdate(req.userId, { phone: newPassword });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
