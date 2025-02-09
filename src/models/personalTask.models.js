import mongoose from "mongoose";

const personalTaskSchema = new mongoose.Schema({
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
    }
}, {
    timestamps: true
});

const PersonalTask = mongoose.model("PersonalTask", personalTaskSchema);

export default PersonalTask;