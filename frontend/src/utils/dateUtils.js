export const formatDate = (isoDate) => {
    const [year, month, day] = isoDate.split("T")[0].split("-");
    const date = new Date(year, month - 1, day);
    const formattedDay = String(date.getDate()).padStart(2, "0");
    const formattedMonth = String(date.getMonth() + 1).padStart(2, "0");
    const formattedYear = date.getFullYear();
    return `${formattedMonth}-${formattedDay}-${formattedYear}`;
  };