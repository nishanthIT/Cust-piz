import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const addIngredient = async (req, res) => {
  try {
    const adminId = req.params.id;
    const { name, price } = req.body;

    const checkAdmin = await prisma.admin.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!checkAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const addIngredients = await prisma.ingredientsList.create({
      data: {
        name: name,
        price: price,
      },
    });
    return res
      .status(201)
      .json({ message: "Topping added successfully", data: addIngredients });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateIngredient = async (req, res) => {
  try {
    const adminId = req.params.id;
    const { id, name, price, status } = req.body;

    const checkAdmin = await prisma.admin.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!checkAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const checkIngredient = await prisma.ingredientsList.findUnique({
      where: {
        id: id,
      },
    });

    if (!checkIngredient) {
      return res.status(404).json({ message: "Topping not found" });
    }

    const updateTopping = await prisma.ingredientsList.update({
      where: {
        id: id,
      },
      data: {
        name: name,
        price: price,
        status: status,
      },
    });
    return res
      .status(201)
      .json({ message: "Topping updated successfully", data: updateTopping });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteIngredient = async (req, res) => {
  try {
    const adminId = req.params.id;
    const { id } = req.body;

    const checkAdmin = await prisma.admin.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!checkAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const checkIngredient = await prisma.ingredientsList.findUnique({
      where: {
        id: id,
      },
    });

    if (!checkIngredient) {
      return res.status(404).json({ message: "Topping not found" });
    }

    const deleteIngredient = await prisma.ingredientsList.delete({
      where: {
        id: id,
      },
    });
    return res.status(201).json({
      message: "Topping deleted successfully",
      data: deleteIngredient,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getIngredients = async (req, res) => {
  try {
    const adminId = req.params.id;

    const checkAdmin = await prisma.admin.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!checkAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const ingredients = await prisma.ingredientsList.findMany();
    return res
      .status(200)
      .json({ message: "Toppings fetched successfully", data: ingredients });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { addIngredient, updateIngredient, deleteIngredient, getIngredients };
