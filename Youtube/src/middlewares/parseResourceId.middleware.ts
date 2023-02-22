import { NextFunction, Response } from 'express';
import { MyApiRequest } from '~~/types/request';
export async function parseResourceId(req: MyApiRequest, res: Response, next: NextFunction) {
  let { id } = req.params;
  const resourceId = parseInt(id, 10);
  if (isNaN(resourceId)) {
    res.status(400).json({
      message: 'Bad Request',
      code: 10,
      data: ["Invalid id parameter, must be a number, got '" + id + "'"],
    });
    return;
  }
  req.resourceId = resourceId;
  next();
}