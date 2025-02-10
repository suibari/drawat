import { PUBLIC_LOCAL_API_KEY, PUBLIC_NODE_ENV, PUBLIC_WORKERS_URL } from "$env/static/public";

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (PUBLIC_NODE_ENV === "development") {
  headers['Authorization'] = `Bearer ${PUBLIC_LOCAL_API_KEY}`;
}

export const getAllRows = async (): Promise<App.dbVector[]> => {
  let dids: string[] = [];

  const response = await fetch(PUBLIC_WORKERS_URL, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    console.error('Failed to delete user data from Supabase:', await response.json());
    return [];
  } else {
    const data = await response.json() as App.dbVector[];

    return data;
  }
}

export const postRow = async ({
  did,
  vector,
  updated_at
}: {
  did: string,
  vector: App.Path[] | null,
  updated_at: string
}) => {
  const response = await fetch(PUBLIC_WORKERS_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      did,
      vector,
      updated_at,
    }),
  });

  if (!response.ok) {
    console.error('Failed to save user data to Supabase:', await response.json());
  }
}

export const deleteRow = async (did: string) => {
  const response = await fetch(PUBLIC_WORKERS_URL, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({
      did
    }),
  });

  if (!response.ok) {
    console.error('Failed to delete user data from Supabase:', await response.json());
  }
}