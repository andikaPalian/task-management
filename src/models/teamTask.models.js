import mongoose from "mongoose";

const taskContentSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    due_date: {
        type: Date,
        required: true
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },
    status: {
        type: String,
        enum: ["Not Started", "In Progress", "Completed"],
        default: "Not Started"
    },
    assigned_to: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }]
    
}, {
    timestamps: true
});

const teamTaskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    content: [taskContentSchema]
}, {
    timestamps: true
});

const TeamTask = mongoose.model("TeamTask", teamTaskSchema);

export default  TeamTask;