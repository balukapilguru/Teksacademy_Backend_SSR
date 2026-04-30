// controller/home.controller.js

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOME_DIR = path.resolve(__dirname, "../assets/home");
const GLOBAL_HOME_FILE = path.join(HOME_DIR, "home.json");

const RESPONSE = {
  SUCCESS: "Success",
  INVALID_PARAMS: "Invalid request parameters",
  INVALID_PATH: "Invalid path",
  INVALID_JSON: "Invalid configuration file",
  INTERNAL_ERROR: "Internal server error",
  HOME_LOAD_FAILED: "Unable to load home data",
};

const isValidSegment = (value) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  /^[a-zA-Z0-9_-]+$/.test(value);

const resolveSafePath = (...segments) => {
  const resolvedPath = path.resolve(HOME_DIR, ...segments);

  const normalizedHomeDir = path.normalize(HOME_DIR + path.sep);
  const normalizedResolved = path.normalize(resolvedPath);

  if (!normalizedResolved.startsWith(normalizedHomeDir)) {
    const error = new Error(RESPONSE.INVALID_PATH);
    error.statusCode = 400;
    throw error;
  }

  return resolvedPath;
};

const readJson = async (filePath) => {
  try {
    const file = await fs.readFile(filePath, "utf8");

    try {
      return JSON.parse(file);
    } catch {
      const error = new Error(RESPONSE.INVALID_JSON);
      error.statusCode = 500;
      throw error;
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      error.statusCode = 404;
    }

    throw error;
  }
};

const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message: RESPONSE.SUCCESS,
    data,
  });
};

const sendError = (
  res,
  error,
  fallbackMessage = RESPONSE.INTERNAL_ERROR
) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};

const getHomeData = async (req, res) => {
  try {
    const data = await readJson(GLOBAL_HOME_FILE);

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error, RESPONSE.HOME_LOAD_FAILED);
  }
};

const getHomeSpecificField = async (req, res) => {
  try {
    const { name } = req.params;

    if (!isValidSegment(name)) {
      return res.status(400).json({
        success: false,
        message: RESPONSE.INVALID_PARAMS,
      });
    }

    const filePath = resolveSafePath(name, `${name}.json`);

    const data = await readJson(filePath);

    return sendSuccess(res, data);
  } catch (error) {
    if (error.code === "ENOENT") {
      error.message = `Field not found: ${req.params.name}`;
    }

    return sendError(res, error);
  }
};

const getHomeFranchiseField = async (req, res) => {
  try {
    const { name, franchise } = req.params;

    if (!isValidSegment(name) || !isValidSegment(franchise)) {
      return res.status(400).json({
        success: false,
        message: RESPONSE.INVALID_PARAMS,
      });
    }

    const filePath = resolveSafePath(
      name,
      franchise,
      `${franchise}.json`
    );

    const data = await readJson(filePath);

    return sendSuccess(res, data);
  } catch (error) {
    if (error.code === "ENOENT") {
      error.message = `Franchise not found: ${req.params.franchise}`;
    }

    return sendError(res, error);
  }
};

export {
  getHomeData,
  getHomeSpecificField,
  getHomeFranchiseField,
};