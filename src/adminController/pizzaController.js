import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const addPizza = async (req, res) => {
  try {
    const {
      name,
      description,
      imageUrl,
      category,
      sizes, // Expecting { SMALL: price, MEDIUM: price, LARGE: price }
      toppings, // Array of objects [{ id: "topping_id", quantity: 2 }, ...]
      ingredients, // Array of objects [{ id: "ingredient_id", quantity: 3 }, ...]
    } = req.body;

    const categoryRecord = await prisma.category.findUnique({
      where: { id: category }, // Ensure 'category' is an ID
    });

    if (!categoryRecord) {
      return res.status(404).json({ error: "Category not found" });
    }

    // 🚀 Perform all DB operations in a transaction
    const pizza = await prisma.$transaction(async (tx) => {
      // 1️ Create Pizza
      const newPizza = await tx.pizza.create({
        data: {
          name,
          description,
          imageUrl,
          category: { connect: { id: category } },
          sizes,
        },
      });

      // 2️ Fetch Toppings from ToppingsList
      const toppingIds = toppings.map((t) => t.id);
      const toppingRecords = await tx.toppingsList.findMany({
        where: { id: { in: toppingIds } },
      });

      // 3️ Fetch Ingredients from IngredientsList
      const ingredientIds = ingredients.map((i) => i.id);
      const ingredientRecords = await tx.ingredientsList.findMany({
        where: { id: { in: ingredientIds } },
      });

      // 4️ Create DefaultToppings linked to this Pizza
      const defaultToppings = toppings.map((t) => {
        const toppingData = toppingRecords.find((top) => top.id === t.id);
        if (!toppingData) throw new Error(`Topping ID ${t.id} not found`);

        return {
          name: toppingData.name,
          price: toppingData.price,
          quantity: t.quantity, // Admin-defined quantity
          include: true, // Admin decides this
          pizzaId: newPizza.id,
          toppingId: toppingData.id,
        };
      });
      await tx.defaultToppings.createMany({ data: defaultToppings });

      // 5️ Create DefaultIngredients linked to this Pizza
      const defaultIngredients = ingredients.map((i) => {
        const ingredientData = ingredientRecords.find((ing) => ing.id === i.id);
        if (!ingredientData) throw new Error(`Ingredient ID ${i.id} not found`);

        return {
          name: ingredientData.name,
          price: ingredientData.price,
          quantity: i.quantity, // Admin-defined quantity
          include: true,
          pizzaId: newPizza.id,
          ingredientId: ingredientData.id,
        };
      });
      await tx.defaultIngredients.createMany({ data: defaultIngredients });

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
      sizes, // Expecting { SMALL: price, MEDIUM: price, LARGE: price }
      toppings, // Array of objects [{ id: "topping_id", quantity: 2 }, ...]
      ingredients, // Array of objects [{ id: "ingredient_id", quantity: 3 }, ...]
    } = req.body;

    const existingPizza = await prisma.pizza.findUnique({
      where: { id: pizzaId },
    });

    if (!existingPizza) {
      return res.status(404).json({ error: "Pizza not found" });
    }

    // 2️ If updating category, check if it exists
    if (category) {
      const categoryRecord = await prisma.category.findUnique({
        where: { id: category },
      });

      if (!categoryRecord) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    // 3️ Perform all DB operations in a transaction
    const updatedPizza = await prisma.$transaction(async (tx) => {
      // 4️ Update Pizza Details
      const pizza = await tx.pizza.update({
        where: { id: pizzaId },
        data: {
          name,
          description,
          imageUrl,
          category: category ? { connect: { id: category } } : undefined,
          sizes,
        },
      });

      // 5️ Update Toppings
      if (toppings) {
        // Fetch existing toppings linked to the pizza
        await tx.defaultToppings.deleteMany({ where: { pizzaId } });

        const toppingIds = toppings.map((t) => t.id);
        const toppingRecords = await tx.toppingsList.findMany({
          where: { id: { in: toppingIds } },
        });

        const newToppings = toppings.map((t) => {
          const toppingData = toppingRecords.find((top) => top.id === t.id);
          if (!toppingData) throw new Error(`Topping ID ${t.id} not found`);

          return {
            name: toppingData.name,
            price: toppingData.price,
            quantity: t.quantity,
            include: true,
            pizzaId: pizza.id,
            toppingId: toppingData.id,
          };
        });

        await tx.defaultToppings.createMany({ data: newToppings });
      }

      // 6️ Update Ingredients
      if (ingredients) {
        // Remove existing ingredients
        await tx.defaultIngredients.deleteMany({ where: { pizzaId } });

        const ingredientIds = ingredients.map((i) => i.id);
        const ingredientRecords = await tx.ingredientsList.findMany({
          where: { id: { in: ingredientIds } },
        });

        const newIngredients = ingredients.map((i) => {
          const ingredientData = ingredientRecords.find(
            (ing) => ing.id === i.id
          );
          if (!ingredientData)
            throw new Error(`Ingredient ID ${i.id} not found`);

          return {
            name: ingredientData.name,
            price: ingredientData.price,
            quantity: i.quantity,
            include: true,
            pizzaId: pizza.id,
            ingredientId: ingredientData.id,
          };
        });

        await tx.defaultIngredients.createMany({ data: newIngredients });
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

    // 2️⃣ Check if the Pizza exists
    const existingPizza = await prisma.pizza.findUnique({
      where: { id: pizzaId },
    });

    if (!existingPizza) {
      return res.status(404).json({ error: "Pizza not found" });
    }

    // 3️⃣ Delete Pizza (Cascade deletes DefaultToppings & DefaultIngredients)
    await prisma.pizza.delete({
      where: { id: pizzaId },
    });

    return res.status(200).json({ message: "Pizza deleted successfully" });
  } catch (error) {
    console.error("Error deleting pizza:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllPizzas = async (req, res) => {
  try {
    //  Fetch Pizzas with Correct Relations
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
