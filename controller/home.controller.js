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

const sendError = (res, error, fallbackMessage = RESPONSE.INTERNAL_ERROR) => {
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

    const filePath = resolveSafePath(name, franchise, `${franchise}.json`);

    const data = await readJson(filePath);

    return sendSuccess(res, data);
  } catch (error) {
    if (error.code === "ENOENT") {
      error.message = `Franchise not found: ${req.params.franchise}`;
    }

    return sendError(res, error);
  }
};

const sanitizeFilename = (raw) => {
  if (!raw || typeof raw !== "string") {
    return null;
  }

  const candidate = raw.trim();

  const ok = /^[a-z0-9-_]+$/i.test(candidate);

  return ok ? candidate : null;
};

//get branch landing page data by field name
const getBranchByName = async (req, res) => {
  try {
    const { branch_name } = req.params;

    const safeName = sanitizeFilename(branch_name);

    if (!safeName) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch name",
      });
    }

    const branchDir = path.resolve(__dirname, "../assets/branch");

    const branchFile = path.join(branchDir, safeName, `${safeName}.json`);

    console.log("Branch File Path:", branchFile);

    const data = await fs.readFile(branchFile, "utf8");

    const cleanData = data.replace(/^\uFEFF/, "").trim();

    // empty file check
    if (!cleanData) {
      return res.status(404).json({
        success: true,
        message: `No data found in ${safeName}.json`,
      });
    }

    let branchData;

    try {
      branchData = JSON.parse(cleanData);
    } catch (parseError) {
      console.error("Invalid JSON:", parseError);

      return res.status(500).json({
        success: false,
        message: `Invalid JSON format in ${safeName}.json`,
      });
    }

    return sendSuccess(res, branchData);
  } catch (err) {
    console.error("getBranchByName error:", err);

    if (err.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: `Branch ${req.params.branch_name} not found`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error retrieving branch details",
    });
  }
};

//get discover page data by discover name
const getDiscoverElements = async (req, res) => {
  try {
    const { discovery_elements } = req.params;

    const safeName = sanitizeFilename(discovery_elements);

    if (!safeName) {
      return res.status(400).json({
        success: false,
        message: "Invalid discover name",
      });
    }

    const discoverDir = path.resolve(__dirname, "../assets/discover");

    const discoverFile = path.join(discoverDir, safeName, `${safeName}.json`);

    console.log("Discover File Path:", discoverFile);

    const data = await fs.readFile(discoverFile, "utf8");

    const cleanData = data.replace(/^\uFEFF/, "").trim();

    // empty file check
    if (!cleanData) {
      return res.status(404).json({
        success: true,
        message: `No data found in ${safeName}.json`,
      });
    }

    let discoverData;

    try {
      discoverData = JSON.parse(cleanData);
    } catch (parseError) {
      console.error("Invalid JSON:", parseError);

      return res.status(500).json({
        success: false,
        message: `Invalid JSON format in ${safeName}.json`,
      });
    }

    return sendSuccess(res, discoverData);
  } catch (err) {
    console.error("getDiscoverByName error:", err);

    if (err.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: `Discover page ${req.params.discover_name} not found`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error retrieving discover details",
    });
  }
};

const getplacementElements = async (req, res) => {
  try {
    const { placement_elements } = req.params;

    const safeName = sanitizeFilename(placement_elements);

    if (!safeName) {
      return res.status(400).json({
        success: false,
        message: "Invalid placement name",
      });
    }

    const placementDir = path.resolve(__dirname, "../assets/placements");

    const placementFile = path.join(placementDir, safeName, `${safeName}.json`);

    console.log("Placement File Path:", placementFile);

    const data = await fs.readFile(placementFile, "utf8");

    const cleanData = data.replace(/^\uFEFF/, "").trim();

    // empty file check
    if (!cleanData) {
      return res.status(404).json({
        success: true,
        message: `No data found in ${safeName}.json`,
      });
    }

    let placementData;

    try {
      placementData = JSON.parse(cleanData);
    } catch (parseError) {
      console.error("Invalid JSON:", parseError);

      return res.status(500).json({
        success: false,
        message: `Invalid JSON format in ${safeName}.json`,
      });
    }

    return sendSuccess(res, placementData);
  } catch (err) {
    console.error("getplacementElements error:", err);

    if (err.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: `Placement page ${req.params.placement_name} not found`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error retrieving placement details",
    });
  }
};

export {
  getHomeData,
  getHomeSpecificField,
  getHomeFranchiseField,
  getBranchByName,
  getDiscoverElements,
  getplacementElements,
};
