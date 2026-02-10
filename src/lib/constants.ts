export const DEPARTMENT_TAGS = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "Legal",
  "Data",
  "Customer Success",
  "People / HR",
  "Other",
] as const;

export type DepartmentTag = (typeof DEPARTMENT_TAGS)[number];

export const JOBS_PER_PAGE = 25;
