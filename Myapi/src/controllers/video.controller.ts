import { Response } from 'express';
import { pagination, parseResourceId } from '~/middlewares';
import { authentification } from '~/middlewares/authentification.middleware';
import multer from 'multer';
const upload = multer({ dest: './public/videos/' });
import { Video, User } from '~~/types/resources';
import Route from '../routes.decorator';
import { AuthenticatedRequest, MyApiRequest } from '~~/types/request';
import * as videoService from '~/services/video.service';

export class Videos {
  @Route({
    path: '/user/:id/video',
    method: 'post',
    middlewares: [authentification('required'), parseResourceId, upload.fields([{ name: 'source', maxCount: 1 }])],
  })
  async createVideo(req: AuthenticatedRequest, res: Response) {
    if (req.user && req.user.id !== req.resourceId) {
      res.status(400).json({
        "message": "Bad Request",
        "code": 22,
        "data": ["You can't create a video for another user"]
      });
      return;
    }
    if (!('files' in req && typeof req.files === 'object' && 'source' in req.files && req.files['source'] instanceof Array && req.files['source'].length === 1)) {
      res.status(400).json({
        "message": "Bad Request",
        "code": 23,
        "data": ["Missing source parameter in request body"]
      });
      return;
    }
    if (!req.files['source'][0].mimetype.startsWith('video/')) {
      res.status(400).json({
        "message": "Bad Request",
        "code": 24,
        "data": ["Source file is not a video"]
      });
      return;
    }
    if (!('name' in req.body)) {
      res.status(400).json({
        "message": "Bad Request",
        "code": 25,
        "data": ["Missing name parameter in request body"]
      });
      return;
    }
    const createdVideo = await videoService.createOne(req.body.name, req.files['source'][0], req.user);
    res.status(201).json({
      "message": "OK",
      "data": createdVideo
    });
  }
  @Route({
    path: '/video/:id',
    method: 'put',
    middlewares: [authentification('required'), parseResourceId],
  })
  async updateVideo(req: AuthenticatedRequest, res: Response) {
    let name = null;
    let user = null;
    if ('name' in req.body && typeof req.body.name === 'string') {
      name = req.body.name;
    }
    if ('user' in req.body && typeof req.body.user === 'string') {
      const userNumber = parseInt(req.body.user);
      if (!isNaN(userNumber)) {
        user = userNumber;
      } else {
        return res.status(400).json({
          "message": "Bad Request",
          "code": 40005,
          "data": ["Invalid user parameter, must be a number, got " + req.body.user]
        });
      }
    }

    if (!name && !user) {
      return res.status(400).json({
        "message": "Bad Request",
        "code": 40005,
        "data": ["Missing name or user parameter"]
      });
    }
    try {
      const video = await videoService.updateOne(name, user, req.user.id, req.resourceId);
      return res.status(200).json({ message: "OK", data: video })
    } catch (err: any) {
      if ('sqlState' in err && err.sqlState === '23000') {
        return res.status(400).json({ message: "Bad Request", code: 5005, data: ["New owner does not exist"] })
      }
      return res.status(400).json({ message: "Bad Request", code: 5006, data: [err.message] })
    }
  }

  @Route({
    path: '/video/:id',
    method: 'patch',
    middlewares: [authentification('none'), parseResourceId],
  })
  async addVideoEncoding(req: MyApiRequest, res: Response) {
    let format = null;
    let file = null;
    if ('format' in req.body && typeof req.body.format === 'string' && ['1080', '720', '480', '360', '240', '144'].includes(req.body.format)) {
      format = req.body.format;
    } else {
      return res.status(400).json({
        "message": "Bad Request",
        "code": 40005,
        "data": ["Missing or wrong format parameter"]
      });
    }
    if ('file' in req.body && typeof req.body.file === 'string') {
      file = req.body.file;
    } else {
      return res.status(400).json({
        "message": "Bad Request",
        "code": 40005,
        "data": ["Missing file parameter"]
      });
    }
    try {
      const video = await videoService.addEncodingOne(format, file, req.resourceId);
      return res.status(200).json({ message: "OK", data: video })
    } catch (err: any) {
      if ('sqlState' in err && err.sqlState === '23000') {
        return res.status(400).json({ message: "Bad Request", code: 5005, data: ["New owner does not exist"] })
      }
      return res.status(400).json({ message: "Bad Request", code: 5006, data: [err.message] })
    }
  }
  @Route({
    path: '/video/:id',
    method: 'delete',
    middlewares: [authentification('required'), parseResourceId],
  })
  async deleteVideo(req: AuthenticatedRequest, res: Response) {
    try {
      await videoService.deleteOne(req.resourceId, req.user.id);
      return res.sendStatus(204);
    } catch (err: any) {
      return res.status(404).json({ message: "Not Found", code: 5007, data: [err.message] })
    }
  }

  @Route({
    path: '/videos',
    method: 'get',
    middlewares: [authentification('none'), pagination],
  })
  async listVideos(req: MyApiRequest, res: Response) {
    let name = null;
    let user = null;
    let duration = null;
    if ('name' in req.query && typeof req.query.name === 'string') {
      name = req.query.name;
    }
    if ('user' in req.query && typeof req.query.user === 'string') {
      const nameNumber = parseInt(req.query.user);
      if (!isNaN(nameNumber)) {
        user = nameNumber;
      } else {
        user = req.query.user;
      }
    }
    if ('duration' in req.query && typeof req.query.duration === 'string') {
      const durationNumber = parseInt(req.query.duration);
      if (!isNaN(durationNumber)) {
        duration = durationNumber;
      } else {
        res.status(400).json({
          "message": "Bad Request",
          "code": 40004,
          "data": ["Parameter duration must be a number"]
        });
        return;
      }
    }

    const listVideosResponse = await videoService.findAll(name, user, duration, req.pagination);
    if (req.pagination.offset && listVideosResponse.items.length === 0) {
      res.status(400).json({
        "message": "Bad Request",
        "code": 40005,
        "data": ["Non existing page"]
      });
      return;
    }
    res.status(200).json({
      "message": "OK",
      "data": listVideosResponse.items,
      "pager": {
        "current": req.pagination.offset / req.pagination.limit + 1,
        "total": Math.floor(listVideosResponse.total / req.pagination.limit + 1)
      }
    });
  }

  @Route({
    path: '/user/:id/videos',
    method: 'get',
    middlewares: [authentification('none'), parseResourceId, pagination],
  })
  async listVideosByUser(req: MyApiRequest, res: Response) {
    const listVideosResponse = await videoService.findAll(null, req.resourceId, null, req.pagination);
    if (req.pagination.offset && listVideosResponse.items.length === 0) {
      res.status(400).json({
        "message": "Bad Request",
        "code": 40005,
        "data": ["Non existing page"]
      });
      return;
    }
    res.status(200).json({
      "message": "OK",
      "data": listVideosResponse.items,
      "pager": {
        "current": req.pagination.offset / req.pagination.limit + 1,
        "total": Math.floor(listVideosResponse.total / req.pagination.limit + 1)
      }
    });
  }

}