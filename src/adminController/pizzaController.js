import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const addPizza = async (req, res) => {
  try {
    const adminId = req.params.id;

    const checkAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!checkAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const {
      name,
      description,
      price,
      imageUrl,
      category,
      size,
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
          price,
          imageUrl,
          category: { connect: { id: category } },
          sizes: size,
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
    const { pizzaId, adminId } = req.params; // Extract adminId from params

    // 1️ Check if the Admin exists
    const checkAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!checkAdmin) {
      return res.status(403).json({ error: "Unauthorized: Admin not found" });
    }

    const {
      name,
      description,
      price,
      imageUrl,
      category,
      size,
      toppings, // Array of objects [{ id: "topping_id", quantity: 2 }, ...]
      ingredients, // Array of objects [{ id: "ingredient_id", quantity: 3 }, ...]
    } = req.body;

    const existingPizza = await prisma.pizza.findUnique({
      where: { id: pizzaId },
    });

    if (!existingPizza) {
      return res.status(404).json({ error: "Pizza not found" });
    }

    // 2️⃣ If updating category, check if it exists
    if (category) {
      const categoryRecord = await prisma.category.findUnique({
        where: { id: category },
      });

      if (!categoryRecord) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    // 3️⃣ Perform all DB operations in a transaction
    const updatedPizza = await prisma.$transaction(async (tx) => {
      // 4️⃣ Update Pizza Details
      const pizza = await tx.pizza.update({
        where: { id: pizzaId },
        data: {
          name,
          description,
          price,
          imageUrl,
          category: category ? { connect: { id: category } } : undefined,
          sizes: size,
        },
      });

      // 5️⃣ Update Toppings
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

      // 6️⃣ Update Ingredients
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
    const { adminId, pizzaId } = req.params; // Get adminId and pizzaId from URL

    // 1️⃣ Check if the Admin exists
    const checkAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!checkAdmin) {
      return res.status(403).json({ error: "Unauthorized: Admin not found" });
    }

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
    const { adminId } = req.params;

    // ✅ Check if Admin exists
    const checkAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!checkAdmin) {
      return res.status(403).json({ error: "Unauthorized: Admin not found" });
    }

    // ✅ Fetch Pizzas with Correct Relations
    const pizzas = await prisma.pizza.findMany({
      include: {
        category: true,
        defaultToppings: {
          include: { topping: true }, // Ensure relation name matches schema
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
