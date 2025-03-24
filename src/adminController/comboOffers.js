import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const addComboOffer = async (req, res) => {
  try {
    const { name, description, imageUrl, discount, pizzas } = req.body;

    const combo = await prisma.$transaction(async (tx) => {
      // Create the combo offer
      const newCombo = await tx.comboOffers.create({
        data: { name, description, imageUrl, discount },
      });

      // Create combo-pizza relationships
      const comboPizzas = pizzas.map((pizza) => ({
        comboId: newCombo.id,
        pizzaId: pizza.pizzaId,
        quantity: pizza.quantity,
      }));

      await tx.comboPizza.createMany({ data: comboPizzas });

      return newCombo;
    });

    res.status(201).json({ message: "Combo offer added successfully", combo });
  } catch (error) {
    console.error("Error adding combo offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getComboOffer = async (req, res) => {
  try {
    const combo = await prisma.comboOffers.findMany({
      include: {
        pizzas: {
          include: { pizza: true },
        },
      },
    });

    if (!combo) {
      return res.status(404).json({ error: "Combo not found" });
    }

    res.status(200).json(combo);
  } catch (error) {
    console.error("Error fetching combo offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteComboOffer = async (req, res) => {
  try {
    const { comboId } = req.params;
    const checkCombo = await prisma.comboOffers.findUnique({
      where: {
        id: comboId,
      },
    });

    if (!checkCombo) {
      return res.status(404).json({ message: "Combo not found" });
    }

    const deleteCombo = await prisma.comboOffers.delete({
      where: {
        id: comboId,
      },
    });
    return res
      .status(200)
      .json({ message: "Combo deleted successfully", data: deleteCombo });
  } catch (error) {
    console.error("Error deleting combo offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { addComboOffer, getComboOffer, deleteComboOffer };
