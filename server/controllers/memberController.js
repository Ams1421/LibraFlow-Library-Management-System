
const mongoose = require("mongoose");
const Member = require("../models/Member");
const Transaction = require("../models/Transaction");

// GET /api/members
// List members with pagination and optional search.
exports.getMembers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search?.trim()) {
      const search = req.query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const regex = new RegExp(search, "i");

      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const [members, total] = await Promise.all([
      Member.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Member.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: members.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: members,
    });
  } catch (error) {
    console.error("Get members error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve members",
    });
  }
};

// GET /api/members/:id
exports.getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    const invalidId =
      error instanceof mongoose.Error.CastError;

    res.status(invalidId ? 400 : 500).json({
      success: false,
      message: invalidId ? "Invalid member ID" : "Failed to retrieve member",
    });
  }
};

// POST /api/members
exports.createMember = async (req, res) => {
  try {
    const { name, email, phone } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Member name and email are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingMember = await Member.findOne({
      email: normalizedEmail,
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: "A member with this email already exists",
      });
    }

    const member = await Member.create({
      name: name.trim(),
      email: normalizedEmail,
      ...(typeof phone === "string" ? { phone: phone.trim() } : {}),
    });

    res.status(201).json({
      success: true,
      message: "Member registered successfully",
      data: member,
    });
  } catch (error) {
    console.error("Create member error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A member with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to register member",
    });
  }
};

// PUT /api/members/:id
exports.updateMember = async (req, res) => {
  try {
    const updates = {};

    if (req.body?.name !== undefined) {
      if (
        typeof req.body.name !== "string" ||
        !req.body.name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Name must be a non-empty string",
        });
      }

      updates.name = req.body.name.trim();
    }

    if (req.body?.email !== undefined) {
      if (
        typeof req.body.email !== "string" ||
        !req.body.email.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Email must be a non-empty string",
        });
      }

      updates.email = req.body.email.trim().toLowerCase();
    }

    if (req.body?.phone !== undefined) {
      if (typeof req.body.phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Phone must be a string",
        });
      }

      updates.phone = req.body.phone.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update",
      });
    }

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  } catch (error) {
    console.error("Update member error:", error.message);

    const status =
      error.code === 11000
        ? 409
        : error.name === "ValidationError" ||
            error.name === "CastError"
          ? 400
          : 500;

    res.status(status).json({
      success: false,
      message:
        status === 409
          ? "A member with this email already exists"
          : status === 400
            ? error.message
            : "Failed to update member",
    });
  }
};

// DELETE /api/members/:id
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const activeTransaction = await Transaction.exists({
      member: member._id,
      status: "Issued",
    });

    if (activeTransaction) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete a member with active loans",
      });
    }

    await Member.deleteOne({ _id: member._id });

    return res.status(200).json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (error) {
    const invalidId = error instanceof mongoose.Error.CastError;

    return res.status(invalidId ? 400 : 500).json({
      success: false,
      message: invalidId
        ? "Invalid member ID"
        : "Failed to delete member",
    });
  }
};
