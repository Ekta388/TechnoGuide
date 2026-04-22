const Assignment = require('../models/Assignment');
const Package = require('../models/Package');
const Client = require('../models/Client');

// Get all assignments (most recent first)
exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .sort({ assignedAt: -1 })
      .populate('package')
      .populate('client');

    // Transform logo path to full URL for populated clients
    const assignmentsWithFullUrls = assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      if (assignmentObj.client && assignmentObj.client.logo && !assignmentObj.client.logo.startsWith('http')) {
        const baseURL = `${req.protocol}://${req.get('host')}`;
        assignmentObj.client.logo = `${baseURL}${assignmentObj.client.logo}`;
      }
      return assignmentObj;
    });

    res.json(assignmentsWithFullUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create an assignment
exports.createAssignment = async (req, res) => {
  try {
    const { packageId, clientId, startDate, endDate } = req.body;

    if (!packageId || !clientId || !startDate || !endDate) {
      return res.status(400).json({ message: 'packageId, clientId, startDate, and endDate are required' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Update package current assigned client + dates using updateOne to avoid full validation
    await Package.updateOne(
      { _id: packageId },
      {
        client: clientId,
        startDate,
        endDate
      }
    );

    // Initialize deliverables progress based on package deliverables
    const deliverablesProgress = (pkg.deliverables || []).map(d => ({
      name: d.name,
      completedCount: 0,
      monthlyCount: d.monthlyCount,
      total: d.total
    }));

    const assignment = new Assignment({
      package: packageId,
      client: clientId,
      startDate,
      endDate,
      deliverablesProgress
    });

    const savedAssignment = await assignment.save();

    const populated = await Assignment.findById(savedAssignment._id)
      .populate('package')
      .populate('client');

    const populatedObj = populated.toObject();
    if (populatedObj.client && populatedObj.client.logo && !populatedObj.client.logo.startsWith('http')) {
      const baseURL = `${req.protocol}://${req.get('host')}`;
      populatedObj.client.logo = `${baseURL}${populatedObj.client.logo}`;
    }

    res.status(201).json({ message: 'Assignment created', assignment: populatedObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update deliverable progress
exports.updateDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliverableName, completedCount } = req.body;

    if (!deliverableName || completedCount === undefined) {
      return res.status(400).json({ message: 'deliverableName and completedCount are required' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const deliverable = assignment.deliverablesProgress.find(d => d.name === deliverableName);
    if (!deliverable) {
      return res.status(404).json({ message: 'Deliverable not found in this assignment' });
    }

    deliverable.completedCount = Number(completedCount);
    const updatedAssignment = await assignment.save();

    const populated = await Assignment.findById(updatedAssignment._id)
      .populate('package')
      .populate('client');

    const populatedObj = populated.toObject();
    if (populatedObj.client && populatedObj.client.logo && !populatedObj.client.logo.startsWith('http')) {
      const baseURL = `${req.protocol}://${req.get('host')}`;
      populatedObj.client.logo = `${baseURL}${populatedObj.client.logo}`;
    }

    res.json({ message: 'Delivery progress updated', assignment: populatedObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active assignment for a client
exports.getActiveAssignmentByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const assignment = await Assignment.findOne({ client: clientId })
      .sort({ assignedAt: -1 })
      .populate('package')
      .populate('client');

    if (!assignment) {
      return res.status(404).json({ message: 'No active assignment found for this client' });
    }

    const assignmentObj = assignment.toObject();
    if (assignmentObj.client && assignmentObj.client.logo && !assignmentObj.client.logo.startsWith('http')) {
      const baseURL = `${req.protocol}://${req.get('host')}`;
      assignmentObj.client.logo = `${baseURL}${assignmentObj.client.logo}`;
    }

    res.json(assignmentObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
