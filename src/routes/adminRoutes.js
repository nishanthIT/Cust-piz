import express from "express";
import {
  addTopping,
  deleteTopping,
  getToppings,
  updateTopping,
} from "../adminController/toppings.js";
import {
  addIngredient,
  deleteIngredient,
  getIngredients,
  updateIngredient,
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

const router = express.Router();

// admin topping
router.post("/addTopping/:id", addTopping);
router.put("/updateTopping/:id", updateTopping);
router.delete("/deleteTopping/:id", deleteTopping);
router.get("/getToppings/:id", getToppings);

// admin ingredients
router.post("/addIngredient/:id", addIngredient);
router.put("/updateIngredient/:id", updateIngredient);
router.delete("/deleteIngredient/:id", deleteIngredient);
router.get("/getIngredients/:id", getIngredients);

// admin category
router.post("/addCategory/:id", addCategory);
router.put("/updateCategory/:id", updateCategory);
router.delete("/deleteCategory/:id", deleteCategory);
router.get("/getCategories/:id", getCategories);

// admin pizza
router.post("/addPizza/:id", addPizza);
router.put("/updatePizza/:adminId/:pizzaId", updatePizza);
router.delete("/deletePizza/:adminId/:pizzaId", deletePizza);
router.get("/getAllPizzas/:adminId", getAllPizzas);

export default router;
