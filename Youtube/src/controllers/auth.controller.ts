import { NextFunction, Request, Response } from 'express';
import Routes from '../routes.decorator';
import { execute } from '~/utils/mysql.connector';
import bcrypt from 'bcrypt'
import * as authService from '~/services/auth.service';
import { authentification } from '~/middlewares/authentification.middleware';
import { MyApiRequest } from '~~/types/request';
import { User } from '~~/types/resources';

export class Auth {
  @Routes({
    path: '/auth',
    method: 'post',
    middlewares: [authentification('none')],
  })
  async login(req: MyApiRequest, res: Response) {
    const body = req.body;
    const validation = await authService.validateForm(body)
    if (!validation.ok)
      return res.status(400).json({ message: "Bad Request", code: validation.code, data: validation.data })

    const user = await execute<any[]>(`SELECT * FROM user WHERE  username = ?;`, [body.login]);

    if (user.length === 0) return res.status(404).json({ message: "Not found" })

    const match = await bcrypt.compare(body.password, user[0].password);
    delete user[0].password;
    if (match) {
      const token = await authService.GenerateToken(user[0]);
      return res.status(201).json({ message: "OK", data: { token, user: user[0] } })
    } else return res.status(400).json({ message: "Bad request", code: 9, data: ["Invalid password"] })
  }
}

