import { parse } from "dotenv";
import TeamTask from "../models/teamTask.models.js";
import User from "../models/user.models.js";
import mongoose from "mongoose";
import validator from "validator";

const createTeam = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {name, maxMembers} = req.body;
        
        if (!name?.trim()) {
            return res.status(400).json({
                message: "Please provide a team name"
            });
        }

        if (typeof name !== "string" || !validator.isLength(name, {min: 3, max: 100})) {
            return res.status(400).json({
                message: "Team name must be a string between 3 and 100 characters"
            });
        }

        if (typeof maxMembers !== "number" || maxMembers < 2 || maxMembers > 20) {
            return res.status(400).json({
                message: "Invalid max members value. It should be a number between 2 and 20"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const team = new TeamTask({
            name,
            members: [user._id],
            maxMembers,
            createdBy: user._id,
        });
        await team.save();
        await user.save();

        res.status(201).json({
            message: "Team created successfully",
            team: {
                name: team.name,
                members: team.members,
                maxMembers: team.maxMembers,
                createdBy: team.createdBy,
            }
        });
    } catch (error) {
        console.error("Error during creating team:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const addMemberToTeam = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {teamId} = req.params;
        const {memberId} = req.body;

        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({
                message: "Invalid team ID"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).json({
                message: "Invalid member ID"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const team = await TeamTask.findOne({_id: teamId, createdBy: userId});
        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        if (team.members.includes(memberId)) {
            return res.status(400).json({
                message: "Member is already in the team"
            });
        }

        if (team.members.length >= team.maxMembers) {
            return res.status(400).json({
                message: "Team is full"
            });
        }

        if (!team.members.includes(memberId)) {
            team.members.push(memberId);
            await team.save();
        }

        res.status(200).json({
            message: "Member added to team successfully",
            team: {
                name: team.name,
                members: team.members,
                maxMembers: team.maxMembers,
                createdBy: team.createdBy,
            }
        });
    } catch (error) {
        console.error("Error during adding member to team:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
        
    }
}

const leaveTeam = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {teamId} = req.params;

        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({
                message: "Invalid team ID"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const team = await TeamTask.findById(teamId);
        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        // Mencegah pembuat tim untuk meninggalkan tim mereka sendiri
        if (team.createdBy.toString() === userId.toString()) {
            return res.status(400).json({
                message: "You cannot leave your own team"
            });
        }

        // Hapus user dari anggota tim
        team.members = team.members.filter((member) => member.toString() !== userId.toString());
        await team.save();

        res.status(200).json({
            message: "You have left the team successfully",
            team: {
                name: team.name,
                members: team.members,
                createdBy: team.createdBy,
            }
        }); 
    } catch (error) {
        console.error("Error during leaving team:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const editMaxMembers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {teamId} = req.params;
        const {maxMembers} = req.body;

        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({
                message: "Invalid team ID"
            });
        }

        if (typeof maxMembers !== "number" || maxMembers < 2 || maxMembers > 20) {
            return res.status(400).json({
                message: "Invalid max members value. It should be a number between 2 and 20."
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const team = await TeamTask.findOne({_id: teamId, createdBy: userId});
        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        if (!team.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to edit this team. Only the team creator can edit the max members value."
            });
        }

        if (team.maxMembers === maxMembers) {
            return res.status(400).json({
                message: "Max members value is already set to the current value"
            });
        }

        team.maxMembers = maxMembers;
        await team.save();

        res.status(200).json({
            message: "Max members value updated successfully",
            team: {
                name: team.name,
                members: team.members,
                maxMembers: team.maxMembers,
                createdBy: team.createdBy,
            }
        });
    } catch (error) {
        console.error("Error during editing max members:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const deleteTeam = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {teamId} = req.params;

        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({
                message: "Invalid team ID"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const team = await TeamTask.findOne({_id: teamId, createdBy: userId});
        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        if (!team.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to delete this team. Only the creator can delete the team."
            });
        }

        await TeamTask.deleteOne({_id: teamId});
        res.status(200).json({
            message: "Team deleted successfully"
        });
    } catch (error) {
        console.error("Error during deleting team:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const addTaskToTeam = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {teamId} = req.params;
        const {content} = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const team = await TeamTask.findById(teamId);
        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        if (!team.members.some(memberId => memberId.toString() === userId.toString())) {
            return res.status(403).json({
                message: "You are not a member of this team"
            });
        }

        let parsedContent;
        try {
            // Jika content bertipe String, lakukan parsing
            if (typeof content === "string") {
                parsedContent = JSON.parse(content);
            } else if (Array.isArray(content)) {
                // Jika content sudah berupa array, langsung gunakan
                parsedContent = content;
            } else {
                // Jika content bukan string atau array, kembalikan error
                return res.status(400).json({
                    message: "Invalid content format",
                    error: "Content should be a string or an array of objects"
                });
            }
            
            // parsedContent = JSON.parse(content);
            if (!Array.isArray(parsedContent) || parsedContent.length === 0) {
                return res.status(400).json({
                    message: "Invalid content format",
                    error: "Content should be a non-empty array of objects"
                });
            }

            const validContent = parsedContent.every(item => 
                item.title && item.description && item.due_date && item.priority && item.assigned_to
            );
            if (!validContent) {
                return res.status(400).json({
                    message: "Invalid content format",
                    error: "Each item in the content array should have title, description, due_date, priority, and assigned_to properties"
                });
            }
        } catch (error) {
            console.error("Error during parsing content:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: error.message || "An unexpected error occurred"
            });
        }

        parsedContent.forEach(item => {
            team.content.push({
                createdBy: userId,
                title: item.title,
                description: item.description,
                due_date: item.due_date,
                priority: item.priority,
                assigned_to: item.assigned_to
            })
        })
        await team.save();

        res.status(200).json({
            message: "Tasks added to team successfully",
            team: {
                name: team.name,
                members: team.members,
                maxMembers: team.maxMembers,
                createdBy: team.createdBy,
                content: team.content.map(task => ({
                    id: task._id,
                    title: task.title,
                    description: task.description,
                    due_date: task.due_date,
                    priority: task.priority,
                    status: task.status,
                    assigned_to: task.assigned_to
                }))
            }
        });
    } catch (error) {
        console.error("Error during adding task to team:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const editContent = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {teamId, taskId} = req.params;
        const updateFields = req.body;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID format"
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const team = await TeamTask.findOne({
            _id: teamId,
            "content._id": taskId
        });
        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        if (!team.members.some(memberId => memberId.toString() === userId.toString())) {
            return res.status(403).json({
                message: "You are not a member of this team"
            });
        }

        const content = team.content.find(task => task._id.toString() === taskId);
        if (!content) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        if (content.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to edit this task. Only the creator of the task can edit it."
            });
        }

        const updateObj = {};
        for (const [key, value] of Object.entries(updateFields)) {
            if (["title", "description", "due_date", "priority", "assigned_to"].includes(key)) {
                updateObj[`content.$.${key}`] = value;
            } else {
                return res.status(400).json({
                    message: "Invalid update field",
                    error: "Only title, description, due_date, priority, and assigned_to fields are allowed"
                });
            }
        }

        const updateContent = await TeamTask.findOneAndUpdate(
            {
                _id: teamId,
                "content._id": taskId
            },
            {
                $set: updateObj
            },
            {
                new: true
            }
        )

    if (!updateContent) {
        return res.status(404).json({
            message: "Team or task not found during update"
        });
    }

    res.status(200).json({
        message: "Content updated successfully",
        team: {
            name: updateContent.name,
            members: updateContent.members,
            maxMembers: updateContent.maxMembers,
            createdBy: updateContent.createdBy,
            content: updateContent.content.map(task => ({
                id: task._id,
                title: task.title,
                description: task.description,
                due_date: task.due_date,
                priority: task.priority,
                status: task.status,
                assigned_to: task.assigned_to
            }))
        }
    });
    } catch (error) {
        console.error("Error during editing content:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const editTaskStatus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {teamId, taskId} = req.params;
        const {status} = req.body;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID format"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const validStatus = ["Not Started", "In Progress", "Completed"];
        if (!validStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status",
                error: "Status must be one of: Not Started, In Progress, Completed"
            });
        }

        const team = await TeamTask.findOne({
            _id: teamId,
            "content._id": taskId
        });
        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        if (!team.members.some(memberId => memberId.toString() === userId.toString())) {
            return res.status(403).json({
                message: "You are not a member of this team"
            });
        }

        const content = team.content.find(task => task._id.toString() === taskId);
        if (!content) {
            return res.status(404).json({
                message: "Task not found"
            });
        }
        if (content.assigned_to.some(assignedId => assignedId.toString() === userId.toString())) {
            return res.status(403).json({
                message: "You are not authorized to edit this task status. Only the assigned user can edit it."
            });
        }

        if (content.status === status) {
            return res.status(200).json({
                message: "Task status is already set to the provided status"
            });
        }

        const updateStatus = await TeamTask.findOneAndUpdate(
            {
                _id: teamId,
                "content._id": taskId
            },
            {
                $set: {
                    "content.$.status": status
                }
            },
            {
                new: true
            }
        ).populate("content.assigned_to", "name email");
        if (!updateStatus) {
            return res.status(404).json({
                message: "Team or task not found during status update"
            });
        }

        // Format response
        // const updatedTask = updateStatus.content.find(task => task._id.toString() === taskId);

        res.status(200).json({
            message: "Task status updated successfully",
            task: updateStatus.content.map(task => ({
                id: task._id,
                title: task.title,
                description: task.description,
                due_date: task.due_date,
                priority: task.priority,
                status: task.status,
                assigned_to: task.assigned_to
            }))
        });
    } catch (error) {
        console.error("Error during editing task status:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const deleteTaskContent = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {teamId, taskId} = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const team = await TeamTask.findOne({
            _id: teamId,
            "content._id": taskId
        });
        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        if (!team.members.some(memberId => memberId.toString() === userId.toString())) {
            return res.status(403).json({
                message: "You are not a member of this team"
            });
        }

        const content = team.content.find(task => task._id.toString() === taskId);
        if (!content) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        if (content.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to delete this task. Only the creator of the task can delete it."
            });
        }

        const deleteContent = await TeamTask.findOneAndUpdate(
            {
                _id: teamId,
                "content._id": taskId
            },
            {
                $pull: {
                    "content": {
                        _id: taskId
                    }
                }
            },
            {
                new: true
            }
        );
        if (!deleteContent) {
            return res.status(404).json({
                message: "Team or task not found during deletion"
            });
        }

        res.status(200).json({
            message: "Task deleted successfully",
        });
    } catch (error) {
        console.error("Error during deleting task:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const listTeamTask = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {teamId} = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const team = await TeamTask.findOne({
            _id: teamId,
            "members": userId
        }).populate("content.assigned_to", "name email");
        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        if (!team.members.some(memberId => memberId.toString() === userId.toString())) {
            return res.status(403).json({
                message: "You are not a member of this team"
            });
        }

        res.status(200).json({
            message: "Team task list",
            team: {
                _id: team._id,
                name: team.name,
                description: team.description,
                members: team.members,
                createdBy: team.createdBy,
                content: team.content.map(task => ({
                    id: task._id,
                    title: task.title,
                    description: task.description,
                    due_date: task.due_date,
                    priority: task.priority,
                    status: task.status,
                    assigned_to: task.assigned_to
                }))
            }
        });
    } catch (error) {
        console.error("Error during listing team tasks:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export {createTeam, addMemberToTeam, leaveTeam, editMaxMembers, deleteTeam, addTaskToTeam, editContent, editTaskStatus, deleteTaskContent, listTeamTask};