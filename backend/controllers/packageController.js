const Package = require('../models/Package');
const Client = require('../models/Client');
const Task = require('../models/Task');

// Get all packages
exports.getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find()
      .populate('client', 'name email')
      .populate('assignedTeam', 'name role')
      .populate('manager', 'name role');

    // Convert to plain objects and ensure deliverables is an array
    const cleanPackages = packages.map(pkg => {
      const plainPkg = pkg.toObject();
      plainPkg.deliverables = Array.isArray(plainPkg.deliverables)
        ? plainPkg.deliverables.filter(d => d !== null && d !== undefined)
        : [];
      return plainPkg;
    });

    res.json(cleanPackages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single package
exports.getPackageById = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id)
      .populate('client')
      .populate('assignedTeam')
      .populate('manager')
      .populate('tasks');
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // Convert to plain object and ensure deliverables is an array
    const plainPkg = pkg.toObject();
    plainPkg.deliverables = Array.isArray(plainPkg.deliverables)
      ? plainPkg.deliverables.filter(d => d !== null && d !== undefined)
      : [];

    res.json(plainPkg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create package
exports.createPackage = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      platforms,
      amount,
      duration,
      durationUnit,
      deliverables,
      features,
      client,
      budget,
      startDate,
      endDate,
      manager
    } = req.body;

    // Basic validation
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ message: 'At least one target platform must be selected' });
    }

    if (!Array.isArray(type) || type.length === 0) {
      return res.status(400).json({ message: 'At least one service category must be selected' });
    }

    const allowedDurations = [3, 6, 9, 12];
    if (!allowedDurations.includes(Number(duration))) {
      return res.status(400).json({ message: 'Duration must be one of 3, 6, 9, or 12 months' });
    }

    // Ensure duration is always in months
    const finalDurationUnit = 'months';

    // Process deliverables to ensure total is calculated
    let processedDeliverables = [];
    if (Array.isArray(deliverables)) {
      processedDeliverables = deliverables.map(d => {
        if (typeof d === 'object' && d.name && d.monthlyCount) {
          return {
            name: d.name,
            monthlyCount: Number(d.monthlyCount),
            total: Number(d.monthlyCount) * Number(duration)
          };
        }
        return d;
      });
    }

    // Check if client exists (only if provided)
    if (client) {
      const clientExists = await Client.findById(client);
      if (!clientExists) {
        return res.status(404).json({ message: 'Client not found' });
      }
    }

    const newPackage = new Package({
      name,
      description,
      type,
      platforms,
      amount,
      duration,
      durationUnit: finalDurationUnit,
      deliverables: processedDeliverables,
      features,
      client,
      budget,
      status: 'Active',
      startDate,
      endDate,
      manager,
      createdBy: req.admin._id
    });

    const savedPackage = await newPackage.save();

    // Add package to client
    await Client.findByIdAndUpdate(client, {
      $push: { packages: savedPackage._id }
    });

    // Convert to plain object and ensure deliverables is a clean array
    const cleanPackage = savedPackage.toObject();
    cleanPackage.deliverables = Array.isArray(cleanPackage.deliverables)
      ? cleanPackage.deliverables.filter(d => d !== null && d !== undefined)
      : [];

    res.status(201).json({
      message: 'Package created successfully',
      package: cleanPackage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update package
exports.updatePackage = async (req, res) => {
  try {
    const { amount, platforms, duration, type, deliverables } = req.body;

    if (amount !== undefined && Number(amount) <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    if (platforms !== undefined && (!Array.isArray(platforms) || platforms.length === 0)) {
      return res.status(400).json({ message: 'At least one target platform must be selected' });
    }

    if (type !== undefined && (!Array.isArray(type) || type.length === 0)) {
      return res.status(400).json({ message: 'At least one service category must be selected' });
    }

    const allowedDurations = [3, 6, 9, 12];
    if (duration !== undefined && !allowedDurations.includes(Number(duration))) {
      return res.status(400).json({ message: 'Duration must be one of 3, 6, 9, or 12 months' });
    }

    // Keep duration unit consistent
    if (duration !== undefined) {
      req.body.durationUnit = 'months';
    }

    // Process deliverables if provided
    if (deliverables && Array.isArray(deliverables)) {
      const currentDuration = req.body.duration || duration;
      req.body.deliverables = deliverables.map(d => {
        if (typeof d === 'object' && d.name && d.monthlyCount !== undefined) {
          return {
            name: d.name,
            monthlyCount: Number(d.monthlyCount),
            total: Number(d.monthlyCount) * Number(currentDuration)
          };
        }
        return d;
      });
    }

    const pkg = await Package.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ).populate('client').populate('manager').populate('assignedTeam');

    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // Convert to plain object and ensure deliverables is a clean array
    const cleanPackage = pkg.toObject();
    cleanPackage.deliverables = Array.isArray(cleanPackage.deliverables)
      ? cleanPackage.deliverables.filter(d => d !== null && d !== undefined)
      : [];

    res.json({
      message: 'Package updated successfully',
      package: cleanPackage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete package
exports.deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // Remove from client
    await Client.findByIdAndUpdate(pkg.client, {
      $pull: { packages: pkg._id }
    });

    // Delete associated tasks
    await Task.deleteMany({ package: pkg._id });

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign team to package
exports.assignTeamToPackage = async (req, res) => {
  try {
    const { teamMembers } = req.body;
    const pkg = await Package.findByIdAndUpdate(
      req.params.id,
      { assignedTeam: teamMembers },
      { new: true }
    ).populate('assignedTeam');

    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    res.json({
      message: 'Team assigned to package',
      package: pkg
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update package progress
exports.updatePackageProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const pkg = await Package.findByIdAndUpdate(
      req.params.id,
      { progress },
      { new: true }
    );

    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    res.json({
      message: 'Package progress updated',
      package: pkg
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get packages by client
exports.getPackagesByClient = async (req, res) => {
  try {
    const packages = await Package.find({ client: req.params.clientId })
      .populate('assignedTeam')
      .populate('manager');
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get package statistics
exports.getPackageStats = async (req, res) => {
  try {
    const totalPackages = await Package.countDocuments();
    const activePackages = await Package.countDocuments({ status: 'Active' });
    const completedPackages = await Package.countDocuments({ status: 'Completed' });

    const totalBudget = await Package.aggregate([
      { $group: { _id: null, total: { $sum: '$budget' } } }
    ]);

    const totalAmount = await Package.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const packagesByType = await Package.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.json({
      totalPackages,
      activePackages,
      completedPackages,
      onHoldPackages: totalPackages - activePackages - completedPackages,
      totalBudget: totalBudget[0]?.total || 0,
      totalAmount: totalAmount[0]?.total || 0,
      packagesByType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
