import ApiError from "../utils/ApiError.js";

const createWindowLimiter = (limit, windowMs) => {
  const hits = new Map();

  return (req, res, next) => {
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const existing = hits.get(ip);

    if (!existing || existing.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= limit) {
      return next(new ApiError(429, "Too many guest requests. Please try again shortly."));
    }

    existing.count += 1;
    hits.set(ip, existing);
    return next();
  };
};

const guestStartLimiter = createWindowLimiter(8, 10 * 60 * 1000);
const guestJoinLimiter = createWindowLimiter(20, 10 * 60 * 1000);

export { guestStartLimiter, guestJoinLimiter };
