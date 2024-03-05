'use client';

import React, { useState, useEffect } from 'react';

const RecipeAddForm = () => {
  const [mounted, setMounted] = useState(false);
  const [invalidImageCount, setInvalidImageCount] = useState(false);

  /*
  const [fields, setFields] = useState({
    owner: '',
    name: 'Test Recipe',
    description: 'This is a description for a test recipe',
    url: 'https://www.google.com',
    starRating: '5',
    category: 'American',
    type: 'Chicken',
    isFeatured: false,
    prepTime: 20,
    cookTime: 40,
    totalTime: 60,
    servings: 4,
    directions:
      'Heat oil in a nonstick pan over high heat. Add onion and salt; cook and stir until onion has softened, about 5 minutes.\nReduce heat to low; stir in garlic and ginger until fragrant. Add hot water; cover, and cook, stirring occasionally, until water has evaporated, about 5 minutes.\nAdd chili powder, ground coriander, cumin, and turmeric; cook and stir over high heat until spices are toasted, about 5 minutes. Stir in tomatoes and green chiles; cover and cook over low heat for 5 minutes.\nAdd chicken; cook and stir over high heat until browned, 5 to 7 minutes. Stir in curry paste; reduce heat to low, cover and cook until chicken is cooked through, adding a little water if necessary, about 5 minutes. Check seasoning and sprinkle with freshly chopped cilantro.',
    nutritionInfo: {
      calories: 182,
      fat: 9,
      carbs: 16,
      protein: 12,
      sugars: 0,
    },
    ingredients: [
      '2 tablespoons vegetable oil\n',
      '3 medium onions, finely chopped\n',
      '1 teaspoon salt\n',
      '4 cloves garlic, crushed\n',
      '1 tablespoon minced fresh ginger\n',
    ],
    images: [],
  });
  */
  const [fields, setFields] = useState({
    owner: '',
    name: '',
    description: '',
    url: '',
    starRating: '',
    category: '',
    type: '',
    isFeatured: false,
    prepTime: 0,
    cookTime: 0,
    totalTime: 0,
    servings: 0,
    directions: '',
    nutritionInfo: {
      calories: 0,
      fat: 0,
      carbs: 0,
      protein: 0,
      sugars: 0,
    },
    ingredients: [],
    images: [],
  });

  // this prevents console warnings to show up at runtime complaining about html and server.
  useEffect(() => {
    setMounted(true);
    setInvalidImageCount(false);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // check if this is a nested property, eg. nutritionInfo.protein, etc
    if (name.includes('.')) {
      const [outerKey, innerKey] = name.split('.');
      setFields((prevFields) => ({
        ...prevFields,
        [outerKey]: {
          ...prevFields[outerKey],
          [innerKey]: value,
        },
      }));
    } else {
      // not nested property
      setFields((prevFields) => ({
        ...prevFields,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e) => {
    const { files } = e.target;

    if (files.length > 2) {
      setInvalidImageCount(true);
    } else {
      setInvalidImageCount(false);
    }

    if (files.length > 2) {
      setInvalidImageCount(true);
    } else {
      setInvalidImageCount(false);
    }

    // we are going to overwrite prev selections
    const updatedImages = [];

    let count = 0;
    // add new files to array - limit to 2 image files only.
    for (const file of files) {
      count++;
      updatedImages.push(file);
      if (count === 2) {
        break;
      }
    }

    // update state with array of images
    setFields((prevFields) => ({
      ...prevFields,
      images: updatedImages,
    }));
  };

  const handleIngredientsChange = (e) => {
    setFields((prevFields) => ({
      ...prevFields,
      ingredients: e.target.value,
    }));
  };

  return (
    mounted && (
      <form action='/api/recipes' method='POST' encType='multipart/form-data'>
        <h2 className='text-3xl text-center font-semibold mb-6'>Add Recipe</h2>

        <div className='mb-4'>
          <label htmlFor='type' className='block text-gray-700 font-bold mb-2'>
            Recipe Type
          </label>
          <select
            id='type'
            name='type'
            className='border rounded w-full py-2 px-3'
            required
            value={fields.type}
            onChange={handleChange}
          >
            <option value='Chicken'>Chicken</option>
            <option value='Beef'>Beef</option>
            <option value='Fish'>Fish</option>
            <option value='Mutton'>Mutton</option>
            <option value='Venison'>Venison</option>
            <option value='Pork'>Pork</option>
            <option value='Other'>Other</option>
          </select>
        </div>

        <div className='mb-4'>
          <label htmlFor='type' className='block text-gray-700 font-bold mb-2'>
            Cusisine Category
          </label>
          <select
            id='category'
            name='category'
            className='border rounded w-full py-2 px-3'
            required
            value={fields.category}
            onChange={handleChange}
          >
            <option value='American'>American</option>
            <option value='Chinese'>Chinese</option>
            <option value='Cuban'>Cuban</option>
            <option value='French'>French</option>
            <option value='Greek'>Greek</option>
            <option value='Japanese'>Japanese</option>
            <option value='Indian'>Indian</option>
            <option value='Italian'>Italian</option>
            <option value='Mexican'>Mexican</option>
            <option value='Thai'>Thai</option>
            <option value='Other'>Other</option>
          </select>
        </div>
        <div className='mb-4'>
          <label className='block text-gray-700 font-bold mb-2'>
            Recipe Name
          </label>
          <input
            type='text'
            id='name'
            name='name'
            className='border rounded w-full py-2 px-3 mb-2'
            placeholder='eg. Beautiful Apartment In Miami'
            required
            value={fields.name}
            onChange={handleChange}
          />
        </div>
        <div className='mb-4'>
          <label className='block text-gray-700 font-bold mb-2'>
            URL / Website of original recipe information
          </label>
          <input
            type='text'
            id='url'
            name='url'
            className='border rounded w-full py-2 px-3 mb-2'
            placeholder='url to original recipe'
            required
            value={fields.url}
            onChange={handleChange}
          />
        </div>
        <div className='mb-4'>
          <label
            htmlFor='description'
            className='block text-gray-700 font-bold mb-2'
          >
            Description
          </label>
          <textarea
            id='description'
            name='description'
            className='border rounded w-full py-2 px-3'
            rows='4'
            placeholder='Add an optional description of your property'
            value={fields.description}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className='mb-4'>
          <label className='block text-gray-700 font-bold mb-2'>
            Star Rating
          </label>
          <input
            type='number'
            id='starRating'
            name='starRating'
            className='border rounded w-full py-2 px-3 mb-2'
            placeholder='eg. Beautiful Apartment In Miami'
            required
            value={fields.starRating}
            onChange={handleChange}
          />
        </div>

        <div className='mb-4 bg-blue-50 p-4'>
          <label className='block text-gray-700 font-bold mb-2'>
            Prep and Cook Times
          </label>
          <input
            type='number'
            id='prepTime'
            name='prepTime'
            className='border rounded w-full py-2 px-3 mb-2'
            placeholder='Preparation Time (in minutes)'
            value={fields.prepTime}
            onChange={handleChange}
          />
          <input
            type='number'
            id='cookTime'
            name='cookTime'
            className='border rounded w-full py-2 px-3 mb-2'
            placeholder='Total Cook Time (in minutes)'
            value={fields.cookTime}
            onChange={handleChange}
          />
          <input
            type='number'
            id='totalTime'
            name='totalTime'
            className='border rounded w-full py-2 px-3 mb-2'
            placeholder='Total Cook Time. Includes misc time. (in minutes)'
            value={fields.totalTime}
            onChange={handleChange}
          />
          <input
            type='number'
            id='servings'
            name='servings'
            className='border rounded w-full py-2 px-3 mb-2'
            placeholder='How many servings does this dish provie?'
            value={fields.servings}
            onChange={handleChange}
          />
        </div>

        <div className='mb-4 flex flex-wrap'>
          <div className='w-full sm:w-1/3 pr-2'>
            <label
              htmlFor='calories'
              className='block text-gray-700 font-bold mb-2'
            >
              Calories
            </label>
            <input
              type='number'
              id='calories'
              name='nutritionInfo.calories'
              className='border rounded w-full py-2 px-3'
              value={fields.nutritionInfo.calories}
              onChange={handleChange}
            />
          </div>
          <div className='w-full sm:w-1/3 px-2'>
            <label htmlFor='fat' className='block text-gray-700 font-bold mb-2'>
              Fat
            </label>
            <input
              type='number'
              id='fat'
              name='nutritionInfo.fat'
              className='border rounded w-full py-2 px-3'
              value={fields.nutritionInfo.fat}
              onChange={handleChange}
            />
          </div>
          <div className='w-full sm:w-1/3 pl-2'>
            <label
              htmlFor='carbs'
              className='block text-gray-700 font-bold mb-2'
            >
              Carbs
            </label>
            <input
              type='number'
              id='carbs'
              name='nutritionInfo.carbs'
              className='border rounded w-full py-2 px-3'
              value={fields.nutritionInfo.carbs}
              onChange={handleChange}
            />
          </div>
          <div className='w-full sm:w-1/3 px-2'>
            <label
              htmlFor='protein'
              className='block text-gray-700 font-bold mb-2'
            >
              Protein
            </label>
            <input
              type='number'
              id='prrotein'
              name='nutritionInfo.protein'
              className='border rounded w-full py-2 px-3'
              value={fields.nutritionInfo.protein}
              onChange={handleChange}
            />
          </div>
          <div className='w-full sm:w-1/3 pl-2'>
            <label
              htmlFor='sugar'
              className='block text-gray-700 font-bold mb-2'
            >
              Sugars
            </label>
            <input
              type='number'
              id='sugar'
              name='nutritionInfo.sugars'
              className='border rounded w-full py-2 px-3'
              value={fields.nutritionInfo.sugars}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className='mb-4'>
          <h3 className='text-lg font-bold my-6 bg-gray-800 text-white p-2'>
            Ingredients
          </h3>
          <div className='ml-5 '>
            <textarea
              id='ingredients'
              name='ingredients'
              className='border rounded w-full py-2 px-3'
              rows='10'
              placeholder='Add ingredients, each one on a separate line'
              value={fields.ingredients}
              onChange={handleIngredientsChange}
            ></textarea>
          </div>
        </div>

        <div className='mb-4'>
          <h3 className='text-lg font-bold my-6 bg-gray-800 text-white p-2'>
            Directions
          </h3>
          <div className='ml-5 '>
            <textarea
              id='directions'
              name='directions'
              className='border rounded w-full py-2 px-3'
              rows='10'
              cols={50}
              placeholder='Add cokking directions, each one on a separate line'
              value={fields.directions}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>

        <div className='mb-4'>
          <label
            htmlFor='images'
            className='block text-gray-700 font-bold mb-2'
          >
            Images (Select up to 2 images)
          </label>
          <input
            type='file'
            id='images'
            name='images'
            className='border rounded w-full py-2 px-3'
            accept='image/*'
            multiple
            onChange={handleImageChange}
            required
          />
          <div>
            {invalidImageCount && (
              <p className='text-red-500'>
                Please do not select more than 2 files.
              </p>
            )}
          </div>
        </div>

        <div>
          <button
            className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline'
            type='submit'
          >
            Add Property
          </button>
        </div>
      </form>
    )
  );
};

export default RecipeAddForm;
