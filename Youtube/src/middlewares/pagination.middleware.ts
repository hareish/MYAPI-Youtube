import { NextFunction, Response } from 'express';
import { Error } from '~~/types/error';
import { MyApiRequest } from '~~/types/request';
export async function pagination(req: MyApiRequest, res: Response, next: NextFunction) {
  let { page, per_page } = req.query;
  req.pagination = {
    offset: 0,
    limit: 5,
  };
  if (per_page) {
    const convertedPerPage = parseInt(per_page as string);
    if (isNaN(convertedPerPage)) {
      const error: Error = {
        message: 'Bad Request',
        code: 17,
        data: ["Invalid per_page parameter, must be a number, got '" + per_page + "'"],
      }
      res.status(400).json(error);
      return;
    } else if (convertedPerPage < 0) {
      const error: Error = {
        message: 'Bad Request',
        code: 18,
        data: ["Invalid per_page parameter, must be greater than 0, got '" + per_page + "'"],
      }
      res.status(400).json(error);
      return;
    }
    req.pagination.limit = convertedPerPage;
  }
  if (page) {
    const convertedPage = parseInt(page as string);
    if (isNaN(convertedPage)) {
      const error: Error = {
        message: 'Bad Request',
        code: 19,
        data: ["Invalid page parameter, must be a number, got '" + page + "'"],
      }
      res.status(400).json(error);
      return;
    } else if (convertedPage < 1) {
      const error: Error = {
        message: 'Bad Request',
        code: 20,
        data: ["Invalid page parameter, must be greater than 0, got '" + page + "'"],
      }
      res.status(400).json(error);
      return;
    }
    req.pagination.offset = (convertedPage - 1) * req.pagination.limit;
  }
  next();
}