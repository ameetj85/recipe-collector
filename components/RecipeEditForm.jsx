"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { fetchRecipe, fetchRecipes } from "@/utils/requests";

const RecipeEditForm = () => {
  const { id } = useParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [fields, setFields] = useState({
    owner: "",
    name: "",
    description: "",
    url: "",
    starRating: "",
    category: "",
    type: "",
    isFeatured: false,
    prepTime: 0,
    cookTime: 0,
    totalTime: 0,
    servings: 0,
    directions: "",
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

  const [loading, setLoading] = useState(true);

  const handleIngredientsChange = (e) => {
    setFields((prevFields) => ({
      ...prevFields,
      ingredients: e.target.value,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // check if this is a nested recipe, eg. nutritionInfo.protein, etc
    if (name.includes(".")) {
      const [outerKey, innerKey] = name.split(".");
      setFields((prevFields) => ({
        ...prevFields,
        [outerKey]: {
          ...prevFields[outerKey],
          [innerKey]: value,
        },
      }));
    } else {
      // not nested recipe
      setFields((prevFields) => ({
        ...prevFields,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.target);

      const res = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (res.status === 200) {
        router.push(`/recipes/${id}`);
      } else if (res.status === 401 || res.status === 403) {
        toast.error("Permission denied.");
      } else {
        toast.error("Something went wrong.");
      }
    } catch (error) {
      toast.error("Something went wrong.");
      console.log(error);
    }
  };

  // this prevents console warnings to show up at runtime complaining about html and server.
  useEffect(() => {
    setMounted(true);

    // fetch recipe data for form
    const fetchRecipeData = async () => {
      try {
        const recipeData = await fetchRecipe(id);
        setFields(recipeData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeData();
  }, []);

  return (
    mounted && (
      <form onSubmit={handleSubmit}>
        <h2 className="text-3xl text-center font-semibold mb-6">Add Recipe</h2>

        <div className="mb-4">
          <label htmlFor="type" className="block text-gray-700 font-bold mb-2">
            Recipe Type
          </label>
          <select
            id="type"
            name="type"
            className="border rounded w-full py-2 px-3"
            required
            value={fields.type}
            onChange={handleChange}
          >
            <option value="Chicken">Chicken</option>
            <option value="Beef">Beef</option>
            <option value="Fish">Fish</option>
            <option value="Mutton">Mutton</option>
            <option value="Venison">Venison</option>
            <option value="Pork">Pork</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="type" className="block text-gray-700 font-bold mb-2">
            Cusisine Category
          </label>
          <select
            id="category"
            name="category"
            className="border rounded w-full py-2 px-3"
            required
            value={fields.category}
            onChange={handleChange}
          >
            <option value="American">American</option>
            <option value="Chinese">Chinese</option>
            <option value="Cuban">Cuban</option>
            <option value="French">French</option>
            <option value="Greek">Greek</option>
            <option value="Japanese">Japanese</option>
            <option value="Indian">Indian</option>
            <option value="Italian">Italian</option>
            <option value="Mexican">Mexican</option>
            <option value="Thai">Thai</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Recipe Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="border rounded w-full py-2 px-3 mb-2"
            placeholder="eg. Delicious Chocolate Chip Cookies"
            required
            value={fields.name}
            onChange={handleChange}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            URL / Website of original recipe information
          </label>
          <input
            type="text"
            id="url"
            name="url"
            className="border rounded w-full py-2 px-3 mb-2"
            placeholder="url to original recipe"
            required
            value={fields.url}
            onChange={handleChange}
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-gray-700 font-bold mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className="border rounded w-full py-2 px-3"
            rows="4"
            placeholder="Add an optional description of your recipe"
            value={fields.description}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Star Rating
          </label>
          <input
            type="number"
            id="starRating"
            name="starRating"
            className="border rounded w-full py-2 px-3 mb-2"
            placeholder="Telkl us how much you loved this recipe. Between 1 and 5 stars."
            required
            value={fields.starRating}
            onChange={handleChange}
          />
        </div>

        <label className="block text-gray-700 font-bold mb-2">
          Prep and Cook Times
        </label>
        <div className="mb-4 bg-blue-50 p-4">
          <label
            htmlFor="prepTime"
            className="block text-gray-700 font-bold mb-2"
          >
            Preparation Time (minutes)
          </label>
          <input
            type="number"
            id="prepTime"
            name="prepTime"
            className="border rounded w-full py-2 px-3 mb-2"
            placeholder="Preparation Time (in minutes)"
            value={fields.prepTime}
            onChange={handleChange}
          />
          <label
            htmlFor="cookTime"
            className="block text-gray-700 font-bold mb-2"
          >
            Cooking Time (minutes)
          </label>
          <input
            type="number"
            id="cookTime"
            name="cookTime"
            className="border rounded w-full py-2 px-3 mb-2"
            placeholder="Total Cook Time (in minutes)"
            value={fields.cookTime}
            onChange={handleChange}
          />
          <label
            htmlFor="totalTime"
            className="block text-gray-700 font-bold mb-2"
          >
            Total Time (minutes)
          </label>
          <input
            type="number"
            id="totalTime"
            name="totalTime"
            className="border rounded w-full py-2 px-3 mb-2"
            placeholder="Total Cook Time. Includes misc time. (in minutes)"
            value={fields.totalTime}
            onChange={handleChange}
          />
          <label
            htmlFor="servings"
            className="block text-gray-700 font-bold mb-2"
          >
            Number of Servings
          </label>
          <input
            type="number"
            id="servings"
            name="servings"
            className="border rounded w-full py-2 px-3 mb-2"
            placeholder="How many servings does this dish provie?"
            value={fields.servings}
            onChange={handleChange}
          />
        </div>

        <div className="mb-4 flex flex-wrap">
          <div className="w-full sm:w-1/3 pr-2">
            <label
              htmlFor="calories"
              className="block text-gray-700 font-bold mb-2"
            >
              Calories
            </label>
            <input
              type="number"
              id="calories"
              name="nutritionInfo.calories"
              className="border rounded w-full py-2 px-3"
              value={fields.nutritionInfo.calories}
              placeholder="Calories"
              onChange={handleChange}
            />
          </div>
          <div className="w-full sm:w-1/3 px-2">
            <label htmlFor="fat" className="block text-gray-700 font-bold mb-2">
              Fat
            </label>
            <input
              type="number"
              id="fat"
              name="nutritionInfo.fat"
              className="border rounded w-full py-2 px-3"
              value={fields.nutritionInfo.fat}
              placeholder="Fat"
              onChange={handleChange}
            />
          </div>
          <div className="w-full sm:w-1/3 pl-2">
            <label
              htmlFor="carbs"
              className="block text-gray-700 font-bold mb-2"
            >
              Carbs
            </label>
            <input
              type="number"
              id="carbs"
              name="nutritionInfo.carbs"
              className="border rounded w-full py-2 px-3"
              value={fields.nutritionInfo.carbs}
              placeholder="Carbs"
              onChange={handleChange}
            />
          </div>
          <div className="w-full sm:w-1/3 px-2">
            <label
              htmlFor="protein"
              className="block text-gray-700 font-bold mb-2"
            >
              Protein
            </label>
            <input
              type="number"
              id="prrotein"
              name="nutritionInfo.protein"
              className="border rounded w-full py-2 px-3"
              value={fields.nutritionInfo.protein}
              onChange={handleChange}
              placeholder="Protein"
            />
          </div>
          <div className="w-full sm:w-1/3 pl-2">
            <label
              htmlFor="sugar"
              className="block text-gray-700 font-bold mb-2"
            >
              Sugars
            </label>
            <input
              type="number"
              id="sugar"
              name="nutritionInfo.sugars"
              className="border rounded w-full py-2 px-3"
              value={fields.nutritionInfo.sugars}
              onChange={handleChange}
              placeholder="Sugar"
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-bold my-6 bg-gray-800 text-white p-2">
            Ingredients
          </h3>
          <div className="ml-5 ">
            <textarea
              id="ingredients"
              name="ingredients"
              className="border rounded w-full py-2 px-3"
              rows="10"
              placeholder="Add ingredients, each one on a separate line"
              value={fields.ingredients}
              onChange={handleIngredientsChange}
            ></textarea>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-bold my-6 bg-gray-800 text-white p-2">
            Directions
          </h3>
          <div className="ml-5 ">
            <textarea
              id="directions"
              name="directions"
              className="border rounded w-full py-2 px-3"
              rows="10"
              cols={50}
              placeholder="Add cooking directions, each one on a separate line"
              value={fields.directions}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>

        <div>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Update Recipe
          </button>
        </div>
      </form>
    )
  );
};

export default RecipeEditForm;
