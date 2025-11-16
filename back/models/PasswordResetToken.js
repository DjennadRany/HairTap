import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    consumedAt: Date
  },
  {
    timestamps: true
  }
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;
