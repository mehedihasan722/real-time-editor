type CommentUser = { id: string; name: string; avatar: string };
async function getUsers(search: URLSearchParams): Promise<CommentUser[]> {
  const response = await fetch(`/api/comment-users?${search}`);
  if (!response.ok) throw new Error("Could not load team members");
  return response.json();
}
export async function resolveCommentUsers({ userIds }: { userIds: string[] }) {
  const users = await getUsers(new URLSearchParams(userIds.map(id => ["id", id])));
  return userIds.map(id => users.find(user => user.id === id) ?? { name: "Former team member" });
}
export async function resolveCommentMentions({ text }: { text: string }) {
  return (await getUsers(new URLSearchParams({ q: text }))).map(user => user.id);
}
