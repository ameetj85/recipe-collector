const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || null;

// GET: fech all recipes
async function fetchRecipes() {
  try {
    // handle the case where the domain is not available yet
    if (!apiDomain) {
      return [];
    }

    const res = await fetch(`${apiDomain}/recipes`);

    if (!res.ok) {
      throw new Error('Failed to fetch data.');
    }

    return res.json();
  } catch (error) {
    console.log(error);
    return [];
  }
}

// GET: fetch a single property
async function fetchRecipe(id) {
  try {
    // handle the case where the domain is not available yet
    if (!apiDomain) {
      return null;
    }

    console.log('ID: ', id);
    const res = await fetch(`${apiDomain}/recipes/${id}`);

    if (!res.ok) {
      throw new Error('Failed to fetch data.');
    }

    return res.json();
  } catch (error) {
    console.log(error);
    return null;
  }
}

export { fetchRecipes, fetchRecipe };
