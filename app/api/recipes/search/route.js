import connectDB from '@/config/database';
import Recipe from '@/models/Recipe';

// GET /api/recpies/search
export const GET = async (req) => {
  try {
    await connectDB();

    let criteria = '';

    const { searchParams } = new URL(req.url);
    const searchCriteria = searchParams.get('searchCriteria');
    const recipeType = searchParams.get('recipeType');

    console.log('type:', recipeType);

    // if searchCriteria is not returned correctly,
    // i.e. iyt contans the url, then strip out everything
    // until and including ?
    if (searchCriteria.includes('?')) {
      criteria = searchCriteria.split('?')[1].split('=')[1];
    } else {
      criteria = searchCriteria;
    }

    const criteriaPattern = new RegExp(criteria, 'i');

    // match criteria pattern against db fields
    let query = {
      $or: [
        { name: criteriaPattern },
        { description: criteriaPattern },
        { type: criteriaPattern },
        { ingredients: criteriaPattern },
        { directions: criteriaPattern },
      ],
    };

    // only check for property type if it is not All
    if (recipeType && recipeType !== 'All') {
      const typePattern = new RegExp(recipeType.toLowerCase(), 'i');
      console.log('type pattern:', typePattern);
      query.category = typePattern;
    }

    console.log(query);

    const recipes = await Recipe.find(query);

    console.log(recipes);

    return new Response(JSON.stringify(recipes, { status: 200 }));
  } catch (error) {
    console.log(error);
    return new Response('Error', { status: 500 });
  }
};
