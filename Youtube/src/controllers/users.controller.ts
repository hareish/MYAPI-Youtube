import { Response } from 'express';
import { pagination, parseResourceId } from '~/middlewares';
import { authentification } from '~/middlewares/authentification.middleware';
import * as userService from '~/services/user.service';
import { AuthenticatedRequest, MyApiRequest } from '~~/types/request';
import { User } from '~~/types/resources';
import Route from '../routes.decorator';
import { execute } from '~/utils/mysql.connector';

export class Users {
  @Route({
    path: '/users',
    method: 'get',
    middlewares: [authentification('none'), pagination],
  })
  async listUsers(req: MyApiRequest, res: Response) {
    let pseudo = null;
    if ('pseudo' in req.query && typeof req.query.pseudo === 'string') {
      pseudo = req.query.pseudo;
    }

    const listUsersResponse = await userService.findAll(pseudo, req.pagination);
    if (req.pagination.offset && listUsersResponse.items.length === 0) {
      res.status(400).json({
        "message": "Bad Request",
        "code": 21,
        "data": ["Non existing page"]
      });
      return;
    }
    res.status(200).json({
      "message": "OK",
      "data": listUsersResponse.items,
      "pager": {
        "current": req.pagination.offset / req.pagination.limit + 1,
        "total": Math.floor(listUsersResponse.total / req.pagination.limit + 1)
      }
    });
  }

  @Route({
    path: '/user/:id',
    method: 'get',
    middlewares: [authentification('required'), parseResourceId],
  })
  async getUser(req: MyApiRequest, res: Response) {
    const user = await userService.findOne(req.resourceId);
    if (!user) {
      res.status(404).json({
        message: 'Not found',
      });
      return;
    }
    if (req.user && (req.user.id !== req.resourceId)) {
      delete user.email;
    }
    res.json({
      message: 'OK',
      data: user,
    });
  }

  @Route({
    path: '/user',
    method: 'post',
    middlewares: [authentification('none')],
  })
  async createUser(req: MyApiRequest, res: Response) {
    const body = req.body;
    const validation = await userService.validationUser(body)
    if (!validation.ok)
      return res.status(400).json({ message: "Bad Request", code: validation.code, data: validation.data })

    try {
      const user = await userService.createOne(body.username, body.pseudo || null, body.email, body.password);
      return res.status(201).json({ message: "OK", data: user })
    } catch (err: any) {
      if ('sqlState' in err && err.sqlState === '23000') {
        return res.status(400).json({ message: "Bad Request", code: 6, data: ["Email or username already taken"] })
      }
      return res.status(500).json({ message: "Internal Server Error", code: 0, data: ["Unknown server error"] })
    }
  }

  @Route({
    path: '/user/:id',
    method: 'delete',
    middlewares: [authentification('required'), parseResourceId],
  })
  async deleteUser(req: AuthenticatedRequest, res: Response) {
    if (req.user.id !== req.resourceId) {
      return res.status(400).json({
        message: 'Bad Request',
        code: 11,
        data: ['You can not delete another user'],
      });
    }
    await userService.deleteOne(req.resourceId);

    return res.sendStatus(204);
  }

  @Route({
    path: '/user/:id',
    method: 'put',
    middlewares: [authentification('required'), parseResourceId],
  })
  async updateUser(req: AuthenticatedRequest, res: Response) {
    if (req.user.id !== req.resourceId) {
      return res.status(400).json({
        message: 'Bad Request',
        code: 12,
        data: ['You can not update another user'],
      });
    }
    let username = null;
    let pseudo = null;
    let email = null;
    let password = null;
    if ('username' in req.body && typeof req.body.username === 'string') {
      if (/[^a-z^A-Z^0-9^_^-]/.exec(req.body.username)) {
        return res.status(400).json({
          message: 'Bad Request',
          code: 13,
          data: ['Username must contain only letters, numbers, underscores and dashes'],
        });
      }
      username = req.body.username;
    }
    if ('pseudo' in req.body && typeof req.body.pseudo === 'string') {
      pseudo = req.body.pseudo;
    }
    if ('email' in req.body && typeof req.body.email === 'string') {
      if (!/^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.exec(req.body.email)) {
        return res.status(400).json({
          message: 'Bad Request',
          code: 14,
          data: ['Email must be a valid email'],
        });
      }
      email = req.body.email;
    }
    if ('password' in req.body && typeof req.body.password === 'string') {
      password = req.body.password;
    }
    if (!username && !pseudo && !email && !password) {
      return res.status(400).json({
        message: 'Bad Request',
        code: 15,
        data: ['No data to update'],
      });
    }

    try {
      const user = await userService.updateOne(username, pseudo, email, password, req.resourceId);
      return res.status(200).json({ message: "OK", data: user })
    } catch (err: any) {
      console.log(err);
      if ('sqlState' in err && err.sqlState === '23000') {
        return res.status(400).json({ message: "Bad Request", code: 16, data: ["Email or username already taken"] })
      }
      return res.status(500).json({ message: "Internal Server Error", code: 0, data: ["Unknown server error"] })
    }
  }
  // @Route({
  //   path: '/user/:id/videos',
  //   method: 'get',
  //   middlewares: [authentification('none'), parseResourceId, pagination],
  // })
  // async listUserVideos(req: MyApiRequest, res: Response) {
  //   const listUsersResponse = await videoService.findAll(null, req.resourceId, null, req.pagination);
  //   if (req.pagination.offset && listUsersResponse.items.length === 0) {
  //     return res.status(400).json({
  //       "message": "Bad Request",
  //       "code": 40005,
  //       "data": ["Non existing page"]
  //     });
  //   }
  //   res.status(200).json({
  //     "message": "OK",
  //     "data": listUsersResponse.items,
  //     "pager": {
  //       "current": req.pagination.offset / req.pagination.limit + 1,
  //       "total": Math.floor(listUsersResponse.total / req.pagination.limit + 1)
  //     }
  //   });
  // }
}