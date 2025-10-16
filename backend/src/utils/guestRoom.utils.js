import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Group } from "../models/group.model.js";
import { User } from "../models/user.model.js";

const parseMinutes = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const GUEST_INVITE_TTL_MINUTES = parseMinutes(process.env.GUEST_INVITE_TTL_MINUTES, 30);
const GUEST_INACTIVITY_TIMEOUT_MINUTES = parseMinutes(process.env.GUEST_INACTIVITY_TIMEOUT_MINUTES, 60);
const GUEST_INVITE_SECRET = process.env.GUEST_INVITE_SECRET || process.env.ACCESS_TOKEN_SECRET;

const makeNonce = () => crypto.randomBytes(12).toString("hex");

const signGuestInviteToken = ({ roomId, nonce }) => {
  const expiresIn = `${GUEST_INVITE_TTL_MINUTES}m`;

  return jwt.sign(
    {
      roomId,
      nonce,
      purpose: "guest-room-invite",
    },
    GUEST_INVITE_SECRET,
    { expiresIn }
  );
};

const verifyGuestInviteToken = (token) => {
  const payload = jwt.verify(token, GUEST_INVITE_SECRET);
  if (!payload || payload.purpose !== "guest-room-invite") {
    throw new Error("Invalid guest invite token");
  }
  return payload;
};

const buildGuestInviteLink = (token, baseUrl = null) => {
  const base = (baseUrl || process.env.CORS_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
  return `${base}/?guestInvite=${encodeURIComponent(token)}`;
};

const getGuestInviteExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + GUEST_INVITE_TTL_MINUTES);
  return expiresAt;
};

const markGuestRoomActive = async (roomId) => {
  if (!roomId) {
    return;
  }

  await Group.findByIdAndUpdate(roomId, {
    $set: { guestLastActiveAt: new Date() },
  });
};

const deleteGuestRoomAndUsers = async (roomId) => {
  const room = await Group.findById(roomId).select("members isGuestRoom");
  if (!room || !room.isGuestRoom) {
    return;
  }

  await User.deleteMany({ _id: { $in: room.members }, isGuest: true });
  await Group.deleteOne({ _id: roomId, isGuestRoom: true });
};

const cleanupExpiredGuestRooms = async () => {
  const now = new Date();
  const staleThreshold = new Date(
    now.getTime() - GUEST_INACTIVITY_TIMEOUT_MINUTES * 60 * 1000
  );

  const staleRooms = await Group.find({
    isGuestRoom: true,
    guestLastActiveAt: { $lt: staleThreshold },
  }).select("_id");

  for (const room of staleRooms) {
    await deleteGuestRoomAndUsers(room._id);
  }

  await User.deleteMany({
    isGuest: true,
    $or: [{ guestExpiresAt: { $lt: now } }, { guestRoom: null }],
  });
};

export {
  makeNonce,
  signGuestInviteToken,
  verifyGuestInviteToken,
  buildGuestInviteLink,
  getGuestInviteExpiryDate,
  markGuestRoomActive,
  cleanupExpiredGuestRooms,
  deleteGuestRoomAndUsers,
};
