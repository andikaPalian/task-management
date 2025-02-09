import PersonalTask from "../models/personalTask.models.js";
import TeamTask from "../models/teamTask.models.js";
import User from "../models/user.models.js";
import mongoose from "mongoose";

const createPersonalTask = async (req, res) => {
    try {
        const userId = req.user.userId
        const {title, description, due_date, priority} = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!title?.trim() || !description?.trim() || !due_date) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (typeof title !== "string" || !validator.isLength(title, {min: 3, max: 100})) {
            return res.status(400).json({
                message: "Title must be a string between 3 and 100 characters"
            });
        }

        if (typeof description !== "string" || !validator.isLength(description, {min: 3, max: 500})) {
            return res.status(400).json({
                message: "Description must be a string between 3 and 500 characters"
            });
        }

        if (!validator.isDate(due_date)) {
            return res.status(400).json({
                message: "Due date must be a valid date"
            });
        }

        const validPriority = ["Low", "Medium", "High"];
        if (!validPriority.includes(priority)) {
            return res.status(400).json({
                message: "Invalid priority value"
            });
        }

        const newPersonalTask = new PersonalTask({
            title,
            description,
            due_date,
            priority,
            status: "Not Started"
        });
        await newPersonalTask.save();

        res.status(201).json({
            message: "Personal task created successfully",
            task: {
                title: newPersonalTask.title,
                description: newPersonalTask.description,
                due_date: newPersonalTask.due_date,
                priority: newPersonalTask.priority,
                status: newPersonalTask.status
            }
        });
    } catch (error) {
        console.error("Error during creating personal task:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const updatePersonalTaskStatus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const taskId = req.params;
        const {status} = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }

        const validStatus = ["Not Started", "In Progress", "Completed"];
        if (!validStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status value. Status value must be one of the following: Not Started, In Progress, Completed"
            });
        }

        const personalTask = await PersonalTask.findById(taskId);
        if (!personalTask) {
            return res.status(404).json({
                message: "Personal task not found"
            });
        }

        personalTask.status = status;
        await personalTask.save();

        res.status(200).json({
            message: "Personal task status updated successfully",
            task: {
                title: personalTask.title,
                description: personalTask.description,
                due_date: personalTask.due_date,
                priority: personalTask.priority,
                status: personalTask.status
            }
        });
    } catch (error) {
        console.error("Error during updating personal task status:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const updatePersonalTask = async (req, res) => {
    try {
        const userId = req.user.userId;
        const taskId = req.params;
        const {title, description, due_date, priority} = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }

        if (!title?.trim() || !description?.trim() || !due_date) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (typeof title !== "string" || !validator.isLength(title, {min: 3, max: 100})) {
            return res.status(400).json({
                message: "Title must be a string between 3 and 100 characters"
            });
        }

        if (typeof description !== "string" || !validator.isLength(description, {min: 3, max: 500})) {
            return res.status(400).json({
                message: "Description must be a string between 3 and 500 characters"
            });
        }

        if (!validator.isDate(due_date)) {
            return res.status(400).json({
                message: "Due date must be a valid date"
            });
        }

        const validPriority = ["Low", "Medium", "High"];
        if (!validPriority.includes(priority)) {
            return res.status(400).json({
                message: "Invalid priority value"
            });
        }

        const personalTask = await PersonalTask.findById(taskId);
        if (!personalTask) {
            return res.status(404).json({
                message: "Personal task not found"
            });
        }

        personalTask.title = title;
        personalTask.description = description;
        personalTask.due_date = due_date;
        personalTask.priority = priority;
        await personalTask.save();

        res.status(200).json({
            message: "Personal task updated successfully",
            task: {
                title: personalTask.title,
                description: personalTask.description,
                due_date: personalTask.due_date,
                priority: personalTask.priority,
                status: personalTask.status
            }
        });
    } catch (error) {
        console.error("Error during updating personal task:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const deletePersonalTask = async (req, res) => {
    try {
        const userId = req.user.userId;
        const taskId = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                messsage: "Invalid task ID"
            });
        }

        await PersonalTask.findByIdAndDelete(taskId);

        res.status(200).json({
            message: "Personal task deleted successfully",
        });
    } catch (error) {
        console.error("Error during deleting personal task:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const listPersonalTasks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {status} = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const validStatus = ["Not Started", "In Progress", "Completed"];
        if (!validStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status value"
            });
        }

        if (status) {
            const personalTask = await PersonalTask.find({user: userId, status: status});
            if (!personalTask) {
                return res.status(404).json({
                    message: "Personal task not found"
                });
            }
        }

        const personalTask = await PersonalTask.find({user: userId});
        if (!personalTask) {
            return res.status(404).json({
                message: "Personal task not found"
            });
        }

        res.status(200).json({
            message: "Personal task listed successfully",
            tasks: {
                title: personalTask.title,
                description: personalTask.description,
                due_date: personalTask.due_date,
                priority: personalTask.priority,
                status: personalTask.status
            }
        });
    } catch (error) {
        console.error("Error during listing personal tasks:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export {createPersonalTask, updatePersonalTaskStatus, updatePersonalTask, deletePersonalTask, listPersonalTasks};