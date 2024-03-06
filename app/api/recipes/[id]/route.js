import connectDB from '@/config/database';
import Recipe from '@/models/Recipe';
import { getSessionUser } from '@/utils/getSessionUser';

// GET /api/recipes/:id
export const GET = async (req, { params }) => {
  try {
    await connectDB();

    const recipe = await Recipe.findById(params.id);

    if (!recipe) {
      return new Response('Recipe Not Found.', { status: 404 });
    }

    return new Response(JSON.stringify(recipe));
  } catch (error) {
    console.log('Error fetching data: ' + error);
    return new Response('Something went wrong.', { status: 500 });
  }
};

// DELETE /api/recipes/:id
export const DELETE = async (request, { params }) => {
  try {
    const recipeId = params.id;

    const sessionUser = await getSessionUser();

    // Check for session
    if (!sessionUser || !sessionUser.userId) {
      return new Response('User ID is required', { status: 401 });
    }

    const { userId } = sessionUser;

    await connectDB();

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) return new Response('Recipe Not Found', { status: 404 });

    // Verify ownership
    if (recipe.owner.toString() !== userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    await recipe.deleteOne();

    return new Response('Recipe Deleted', {
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return new Response('Something Went Wrong', { status: 500 });
  }
};

// PUT /api/recipes/:id
export const PUT = async (req, { params }) => {
  try {
    console.log('Inside PUT');

    await connectDB();

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.userId) {
      return new Response('User id is required.', { status: 401 });
    }

    const { id } = params;
    const { userId } = sessionUser;

    const formData = await req.formData();

    // get recipe to update
    const existingRecipe = await Recipe.findById(id);

    if (!existingRecipe) {
      return new Response('Recipe does not exist!', { status: 404 });
    }

    // Verify ownership
    if (existingRecipe.owner.toString() != userId) {
      return new Response('Unauthorised!', { status: 401 });
    }

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
      ingredients: formData.get('ingredients').split('\r\n'),
    };

    // update recipe in db
    const filter = { _id: existingRecipe._id.toString() };
    const options = { upsert: true };

    const updatedRecipe = await Recipe.updateOne(filter, recipeData, options);

    // const updatedRecipe = await Recipe.findByIdAndUpdate(id, recipeData);

    return new Response(JSON.stringify(updatedRecipe), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response('Failed to update recipe.', { status: 500 });
  }
};
