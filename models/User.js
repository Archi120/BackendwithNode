const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    unique: true,
    required: true,
    default: () => Math.floor(Math.random() * 1000000)
  },
  name: {
    type: String,
    required: true,
    maxLength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: null
  },
  dob: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    maxLength: 50,
    default: null
  },
  number: {
    type: String,
    maxLength: 20,
    default: null
  },
  profile_picture: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Assistant Schema
const assistantSchema = new mongoose.Schema({
  assistant_id: {
    type: Number,
    unique: true,
    required: true,
    default: () => Math.floor(Math.random() * 1000000)
  },
  name: {
    type: String,
    required: true,
    maxLength: 255
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxLength: 255
  },
  password: {
    type: String,
    required: true
  },
  dob: Date,
  gender: String,
  number: String,
  address: String,
  created: {
    type: Date,
    default: Date.now
  },
  profile_picture: String,
  id_proof: String,
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'available'
  }
});

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  doctor_id: {
    type: Number,
    unique: true,
    required: true,
    default: () => Math.floor(Math.random() * 1000000)
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  dob: Date,
  profile_picture: String,
  reg_no: {
    type: String,
    required: true
  },
  id_proof: String,
  specialization: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  }
});

// Pending Request Schema
const pendingRequestSchema = new mongoose.Schema({
  request_id: {
    type: Number,
    unique: true,
    required: true,
    default: () => Math.floor(Math.random() * 1000000)
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  latitude: Number,
  longitude: Number,
  updated_at: Date,
  assistant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assistant'
  },
  status: String,
  notified: {
    type: Boolean,
    default: false
  }
});

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  appointment_id: {
    type: Number,
    unique: true,
    required: true,
    default: () => Math.floor(Math.random() * 1000000)
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointment_time: {
    type: Date,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true
  }
});

// Post Schema
const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  media: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  liked_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Comment Schema
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  is_read: {
    type: Boolean,
    default: false
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }
});

// Password hashing middleware for all schemas that have passwords
[userSchema, assistantSchema, doctorSchema].forEach(schema => {
  schema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  schema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };
});

// Create models
const User = mongoose.model('User', userSchema);
const Assistant = mongoose.model('Assistant', assistantSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const PendingRequest = mongoose.model('PendingRequest', pendingRequestSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
  User,
  Assistant,
  Doctor,
  PendingRequest,
  Appointment,
  Post,
  Comment,
  Notification
};