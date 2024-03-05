import connectDB from '@/config/database';
import Recipe from '@/models/Recipe';
import { getSessionUser } from '@/utils/getSessionUser';
import cloudinary from '@/config/cloudinary';

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
      .filter((image) => image.name != '');

    // create property data object for db
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
      // upload images logic is below
    };

    // upload image(s) to Cloudinary

    const imageUploadPromises = [];

    for (const image of images) {
      const imageBuffer = await image.arrayBuffer();
      const imageArray = Array.from(new Uint8Array(imageBuffer));
      const imageData = Buffer.from(imageArray);

      // converttheimage data to base64
      const imageBase64 = imageData.toString('base64');

      // make request to upload to cloudinary
      const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${imageBase64}`,
        { folder: 'RecipeApp' }
      );

      imageUploadPromises.push(result.secure_url);

      // Wait for all images to upload
      const uploadedImages = await Promise.all(imageUploadPromises);
      // add uploaded images to the propertyData object
      recipeData.images = uploadedImages;
    }

    const newRecipe = new Recipe(recipeData);
    await newRecipe.save();

    return Response.redirect(
      `${process.env.NEXTAUTH_URL}/recipes/${newRecipe._id}`
    );

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
