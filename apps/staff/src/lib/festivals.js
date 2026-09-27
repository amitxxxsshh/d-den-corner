import { apiRequest } from "./api";

export async function getFestivals() {
  const data = await apiRequest(
    "/api/staff/festivals",
  );

  return data?.festivals || [];
}

export async function createFestival(
  input,
) {
  return apiRequest(
    "/api/staff/festivals",
    {
      method: "POST",
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
  );
}

export async function getSpecialMenus(
  festivalId,
) {
  const data =
    await getFestival(
      festivalId,
    );

  return (
    data?.festival
      ?.specialMenus || []
  );
}

export async function createSpecialMenu(
  festivalId,
  input,
) {
  const data =
    await apiRequest(
      `/api/staff/festivals/${encodeURIComponent(
        festivalId,
      )}/menus`,
      {
        method: "POST",
        body: JSON.stringify(
          input,
        ),
      },
    );

  return (
    data?.specialMenu ||
    data
  );
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
  const data =
    await apiRequest(
      `/api/staff/festivals/${encodeURIComponent(
        festivalId,
      )}/menus/${encodeURIComponent(
        specialMenuId,
      )}/items`,
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
      body: JSON.stringify({
        specialPriceMinor,
      }),
    },
  );
}

export async function getAvailableMenuItems() {
  const data =
    await apiRequest(
      "/api/staff/festivals/menu-items",
    );

  return data?.items || [];
}