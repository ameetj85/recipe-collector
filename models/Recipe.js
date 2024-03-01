import { Schema, model, models } from 'mongoose';

const RecipeSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    url: {
      type: String,
      required: false,
    },
    starRating: {
      type: String,
      required: true,
      default: '1',
    },
    category: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    prepTime: {
      type: Number,
      default: 0,
    },
    cookTime: {
      type: Number,
      default: 0,
    },
    totalTime: {
      type: Number,
      default: 0,
    },
    servings: {
      type: Number,
      default: 0,
    },
    nutritionInfo: {
      calories: {
        type: Number,
        default: 0,
      },
      fat: {
        type: Number,
        default: 0,
      },
      carbs: {
        type: Number,
        default: 0,
      },
      protein: {
        type: Number,
        default: 0,
      },
      sugars: {
        type: Number,
        default: 0,
      },
    },
    ingredients: [
      {
        type: String,
      },
    ],
    directions: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Recipe = models.Recipe || model('Recipe', RecipeSchema);

export default Recipe;
