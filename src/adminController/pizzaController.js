import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const addPizza = async (req, res) => {
  try {
    const {
      name,
      description,
      imageUrl,
      category,
      sizes,
      toppings,
      ingredients,
    } = req.body;

    const categoryRecord = await prisma.category.findUnique({
      where: { id: category },
    });

    if (!categoryRecord) {
      return res.status(404).json({ error: "Category not found" });
    }

    const pizza = await prisma.$transaction(async (tx) => {
      const newPizza = await tx.pizza.create({
        data: {
          name,
          description,
          imageUrl,
          categoryId: category, // Directly setting categoryId
          sizes,
        },
      });

      if (toppings.length) {
        const toppingRecords = await tx.toppingsList.findMany({
          where: { id: { in: toppings.map((t) => t.id) } },
        });

        if (toppingRecords.length !== toppings.length) {
          throw new Error("Some toppings not found");
        }

        await tx.defaultToppings.createMany({
          data: toppings.map((t) => ({
            name: toppingRecords.find((top) => top.id === t.id).name,
            price: toppingRecords.find((top) => top.id === t.id).price,
            quantity: t.quantity,
            include: true,
            pizzaId: newPizza.id,
            toppingId: t.id,
          })),
        });
      }

      if (ingredients.length) {
        const ingredientRecords = await tx.ingredientsList.findMany({
          where: { id: { in: ingredients.map((i) => i.id) } },
        });

        if (ingredientRecords.length !== ingredients.length) {
          throw new Error("Some ingredients not found");
        }

        await tx.defaultIngredients.createMany({
          data: ingredients.map((i) => ({
            name: ingredientRecords.find((ing) => ing.id === i.id).name,
            price: ingredientRecords.find((ing) => ing.id === i.id).price,
            quantity: i.quantity,
            include: true,
            pizzaId: newPizza.id,
            ingredientId: i.id,
          })),
        });
      }

      return newPizza;
    });

    return res.status(201).json({ message: "Pizza added successfully", pizza });
  } catch (error) {
    console.error("Error adding pizza:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updatePizza = async (req, res) => {
  try {
    const {
      pizzaId,
      name,
      description,
      imageUrl,
      category,
      sizes,
      toppings,
      ingredients,
    } = req.body;

    const existingPizza = await prisma.pizza.findUnique({
      where: { id: pizzaId },
    });

    if (!existingPizza) {
      return res.status(404).json({ error: "Pizza not found" });
    }

    if (category) {
      const categoryRecord = await prisma.category.findUnique({
        where: { id: category },
      });
      if (!categoryRecord) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    const updatedPizza = await prisma.$transaction(async (tx) => {
      const pizza = await tx.pizza.update({
        where: { id: pizzaId },
        data: {
          name,
          description,
          imageUrl,
          categoryId: category || existingPizza.categoryId,
          sizes: sizes || existingPizza.sizes,
        },
      });

      if (toppings) {
        await tx.defaultToppings.deleteMany({ where: { pizzaId } });

        const toppingRecords = await tx.toppingsList.findMany({
          where: { id: { in: toppings.map((t) => t.id) } },
        });

        if (toppingRecords.length !== toppings.length) {
          throw new Error("Some toppings not found");
        }

        await tx.defaultToppings.createMany({
          data: toppings.map((t) => ({
            name: toppingRecords.find((top) => top.id === t.id).name,
            price: toppingRecords.find((top) => top.id === t.id).price,
            quantity: t.quantity,
            include: true,
            pizzaId: pizza.id,
            toppingId: t.id,
          })),
        });
      }

      if (ingredients) {
        await tx.defaultIngredients.deleteMany({ where: { pizzaId } });

        const ingredientRecords = await tx.ingredientsList.findMany({
          where: { id: { in: ingredients.map((i) => i.id) } },
        });

        if (ingredientRecords.length !== ingredients.length) {
          throw new Error("Some ingredients not found");
        }

        await tx.defaultIngredients.createMany({
          data: ingredients.map((i) => ({
            name: ingredientRecords.find((ing) => ing.id === i.id).name,
            price: ingredientRecords.find((ing) => ing.id === i.id).price,
            quantity: i.quantity,
            include: true,
            pizzaId: pizza.id,
            ingredientId: i.id,
          })),
        });
      }

      return pizza;
    });

    return res
      .status(200)
      .json({ message: "Pizza updated successfully", updatedPizza });
  } catch (error) {
    console.error("Error updating pizza:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deletePizza = async (req, res) => {
  try {
    const { pizzaId } = req.body;

    const existingPizza = await prisma.pizza.findUnique({
      where: { id: pizzaId },
    });

    if (!existingPizza) {
      return res.status(404).json({ error: "Pizza not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.defaultToppings.deleteMany({ where: { pizzaId } });
      await tx.defaultIngredients.deleteMany({ where: { pizzaId } });
      await tx.pizza.delete({ where: { id: pizzaId } });
    });

    return res.status(200).json({ message: "Pizza deleted successfully" });
  } catch (error) {
    console.error("Error deleting pizza:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllPizzas = async (req, res) => {
  try {
    const pizzas = await prisma.pizza.findMany({
      include: {
        category: true,
        defaultToppings: {
          include: { topping: true },
        },
        defaultIngredients: {
          include: { ingredient: true },
        },
      },
    });

    return res
      .status(200)
      .json({ message: "Pizzas retrieved successfully", pizzas });
  } catch (error) {
    console.error("Error fetching pizzas:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export { addPizza, updatePizza, deletePizza, getAllPizzas };
