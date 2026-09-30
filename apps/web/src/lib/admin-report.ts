export function createBoardCsv(boards: readonly { title: string; authorName: string; _creationTime: number; isFavourite: boolean }[]) {
  const cell = (value: string) => {
    const safe = /^[\s]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return ["Name,Owner,Created,Favourite", ...boards.map(board =>
    [board.title, board.authorName, new Date(board._creationTime).toISOString(), board.isFavourite ? "Yes" : "No"].map(cell).join(",")
  )].join("\r\n");
}
