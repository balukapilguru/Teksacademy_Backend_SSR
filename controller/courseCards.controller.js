import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { paginate } from "../utils/paginate.js";

// CONFIG
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coursesFile = path.join(__dirname, "../assets/course/course.json");

const coursesDir = path.join(__dirname, "../assets/course");

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
      branches,
      name,
      programName,
      top,
    } = req.query;

    const coursesData = readCoursesFile();

    // NORMALIZE COURSES

    coursesData.courses = (coursesData.courses || []).map((course) => ({
      ...course,

      category: course.category?.toString().trim().toLowerCase(),

      subCategory: course.subCategory?.toString().trim().toLowerCase(),

      branch: course.branch?.toString().trim().toLowerCase(),

      programName: course.programName?.toString().trim(),
    }));

    // REMOVE ACADEMIC LANDING PAGES
    const isCountableCourse = (course) => {
      if (
        course.category === "academics" &&
        course.subCategory &&
        course.specialization
      ) {
        return false;
      }

      return isRealCourseCard(course);
    };

    // ONLY COURSES
    let filteredCourses = coursesData.courses.filter(isCountableCourse);
    let academicCards = coursesData.courses.filter(
      (course) =>
        course.category === "academics" &&
        course.subCategory &&
        course.specialization,
    );

    const parsedPage = parsePositiveInt(page, 1);

    const parsedPageSize = parsePositiveInt(
      pageSize,
      DEFAULTS.ALL_COURSES_PAGE_SIZE,
    );

    // SEARCH
    const parsedSearch = search?.trim().toLowerCase();

    if (parsedSearch) {
      filteredCourses = filteredCourses.filter((course) => {
        const searchableText = [
          course.programName,
          course.heading,
          course.category,
          course.subCategory,
          course.branch,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(parsedSearch);
      });
    }

    // PROGRAM NAME FILTER
    const parsedProgramName = programName?.trim().toLowerCase();

    if (parsedProgramName) {
      filteredCourses = filteredCourses.filter((course) =>
        course.programName?.toLowerCase().includes(parsedProgramName),
      );
    }

    // TOP COURSES
    if (top === "true") {
      filteredCourses = filteredCourses.filter(
        (course) => course.isTop === true,
      );
    }

    // CATEGORY FILTER
    if (category) {
      const categoryLower = category.trim().toLowerCase();

      // ACADEMICS => RETURN ACADEMIC LANDING CARDS
      if (categoryLower === "academics") {
        filteredCourses = academicCards;
      } else {
        filteredCourses = filteredCourses.filter(
          (course) => course.category === categoryLower,
        );
      }
    }

    // SUB CATEGORY FILTER
    if (subCategory) {
      const subLower = subCategory.trim().toLowerCase();

      filteredCourses = filteredCourses.filter(
        (course) => course.subCategory === subLower,
      );
    }

    // BRANCH FILTER
    if (branch) {
      const branchLower = branch.trim().toLowerCase();

      filteredCourses = filteredCourses.filter(
        (course) => course.branch === branchLower,
      );
    }

    // BRANCHES FILTER
    // BRANCHES ARRAY FILTER
    if (branches) {
      const branchesLower = branches.trim().toLowerCase();

      filteredCourses = filteredCourses.filter((course) =>
        Array.isArray(course.branches)
          ? course.branches.some(
              (item) => item?.toString().trim().toLowerCase() === branchesLower,
            )
          : false,
      );
    }
    
    // UNIVERSITY FILTER
    if (name) {
      const nameLower = name.trim().toLowerCase();

      filteredCourses = filteredCourses.filter((course) =>
        (course.universities || []).some(
          (university) => university.name?.toLowerCase().trim() === nameLower,
        ),
      );
    }

    // COUNTS
    const counts = {
      allCourses: pad(coursesData.courses.filter(isCountableCourse).length),

      sections: {},
    };

    // INDUSTRY READY PROGRAMS
    const certificationCount = coursesData.courses.filter(
      (course) =>
        course.category === "certifications" && isCountableCourse(course),
    ).length;

    counts.sections.certifications = {
      total: pad(certificationCount),
    };

    // ACADEMICS
    const BRANCH_ORDER = {
      ug: ["bba", "bcom", "bca", "ba"],

      pg: ["mba", "mca", "ma", "mcom", "ms"],
    };

    counts.sections.academics = {
      total: "00",

      subCategory: {},
    };

    let academicsTotal = 0;

    Object.entries(BRANCH_ORDER).forEach(([subCategoryKey, branches]) => {
      let subTotal = 0;

      const programs = {};

      branches.forEach((branchName) => {
        const branchCount = coursesData.courses.filter(
          (course) =>
            isCountableCourse(course) &&
            (course.branch || "").trim().toLowerCase() === branchName,
        ).length;

        programs[branchName] = pad(branchCount);

        subTotal += branchCount;
      });

      counts.sections.academics.subCategory[subCategoryKey] = {
        total: pad(subTotal),

        programs,
      };

      academicsTotal += subTotal;
    });

    counts.sections.academics.total = pad(academicsTotal);

    // PAGINATION
    const pagination = paginate(filteredCourses, parsedPage, parsedPageSize, {
      defaultPageSize: DEFAULTS.ALL_COURSES_PAGE_SIZE,

      maxPageSize: DEFAULTS.MAX_PAGE_SIZE,

      allowPageGreaterThanTotal: true,
    });

    // RESPONSE
    return sendSuccess(res, {
      page: pagination.page,

      pageSize: pagination.pageSize,

      total: pagination.total,

      totalPages: pagination.totalPages,

      counts,

      meta: coursesData.meta,

      heading: coursesData.heading,

      subHeading: coursesData.subHeading,

      searchBar: coursesData.searchBar,

      sideBar: {
        sections: [
          {
            name: "All Courses",
            value: "allCourses",
            active: true,
          },

          {
            name: "Industry Ready Programs",
            value: "certifications",
            active: false,
          },

          {
            name: "Academics",
            value: "academics",
            active: false,

            subCategory: [
              {
                name: "Under Graduation",
                value: "ug",

                programs: [
                  {
                    name: "BBA",
                    value: "bba",
                  },

                  {
                    name: "BCOM",
                    value: "bcom",
                  },

                  {
                    name: "BCA",
                    value: "bca",
                  },

                  {
                    name: "BA",
                    value: "ba",
                  },
                ],
              },

              {
                name: "Post Graduation",
                value: "pg",

                programs: [
                  {
                    name: "MBA",
                    value: "mba",
                  },

                  {
                    name: "MCA",
                    value: "mca",
                  },

                  {
                    name: "MA",
                    value: "ma",
                  },

                  {
                    name: "MCOM",
                    value: "mcom",
                  },

                  {
                    name: "MS",
                    value: "ms",
                  },
                ],
              },
            ],
          },
        ],
      },

      data: pagination.data,
    });
  } catch (err) {
    console.error(err);

    return sendError(res, 500, "Courses not found");
  }
};

export { getAllCourses };
