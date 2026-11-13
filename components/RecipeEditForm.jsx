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
  const [invalidImageCount, setInvalidImageCount] = useState(false);

  const handleImageChange = (e) => {
    setInvalidImageCount(e.target.files.length > 2);
  };

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
        if (!recipeData) return;

        // ingredients are stored as an array; the textarea needs one per line
        // (otherwise React joins the array with commas and saving merges them)
        setFields({
          ...recipeData,
          ingredients: Array.isArray(recipeData.ingredients)
            ? recipeData.ingredients.map((i) => i.trim()).join("\n")
            : recipeData.ingredients || "",
        });
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
        <h2 className="font-display text-4xl text-center font-bold gradient-text mb-10">Edit Recipe</h2>

        <div className="form-group">
          <label htmlFor="type" className="form-label">
            Recipe Type
          </label>
          <select
            id="type"
            name="type"
            className="form-input"
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

        <div className="form-group">
          <label htmlFor="type" className="form-label">
            Cusisine Category
          </label>
          <select
            id="category"
            name="category"
            className="form-input"
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
        <div className="form-group">
          <label className="form-label">
            Recipe Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-input mb-3"
            placeholder="eg. Delicious Chocolate Chip Cookies"
            required
            value={fields.name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            URL / Website of original recipe information
          </label>
          <input
            type="text"
            id="url"
            name="url"
            className="form-input mb-3"
            placeholder="url to original recipe"
            required
            value={fields.url}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label
            htmlFor="description"
            className="form-label"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className="form-input"
            rows="4"
            placeholder="Add an optional description of your recipe"
            value={fields.description}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-group">
          <label className="form-label">
            Star Rating
          </label>
          <input
            type="number"
            id="starRating"
            name="starRating"
            className="form-input mb-3"
            placeholder="Telkl us how much you loved this recipe. Between 1 and 5 stars."
            required
            value={fields.starRating}
            onChange={handleChange}
          />
        </div>

        <label className="form-label">
          Prep and Cook Times
        </label>
        <div className="form-section">
          <label
            htmlFor="prepTime"
            className="form-label"
          >
            Preparation Time (minutes)
          </label>
          <input
            type="number"
            id="prepTime"
            name="prepTime"
            className="form-input mb-3"
            placeholder="Preparation Time (in minutes)"
            value={fields.prepTime}
            onChange={handleChange}
          />
          <label
            htmlFor="cookTime"
            className="form-label"
          >
            Cooking Time (minutes)
          </label>
          <input
            type="number"
            id="cookTime"
            name="cookTime"
            className="form-input mb-3"
            placeholder="Total Cook Time (in minutes)"
            value={fields.cookTime}
            onChange={handleChange}
          />
          <label
            htmlFor="totalTime"
            className="form-label"
          >
            Total Time (minutes)
          </label>
          <input
            type="number"
            id="totalTime"
            name="totalTime"
            className="form-input mb-3"
            placeholder="Total Cook Time. Includes misc time. (in minutes)"
            value={fields.totalTime}
            onChange={handleChange}
          />
          <label
            htmlFor="servings"
            className="form-label"
          >
            Number of Servings
          </label>
          <input
            type="number"
            id="servings"
            name="servings"
            className="form-input mb-3"
            placeholder="How many servings does this dish provie?"
            value={fields.servings}
            onChange={handleChange}
          />
        </div>

        <h3 className="form-heading">Nutrition Information</h3>
        <div className="form-section grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="w-full">
            <label
              htmlFor="calories"
              className="form-label"
            >
              Calories
            </label>
            <input
              type="number"
              id="calories"
              name="nutritionInfo.calories"
              className="form-input"
              value={fields.nutritionInfo.calories}
              placeholder="Calories"
              onChange={handleChange}
            />
          </div>
          <div className="w-full">
            <label htmlFor="fat" className="form-label">
              Fat
            </label>
            <input
              type="number"
              id="fat"
              name="nutritionInfo.fat"
              className="form-input"
              value={fields.nutritionInfo.fat}
              placeholder="Fat"
              onChange={handleChange}
            />
          </div>
          <div className="w-full">
            <label
              htmlFor="carbs"
              className="form-label"
            >
              Carbs
            </label>
            <input
              type="number"
              id="carbs"
              name="nutritionInfo.carbs"
              className="form-input"
              value={fields.nutritionInfo.carbs}
              placeholder="Carbs"
              onChange={handleChange}
            />
          </div>
          <div className="w-full">
            <label
              htmlFor="protein"
              className="form-label"
            >
              Protein
            </label>
            <input
              type="number"
              id="prrotein"
              name="nutritionInfo.protein"
              className="form-input"
              value={fields.nutritionInfo.protein}
              onChange={handleChange}
              placeholder="Protein"
            />
          </div>
          <div className="w-full">
            <label
              htmlFor="sugar"
              className="form-label"
            >
              Sugars
            </label>
            <input
              type="number"
              id="sugar"
              name="nutritionInfo.sugars"
              className="form-input"
              value={fields.nutritionInfo.sugars}
              onChange={handleChange}
              placeholder="Sugar"
            />
          </div>
        </div>

        <div className="form-group">
          <h3 className="form-heading">
            Ingredients
          </h3>
          <div className="">
            <textarea
              id="ingredients"
              name="ingredients"
              className="form-input"
              rows="10"
              placeholder="Add ingredients, each one on a separate line"
              value={fields.ingredients}
              onChange={handleIngredientsChange}
            ></textarea>
          </div>
        </div>

        <div className="form-group">
          <h3 className="form-heading">
            Directions
          </h3>
          <div className="">
            <textarea
              id="directions"
              name="directions"
              className="form-input"
              rows="10"
              cols={50}
              placeholder="Add cooking directions, each one on a separate line"
              value={fields.directions}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>

        <div className="form-group">
          <label
            htmlFor="images"
            className="form-label"
          >
            Replace Images (optional, up to 2)
          </label>
          <p className="text-sm text-slate-500 mb-2">
            Leave empty to keep the current images. Selecting new images
            replaces all existing ones.
          </p>
          <input
            type="file"
            id="images"
            name="images"
            className="form-input"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          {invalidImageCount && (
            <p className="mt-2 text-sm font-medium text-rose-600">
              Only the first 2 selected images will be used.
            </p>
          )}
        </div>

        <div>
          <button
            className="btn-primary w-full py-3.5 text-lg mt-4"
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
