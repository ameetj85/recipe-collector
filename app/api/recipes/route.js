import connectDB from '@/config/database';
import Recipe from '@/models/Recipe';
import { getSessionUser } from '@/utils/getSessionUser';
import { uploadImages } from '@/utils/cloudinaryImages';
import { parseIngredients } from '@/utils/parseIngredients';

const MAX_IMAGES = 2;

// GET /api/recipes
export const GET = async (req) => {
  try {
    await connectDB();

    const recipes = await Recipe.find({});

    return new Response(JSON.stringify(recipes), {
      status: 200,
    });
  } catch (error) {
    console.log('Error fetching data: ' + error);
    return new Response('Something went wrong.', { status: 500 });
  }
};

// POST /api/recipes
export const POST = async (req) => {
  try {
    console.log('Inside POST');

    await connectDB();

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.userId) {
      return new Response('User id is required.', { status: 401 });
    }

    const { userId } = sessionUser;

    const formData = await req.formData();

    // access all values from images
    const images = formData
      .getAll('images')
      .filter((image) => image.name != '')
      .slice(0, MAX_IMAGES); // the form limits to 2, enforce it server-side too

    // create recipe data object for db
    const recipeData = {
      owner: userId,
      name: formData.get('name'),
      description: formData.get('description'),
      url: formData.get('url'),
      starRating: formData.get('starRating'),
      category: formData.get('category'),
      type: formData.get('type'),
      isFeatured: formData.get('isFeatured'),
      prepTime: formData.get('prepTime'),
      cookTime: formData.get('cookTime'),
      totalTime: formData.get('totalTime'),
      servings: formData.get('servings'),
      directions: formData.get('directions'),

      nutritionInfo: {
        calories: formData.get('nutritionInfo.calories'),
        fat: formData.get('nutritionInfo.fat'),
        carbs: formData.get('nutritionInfo.carbs'),
        protein: formData.get('nutritionInfo.protein'),
        sugars: formData.get('nutritionInfo.sugars'),
      },
      ingredients: parseIngredients(formData.get('ingredients')),
      // upload images logic is below
    };

    // upload image(s) to Cloudinary in parallel
    recipeData.images = await uploadImages(images);

    const newRecipe = new Recipe(recipeData);
    await newRecipe.save();

    // Redirect (303 so the browser follows with GET) to the new recipe.
    // Fall back to the request's own origin if NEXTAUTH_URL is not set.
    const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
    return Response.redirect(`${baseUrl}/recipes/${newRecipe._id}`, 303);

    /*
    return new Response(JSON.stringify({ message: 'Success' }), {
      status: 200,
    });
    */
  } catch (error) {
    console.error(error);
    return new Response('Failed to add recipe.', { status: 500 });
  }
};
