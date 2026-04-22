const Task = require('../models/Task');
const TaskHistory = require('../models/TaskHistory');
const Team = require('../models/Team');
const Client = require('../models/Client');
const Package = require('../models/Package');
const Assignment = require('../models/Assignment');
const notificationService = require('../services/notificationService');

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('client', 'name')
      .populate('package', 'name')
      .populate('assignedTo', 'name email phone')
      .populate('assignedBy', 'name')
      .lean(); // Use lean for performance since we'll modify the objects

    // Fetch latest notification for each task
    const Notification = require('../models/Notification');

    const tasksWithNotifications = await Promise.all(tasks.map(async (task) => {
      const lastNotification = await Notification.findOne({ 'metadata.taskId': task._id })
        .sort({ createdAt: -1 })
        .select('status createdAt type recipientEmail')
        .lean();

      return {
        ...task,
        lastNotification: lastNotification || null
      };
    }));

    res.json(tasksWithNotifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single task
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('client')
      .populate('package')
      .populate('assignedTo')
      .populate('assignedBy');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create task
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      client,
      package: packageId,
      assignedTo,
      priority,
      type,
      platform,
      dueDate,
      dueTime,
      instructions,
      taskDetails,
      impactedDeliverables
    } = req.body;

    // Verify references exist
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (assignedTo) {
      const teamMemberExists = await Team.findById(assignedTo);
      if (!teamMemberExists) {
        return res.status(404).json({ message: 'Team member not found' });
      }
    }

    // Check if package exists only if packageId is provided
    let pkgExists = null;
    if (packageId) {
      pkgExists = await Package.findById(packageId);
      if (!pkgExists) {
        return res.status(404).json({ message: 'Package not found' });
      }
    }

    const newTask = new Task({
      title,
      description,
      client,
      package: packageId || null,
      assignedTo: assignedTo || null,
      assignedBy: req.admin?._id || null,
      priority,
      type,
      platform,
      status: 'Pending',
      dueDate,
      dueTime,
      instructions,
      taskDetails: taskDetails && Array.isArray(taskDetails) ? taskDetails.filter(t => t.trim()) : (typeof taskDetails === 'string' ? JSON.parse(taskDetails).filter(t => t.trim()) : []),
      impactedDeliverables: impactedDeliverables ? (typeof impactedDeliverables === 'string' ? JSON.parse(impactedDeliverables) : impactedDeliverables) : [],
      notificationSent: false,
      reminderScheduled: false
    });

    // Handle reference files
    if (req.files && req.files.length > 0) {
      let descriptions = [];
      try {
        if (req.body.fileDescriptions) {
          descriptions = JSON.parse(req.body.fileDescriptions);
        }
      } catch (e) {
        console.warn('Failed to parse fileDescriptions', e);
      }

      const mappedFiles = req.files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        originalName: file.originalname,
        mimetype: file.mimetype,
        description: descriptions[index] || ''
      }));
      newTask.referenceFiles = mappedFiles;
    }

    const savedTask = await newTask.save();

    // Add task to team member
    if (assignedTo) {
      await Team.findByIdAndUpdate(assignedTo, {
        $push: { assignedTasks: savedTask._id }
      });
    }

    // Add task to package if packageId exists
    if (packageId) {
      await Package.findByIdAndUpdate(packageId, {
        $push: { tasks: savedTask._id }
      });
    }


    // Notify team member about task assignment
    if (assignedTo) {
      // We don't await this to avoid blocking the response, but it runs in background
      notificationService.notifyTaskAssignment(savedTask._id);
    }

    // Update assignment deliverables if provided
    if (newTask.impactedDeliverables && newTask.impactedDeliverables.length > 0) {
      const assignment = await Assignment.findOne({ client }).sort({ assignedAt: -1 });
      if (assignment) {
        newTask.impactedDeliverables.forEach(item => {
          const deliverable = assignment.deliverablesProgress.find(d => d.name === item.name);
          if (deliverable) {
            deliverable.completedCount += Number(item.count);
          }
        });
        await assignment.save();
      }
    }

    res.status(201).json({
      message: 'Task created and assigned successfully',
      task: savedTask
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    let updateData = { ...req.body, updatedAt: Date.now() };

    // Format taskDetails properly if passed from FormData
    if (req.body.taskDetails && typeof req.body.taskDetails === 'string') {
      try {
        updateData.taskDetails = JSON.parse(req.body.taskDetails).filter(t => t.trim());
      } catch (e) {
        updateData.taskDetails = [];
      }
    }

    // Handle existing vs new referenceFiles
    let combinedFiles = [];
    if (req.body.existingReferenceFiles) {
      try {
        combinedFiles = JSON.parse(req.body.existingReferenceFiles);
      } catch (e) {
        console.warn('Failed to parse existingReferenceFiles', e);
      }
    }

    if (req.files && req.files.length > 0) {
      let descriptions = [];
      try {
        if (req.body.fileDescriptions) {
          descriptions = JSON.parse(req.body.fileDescriptions);
        }
      } catch (e) {
        console.warn('Failed to parse fileDescriptions', e);
      }

      const newFiles = req.files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        originalName: file.originalname,
        mimetype: file.mimetype,
        description: descriptions[index] || ''
      }));
      combinedFiles = [...combinedFiles, ...newFiles];
      updateData.referenceFiles = combinedFiles; // Overwrite entirely with old + new
    } else if (req.body.existingReferenceFiles) {
      updateData.referenceFiles = combinedFiles; // Overwrite with remaining files after deletion
    }

    // Handle impactedDeliverables sync
    if (req.body.impactedDeliverables) {
      const newImpact = typeof req.body.impactedDeliverables === 'string'
        ? JSON.parse(req.body.impactedDeliverables)
        : req.body.impactedDeliverables;

      const oldTask = await Task.findById(req.params.id);
      if (oldTask) {
        const assignment = await Assignment.findOne({ client: oldTask.client }).sort({ assignedAt: -1 });
        if (assignment) {
          // Revert old impact
          if (oldTask.impactedDeliverables && oldTask.impactedDeliverables.length > 0) {
            oldTask.impactedDeliverables.forEach(item => {
              const deliverable = assignment.deliverablesProgress.find(d => d.name === item.name);
              if (deliverable) deliverable.completedCount = Math.max(0, deliverable.completedCount - Number(item.count));
            });
          }
          // Apply new impact
          newImpact.forEach(item => {
            const deliverable = assignment.deliverablesProgress.find(d => d.name === item.name);
            if (deliverable) deliverable.completedCount += Number(item.count);
          });
          await assignment.save();
        }
      }
      updateData.impactedDeliverables = newImpact;
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('client').populate('package').populate('assignedTo');

    if (!task) return res.status(404).json({ message: 'Task not found' });


    // Notify if assignedTo changed or was newly added
    if (req.body.assignedTo && (!task.assignedTo || task.assignedTo._id.toString() !== req.body.assignedTo)) {
      notificationService.notifyTaskAssignment(task._id);
    }

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = req.params.id;

    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        status
      },
      { new: true }
    ).populate('assignedTo').populate('client').populate('package');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json({
      message: 'Task status updated',
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Remove from team member
    await Team.findByIdAndUpdate(task.assignedTo, {
      $pull: { assignedTasks: task._id }
    });

    // Remove from package
    if (task.package) {
      await Package.findByIdAndUpdate(task.package, {
        $pull: { tasks: task._id }
      });
    }

    // Revert assignment deliverables if any
    if (task.impactedDeliverables && task.impactedDeliverables.length > 0) {
      const assignment = await Assignment.findOne({ client: task.client }).sort({ assignedAt: -1 });
      if (assignment) {
        task.impactedDeliverables.forEach(item => {
          const deliverable = assignment.deliverablesProgress.find(d => d.name === item.name);
          if (deliverable) {
            deliverable.completedCount = Math.max(0, deliverable.completedCount - Number(item.count));
          }
        });
        await assignment.save();
      }
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by team member
exports.getTasksByTeamMember = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.teamMemberId })
      .populate('client', 'name')
      .populate('package', 'name')
      .populate('assignedBy', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task history
exports.getTaskHistory = async (req, res) => {
  try {
    const history = await TaskHistory.find()
      .populate('client', 'name')
      .populate('assignedTo', 'name')
      .sort({ completedDate: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by status
exports.getTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const tasks = await Task.find({ status })
      .populate('client', 'name')
      .populate('package', 'name')
      .populate('assignedTo', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by priority
exports.getTasksByPriority = async (req, res) => {
  try {
    const { priority } = req.params;
    const tasks = await Task.find({ priority })
      .populate('client', 'name')
      .populate('package', 'name')
      .populate('assignedTo', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task statistics
exports.getTaskStats = async (req, res) => {
  try {
    const totalActiveTasks = await Task.countDocuments();
    const completedHistoryTasks = await TaskHistory.countDocuments();

    const pendingTasks = await Task.countDocuments({ status: 'Pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });
    const reviewTasks = await Task.countDocuments({ status: 'Review' });

    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: Date.now() }
    });

    // Aggregate from both active and history if needed, but for now let's focus on active stats + total completed
    const tasksByPriority = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const tasksByType = await Task.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.json({
      totalTasks: totalActiveTasks + completedHistoryTasks,
      activeTasks: totalActiveTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks: completedHistoryTasks,
      reviewTasks,
      overdueTasks,
      tasksByPriority,
      tasksByType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk assign tasks
exports.bulkAssignTasks = async (req, res) => {
  try {
    const { taskIds, assignedTo } = req.body;

    for (const taskId of taskIds) {
      const task = await Task.findByIdAndUpdate(
        taskId,
        { assignedTo },
        { new: true }
      ).populate('assignedTo');

      if (task) {
        // Add to team member
        await Team.findByIdAndUpdate(assignedTo, {
          $push: { assignedTasks: task._id }
        });
        // Notify team member
        notificationService.notifyTaskAssignment(task._id);
      }
    }

    res.json({
      message: 'Tasks assigned successfully',
      tasksAssigned: taskIds.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Client Delivery Report
exports.getClientReport = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const tasks = await TaskHistory.find({ client: clientId })
      .populate('client')
      .populate('assignedTo')
      .sort({ completedDate: -1 });

    if (!tasks) {
      return res.status(404).json({ message: 'No history found for this client' });
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
