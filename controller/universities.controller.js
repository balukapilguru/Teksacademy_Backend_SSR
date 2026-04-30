import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { paginate } from "../utils/paginate.js";

// Paths & helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const univFile = path.join(__dirname, "../assets/universities/universities.json");
const univDir = path.join(__dirname, "../assets/universities");

const DEFAULTS = {
  UNIVERSITIES_PAGE_SIZE: 4,
  MAX_PAGE_SIZE: 200,
};

const parsePositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Basic filename sanitizer: allow lowercase letters, numbers, dash, underscore.
const sanitizeFilename = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const candidate = raw.trim().toLowerCase();
  return /^[a-z0-9-_]+$/.test(candidate) ? candidate : null;
};

// Read and parse the root universities JSON
const readUnivFile = () => {
  try {
    const raw = fs.readFileSync(univFile, "utf-8");
    const cleaned = raw.replace(/^\uFEFF/, ""); // Strip BOM
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Error reading universities.json:", err);
    return { universities: [] }; // Return empty on failure
  }
};

const sendSuccess = (res, data = {}, status = 200) =>
  res.status(status).json({ success: true, status, ...data });

const sendError = (res, status = 500, message = "Server error") =>
  res.status(status).json({ success: false, status, message });

// ------------------------------------------------------------------
// GET /api/v1/universities
const getUniversities = (req, res) => {
  try {
    const { page, pageSize, search } = req.query;

    const universitiesData = readUnivFile();
    let universitiesList = Array.isArray(universitiesData.universities)
      ? universitiesData.universities.slice()
      : [];

    // Search filter
    const q = (search || "").trim().toLowerCase();
    if (q) {
      universitiesList = universitiesList.filter((univ) => {
        const title = (univ.title || "").toLowerCase();
        const description = (univ.description || "").toLowerCase();
        return title.includes(q) || description.includes(q);
      });
    }

    // Pagination
    const parsedPage = parsePositiveInt(page, 1);
    const parsedPageSize = parsePositiveInt(pageSize, DEFAULTS.UNIVERSITIES_PAGE_SIZE);

    const pagination = paginate(universitiesList, parsedPage, parsedPageSize, {
      defaultPageSize: DEFAULTS.UNIVERSITIES_PAGE_SIZE,
      maxPageSize: DEFAULTS.MAX_PAGE_SIZE,
      allowPageGreaterThanTotal: true,
    });

    return sendSuccess(res, {
      total: pagination.total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: pagination.totalPages,
      data: pagination.data,
    });
  } catch (err) {
    console.error("getUniversities error:", err);
    return sendError(res, 500, "Failed to fetch universities");
  }
};

// ------------------------------------------------------------------
// GET /api/v1/university/:name
const getSingleUniversity = (req, res) => {
  try {
    const { name } = req.params;
    const safeName = sanitizeFilename(name);

    if (!safeName) {
      return sendError(res, 400, "Invalid university name format");
    }

    const filePath = path.join(univDir, `${safeName}.json`);

    if (!fs.existsSync(filePath)) {
      return sendError(res, 404, "University not found");
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const cleaned = raw.replace(/^\uFEFF/, "");
    const university = JSON.parse(cleaned);

    return sendSuccess(res, { data: university });
  } catch (err) {
    console.error("getSingleUniversity error:", err);
    return sendError(res, 500, "Failed to load university details");
  }
};

// ------------------------------------------------------------------
// GET /api/v1/university/:name/other
const getOtherUniversity = (req, res) => {
  try {
    const { name } = req.params;
    const { page, pageSize } = req.query;

    const parsedPage = parsePositiveInt(page, 1);
    const parsedPageSize = parsePositiveInt(pageSize, DEFAULTS.UNIVERSITIES_PAGE_SIZE);

    const universitiesData = readUnivFile();
    const universitiesList = Array.isArray(universitiesData.universities)
      ? universitiesData.universities.slice()
      : [];

    const targetName = (name || "").trim().toLowerCase();

    // Find the target university to exclude
    const targetUniv = universitiesList.find(
      (u) => (u.name || "").toLowerCase() === targetName
    );

    if (!targetUniv) {
      return sendError(res, 404, "University not found");
    }

    // Exclude the current university
    const otherUniversities = universitiesList.filter(
      (u) => (u.name || "").toLowerCase() !== targetName
    );

    const pagination = paginate(otherUniversities, parsedPage, parsedPageSize, {
      defaultPageSize: DEFAULTS.UNIVERSITIES_PAGE_SIZE,
      maxPageSize: DEFAULTS.MAX_PAGE_SIZE,
      allowPageGreaterThanTotal: true,
    });

    return sendSuccess(res, {
      total: pagination.total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: pagination.totalPages,
      data: pagination.data,
    });
  } catch (err) {
    console.error("getOtherUniversities error:", err);
    return sendError(res, 500, "Failed to fetch other universities");
  }
};

export { getUniversities, getSingleUniversity, getOtherUniversity };