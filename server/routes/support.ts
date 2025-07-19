import { RequestHandler } from "express";
import mongoose from "mongoose";
import SupportTicket from "../models/SupportTicket";
import User from "../models/User";

// Get user's support tickets
export const getUserTickets: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user._id;

    const tickets = await SupportTicket.find({ userId })
      .populate("userId", "fullName mobile email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error("Get user tickets error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new support ticket
export const createTicket: RequestHandler = async (req, res) => {
  try {
    const { subject, category, priority, description } = req.body;
    const userId = (req as any).user._id;

    // Validate required fields
    if (!subject || !description) {
      res.status(400).json({ message: "Subject and description are required" });
      return;
    }

    // Generate ticket ID
    const ticketCount = await SupportTicket.countDocuments();
    const ticketId = `TKT-${new Date().getFullYear()}-${String(ticketCount + 1).padStart(3, "0")}`;

    const ticket = new SupportTicket({
      ticketId,
      userId,
      subject: subject.trim(),
      category: category || "other",
      priority: priority || "medium",
      description: description.trim(),
      status: "open",
      responses: [],
    });

    await ticket.save();
    await ticket.populate("userId", "fullName mobile email");

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: ticket,
    });
  } catch (error: any) {
    console.error("Create ticket error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      res.status(400).json({ message: messages.join(", ") });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

// Add response to ticket (user)
export const addUserResponse: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const userId = (req as any).user._id;
    const user = (req as any).user;

    if (!message || !message.trim()) {
      res.status(400).json({ message: "Message is required" });
      return;
    }

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      userId,
    });

    if (!ticket) {
      res.status(404).json({ message: "Ticket not found" });
      return;
    }

    if (ticket.status === "closed") {
      res.status(400).json({ message: "Cannot respond to closed ticket" });
      return;
    }

    const response = {
      _id: new mongoose.Types.ObjectId(),
      message: message.trim(),
      isAdmin: false,
      respondedBy: user.fullName,
      respondedAt: new Date(),
    };

    ticket.responses.push(response);
    ticket.updatedAt = new Date();

    await ticket.save();

    res.json({
      success: true,
      message: "Response added successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Add user response error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all support tickets (admin)
export const getAllTickets: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { ticketId: { $regex: search, $options: "i" } },
      ];
    }

    const [tickets, totalTickets] = await Promise.all([
      SupportTicket.find(query)
        .populate("userId", "fullName mobile email")
        .populate("assignedTo", "fullName")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      SupportTicket.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTickets / limit),
          totalTickets,
          hasNext: page * limit < totalTickets,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all tickets error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add admin response to ticket
export const addAdminResponse: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const adminUser = (req as any).admin;

    if (!message || !message.trim()) {
      res.status(400).json({ message: "Message is required" });
      return;
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      res.status(404).json({ message: "Ticket not found" });
      return;
    }

    const response = {
      _id: new mongoose.Types.ObjectId(),
      message: message.trim(),
      isAdmin: true,
      respondedBy: adminUser?.fullName || "Admin",
      respondedAt: new Date(),
    };

    ticket.responses.push(response);
    ticket.updatedAt = new Date();

    // Auto-set status to in_progress if it was open
    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();
    await ticket.populate("userId", "fullName mobile email");

    res.json({
      success: true,
      message: "Response added successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Add admin response error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update ticket status (admin)
export const updateTicketStatus: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    const adminUser = (req as any).admin;

    if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      res.status(404).json({ message: "Ticket not found" });
      return;
    }

    ticket.status = status;
    ticket.updatedAt = new Date();

    if (status === "resolved" || status === "closed") {
      ticket.resolvedAt = new Date();
      ticket.resolvedBy = adminUser?._id as mongoose.Types.ObjectId;

      // Calculate resolution time in hours
      const createdTime = new Date(ticket.createdAt).getTime();
      const resolvedTime = new Date().getTime();
      ticket.resolutionTime = Math.floor(
        (resolvedTime - createdTime) / (1000 * 60 * 60),
      );
    }

    await ticket.save();
    await ticket.populate("userId", "fullName mobile email");

    res.json({
      success: true,
      message: `Ticket status updated to ${status}`,
      data: ticket,
    });
  } catch (error) {
    console.error("Update ticket status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign ticket to admin
export const assignTicket: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { assignedTo } = req.body;
    const adminUser = (req as any).admin;

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      res.status(404).json({ message: "Ticket not found" });
      return;
    }

    ticket.assignedTo = assignedTo || adminUser?._id;
    ticket.updatedAt = new Date();

    await ticket.save();
    await ticket.populate("userId", "fullName mobile email");
    await ticket.populate("assignedTo", "fullName");

    res.json({
      success: true,
      message: "Ticket assigned successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Assign ticket error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
