const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Get all interns mapped to the Team Leader
exports.getTeamInterns = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    // Only fetch interns assigned to the logged-in team leader
    // Wait, if the user is an admin, they might want to query it for a specific TL?
    // For now, we assume this is called by the TEAM_LEADER for their own team.
    const tlId = req.user._id;

    const query = { role: 'INTERN', teamLeader: tlId };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [interns, total] = await Promise.all([
      User.find(query)
        .select('fullName email mobile department internDetails createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    // Format interns
    const formattedInterns = interns.map(intern => ({
      _id: intern._id,
      internId: intern.internDetails?.internId || `INT-${intern._id.toString().slice(-6).toUpperCase()}`,
      fullName: intern.fullName,
      email: intern.email,
      mobile: intern.mobile,
      department: intern.department || 'Not Assigned',
      assignedTasksCount: intern.internDetails?.assignedTasks?.length || 0,
      joinedAt: intern.createdAt
    }));

    res.json({
      success: true,
      data: formattedInterns,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Get team interns error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team interns' });
  }
};

// Assign a task to an intern
exports.assignTaskToIntern = async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, description, dueDate } = req.body;
    const tlId = req.user._id;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const user = await User.findOne({ _id: userId, role: 'INTERN', teamLeader: tlId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Intern not found in your team' });
    }

    if (!user.internDetails) user.internDetails = {};
    if (!user.internDetails.assignedTasks) user.internDetails.assignedTasks = [];

    const newTask = {
      title,
      description,
      dueDate,
      status: 'Pending',
      assignedDate: new Date()
    };

    user.internDetails.assignedTasks.push(newTask);
    await user.save();

    // Notify the intern
    await createNotification(
      user._id,
      `New Task Assigned by TL: ${title}`,
      'info',
      null,
      'Task'
    );

    res.status(201).json({
      success: true,
      message: 'Task assigned successfully',
      data: user.internDetails.assignedTasks[user.internDetails.assignedTasks.length - 1]
    });
  } catch (error) {
    console.error('TL Assign Task Error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign task' });
  }
};
