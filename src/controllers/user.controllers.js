import User from "../models/user.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import PersonalTask from "../models/personalTask.models.js";
import TeamTask from "../models/teamTask.models.js";

const registerUser = async (req, res) => {
    try {
        const {name, email, password} = req.body;
        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({message: "All fields are required"});
        }

        if (typeof name !== "string" || !validator.isLength(name, {min: 3, max: 30})) {
            return res.status(400).json({
                message: "Name must be a string and between 3 and 30 characters"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Invalid email address"
            });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: "User created successfully",
            user: userResponse,
        });
    } catch (error) {
        console.error("Error during user registration:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Invalid email address"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });
        if (!user) {
            return res.status(400).json({
                message: "User doesn't exist"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({
                _id: user._id
            }, process.env.JWT_SECRET, {expiresIn: "1d"});
            user.password = undefined;
            return res.status(200).json({
                message: "Login successful",
                user: {
                    token,
                    user
                }
            });
        } else {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }
    } catch (error) {
        console.error("Error during user login:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const userDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {type, status, page = 1, limit = 10} = req.query;
        const query = {user: userId};

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const userResponse = user.toObject();
        delete userResponse.password;

        const validTaskTypes = ["personal", "team"];
        if (type && !validTaskTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid task type"
            });
        }

        const validTaskStatus = ["Not Started", "In Progress", "Completed"];
        if (status && !validTaskStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid task status"
            });
        }

        if (type === "personal") {
            let queryPersonal = {createdBy: userId};
            if (status) {
                queryPersonal.status = status;
            }

            const totalPersonalTasks = await PersonalTask.countDocuments(queryPersonal);

            const personalTasks = await PersonalTask.find(queryPersonal).skip(skip).limit(limitNum);

            // Statistik keseluruhan personal task 
            const completedCount = await PersonalTask.countDocuments({
                createdBy: userId,
                status: "Completed"
            });

            const inProgressCount = await PersonalTask.countDocuments({
                createdBy: userId,
                status: "In Progress"
            });

            const notStartedCount = await PersonalTask.countDocuments({
                createdBy: userId,
                status: "Not Started"
            });

            return res.status(200).json({
                message: "Personal tasks retrieved successfully",
                data: {
                    total: totalPersonalTasks,
                    personalTasks,
                    stats: {
                        completed: completedCount,
                        inProgress: inProgressCount,
                        notStarted: notStartedCount
                    }
                }
            });
        } else if (type === "team") {
            const matchStage = {"content.assigned_to": userId};

            if (status) {
                matchStage["content.status"] = status;
            }

            const teamAggregation = await TeamTask.aggregate([
                {$match: {"content.assigned_to": userId}},
                {$unwind: "$content"},
                // Jika status difilter, maka tambahkan tahap match kedua
                {$match: status ? {"content.status": status} : {}},
                {$group: {_id: null, count: {$sum: 1}}},
            ]);

            const totalTeamTasks = teamAggregation.length > 0 ? teamAggregation[0].count : 0;

            // Mengambil data team tasks:
            // Karena team tasks menyimpan beberapa task di dalam array, "content"
            // Kita ambil semua team task yang memiliki assigned_to yang sesuai dengan userId lalu filter kontennya
            let teamTasksData = await TeamTask.find({"content.assigned_to": userId});
            teamTasksData = teamTasksData.map((teamTask) => {
                const filteredContent = teamTask.content.filter((task) => 
                task.assigned_to.toString() === userId && (status ? task.status === status : true));
                return {...teamTask.toObject(), content: filteredContent};
            });

            // Hanya mengambil team task yang yang memiliki setidaknya 1 task (setelah di filter)
            teamTasksData = teamTasksData.filter((teamTask) => teamTask.content.length > 0);

            // Terapkan pagination secara manual
            const paginatedTeamTasks = teamTasksData.slice(skip, skip + limitNum);

            // Menghitung statistik status untuk team tasks (keseluruhan, tanpa filter)
            const teamStatusAggregation = await TeamTask.aggregate([
                {$match: {"content.assigned_to": userId}},
                {$unwind: "$content"},
                {$group: {_id: "$content.status", count: {$sum: 1}}},
            ]);

            // Inisiasi statistik
            let teamStats = {
                "Completed": 0,
                "In Progress": 0,
                "Not Started": 0,
            };
            teamStatusAggregation.forEach((item) => {
                teamStats[item._id] = item.count;
            });

            return res.status(200).json({
                message: "Team tasks retrieved successfully",
                data: {
                    total: totalTeamTasks,
                    teamTasks: paginatedTeamTasks,
                    stats: teamStats
                }
            });
        }

        // Jika tidak ada query type, maka total keseluruhan tasks dari personal dan team tasks
        // Menghitung total personal tasks
        const totalPersonal = await PersonalTask.countDocuments({createdBy: userId});

        // Menghitung total team tasks melalui aggregate (jumlah total task dari semua content)
        const teamAggregate = await TeamTask.aggregate([
            {$match: {"content.assigned_to": userId}},
            {$unwind: "$content"},
            {$group: {_id: null, count: {$sum: 1}}},
        ]);
        const totalTeam = teamAggregate.length > 0 ? teamAggregate[0].count : 0;

        const totalTasks = totalPersonal + totalTeam;

        // Statistik untuk personal tasks
        const personalStats = {
            completed: await PersonalTask.countDocuments({
                createdBy: userId,
                status: "Completed"
            }),
            inProgress: await PersonalTask.countDocuments({
                createdBy: userId,
                status: "In Progress"
            }),
            notStarted: await PersonalTask.countDocuments({
                createdBy: userId,
                status: "Not Started"
            })
        };

        // Statistik untuk team stats
        const teamStatsAggregate = await TeamTask.aggregate([
            {$match: {"content.assigned_to": userId}},
            {$unwind: "$content"},
            {$group: {_id: "$content.status", count: {$sum: 1}}},
        ]);
        let teamStats = {
            "Completed": 0,
            "In Progress": 0,
            "Not Started": 0,
        };
        teamStatsAggregate.forEach((item) => {
            teamStats[item._id] = item.count;
        });

        res.status(200).json({
            message: "User dashboard retrieved successfully",
            data: {
                user: userResponse,
                tasks: {
                    total: totalTasks,
                    personal: {
                        total: totalPersonal,
                        stats: personalStats
                    },
                    team: {
                        total: totalTeam,
                        stats: teamStats
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error retrieving user dashboard:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message || "An error occurred while retrieving user dashboard"
        });
    }
}

export {registerUser, loginUser, userDashboard};