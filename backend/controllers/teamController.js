const Team = require('../models/Team');
const Task = require('../models/Task');

// Get all team members
exports.getAllTeam = async (req, res) => {
  try {
    const team = await Team.find();
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single team member
exports.getTeamMemberById = async (req, res) => {
  try {
    const member = await Team.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Team member not found' });
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new team member
exports.addTeamMember = async (req, res) => {
  try {
    const { name, email, phone, address, role, experience } = req.body;

    const newMember = new Team({
      name,
      email,
      phone,
      address,
      role,
      experience
    });

    const savedMember = await newMember.save();

    res.status(201).json({
      message: 'Team member added successfully',
      member: savedMember
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update team member
exports.updateTeamMember = async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id; // Prevent MongoDB immutable field error
    delete updateData.__v;

    const member = await Team.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!member) return res.status(404).json({ message: 'Team member not found' });

    res.json({
      message: 'Team member updated successfully',
      member
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This email address is already registered to another team member.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete team member
exports.deleteTeamMember = async (req, res) => {
  try {
    const member = await Team.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: 'Team member not found' });

    // Update tasks assigned to this member
    await Task.updateMany(
      { assignedTo: req.params.id },
      { assignedTo: null }
    );

    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update team member status
exports.updateTeamMemberStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const member = await Team.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!member) return res.status(404).json({ message: 'Team member not found' });

    res.json({
      message: 'Team member status updated',
      member
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get team members by role
exports.getTeamByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const team = await Team.find({ role, status: 'Active' });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get team members by department
exports.getTeamByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const team = await Team.find({ department, status: 'Active' });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get team statistics
exports.getTeamStats = async (req, res) => {
  try {
    const totalMembers = await Team.countDocuments();
    const activeMembers = totalMembers; // All team members are considered active
    const onLeaveMembers = 0;
    
    const roles = await Team.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      totalMembers,
      activeMembers,
      onLeaveMembers,
      roles
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

