export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export const formatTime = (time) => {
  if (!time) return "";
  return String(time).slice(0, 5);
};

export const getClassDuration = (classData) => {
  if (!classData?.start_time || !classData?.end_time) return 1;

  const startHour = Number(classData.start_time.split(":")[0]);
  const endHour = Number(classData.end_time.split(":")[0]);

  const duration = endHour - startHour;

  return duration > 0 ? duration : 1;
};

export const buildTimetableMap = (rawData = []) => {
  const dataMap = {};

  rawData.forEach((item) => {
    if (!item.day_of_week || !item.start_time) return;

    const day = item.day_of_week;
    const startTime = formatTime(item.start_time);

    if (!dataMap[day]) {
      dataMap[day] = {};
    }

    dataMap[day][startTime] = item;
  });

  return dataMap;
};

export const getCellClassName = (classData) => {
  if (!classData) return "";

  const subject = String(classData.subject || "").toLowerCase();

  let className = "clickable-cell";

  if (subject.includes("lab")) {
    className += " lab-cell";
  }

  if (subject.includes("project") || subject.includes("research")) {
    className += " research-cell";
  }

  return className;
};

export const getTeacherName = (classData) => {
  return classData?.teacher_name || classData?.teacher_id || "N/A";
};

export const getRoomNumber = (classData) => {
  return classData?.room_number || "Room TBD";
};