import { Response } from 'express';
import Routes from '../routes.decorator';
import { authentification } from '~/middlewares/authentification.middleware';
import { pagination, parseResourceId } from '~/middlewares';
import * as commentService from '~/services/comment.service';
import { AuthenticatedRequest } from '~~/types/request';
import { VideoDbResponse } from '~~/types/resources';
import { execute } from '~/utils/mysql.connector';

export class Comments {
  @Routes({
    path: '/video/:id/comment',
    method: 'post',
    middlewares: [parseResourceId],
  })
  async postComment(req: AuthenticatedRequest, res: Response) {
    const { body } = req.body;
    if (!body) return res.status(400).json({ message: "Bad Request", code: 10001, data: ["Parameter 'body' is missing"] });
    const query = `SELECT id FROM video WHERE id = ${req.resourceId}`;
    const video = await execute<VideoDbResponse[]>(query, []);
    if (video.length === 0) return res.status(400).json({ message: "Bad Request", code: 10002, data: ["Video does not exist anymore"] });
    try {
      const comment = await commentService.createOne(req.resourceId, req.user, body);
      return res.status(201).json({ message: "OK", data: comment })
    } catch (err: any) {
      return res.status(500).json({ message: "Internal Server Error", code: 500, data: ["Unknown server error"] })
    }
  }

  @Routes({
    path: '/video/:id/comments',
    method: 'get',
    middlewares: [authentification('required'), parseResourceId, pagination],
  })
  async listAll(req: AuthenticatedRequest, res: Response) {
    const listCommentsResponse = await commentService.listAll(req.pagination);
    if (req.pagination.offset && listCommentsResponse.items.length === 0) {
      return res.status(400).json({
        "message": "Bad Request",
        "code": 40005,
        "data": ["Non existing page"]
      });
    }
    return res.status(200).json({
      "message": "OK",
      "data": listCommentsResponse.items,
      "pager": {
        "current": req.pagination.offset / req.pagination.limit + 1,
        "total": Math.floor(listCommentsResponse.total / req.pagination.limit + 1)
      }
    });
  }
}

