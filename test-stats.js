const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const { Lead, Deal, CRMContact, Activity } = require('./src/models/crmModels');

const buildRoleQuery = async (user, assignedField = 'assignedTo') => {
    const role = user.role?.toUpperCase();

    switch (role) {
        case 'ADMIN':
            return {};

        case 'PARTNER':
        case 'HR':
            const teamMembers = await User.find({
                $or: [
                    { manager: user._id },
                    { department: user.department }
                ]
            }).select('_id');
            const teamIds = [user._id, ...teamMembers.map(m => m._id)];
            return { [assignedField]: { $in: teamIds } };

        case 'EMPLOYEE':
        case 'SALES':
        case 'SUPPORT':
        case 'INTERN':
        default:
            return {}; // Simplified Shared Pool
    }
};

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Connected to DB");
        
        try {
            const user = await User.findOne({ role: 'SALES' });
            const userId = user._id;

            let leadQuery = await buildRoleQuery(user, 'assignedTo');
            let dealQuery = await buildRoleQuery(user, 'owner');

            const [
                totalLeads,
                newLeads,
                contactedLeads,
                qualifiedLeads,
                convertedLeads,
                totalDeals,
                openDeals,
                wonDeals,
                lostDeals,
                totalDealValue,
                wonDealValue,
                totalContacts,
                pendingActivities,
                todayActivities,
                overdueActivities
            ] = await Promise.all([
                Lead.countDocuments(leadQuery),
                Lead.countDocuments({ ...leadQuery, status: 'new' }),
                Lead.countDocuments({ ...leadQuery, status: 'contacted' }),
                Lead.countDocuments({ ...leadQuery, status: 'qualified' }),
                Lead.countDocuments({ ...leadQuery, status: 'converted' }),
                Deal.countDocuments(dealQuery),
                Deal.countDocuments({ ...dealQuery, stage: { $nin: ['closed_won', 'closed_lost'] } }),
                Deal.countDocuments({ ...dealQuery, stage: 'closed_won' }),
                Deal.countDocuments({ ...dealQuery, stage: 'closed_lost' }),
                Deal.aggregate([
                    { $match: dealQuery },
                    { $group: { _id: null, total: { $sum: '$value' } } }
                ]),
                Deal.aggregate([
                    { $match: { ...dealQuery, stage: 'closed_won' } },
                    { $group: { _id: null, total: { $sum: '$value' } } }
                ]),
                CRMContact.countDocuments(await buildRoleQuery(user)),
                Activity.countDocuments({
                    assignedTo: userId,
                    completed: false,
                    dueDate: { $gte: new Date() }
                }),
                Activity.countDocuments({
                    assignedTo: userId,
                    dueDate: {
                        $gte: new Date().setHours(0, 0, 0, 0),
                        $lt: new Date().setHours(23, 59, 59, 999)
                    }
                }),
                Activity.countDocuments({
                    assignedTo: userId,
                    completed: false,
                    dueDate: { $lt: new Date() }
                })
            ]);

            console.log("Stats fetched successfully!");
            console.log("Total Leads:", totalLeads);
        } catch (error) {
            console.error("Dashboard stats error:", error);
        }
        
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
