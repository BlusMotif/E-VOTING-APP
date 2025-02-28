export async function apiRequest(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: any
) {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response;
}
