
export function paginate(
  array,
  page,
  pageSize,
  options = {}
) {
  if (!Array.isArray(array)) {
    throw new TypeError("paginate(): first argument must be an array");
  }

  const {
    defaultPageSize = 10,
    maxPageSize = 100,
    allowPageGreaterThanTotal = true,
  } = options;

  // Parse page
  let p = Number.parseInt(page, 10);
  if (!Number.isFinite(p) || p <= 0) p = 1;

  // Parse pageSize
  let ps = Number.parseInt(pageSize, 10);
  if (!Number.isFinite(ps) || ps <= 0) ps = defaultPageSize;

  // Clamp pageSize
  if (ps > maxPageSize) ps = maxPageSize;

  const total = array.length;
  const totalPages = ps === 0 ? 0 : Math.max(1, Math.ceil(total / ps));

  // If page > totalPages → return empty (do NOT throw or return 404)
  const outOfRange = p > totalPages;

  const start = (p - 1) * ps;
  const end = Math.min(start + ps, total);

  const data = outOfRange ? [] : array.slice(start, end);

  return {
    page: p,
    pageSize: ps,
    total,
    totalPages,
    start,
    end,
    data,
  };
}
