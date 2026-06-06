const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
require('./src/models/Company');
const Attendance = require('./src/models/Attendance');
const WorkReport = require('./src/models/WorkReport');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Connected to DB");
        try {
            const user = await User.findOne({ role: 'PARTNER' }).populate('companyId', 'companyName isActive');
            if (!user) throw new Error("No partner found");
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const [
              totalEmployees,
              totalInterns,
              activeUsers,
              disabledUsers,
              todayAttendance,
              pendingReports,
              recentUsers
            ] = await Promise.all([
              User.countDocuments({ role: { $in: ['EMPLOYEE', 'HR', 'PARTNER'] }, companyId: user.companyId._id || user.companyId }),
              User.countDocuments({ role: 'INTERN', companyId: user.companyId._id || user.companyId }),
              User.countDocuments({ isActive: true, role: { $ne: 'ADMIN' }, companyId: user.companyId._id || user.companyId }),
              User.countDocuments({ isActive: false, role: { $ne: 'ADMIN' }, companyId: user.companyId._id || user.companyId }),
              Attendance.aggregate([
                { $match: { date: { $gte: today, $lt: tomorrow } } },
                {
                  $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                  }
                }
              ]),
              WorkReport.countDocuments({ status: 'SUBMITTED' }),
              User.find({ role: { $ne: 'ADMIN' }, companyId: user.companyId._id || user.companyId })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('fullName email role createdAt isActive')
            ]);
            
            console.log("Dashboard stats query succeeded!");
            console.log("Total Employees:", totalEmployees);
        } catch (error) {
            console.error("Dashboard Stats Error:", error);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
