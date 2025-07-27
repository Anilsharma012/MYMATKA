import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicket extends Document {
  ticketId: string;
  userId: mongoose.Types.ObjectId;
  subject: string;
  category: "payment" | "account" | "technical" | "game" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  description: string;
  attachments?: string[];
  responses: {
    _id: mongoose.Types.ObjectId;
    message: string;
    isAdmin: boolean;
    respondedBy: string;
    respondedAt: Date;
  }[];
  assignedTo?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionTime?: number; // in hours
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema: Schema = new Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: ["payment", "account", "technical", "game", "other"],
      default: "other",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    attachments: [
      {
        type: String,
        trim: true,
      },
    ],
    responses: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        message: {
          type: String,
          required: true,
          trim: true,
          maxlength: 1000,
        },
        isAdmin: {
          type: Boolean,
          default: false,
        },
        respondedBy: {
          type: String,
          required: true,
          trim: true,
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolutionTime: {
      type: Number, // in hours
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for better query performance
SupportTicketSchema.index({ userId: 1, status: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
SupportTicketSchema.index({ category: 1, status: 1, createdAt: -1 });
SupportTicketSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

// Text index for search functionality
SupportTicketSchema.index({
  subject: "text",
  description: "text",
  ticketId: "text",
});

export default mongoose.model<ISupportTicket>(
  "SupportTicket",
  SupportTicketSchema,
);
