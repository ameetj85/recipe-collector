import connectDB from '@/config/database';
import Recipe from '@/models/Recipe';

// GET all recipes for a specific user
// /api/recipes/user/:userId
export const GET = async (req, { params }) => {
  try {
    await connectDB();

    const userId = params.userId;

    if (!userId) {
      return new Response('User Id is required.', { status: 400 });
    }

    const recipe = await Recipe.find({ owner: userId });

    return new Response(JSON.stringify(recipe), {
      status: 200,
    });
  } catch (error) {
    console.log('Error fetching data: ' + error);
    return new Response('Something went wrong.', { status: 500 });
  }
};
