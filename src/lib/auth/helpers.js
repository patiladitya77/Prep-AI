const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "fallback-secret-key", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Helper function to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-key");
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Helper function to hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Helper function to compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Helper function to exclude password from user object
const excludePassword = (user) => {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Helper function to get user from token in request
const getUserFromToken = async (request) => {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No token provided");
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    return decoded.userId;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Detailed password validation returning reasons for failure
const validatePasswordDetailed = (password) => {
  const errors = [];

  if (!password || typeof password !== "string") {
    errors.push("Password must be a string");
    return { valid: false, errors };
  }

  // Requirements
  const minLength = 6; // raised minimum length
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
  const hasSpace = /\s/.test(password);

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasLower) errors.push("Password must contain a lowercase letter");
  if (!hasUpper) errors.push("Password must contain an uppercase letter");
  if (!hasDigit) errors.push("Password must contain a number");
  if (!hasSymbol) errors.push("Password must contain a special character");
  if (hasSpace) errors.push("Password must not contain spaces");

  // Reject a short list of very common passwords (keeps list small and local)
  const common = new Set([
    "123456",
    "password",
    "123456789",
    "12345678",
    "qwerty",
    "abc123",
    "password1",
    "111111",
    "123123",
    "iloveyou",
    "admin",
  ]);
  if (common.has(password.toLowerCase())) {
    errors.push("Password is too common");
  }

  return { valid: errors.length === 0, errors };
};

// Backwards-compatible boolean validator used across the codebase
const validatePassword = (password) => {
  const result = validatePasswordDetailed(password);
  return result.valid;
};

const validateName = (name) => {
  return name && name.trim().length >= 2;
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  excludePassword,
  getUserFromToken,
  validateEmail,
  validatePassword,
  validatePasswordDetailed,
  validateName,
};
