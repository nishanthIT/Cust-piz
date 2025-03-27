import express from "express";
import {
  addTopping,
  deleteTopping,
  getToppings,
  updateStatusinTopping,
  updateTopping,
} from "../adminController/toppings.js";
import {
  addIngredient,
  deleteIngredient,
  getIngredients,
  updateIngredient,
  updateStatusinIngredient,
} from "../adminController/ingredients.js";
import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../adminController/category.js";
import {
  addPizza,
  deletePizza,
  getAllPizzas,
  updatePizza,
} from "../adminController/pizzaController.js";
import {
  addComboOffer,
  deleteComboOffer,
  getComboOffer,
} from "../adminController/comboOffers.js";

const router = express.Router();

// admin topping
router.post("/addTopping", addTopping);
router.put("/updateTopping", updateTopping);
router.put("/updateStatusTopping", updateStatusinTopping);
router.delete("/deleteTopping", deleteTopping);
router.get("/getToppings", getToppings);

// admin ingredients
router.post("/addIngredient", addIngredient);
router.put("/updateIngredient", updateIngredient);
router.put("/updateStatusIngredient", updateStatusinIngredient);
router.delete("/deleteIngredient", deleteIngredient);
router.get("/getIngredients", getIngredients);

// admin category
router.post("/addCategory", addCategory);
router.put("/updateCategory", updateCategory);
router.delete("/deleteCategory", deleteCategory);
router.get("/getCategories", getCategories);

// admin pizza
router.post("/addPizza", addPizza);
router.put("/updatePizza", updatePizza);
router.delete("/deletePizza", deletePizza);
router.get("/getAllPizzas", getAllPizzas);

// admin combo
router.post("/addComboOffer", addComboOffer);
router.get("/getComboOffer", getComboOffer);
router.delete("/deleteComboOffer/:comboId", deleteComboOffer);

export default router;
