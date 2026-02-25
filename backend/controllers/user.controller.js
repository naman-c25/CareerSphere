import User from "../models/users.model.js";
import bcrypt from "bcrypt";
import Profile from "../models/profile.model.js";
import ConnectionRequest from "../models/connections.model.js";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import mongoose from "mongoose";

export const activeCheck = async (req, res) => {
  return res.status(200).json({ message: "Running" });
};

export const convertUserDataTOPDF = async (userData) => {
  const doc = new PDFDocument();

  const outputPath = crypto.randomBytes(32).toString("hex") + ".pdf";
  const stream = fs.createWriteStream("uploads/" + outputPath);

  doc.pipe(stream);

  if (userData.userId.profilePicture && userData.userId.profilePicture !== "default.jpg") {
    try {
      doc.image(`uploads/${userData.userId.profilePicture}`, { align: "center", width: 100 });
    } catch (_) {}
  }

  doc.moveDown();
  doc.fontSize(20).font("Helvetica-Bold").text("Career Sphere Resume", { align: "center" });
  doc.moveDown();
  doc.fontSize(14).font("Helvetica").text(`Name: ${userData.userId.name}`);
  doc.fontSize(14).text(`Username: @${userData.userId.username}`);
  doc.fontSize(14).text(`Email: ${userData.userId.email}`);
  if (userData.bio) doc.fontSize(14).text(`Bio: ${userData.bio}`);
  if (userData.currentPost) doc.fontSize(14).text(`Current Position: ${userData.currentPost}`);

  if (userData.pastWork && userData.pastWork.length > 0) {
    doc.moveDown();
    doc.fontSize(16).font("Helvetica-Bold").text("Work Experience");
    doc.font("Helvetica");
    userData.pastWork.forEach((work) => {
      doc.fontSize(13).text(`• ${work.position} at ${work.company} (${work.years})`);
    });
  }

  if (userData.education && userData.education.length > 0) {
    doc.moveDown();
    doc.fontSize(16).font("Helvetica-Bold").text("Education");
    doc.font("Helvetica");
    userData.education.forEach((edu) => {
      doc.fontSize(13).text(`• ${edu.degree} in ${edu.fieldOfStudy} from ${edu.school}`);
    });
  }

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return outputPath;
};

export const register = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({
      email,
    });

    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      username,
    });

    await newUser.save();

    const profile = new Profile({ userId: newUser._id });
    await profile.save();

    return res.json({ message: "User Created" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) return res.status(404).json({ message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Credentials Invalid" });

    const token = crypto.randomBytes(32).toString("hex");

    await User.updateOne({ _id: user._id }, { token });
    return res.json({ token: token });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const uploadProfilePicture = async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profilePicture = req.file.filename;

    await user.save();

    return res.json({ message: "profile picture updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { token, ...newUserData } = req.body;

    const user = await User.findOne({ token: token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const { username, email } = newUserData;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      if (existingUser || String(existingUser._id) !== String(user._id)) {
        return res.status(400).json({ message: "User already exists" });
      }
    }

    Object.assign(user, newUserData);
    await user.save();

    return res.json({ message: "User Udated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserAndProfile = async (req, res) => {
  try {
    const token = req.body.token || req.query.token;

    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const userProfile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name email username profilePicture"
    );
    return res.json(userProfile);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProfileData = async (req, res) => {
  try {
    const { token, ...newProfileData } = req.body;

    const userProfile = await User.findOne({ token: token });

    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile_to_update = await Profile.findOne({
      userId: userProfile._id,
    });

    if (!profile_to_update) {
      return res.status(404).json({ message: "Profile not found" });
    }

    Object.assign(profile_to_update, newProfileData);
    await profile_to_update.save();

    return res.json({ message: "Profile updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllUserProfile = async (req, res) => {
  try {
    const profiles = await Profile.find().populate(
      "userId",
      "name username email password",
    );

    return res.json({ profiles });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const downloadProfile = async (req, res) => {
  try {
    const user_id = req.query.id;

    const userProfile = await Profile.findOne({ userId: user_id }).populate(
      "userId",
      "username, name, email, profilePicture",
    );

    let outputPath = await convertUserDataTOPDF(userProfile);

    return res.json({ message: outputPath });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const sendConnectionRequest = async (req, res) => {
  const { token, connectionId } = req.body;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (String(user._id) === String(connectionId)) {
      return res.status(400).json({ message: "Cannot connect with yourself" });
    }

    const connectionUser = await User.findById(connectionId);

    if (!connectionUser) {
      return res.status(404).json({ message: "Connection User not found" });
    }

    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { userId: user._id, connectionId: connectionUser._id },
        { userId: connectionUser._id, connectionId: user._id },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Request already exists" });
    }

    const request = new ConnectionRequest({
      userId: user._id,
      connectionId: connectionUser._id,
    });

    await request.save();

    return res.json({ message: "Request sent" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyConnectionsRequests = async (req, res) => {
  const {token} = req.body;

  try{
    const user = await User.findOne({token});

    if(!user){
      return res.status(404).json({message: "User not found"});
    }

    const connections = await ConnectionRequest.find({ userId: user._id })
      .populate("connectionId", "name username email profilePicture");

    return res.json({connections});

  }catch(err){
    return res.status(500).json({message: err.message});
  }
}

export const whatAreMyConnections = async (req, res) => {
  const {token} = req.body;

  try{
    const user = await User.findOne({token});

    if(!user){
      return res.status(404).json({message: "User not found"});
    }

    const connections = await ConnectionRequest.find({ connectionId: user._id })
      .populate("userId", "name email username profilePicture");

    return res.json(connections);

  }catch(e){
    return res.status(500).json({message: e.message});
  }
}

export const acceptConnectionRequest = async (req, res) => {

    const {token, requestId, action_type} = req.body;

  try{
    const user = await User.findOne({token});

    if(!user){
      return res.status(404).json({message: "User not found"});
    }

    const connection = await ConnectionRequest.findById(requestId);

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (String(connection.connectionId) !== String(user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (action_type === "accept") {
      connection.status_accepted = true;
      await connection.save();
      return res.json({ message: "Connection accepted" });
    } else {
      await connection.deleteOne();
      return res.json({ message: "Request rejected" });
    }

  }catch(e){
    return res.status(500).json({message: e.message});
  }
}

export const getUserProfileAndUserBasedOnUsername = async (req, res) => {
  const { username } = req.query;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const profile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name username email profilePicture"
    );

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    return res.json(profile);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};