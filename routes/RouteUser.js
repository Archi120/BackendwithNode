const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Assistant, Doctor, PendingRequest, Appointment, Post, Comment, Notification } = require("../models/User");
const upload = require("../middleware/upload");

// Utility function for Haversine distance calculation
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in kilometers
  
  // Convert degrees to radians
  const toRad = (value) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance * 1000; // Convert to meters
};

// User Routes
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    res.status(200).json({
      user_id: user.user_id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/user/register", upload.single('profile_picture'), async (req, res) => {
  try {
    const { name, email, password, address, dob, gender, number } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      address,
      dob: dob ? new Date(dob) : null,
      gender,
      number,
      profile_picture: req.file ? req.file.path : null
    });
    
    await user.save();
    
    res.status(201).json({
      message: "User registered successfully",
      user_id: user.user_id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Assistant Routes
router.post("/assistant/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", { email, password });

    const assistant = await Assistant.findOne({ email });
    if (!assistant) {
      console.log("Assistant not found");
      return res.status(404).json({ error: "Assistant not found" });
    }

    const isMatch = await bcrypt.compare(password, assistant.password);
    if (!isMatch) {
      console.log("Invalid credentials");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({
      assistant_id: assistant.assistant_id,
      name: assistant.name,
      email: assistant.email
    });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ error: err.message });
  }
});
router.post("/assistant/register", upload.fields([
  { name: 'profile_picture', maxCount: 1 },
  { name: 'id_proof', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, email, password, dob, gender, number, address, latitude, longitude } = req.body;
    // Check for existing assistant
    const existingAssistant = await Assistant.findOne({ email });
    if (existingAssistant) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Handle optional file uploads
    const profile_picture = req.files?.profile_picture?.[0]?.path || null;
    const id_proof = req.files?.id_proof?.[0]?.path || null;

    // Create assistant
    const assistant = new Assistant({
      name,
      email,
      password,
      dob: dob ? new Date(dob) : null,
      gender,
      number,
      address,
      latitude,
      longitude,
      profile_picture,
      id_proof
    });

    await assistant.save();

    res.status(201).json({
      assistant_id: assistant.assistant_id || assistant._id, // fallback in case schema uses _id
      name: assistant.name,
      email: assistant.email
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/assistant/all", async (req, res) => {
  try {
    const assistants = await Assistant.find({ status: 'available' });
    
    if (!assistants.length) {
      return res.status(204).json({ message: "No assistants found" });
    }
    
    const assistantList = assistants.map(assistant => ({
      assistant_id: assistant.assistant_id,
      name: assistant.name,
      latitude: assistant.latitude,
      longitude: assistant.longitude,
      profile_picture: `${req.protocol}://${req.get('host')}/${assistant.profile_picture}`,
      number: assistant.number
    }));
    
    res.status(200).json(assistantList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Doctor Routes
router.post("/doctor/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    res.status(200).json({
      doctor_id: doctor.doctor_id,
      name: doctor.name,
      email: doctor.email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/doctor/register", upload.fields([
  { name: 'profile_picture', maxCount: 1 },
  { name: 'id_proof', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, email, password, gender, dob, reg_no, specialization, experience, address } = req.body;
    console.log(password);
    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(409).json({ error: "Email already exists" });
    }
    
    // Create new doctor
    const doctor = new Doctor({
      name,
      email,
      password,
      gender,
      dob: dob ? new Date(dob) : null,
      reg_no,
      specialization,
      experience,
      address,
      profile_picture: req.files && req.files.profile_picture ? req.files.profile_picture[0].path : null,
      id_proof: req.files && req.files.id_proof ? req.files.id_proof[0].path : null
    });
    
    await doctor.save();
    
    res.status(201).json({
      message: "Doctor registered successfully",
      doctor_id: doctor.doctor_id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/doctor/all", async (req, res) => {
  try {
    const doctors = await Doctor.find();
    
    if (!doctors.length) {
      return res.status(204).json({ message: "No doctors found" });
    }
    
    const doctorList = doctors.map(doctor => ({
      doctor_id: doctor.doctor_id,
      name: doctor.name,
      profile_picture: `${req.protocol}://${req.get('host')}/${doctor.profile_picture}`,
      gender: doctor.gender,
      specialization: doctor.specialization,
      experience: doctor.experience,
      address: doctor.address
    }));
    
    res.status(200).json(doctorList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Pending Request Routes
router.post("/pending/send", async (req, res) => {
  try {
    const { userId, assistantId, category, description, latitude, longitude } = req.body;
    
    // Find assistant and check availability
    const assistant = await Assistant.findOne({ assistant_id: assistantId });
    if (!assistant || assistant.status !== 'available') {
      return res.status(400).json({ error: "Assistant is not available" });
    }
    
    // Find user
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Create pending request
    const request = new PendingRequest({
      user: user._id,
      assistant: assistant._id,
      category,
      description,
      latitude,
      longitude,
      status: 'pending'
    });
    
    await request.save();
    
    res.status(201).json({
      message: "Request sent successfully",
      requestId: request.request_id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/pending/requests/user/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const pendingRequests = await PendingRequest.find({ user: user._id })
      .populate('user', 'user_id name')
      .populate('assistant', 'assistant_id name');
    
    const requestList = pendingRequests.map(req => ({
      requestId: req.request_id,
      userId: req.user.user_id,
      userName: req.user.name,
      category: req.category,
      description: req.description,
      latitude: req.latitude,
      longitude: req.longitude,
      created_at: req.created_at,
      status: req.status
    }));
    
    res.status(200).json(requestList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/pending/requests/:assistantId", async (req, res) => {
  try {
    const assistant = await Assistant.findOne({ assistant_id: req.params.assistantId });
    if (!assistant) {
      return res.status(404).json({ error: "Assistant not found" });
    }
    
    const pendingRequests = await PendingRequest.find({ assistant: assistant._id })
      .populate('user', 'user_id name');
    
    const requestList = pendingRequests.map(req => ({
      requestId: req.request_id,
      userId: req.user.user_id,
      userName: req.user.name,
      category: req.category,
      description: req.description,
      latitude: req.latitude,
      longitude: req.longitude,
      created_at: req.created_at,
      status: req.status
    }));
    
    res.status(200).json(requestList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pending/confirm", async (req, res) => {
  try {
    const { requestId, assistantId } = req.body;
    
    const request = await PendingRequest.findOne({ request_id: requestId });
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    const assistant = await Assistant.findOne({ assistant_id: assistantId });
    if (!assistant) {
      return res.status(404).json({ error: "Assistant not found" });
    }
    
    request.status = 'accepted';
    request.assistant = assistant._id;
    await request.save();
    
    assistant.status = 'busy';
    await assistant.save();
    
    res.status(200).json({ message: "Request confirmed" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/pending/completed", async (req, res) => {
  try {
    const { requestId, assistantId } = req.body;
    
    console.log("Completing request:", { requestId, assistantId });
    
    if (!requestId || !assistantId) {
      return res.status(400).json({ error: "requestId and assistantId are required" });
    }
    
    // First find the assistant to verify they exist
    const assistant = await Assistant.findOne({ assistant_id: assistantId });
    if (!assistant) {
      return res.status(404).json({ error: "Assistant not found" });
    }
    
    // Find the request - try different approaches to find it
    let request = await PendingRequest.findOne({ request_id: requestId });
    
    // If not found by request_id, try finding by _id
    if (!request && requestId.match(/^[0-9a-fA-F]{24}$/)) {
      request = await PendingRequest.findById(requestId);
    }
    
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    // Check if the request is already completed
    if (request.status === 'completed') {
      return res.status(400).json({ error: "Request is already marked as completed" });
    }
    
    // Ensure the request belongs to this assistant
    if (request.assistant.toString() !== assistant._id.toString()) {
      return res.status(403).json({ error: "This request does not belong to the specified assistant" });
    }
    
    // Update request status
    request.status = 'completed';
    await request.save();
    
    // Update assistant status
    assistant.status = 'available';
    await assistant.save();
    
    console.log("Request completed successfully:", {
      requestId: request.request_id || request._id,
      assistantId: assistant.assistant_id,
      requestStatus: request.status,
      assistantStatus: assistant.status
    });
    
    res.status(200).json({ 
      message: "Request completed successfully",
      request_status: request.status,
      assistant_status: assistant.status
    });
  } catch (err) {
    console.error("Error completing request:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/pending/notification/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const pendingRequests = await PendingRequest.find({ 
      user: user._id, 
      status: 'accepted',
      notified: false
    }).populate('assistant', 'assistant_id name');
    
    if (!pendingRequests.length) {
      return res.status(204).json({ message: "No new notifications" });
    }
    
    const acceptedRequests = pendingRequests.map(req => {
      // Mark as notified
      req.notified = true;
      req.save();
      
      return {
        id: req._id,
        latitude: req.latitude,
        longitude: req.longitude,
        assistantId: req.assistant ? req.assistant.assistant_id : null,
        assistantName: req.assistant ? req.assistant.name : null
      };
    });
    
    res.status(200).json(acceptedRequests);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/pending/check/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const pendingRequests = await PendingRequest.find({ user: user._id })
      .populate('assistant', 'assistant_id name');
    
    if (!pendingRequests.length) {
      return res.status(204).json({ message: "No requests found" });
    }
    
    const requestList = pendingRequests.map(req => ({
      id: req._id,
      status: req.status,
      latitude: req.latitude,
      longitude: req.longitude,
      assistantId: req.assistant ? req.assistant.assistant_id : null,
      assistantName: req.assistant ? req.assistant.name : null
    }));
    
    res.status(200).json(requestList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Appointment Routes
router.post("/doctor/appointment/add", async (req, res) => {
  try {
    const { user_id, doctor_id, date, time } = req.body;
    
    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const doctor = await Doctor.findOne({ doctor_id });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    
    // Combine date and time
    const appointmentTime = new Date(`${date}T${time}`);
    
    const appointment = new Appointment({
      user: user._id,
      doctor: doctor._id,
      appointment_time: appointmentTime,
      status: 'pending'
    });
    
    await appointment.save();
    
    res.status(201).json({
      message: "Appointment added successfully",
      appointment_id: appointment.appointment_id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/doctor/appointment/confirm", async (req, res) => {
  try {
    const { appointment_id, doctor_id } = req.body;
    
    const appointment = await Appointment.findOne({ appointment_id });
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    const doctor = await Doctor.findOne({ doctor_id });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    
    appointment.status = 'confirmed';
    await appointment.save();
    
    res.status(200).json({ message: "Appointment confirmed" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/doctor/appointment/user/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const appointments = await Appointment.find({ user: user._id })
      .populate('doctor', 'doctor_id name');
    
    if (!appointments.length) {
      return res.status(204).json({ message: "No appointments found" });
    }
    
    const appointmentList = appointments.map(appointment => ({
      appointment_id: appointment.appointment_id,
      doctor_id: appointment.doctor.doctor_id,
      doctor_name: appointment.doctor.name,
      date: appointment.appointment_time.toISOString().split('T')[0],
      time: appointment.appointment_time.toTimeString().split(' ')[0].substring(0, 5),
      status: appointment.status
    }));
    
    res.status(200).json(appointmentList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/doctor/appointment/doctor/:doctorId", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctor_id: req.params.doctorId });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    
    const appointments = await Appointment.find({ doctor: doctor._id })
      .populate('user', 'user_id name');
    
    if (!appointments.length) {
      return res.status(204).json({ message: "No appointments found" });
    }
    
    const appointmentList = appointments.map(appointment => ({
      appointment_id: appointment.appointment_id,
      user_id: appointment.user.user_id,
      user_name: appointment.user.name,
      date: appointment.appointment_time.toISOString().split('T')[0],
      time: appointment.appointment_time.toTimeString().split(' ')[0].substring(0, 5),
      status: appointment.status
    }));
    
    res.status(200).json(appointmentList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Social Media Routes
router.post("/user/feed/post", upload.single('image'), async (req, res) => {
  try {
    const { user_id, content } = req.body;
    
    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const post = new Post({
      user: user._id,
      content,
      media: req.file ? req.file.path : null
    });
    
    await post.save();
    
    res.status(201).json({
      message: "Post added successfully",
      post_id: post._id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/user/feed/comment", async (req, res) => {
  try {
    const { user_id, post_id, content } = req.body;
    
    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const post = await Post.findById(post_id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    const comment = new Comment({
      user: user._id,
      post: post._id,
      content
    });
    
    await comment.save();
    
    // Create notification for post owner
    const notification = new Notification({
      user: post.user,
      content: `${user.name} commented on your post`,
      is_read: false,
      post: post._id
    });
    
    await notification.save();
    
    res.status(201).json({
      message: "Comment added successfully",
      comment_id: comment._id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/user/notifications/all/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const notifications = await Notification.find({ 
      user: user._id,
      is_read: false
    }).populate('post');
    
    if (!notifications.length) {
      return res.status(204).json({ message: "No notifications found" });
    }
    
    const notificationList = notifications.map(notification => ({
      notification_id: notification._id,
      content: notification.content,
      created_at: notification.created_at,
      post_id: notification.post ? notification.post._id : null
    }));
    
    res.status(200).json(notificationList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/user/feed/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'user_id name');
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    const comments = await Comment.find({ post: post._id })
      .populate('user', 'user_id name');
    
    const commentList = comments.map(comment => ({
      comment_id: comment._id,
      user_id: comment.user.user_id,
      user_name: comment.user.name,
      content: comment.content,
      created_at: comment.created_at
    }));
    
    res.status(200).json({
      post_id: post._id,
      user_id: post.user.user_id,
      user_name: post.user.name,
      content: post.content,
      image: post.media ? `${req.protocol}://${req.get('host')}/${post.media}` : null,
      created_at: post.created_at,
      comments: commentList
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/user/feed/all/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const posts = await Post.find()
      .populate('user', 'user_id name profile_picture')
      .sort({ created_at: -1 });
    
    const postList = await Promise.all(posts.map(async post => {
      const comments = await Comment.find({ post: post._id })
        .populate('user', 'user_id name profile_picture');
      
      const commentList = comments.map(comment => ({
        comment_id: comment._id,
        user_id: comment.user.user_id,
        user_name: comment.user.name,
        user_image: `${req.protocol}://${req.get('host')}/${comment.user.profile_picture}`,
        content: comment.content,
        created_at: comment.created_at
      }));
      
      // Get like count and check if user liked the post
      const likeCount = post.liked_by.length;
      const userLiked = post.liked_by.some(id => id.toString() === userId);
      
      return {
        post_id: post._id,
        user_id: post.user.user_id,
        user_name: post.user.name,
        user_image: `${req.protocol}://${req.get('host')}/${post.user.profile_picture}`,
        content: post.content,
        image: post.media ? `${req.protocol}://${req.get('host')}/${post.media}` : null,
        created_at: post.created_at,
        comments: commentList,
        likes: likeCount,
        liked: userLiked
      };
    }));
    
    res.status(200).json(postList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/user/feed/like", async (req, res) => {
  try {
    const { user_id, post_id } = req.body;
    
    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const post = await Post.findById(post_id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    // Check if user already liked the post
    const alreadyLiked = post.liked_by.includes(user._id);
    
    if (alreadyLiked) {
      // Unlike: remove user from liked_by
      post.liked_by = post.liked_by.filter(id => id.toString() !== user._id.toString());
    } else {
      // Like: add user to liked_by
      post.liked_by.push(user._id);
      
      // Create notification
      const notification = new Notification({
        user: post.user,
        content: `${user.name} liked your post`,
        is_read: false,
        post: post._id
      });
      
      await notification.save();
    }
    
    await post.save();
    
    res.status(200).json({ message: "Successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// router.post("/assistant/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const assistant = await Assistant.findOne({ email });
//     if (!assistant) {
//       return res.status(404).json({ error: "Assistant not found" });
//     }

//     const isMatch = await assistant.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     res.status(200).json({
//       assistant_id: assistant.assistant_id,
//       name: assistant.name,
//       email: assistant.email
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });



module.exports = router;