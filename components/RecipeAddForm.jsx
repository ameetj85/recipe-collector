"use client";

import React, { useState, useEffect, useActionState, useTransition, useRef } from "react";
import { toast } from "react-toastify";
import { addRecipe } from "@/app/actions/recipes";
import { importRecipeFromUrl } from "@/app/actions/import";
import { toImportUrl, parseRecipePage } from "@/utils/recipeImport";
import SubmitButton from "@/components/SubmitButton";

const RecipeAddForm = () => {
  // addRecipe redirects to the new recipe on success, or returns { error }
  const [formState, formAction] = useActionState(addRecipe, {});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (formState?.error) toast.error(formState.error);
  }, [formState]);
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

  // this prevents console warnings to show up at runtime complaining about html and server.
  useEffect(() => {
    setMounted(true);
    setInvalidImageCount(false);
  }, []);

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

  // "Import": scrape the Allrecipes page in the URL field (on the server) and
  // fill in whatever recipe fields it provides. If Allrecipes blocks the
  // server's request, the user can paste the page source instead; that is
  // parsed right here in the browser with the same parser.
  const [isImporting, startImport] = useTransition();
  const [showPaste, setShowPaste] = useState(false);
  const pasteRef = useRef(null); // uncontrolled: page source can be ~1 MB

  const applyImport = ({ fields: imported, missing }) => {
    setFields((prevFields) => ({
      ...prevFields,
      ...imported,
      ingredients: imported.ingredients
        ? imported.ingredients.join("\n")
        : prevFields.ingredients,
      nutritionInfo: {
        ...prevFields.nutritionInfo,
        ...imported.nutritionInfo,
      },
    }));

    if (missing.length) {
      toast.warn(`Imported, but the page had no ${missing.join(", ")}.`);
    } else {
      toast.success("Recipe imported. Review the fields before saving.");
    }
  };

  const handleImport = () => {
    if (!toImportUrl(fields.url)) {
      toast.error("Import only works with www.allrecipes.com recipe URLs.");
      return;
    }

    startImport(async () => {
      const result = await importRecipeFromUrl(fields.url);
      if (result.error) {
        toast.error(result.error);
        if (result.canPaste) setShowPaste(true);
        return;
      }
      setShowPaste(false);
      applyImport(result);
    });
  };

  const handlePasteImport = () => {
    const html = pasteRef.current?.value || "";
    if (!html.trim()) {
      toast.error("Paste the page source into the box first.");
      return;
    }

    const result = parseRecipePage(html);
    if (!result) {
      toast.error(
        "No recipe data found. Make sure you copied the whole page source (Ctrl+U, then Ctrl+A and Ctrl+C)."
      );
      return;
    }

    applyImport(result);
    pasteRef.current.value = "";
    setShowPaste(false);
  };

  const handleIngredientsChange = (e) => {
    setFields((prevFields) => ({
      ...prevFields,
      ingredients: e.target.value,
    }));
  };

  return (
    mounted && (
      <form action={formAction}>
        <h2 className="font-display text-4xl text-center font-bold gradient-text mb-10">Add Recipe</h2>

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
            Cuisine Category
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
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              id="url"
              name="url"
              className="form-input flex-1 min-w-0"
              placeholder="url to original recipe"
              required
              value={fields.url}
              onChange={handleChange}
            />
            <button
              type="button"
              className="btn-secondary shrink-0 px-5"
              title="scrape the web page pointed to by the url"
              onClick={handleImport}
              disabled={isImporting || !fields.url.trim()}
            >
              {isImporting ? "Importing..." : "Import"}
            </button>
          </div>

          {!showPaste && toImportUrl(fields.url) && (
            <button
              type="button"
              className="text-sm font-medium text-purple-600 hover:text-purple-800 underline underline-offset-2"
              onClick={() => setShowPaste(true)}
            >
              Or paste the page source instead
            </button>
          )}

          {showPaste && (
            <div className="rounded-xl bg-purple-50 p-4 ring-1 ring-purple-100">
              <p className="text-sm font-semibold text-purple-900">
                Import from the page source
              </p>
              <ol className="mt-2 mb-3 list-decimal pl-5 text-sm text-slate-600 space-y-0.5">
                <li>
                  Open the recipe in your browser
                  {fields.url && (
                    <>
                      {" "}(
                      <a
                        href={toImportUrl(fields.url) || fields.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-700 underline"
                      >
                        open it
                      </a>
                      )
                    </>
                  )}
                  .
                </li>
                <li>
                  Press <kbd>Ctrl</kbd>+<kbd>U</kbd> (Mac: <kbd>⌥</kbd><kbd>⌘</kbd><kbd>U</kbd>) to view the page source.
                </li>
                <li>
                  Select all (<kbd>Ctrl</kbd>+<kbd>A</kbd>), copy, and paste it below.
                </li>
              </ol>
              {/* No `name`: the pasted source is parsed here and never submitted. */}
              <textarea
                ref={pasteRef}
                id="pageSource"
                className="form-input font-mono text-xs"
                rows="5"
                placeholder="Paste the page source here"
                spellCheck={false}
                aria-label="Page source"
              ></textarea>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  className="btn-primary px-5 text-sm"
                  onClick={handlePasteImport}
                >
                  Import from pasted source
                </button>
                <button
                  type="button"
                  className="btn-secondary px-5 text-sm"
                  onClick={() => setShowPaste(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
            placeholder="Tell us how much you loved this recipe. Between 1 and 5 stars."
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
            placeholder="How many servings does this dish provide?"
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
              id="protein"
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
            Images (Select up to 2 images)
          </label>
          <input
            type="file"
            id="images"
            name="images"
            className="form-input"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            required
          />
          <div>
            {invalidImageCount && (
              <p className="mt-2 text-sm font-medium text-rose-600">
                Please do not select more than 2 files.
              </p>
            )}
          </div>
        </div>

        <div>
          <SubmitButton
            className="btn-primary w-full py-3.5 text-lg mt-4"
            pendingText="Adding Recipe..."
          >
            Add Recipe
          </SubmitButton>
        </div>
      </form>
    )
  );
};

export default RecipeAddForm;
