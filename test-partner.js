const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
require('./src/models/Company');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Connected to DB");
        try {
            const users = await User.find({ role: 'PARTNER' });
            users.forEach(u => {
                console.log(`User: ${u.email}, Role: ${u.role}, CompanyId: ${u.companyId ? (u.companyId._id || u.companyId) : 'UNDEFINED'}`);
            });
        } catch (error) {
            console.error("Error:", error);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
