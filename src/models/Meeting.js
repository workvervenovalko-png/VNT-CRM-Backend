const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Meeting title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    meetLink: {
        type: String,
        required: [true, 'Meeting link is required'],
        trim: true
    },
    scheduledAt: {
        type: Date,
        required: [true, 'Scheduled time is required']
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);
