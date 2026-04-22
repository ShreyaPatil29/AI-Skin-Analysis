import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  photo: { type: String },
  // Additional user information
  firstName: { type: String },
  lastName: { type: String },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now },
  // User preferences
  preferences: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: 'light' }
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);


