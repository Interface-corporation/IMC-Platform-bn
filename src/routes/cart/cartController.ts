import prisma from "@/config/prisma";
import { ServiceResponse } from "@/utils/serviceResponse";
import type { Cart, User } from "@prisma/client";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ErrorHandler, asyncCatch } from "../../middleware/errorHandler";

class CartController {
  public getCarts: RequestHandler = asyncCatch(async (req: Request, res: Response, next: NextFunction) => {
    const carts = await prisma.cart.findMany({
      where: {
        userId: (req.user as User).id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            location: true,
            price: true,
            numberOfReviews: true,
            productionType: true,
            stock: true,
            images: {
              select: {
                public_id: true,
                url: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            address: true,
            email: true,
            name: true,
            user_type: true,
          },
        },
      },
    });

    if (!carts || carts.length === 0) {
      return next(ErrorHandler.NotFound("No Cart Items found"));
    }

    const totalCost = carts.reduce((acc, cart) => acc + cart.quantity * Number(cart.product.price), 0);

    return ServiceResponse.success<Cart[]>("List of All Carts Items for LoggedIn user.", carts, res, undefined, {
      totalCost,
    });
  });

  public addToCart: RequestHandler = asyncCatch(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as User).id;

    const { quantity, priceAtAddition, status } = req.body;

    // Validate Cart Quantity and Product Quantity
    const product = await prisma.product.findUnique({ where: { id: req.body.productId } });

    if (!product)
        return next(ErrorHandler.BadRequest("No product found matching provided productId!"));

    if (product && Number(product.stock < quantity))
      return next(ErrorHandler.BadRequest("Cart Quantity can't exceed Product Stock!"));

    const cart = await prisma.cart.create({
      data: {
        quantity,
        priceAtAddition,
        status,
        user: {
          connect: {
            id: userId,
          },
        },
        product: {
          connect: {
            id: req.body.productId,
          },
        },
      },
    });

    return ServiceResponse.success<Cart>("Product Added to cart Successful!", cart, res);
  });

  public updateCartQuantity: RequestHandler = asyncCatch(async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.update_id);

    const cart = await prisma.cart.findUnique({
      where: { id },
    });

    if (!cart) {
      return next(ErrorHandler.BadRequest("No cart found with that ID"));
    }

    // Validate Cart Quantity and Product Quantity
    const product = await prisma.product.findUnique({ where: { id: cart.productId } });

    if (product && Number(product.stock < req.body.quantity))
      return next(ErrorHandler.BadRequest("Cart Quantity can't exceed Product Stock!"));

    // Update quantity or status
    const updatedCart = await prisma.cart.update({
      where: { id },
      data: {
        quantity: req.body.quantity,
      },
    });

    return ServiceResponse.success<Cart>("Cart Quantity was Updated successful!", updatedCart, res);
  });

  public deleteCartItem: RequestHandler = asyncCatch(async (req: Request, res: Response, next: NextFunction) => {
    const delete_id = Number(req.params.delete_id);

    const cart = await prisma.cart.findUnique({
      where: { id: delete_id },
    });

    if (!cart) {
      return next(ErrorHandler.NotFound("No cart item found with that ID"));
    }

    await prisma.cart.delete({ where: { id: delete_id } });

    return ServiceResponse.success("Cart Item was Deleted Successful!", null, res, StatusCodes.OK);
  });
}

export const cartController = new CartController();
