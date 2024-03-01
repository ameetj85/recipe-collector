import connectDB from '@/config/database';
import Recipe from '@/models/Recipe';

// GET /api/properties
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
