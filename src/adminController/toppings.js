import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const addTopping = async (req, res) => {
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

    const addTopping = await prisma.toppingsList.create({
      data: {
        name: name,
        price: price,
      },
    });
    return res
      .status(201)
      .json({ message: "Topping added successfully", data: addTopping });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateTopping = async (req, res) => {
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

    const checkTopping = await prisma.toppingsList.findUnique({
      where: {
        id: id,
      },
    });

    if (!checkTopping) {
      return res.status(404).json({ message: "Topping not found" });
    }

    const updateTopping = await prisma.toppingsList.update({
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

const deleteTopping = async (req, res) => {
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

    const checkTopping = await prisma.toppingsList.findUnique({
      where: {
        id: id,
      },
    });

    if (!checkTopping) {
      return res.status(404).json({ message: "Topping not found" });
    }

    const deleteTopping = await prisma.toppingsList.delete({
      where: {
        id: id,
      },
    });
    return res
      .status(201)
      .json({ message: "Topping deleted successfully", data: deleteTopping });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getToppings = async (req, res) => {
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

    const toppings = await prisma.toppingsList.findMany();
    return res
      .status(200)
      .json({ message: "Toppings fetched successfully", data: toppings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { addTopping, updateTopping, deleteTopping, getToppings };
