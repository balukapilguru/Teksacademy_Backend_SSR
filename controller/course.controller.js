import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { paginate } from "../utils/paginate.js";

// CONFIG
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coursesFile = path.join(__dirname, "../assets/courses/courses.json");

const coursesDir = path.join(__dirname, "../assets/courses");

const DEFAULTS = {
  ALL_COURSES_PAGE_SIZE: 9,
  UNIVERSITY_BRANCH_PAGE_SIZE: 4,
  MAX_PAGE_SIZE: 200,
};

// HELPERS
const isRealCourseCard = (course) => {
  return (
    (Array.isArray(course.universities) && course.universities.length > 0) ||
    (Array.isArray(course.specializations) && course.specializations.length > 0)
  );
};

const pad = (n) => String(n).padStart(2, "0");

const parsePositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);

  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const sanitizeFilename = (raw) => {
  if (!raw || typeof raw !== "string") {
    return null;
  }

  const candidate = raw.trim();

  const ok = /^[a-z0-9-_]+$/i.test(candidate);

  return ok ? candidate : null;
};

const readCoursesFile = () => {
  const raw = fs.readFileSync(coursesFile, "utf-8");

  const cleaned = raw.replace(/^\uFEFF/, "");

  return JSON.parse(cleaned);
};

const sendSuccess = (res, data = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    status,
    ...data,
  });
};

const sendError = (res, status = 500, message = "Server error") => {
  return res.status(status).json({
    success: false,
    status,
    message,
  });
};

// GET ALL COURSES
const getAllCourses = async (req, res) => {
  try {
    const {
      page,
      pageSize,
      search,
      category,
      subCategory,
      branch,
      name,
      programName,
      top,
    } = req.query;

    const coursesData = readCoursesFile();

    coursesData.courses = coursesData.courses.map((course) => ({
      ...course,
      category: course.category
        ?.toString()
        .trim()
        .toLowerCase(),

      subCategory: course.subCategory
        ?.toString()
        .trim()
        .toLowerCase(),

      branch: course.branch
        ?.toString()
        .trim()
        .toLowerCase(),

      programName: course.programName
        ?.toString()
        .trim(),
    }));

    let filteredCourses = Array.isArray(coursesData.courses)
      ? [...coursesData.courses]
      : [];

    const parsedPage = parsePositiveInt(page, 1);

    const parsedPageSize = parsePositiveInt(
      pageSize,
      DEFAULTS.ALL_COURSES_PAGE_SIZE
    );

    const parsedSearch = search
      ?.trim()
      .toLowerCase();

    if (parsedSearch) {
      filteredCourses = filteredCourses
        .filter(isRealCourseCard)
        .filter((course) => {
          const text = [
            course.programName,
            course.heading,
            course.category,
            course.subCategory,
            course.branch,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(parsedSearch);
        });
    }

    const parsedProgramName = programName
      ?.trim()
      .toLowerCase();

    if (parsedProgramName) {
      filteredCourses = filteredCourses
        .filter(isRealCourseCard)
        .filter((course) => {
          const text = [
            course.programName,
            course.heading,
            course.category,
            course.subCategory,
            course.branch,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(parsedProgramName);
        });
    }

    if (top === "true") {
      filteredCourses = filteredCourses.filter(
        (course) => course.isTop === true
      );
    }

    if (category) {
      const categoryLower = category
        .trim()
        .toLowerCase();

      filteredCourses = filteredCourses.filter(
        (course) =>
          course.category === categoryLower
      );
    }

    if (subCategory) {
      const subLower = subCategory
        .trim()
        .toLowerCase();

      console.log(
        "Requested SubCategory:",
        subLower
      );

      filteredCourses = filteredCourses.filter(
        (course) =>
          course.category === "academics" &&
          course.subCategory === subLower
      );
    }

    if (branch) {
      const branchLower = branch
        .trim()
        .toLowerCase();

      filteredCourses = filteredCourses.filter(
        (course) =>
          course.branch === branchLower
      );

      console.log(
        "After branch filter:",
        filteredCourses.length
      );
    }

    if (name) {
      const nameLower = name
        .trim()
        .toLowerCase();

      filteredCourses = filteredCourses.filter(
        (course) =>
          (course.universities || []).some(
            (u) =>
              u.name
                ?.toString()
                .trim()
                .toLowerCase() === nameLower
          )
      );
    }

    const CATEGORY_ORDER = [
      "certifications",
      "academics",
    ];

    const SUBCATEGORY_ORDER = {
      certifications: ["certification"],
      academics: ["ug", "pg", "dr"],
    };

    const BRANCH_ORDER = {
      ug: ["bba", "bcom", "bca", "ba"],
      pg: ["mba", "mca", "ma", "mcom", "ms"],
      dr: ["phd"],
    };

    const categoryCounts = {};

    CATEGORY_ORDER.forEach((cat) => {
      categoryCounts[cat] = {
        total: 0,
        subCategory: {},
      };

      const subOrders =
        SUBCATEGORY_ORDER[cat] || [];

      subOrders.forEach((subCat) => {
        categoryCounts[cat].subCategory[
          subCat
        ] = {
          total: 0,
          programs: {},
        };

        if (cat === "academics") {
          const branches =
            BRANCH_ORDER[subCat] || [];

          let subTotal = 0;

          branches.forEach((branchName) => {
            const branchCount =
              coursesData.courses.filter(
                (course) =>
                  course.branch === branchName
              ).length;

            categoryCounts[cat]
              .subCategory[subCat]
              .programs[branchName] =
              pad(branchCount);

            subTotal += branchCount;
          });

          categoryCounts[cat]
            .subCategory[subCat]
            .total = pad(subTotal);

          categoryCounts[cat].total +=
            subTotal;
        } else {
          const count =
            coursesData.courses.filter(
              (course) =>
                course.category === cat &&
                course.subCategory ===
                  subCat &&
                isRealCourseCard(course)
            ).length;

          categoryCounts[cat]
            .subCategory[subCat]
            .programs[subCat] =
            pad(count);

          categoryCounts[cat]
            .subCategory[subCat]
            .total = pad(count);

          categoryCounts[cat].total +=
            count;
        }
      });

      categoryCounts[cat].total = pad(
        categoryCounts[cat].total
      );
    });

    const pagination = paginate(
      filteredCourses,
      parsedPage,
      parsedPageSize,
      {
        defaultPageSize:
          DEFAULTS.ALL_COURSES_PAGE_SIZE,
        maxPageSize:
          DEFAULTS.MAX_PAGE_SIZE,
        allowPageGreaterThanTotal: true,
      }
    );

    return sendSuccess(res, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      totalPages: pagination.totalPages,

      counts: {
        totalCourses: pad(
          coursesData.courses.length
        ),
        categoryCounts,
      },

      meta: coursesData.meta,
      heading: coursesData.heading,
      subHeading:
        coursesData.subHeading,
      searchBar: coursesData.searchBar,
      sideBar: coursesData.sideBar,

      data: pagination.data,
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "Courses not found"
    );
  }
};

// GET COURSE BY NAME

const getCourseByName = async (req, res) => {
  try {
    const { course_name } = req.params;

    const safeName = sanitizeFilename(course_name);

    if (!safeName) {
      return sendError(res, 400, "Invalid course name");
    }

    const courseFile = path.join(coursesDir, safeName, `${safeName}.json`);

    if (!fs.existsSync(courseFile)) {
      return sendError(res, 404, `Course ${safeName} not found`);
    }

    const data = fs.readFileSync(courseFile, "utf-8").replace(/^\uFEFF/, "");

    const courseData = JSON.parse(data);
    return sendSuccess(res, {
      data: courseData,
    });
  } catch (err) {
    console.error("getCourseByName error:", err);

    return sendError(res, 500, "Error retrieving course details");
  }
};

// GET SPECIALIZATION

const getSpecializationByName = async (req, res) => {
  try {
    const { course_name, specialization_name } = req.params;

    const safeCourse = sanitizeFilename(course_name);

    const safeSpec = sanitizeFilename(specialization_name);

    if (!safeCourse || !safeSpec) {
      return sendError(res, 400, "Invalid course or specialization name");
    }

    const specializationFile = path.join(
      coursesDir,
      safeCourse,
      "specializations",
      `${safeSpec}.json`,
    );

    if (!fs.existsSync(specializationFile)) {
      return sendError(res, 404, `Specialization ${safeSpec} not found`);
    }

    const data = fs
      .readFileSync(specializationFile, "utf-8")
      .replace(/^\uFEFF/, "");

    const specializationData = JSON.parse(data);
    return sendSuccess(res, {
      data: specializationData,
    });
  } catch (err) {
    console.error("getSpecializationByName error:", err);

    return sendError(res, 500, "Error retrieving specialization details");
  }
};

// GET UNIVERSITIES BY SPECIALIZATION
const getUniversityBySpecializations = async (req, res) => {
  try {
    const rawName = req.params.specializationInternalName;

    if (!rawName) {
      return sendError(
        res,
        400,
        "Provide specialization internal name in the URL",
      );
    }

    const specializationInternalName = rawName.toLowerCase().trim();

    const coursesData = readCoursesFile();

    const filteredCourses = Array.isArray(coursesData.courses)
      ? coursesData.courses
      : [];

    const matchedSpec = filteredCourses
      .flatMap((course) => course.specializations || [])
      .find((spec) => {
        const specSlug = spec.specializationInternalName
          ? spec.specializationInternalName.toLowerCase().trim()
          : spec.specializationName?.toLowerCase().replace(/\s+/g, "-").trim();

        return specSlug === specializationInternalName;
      });

    if (!matchedSpec) {
      return sendError(res, 404, "No universities found");
    }

    const universityOffering = matchedSpec.universityOffering || [];

    if (universityOffering.length === 0) {
      return sendError(res, 404, "No universities found");
    }
    return sendSuccess(res, {
      specialization: specializationInternalName,
      universityOffering,
    });
  } catch (err) {
    console.error("getUniversityBySpecializations error:", err);

    return sendError(res, 500, "Server error");
  }
};

// GET COURSES BY UNIVERSITY & BRANCH
const getCoursesByUniversityAndBranch = async (req, res) => {
  try {
    const { name, branch, page, pageSize } = req.query;

    if (!name || !branch) {
      return sendError(res, 400, "Please provide both name and branch");
    }

    const coursesData = readCoursesFile();

    let filteredCourses = Array.isArray(coursesData.courses)
      ? [...coursesData.courses]
      : [];

    const branchLower = branch.toLowerCase();

    filteredCourses = filteredCourses.filter(
      (course) => course.branch?.toLowerCase() === branchLower,
    );

    const nameLower = name.toLowerCase();

    filteredCourses = filteredCourses.filter((course) =>
      (course.universities || []).some(
        (u) => (u.name || "").toLowerCase() === nameLower,
      ),
    );

    if (filteredCourses.length === 0) {
      return sendSuccess(res, {
        page: 1,
        pageSize: 0,
        total: 0,
        totalPages: 0,
        data: [],
        message: "Courses will be available soon...!",
      });
    }

    const parsedPage = parsePositiveInt(page, 1);

    const parsedPageSize = parsePositiveInt(
      pageSize,
      DEFAULTS.UNIVERSITY_BRANCH_PAGE_SIZE,
    );

    const pagination = paginate(filteredCourses, parsedPage, parsedPageSize, {
      defaultPageSize: DEFAULTS.UNIVERSITY_BRANCH_PAGE_SIZE,
      maxPageSize: DEFAULTS.MAX_PAGE_SIZE,
      allowPageGreaterThanTotal: true,
    });

    return sendSuccess(res, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      totalPages: pagination.totalPages,
      data: pagination.data,
    });
  } catch (err) {
    console.error("getCoursesByUniversityAndBranch error:", err);

    return sendError(res, 500, "Server error");
  }
};

export {
  getAllCourses,
  getCourseByName,
  getSpecializationByName,
  getUniversityBySpecializations,
  getCoursesByUniversityAndBranch,
};
