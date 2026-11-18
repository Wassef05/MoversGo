const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, 'Message trop long (max 2000 caractères)'],
    },
    attachments: [
      {
        filePath: String,
        fileName: String,
        fileType: String,
        fileSize: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);

