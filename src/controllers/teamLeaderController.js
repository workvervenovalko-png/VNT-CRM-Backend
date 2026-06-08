const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { createNotification } = require('./notificationController');
const { sendEmail } = require('../utils/emailService');
const { getAssignmentUpdateTemplate } = require('../utils/emailTemplates');
const Meeting = require('../models/Meeting');

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

// Assign project to intern
exports.assignProjectToIntern = async (req, res) => {
  try {
    const { userId } = req.params;
    const { projectTitle } = req.body;
    const tlId = req.user._id;

    const user = await User.findOne({ _id: userId, role: 'INTERN', teamLeader: tlId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Intern not found or not mapped to you' });
    }

    if (!user.internDetails) user.internDetails = {};
    if (!user.internDetails.projectWork) user.internDetails.projectWork = {};

    user.internDetails.projectWork.projectTitle = projectTitle;
    await user.save();

    // Notify the intern
    await createNotification(
      user._id,
      `You have been assigned a new project: ${projectTitle}`,
      'info',
      null,
      'Project'
    );

    res.json({
      success: true,
      message: 'Project assigned successfully',
      data: user.internDetails.projectWork
    });
  } catch (error) {
    console.error('TL Assign Project Error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign project' });
  }
};

// Get specific intern details (stripped of sensitive info)
exports.getInternDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const tlId = req.user._id;

    const intern = await User.findOne({ _id: userId, role: 'INTERN', teamLeader: tlId })
      .select('-password -__v -resetPasswordToken -resetPasswordExpire');

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found in your team' });
    }

    // Strip sensitive info
    const safeDetails = { ...intern.toObject() };
    if (safeDetails.internDetails && safeDetails.internDetails.personal) {
      delete safeDetails.internDetails.personal.aadhaarNumber;
      delete safeDetails.internDetails.personal.panNumber;
      delete safeDetails.internDetails.personal.bankDetails;
      delete safeDetails.internDetails.personal.emergencyContact;
    }

    res.json({ success: true, data: safeDetails });
  } catch (error) {
    console.error('Get intern details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch intern details' });
  }
};

// Get all assigned tasks across the team
exports.getTeamTasks = async (req, res) => {
  try {
    const tlId = req.user._id;
    const interns = await User.find({ role: 'INTERN', teamLeader: tlId })
      .select('fullName email internDetails.assignedTasks');

    let allTasks = [];
    interns.forEach(intern => {
      if (intern.internDetails && intern.internDetails.assignedTasks) {
        intern.internDetails.assignedTasks.forEach(task => {
          allTasks.push({
            ...task.toObject(),
            internId: intern._id,
            internName: intern.fullName,
            internEmail: intern.email
          });
        });
      }
    });

    res.json({ success: true, data: allTasks });
  } catch (error) {
    console.error('Get team tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team tasks' });
  }
};

// Update task status for a team member
exports.updateTaskStatus = async (req, res) => {
  try {
    const { userId, taskId } = req.params;
    const { status } = req.body;
    const tlId = req.user._id;

    const intern = await User.findOne({ _id: userId, role: 'INTERN', teamLeader: tlId });
    if (!intern || !intern.internDetails) {
      return res.status(404).json({ success: false, message: 'Intern not found in your team' });
    }

    const task = intern.internDetails.assignedTasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = status;
    await intern.save();

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update task status' });
  }
};

// Get historical attendance for the team
exports.getTeamAttendance = async (req, res) => {
  try {
    const tlId = req.user._id;
    const { startDate, endDate } = req.query;

    const interns = await User.find({ role: 'INTERN', teamLeader: tlId }).select('_id');
    const internIds = interns.map(i => i._id);

    let query = { user: { $in: internIds } };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.date = { $gte: thirtyDaysAgo };
    }

    const attendance = await Attendance.find(query).populate('user', 'fullName').sort({ date: -1 });

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Get team attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team attendance' });
  }
};

// Get leaves for the team
const Leave = require('../models/Leave');
exports.getTeamLeaves = async (req, res) => {
  try {
    const tlId = req.user._id;
    const interns = await User.find({ role: 'INTERN', teamLeader: tlId }).select('_id');
    const internIds = interns.map(i => i._id);

    const leaves = await Leave.find({ user: { $in: internIds } })
      .populate('user', 'fullName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (error) {
    console.error('Get team leaves error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team leaves' });
  }
};

// Review/Update leave status
exports.reviewLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, reviewComments } = req.body;
    const tlId = req.user._id;

    const leave = await Leave.findById(leaveId).populate('user');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

    // Ensure user belongs to this TL
    if (leave.user.teamLeader.toString() !== tlId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    leave.status = status;
    leave.reviewedBy = tlId;
    leave.reviewedAt = new Date();
    if (reviewComments) leave.reviewComments = reviewComments;

    await leave.save();

    // Notify intern
    await createNotification(
      leave.user._id,
      `Your leave request has been ${status.toLowerCase()} by your Team Leader.`,
      status === 'APPROVED' ? 'success' : 'error',
      null,
      'Leave'
    );

    res.json({ success: true, data: leave });
  } catch (error) {
    console.error('Review leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to review leave' });
  }
};

// Get progress reports (daily/weekly) for the team
exports.getTeamReports = async (req, res) => {
  try {
    const tlId = req.user._id;
    const interns = await User.find({ role: 'INTERN', teamLeader: tlId })
      .select('fullName internDetails.academicWork');

    let reports = { daily: [], weekly: [] };
    
    interns.forEach(intern => {
      if (intern.internDetails && intern.internDetails.academicWork) {
        // Daily
        const daily = intern.internDetails.academicWork.dailyTaskUpdate || [];
        daily.forEach(d => reports.daily.push({ ...d.toObject(), internId: intern._id, internName: intern.fullName }));
        
        // Weekly
        const weekly = intern.internDetails.academicWork.weeklyProgressReport || [];
        weekly.forEach(w => reports.weekly.push({ ...w.toObject(), internId: intern._id, internName: intern.fullName }));
      }
    });

    // Sort by date/time descending
    reports.daily.sort((a, b) => new Date(b.date) - new Date(a.date));
    reports.weekly.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get team reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team reports' });
  }
};

// ===================== MEETING FEATURES =====================

exports.getColleaguesForMeeting = async (req, res) => {
  try {
    const tlId = req.user._id;

    // Fetch interns assigned to TL
    const interns = await User.find({ role: 'INTERN', teamLeader: tlId }).select('fullName email role');
    
    // Fetch Admins and Partners
    const adminsAndPartners = await User.find({ role: { $in: ['ADMIN', 'PARTNER'] } }).select('fullName email role');

    res.json({
      success: true,
      data: {
        interns,
        adminsAndPartners
      }
    });
  } catch (error) {
    console.error('Get colleagues error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch colleagues' });
  }
};

exports.scheduleMeeting = async (req, res) => {
  try {
    const { title, description, meetLink, scheduledAt, attendees } = req.body;
    const tlId = req.user._id;

    const meeting = await Meeting.create({
      title,
      description,
      meetLink,
      scheduledAt,
      host: tlId,
      attendees
    });

    // Fetch attendee details to send emails and notifications
    const users = await User.find({ _id: { $in: attendees } }).select('email fullName');
    const emails = users.map(u => u.email);

    // Send email to attendees
    if (emails.length > 0) {
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Meeting Scheduled: ${title}</h2>
          <p>Hello,</p>
          <p>You have been invited to a meeting scheduled by <strong>${req.user.fullName}</strong>.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
            <p><strong>Description:</strong> ${description || 'No description provided.'}</p>
          </div>
          <a href="${meetLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Join Meeting</a>
          <p style="margin-top: 30px; font-size: 12px; color: #64748b;">This is an automated notification from Verve Nova Tech CRM.</p>
        </div>
      `;

      await sendEmail({
        to: emails,
        subject: `Meeting Invitation: ${title}`,
        html: emailHtml
      });

      // Create in-app notifications
      for (const user of users) {
        await createNotification(
          user._id,
          `You have a new meeting scheduled: ${title} on ${new Date(scheduledAt).toLocaleString()}`,
          'info',
          null,
          'Meeting'
        );
      }
    }

    res.status(201).json({ success: true, message: 'Meeting scheduled successfully', data: meeting });
  } catch (error) {
    console.error('Schedule meeting error:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule meeting' });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch meetings where the user is either the host or an attendee
    const meetings = await Meeting.find({
      $or: [
        { host: userId },
        { attendees: userId }
      ]
    })
    .populate('host', 'fullName email role')
    .populate('attendees', 'fullName email role')
    .sort({ scheduledAt: 1 });

    res.json({ success: true, data: meetings });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
  }
};
