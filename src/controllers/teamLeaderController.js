const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { createNotification } = require('./notificationController');
const { sendEmail } = require('../utils/emailService');
const { getAssignmentUpdateTemplate } = require('../utils/emailTemplates');

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

    // Fetch today's attendance for these interns
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const internIds = interns.map(i => i._id);
    const attendanceRecords = await Attendance.find({
      user: { $in: internIds },
      date: { $gte: today, $lt: tomorrow }
    }).lean();

    const attendanceMap = {};
    attendanceRecords.forEach(att => {
      attendanceMap[att.user.toString()] = att.status;
    });

    // Format interns
    const formattedInterns = interns.map(intern => ({
      _id: intern._id,
      internId: intern.internDetails?.internId || `INT-${intern._id.toString().slice(-6).toUpperCase()}`,
      fullName: intern.fullName,
      email: intern.email,
      mobile: intern.mobile,
      department: intern.department || 'Not Assigned',
      assignedTasksCount: intern.internDetails?.assignedTasks?.length || 0,
      joinedAt: intern.createdAt,
      todayAttendance: attendanceMap[intern._id.toString()] || 'ABSENT'
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

    // Send Email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `New Task Assigned by TL: ${title}`,
        html: getAssignmentUpdateTemplate(
          user.fullName,
          'Task',
          `Title: ${title}<br/>Due Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}<br/>Description: ${description || 'N/A'}<br/><br/>Assigned by your Team Leader.`,
          'http://localhost:5173/intern/dashboard'
        )
      }).catch(err => console.error('Failed to send task email (TL):', err));
    }

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
