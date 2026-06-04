export const getUserRole = () => {
  return localStorage.getItem("role") || "student";
};

export const getAuthorTag = (author = "") => {
  const value = author.toLowerCase();

  if (value.includes("professor")) {
    return {
      className: "tag-professor",
      label: "Professor",
    };
  }

  if (value.includes("admin")) {
    return {
      className: "tag-admin",
      label: "Admin",
    };
  }

  return {
    className: "tag-student",
    label: "Student",
  };
};

export const getCategoryTagClass = (post) => {
  return post?.tag_class || "tag-general";
};