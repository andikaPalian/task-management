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
        if (team.createdBy.toString() === userId) {
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

        if (!team.createdBy.equals(userId)) {
            return res.status(403).json({
                message: "You are not authorized to edit this team"
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

        if (!team.createdBy.equals(userId)) {
            return res.status(403).json({
                message: "You are not authorized to delete this team"
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

export {createTeam, addMemberToTeam, leaveTeam, editMaxMembers, deleteTeam};