import { API_BASE_URL } from "../../../utils/api";

const SERVER_ROOT = API_BASE_URL;

export const FILTERS = [
  { label: "All", value: "all" },
  { label: "Due Soon", value: "due-soon" },
  { label: "Overdue", value: "overdue" },
];

export const SORT_OPTIONS = [
  { label: "Sort by Deadline", value: "deadline" },
  { label: "Sort by Subject", value: "subject" },
  { label: "Sort by Priority", value: "priority" },
];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const calculateStatus = (deadline) => {
  const dueDate = new Date(deadline);
  const now = new Date();

  if (Number.isNaN(dueDate.getTime())) {
    return "pending";
  }

  return now > dueDate ? "overdue" : "pending";
};

export const getDaysUntilDeadline = (deadline) => {
  const dueDate = new Date(deadline);
  const now = new Date();

  if (Number.isNaN(dueDate.getTime())) {
    return null;
  }

  const diffTime = dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculatePriority = (deadline) => {
  const status = calculateStatus(deadline);
  const diffDays = getDaysUntilDeadline(deadline);

  if (status === "overdue") return "urgent";
  if (diffDays === null) return "normal";
  if (diffDays <= 2) return "urgent";
  if (diffDays <= 7) return "upcoming";

  return "normal";
};

export const buildFileUrl = (filePath) => {
  if (!filePath) return null;

  if (String(filePath).startsWith("http")) {
    return filePath;
  }

  return `${SERVER_ROOT}${filePath}`;
};

export const normalizeAssignment = (item) => {
  const dueDate = item.deadline ? new Date(item.deadline) : new Date();

  return {
    id: item.id,
    subject: item.subject || "General",
    title: item.title || "Untitled Assignment",
    description: item.description || "No description provided.",
    dueDate,
    teacher: item.teacher_name || item.teacher || "",
    status: calculateStatus(dueDate),
    priority: calculatePriority(dueDate),
    filePath: buildFileUrl(item.file_path),
  };
};

export const formatDeadlineDate = (date) => {
  const dueDate = new Date(date);

  if (Number.isNaN(dueDate.getTime())) {
    return "Invalid date";
  }

  return dueDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDeadlineFullDate = (date) => {
  const dueDate = new Date(date);

  if (Number.isNaN(dueDate.getTime())) {
    return "Invalid date";
  }

  return dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDeadlineTime = (date) => {
  const dueDate = new Date(date);

  if (Number.isNaN(dueDate.getTime())) {
    return "";
  }

  return dueDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getCountdown = (assignment) => {
  if (!assignment || assignment.status !== "pending") {
    return null;
  }

  const now = new Date();
  const diff = assignment.dueDate - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days > 2) return null;

  if (days === 0) {
    const hours = Math.ceil(diff / (1000 * 60 * 60));

    if (hours > 0) {
      return {
        className: "urgent",
        text: `${hours} hrs left`,
      };
    }

    return {
      className: "urgent",
      text: "Due today",
    };
  }

  if (days > 0) {
    return {
      className: days <= 1 ? "urgent" : "upcoming",
      text: `${days} day${days > 1 ? "s" : ""} left`,
    };
  }

  return null;
};

export const filterAssignments = (assignments, filter) => {
  if (filter === "due-soon") {
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);

    return assignments.filter(
      (assignment) =>
        assignment.status === "pending" && assignment.dueDate <= soon
    );
  }

  if (filter === "overdue") {
    return assignments.filter((assignment) => assignment.status === "overdue");
  }

  if (filter === "submitted") {
    return assignments.filter((assignment) => assignment.status === "submitted");
  }

  return assignments;
};

export const sortAssignments = (assignments, sort) => {
  const list = [...assignments];

  if (sort === "deadline") {
    return list.sort((a, b) => a.dueDate - b.dueDate);
  }

  if (sort === "subject") {
    return list.sort((a, b) => a.subject.localeCompare(b.subject));
  }

  if (sort === "priority") {
    const priorityRank = {
      urgent: 1,
      upcoming: 2,
      normal: 3,
    };

    return list.sort(
      (a, b) =>
        (priorityRank[a.priority] || 99) - (priorityRank[b.priority] || 99)
    );
  }

  return list;
};

export const getCalendarDays = (selectedMonth, selectedYear, assignments) => {
  const days = [];

  const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const prevDays = new Date(selectedYear, selectedMonth, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      number: prevDays - i,
      otherMonth: true,
      assignments: [],
    });
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const assignmentsForDay = assignments.filter((assignment) => {
      const date = assignment.dueDate;

      return (
        date.getDate() === dayNumber &&
        date.getMonth() === selectedMonth &&
        date.getFullYear() === selectedYear
      );
    });

    days.push({
      number: dayNumber,
      otherMonth: false,
      assignments: assignmentsForDay,
    });
  }

  const filled = days.length;

  for (let i = 1; i <= 42 - filled; i++) {
    days.push({
      number: i,
      otherMonth: true,
      assignments: [],
    });
  }

  return days;
};

export const isTodayDate = (dayNumber, selectedMonth, selectedYear) => {
  const today = new Date();

  return (
    dayNumber === today.getDate() &&
    selectedMonth === today.getMonth() &&
    selectedYear === today.getFullYear()
  );
};

export const capitalize = (value) => {
  if (!value) return "";

  return value.charAt(0).toUpperCase() + value.slice(1);
};