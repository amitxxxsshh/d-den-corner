import { apiRequest } from "./api";

const STAFF_USER_ID =
  process.env.NEXT_PUBLIC_STAFF_USER_ID || "";

function staffHeaders() {
  return {
    "X-Staff-User-Id": STAFF_USER_ID,
  };
}

export async function getFestivals() {
  const data = await apiRequest(
    "/api/staff/festivals",
    {
      headers: staffHeaders(),
    },
  );

  return data?.festivals || [];
}

export async function createFestival(input) {
  return apiRequest(
    "/api/staff/festivals",
    {
      method: "POST",
      headers: staffHeaders(),
      body: JSON.stringify(input),
    },
  );
}

export async function updateFestival(
  festivalId,
  input,
) {
  return apiRequest(
    `/api/staff/festivals/${encodeURIComponent(
      festivalId,
    )}`,
    {
      method: "PATCH",
      headers: staffHeaders(),
      body: JSON.stringify(input),
    },
  );
}

export async function getFestival(
  festivalId,
) {
  return apiRequest(
    `/api/staff/festivals/${encodeURIComponent(
      festivalId,
    )}`,
    {
      headers: staffHeaders(),
    },
  );
}

export async function getSpecialMenus(
  festivalId,
) {
  const data = await getFestival(
    festivalId,
  );

  return data?.festival?.specialMenus || [];
}

export async function createSpecialMenu(
  festivalId,
  input,
) {
  const data = await apiRequest(
    `/api/staff/festivals/${encodeURIComponent(
      festivalId,
    )}/menus`,
    {
      method: "POST",
      headers: staffHeaders(),
      body: JSON.stringify(input),
    },
  );

  return data?.specialMenu || data;
}

export async function updateSpecialMenuStatus(
  festivalId,
  specialMenuId,
  active,
) {
  return apiRequest(
    `/api/staff/festivals/${encodeURIComponent(
      festivalId,
    )}/menus/${encodeURIComponent(
      specialMenuId,
    )}`,
    {
      method: "PATCH",
      headers: staffHeaders(),
      body: JSON.stringify({
        active,
      }),
    },
  );
}

export async function getSpecialMenuItems(
  festivalId,
  specialMenuId,
) {
  const data = await apiRequest(
    `/api/staff/festivals/${encodeURIComponent(
      festivalId,
    )}/menus/${encodeURIComponent(
      specialMenuId,
    )}/items`,
    {
      headers: staffHeaders(),
    },
  );

  return data?.items || [];
}

export async function addSpecialMenuItem(
  festivalId,
  specialMenuId,
  input,
) {
  return apiRequest(
    `/api/staff/festivals/${encodeURIComponent(
      festivalId,
    )}/menus/${encodeURIComponent(
      specialMenuId,
    )}/items`,
    {
      method: "POST",
      headers: staffHeaders(),
      body: JSON.stringify(input),
    },
  );
}

export async function updateSpecialMenuItemAvailability(
  festivalId,
  specialMenuId,
  itemId,
  available,
) {
  return apiRequest(
    `/api/staff/festivals/${encodeURIComponent(
      festivalId,
    )}/menus/${encodeURIComponent(
      specialMenuId,
    )}/items/${encodeURIComponent(
      itemId,
    )}`,
    {
      method: "PATCH",
      headers: staffHeaders(),
      body: JSON.stringify({
        available,
      }),
    },
  );
}

export async function updateSpecialMenuItemPrice(
  festivalId,
  specialMenuId,
  itemId,
  specialPriceMinor,
) {
  return apiRequest(
    `/api/staff/festivals/${encodeURIComponent(
      festivalId,
    )}/menus/${encodeURIComponent(
      specialMenuId,
    )}/items/${encodeURIComponent(
      itemId,
    )}`,
    {
      method: "PATCH",
      headers: staffHeaders(),
      body: JSON.stringify({
        specialPriceMinor,
      }),
    },
  );
}

export async function getAvailableMenuItems() {
  const data = await apiRequest(
    "/api/staff/festivals/menu-items",
    {
      headers: staffHeaders(),
    },
  );

  return data?.items || [];
}