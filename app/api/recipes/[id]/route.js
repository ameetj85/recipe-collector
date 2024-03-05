import connectDB from '@/config/database';
import Recipe from '@/models/Recipe';

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
