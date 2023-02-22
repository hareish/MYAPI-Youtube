import { pagination } from "~~/types/request";
import { ListResponse, User } from "~~/types/resources";
import bcrypt from 'bcrypt'
import { UserQueries } from "~/queries/user.queries";
import { execute } from "~/utils/mysql.connector";
import { ResultSetHeader } from "mysql2";


export async function createOne(username: string, pseudo: string | null, email: string, password: string): Promise<User> {
  const query = `INSERT INTO mydb.user (username, email, password${pseudo ? ', pseudo' : ''}) VALUES (?, ?, ?${pseudo ? ', ?' : ''});`;
  const queryParams: string[] = [username, email, await hashPassword(password)];
  if (pseudo) {
    queryParams.push(pseudo);
  }
  const dbResponse = await execute<ResultSetHeader>(query, queryParams);
  return {
    id: dbResponse.insertId,
    username,
    pseudo: pseudo || null,
    createdAt: new Date(),
    email,
  };
}

export async function findAll(pseudo: string | null, pagination: pagination): Promise<ListResponse<User>> {
  const query = `SELECT id, username, pseudo, created_at FROM user WHERE 1=1`;
  const queryParams: string[] = [];
  let countQuery = `SELECT COUNT(*) as 'total' FROM user WHERE 1=1`;
  if (pseudo) {
    queryParams.push(` AND pseudo LIKE '%${pseudo}%'`);
  }
  const users = await execute<User[]>(query + queryParams.join() + ` ORDER BY id DESC` + ` LIMIT ${pagination.limit} OFFSET ${pagination.offset}`, []);
  return {
    items: users,
    total: (await execute<{ total: number }[]>(countQuery + queryParams.join(), []))[0].total
  };
}


export async function deleteOne(id: number) {
  await execute<ResultSetHeader>("DELETE FROM user WHERE id = ?", [id])
}

export async function updateOne(username: string | null, pseudo: string | null, email: string | null, password: string | null, userId: number): Promise<User> {
  const query = `UPDATE user SET`;
  const queryParams: string[] = [];
  if (username) {
    queryParams.push(` username = '${username}'`);
  }
  if (pseudo) {
    queryParams.push(` pseudo = '${pseudo}'`);
  }
  if (email) {
    queryParams.push(` email = '${email}'`);
  }
  if (password) {
    const hashedPassword = await hashPassword(password)
    queryParams.push(` password = '${hashedPassword}'`);
  }
  await execute<ResultSetHeader>(query + queryParams.join() + ` WHERE id=${userId}`, []);
  const user = await execute<any[]>(UserQueries.GetUserById, [
    userId
  ])
  delete user[0].password;
  return user[0];
}

export async function findOne(id: number): Promise<User | null> {
  const user = await execute<any[]>(UserQueries.GetUserById, [
    id
  ])
  if (user.length === 0) {
    return null;
  }
  delete user[0].password;
  return user[0];
}



export async function validationUser(form: any): Promise<{ ok: Boolean, data: string[], code: number }> {
  let errors: { ok: Boolean, data: string[], code: number } = {
    ok: true,
    data: [],
    code: 0
  }
  if (!form.username) {
    errors.ok = false;
    errors.data.push("username is required");
    errors.code = 1;
    return errors;
  }
  if (/[^a-zA-Z0-9_-]/gm.exec(form.username)) {
    errors.ok = false;
    errors.data.push("username must contain only letters, numbers, underscores and hyphens");
    errors.code = 2;
    return errors;
  }

  if (!form.email) {
    errors.ok = false;
    errors.data.push("email is required");
    errors.code = 3;
    return errors;
  }
  if (!/^((\w[^\W]+)[\.\-]?){1,}\@(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gm.exec(form.email)) {
    errors.ok = false;
    errors.data.push("email is invalid");
    errors.code = 4;
    return errors;
  }

  if (!form.password) {
    errors.ok = false;
    errors.data.push("password is required");
    errors.code = 5;
    return errors;
  }

  return errors
}

// ============================================================ Functions

async function hashPassword(plaintextPassword: string) {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(plaintextPassword, salt);
  return hash
}

export function hidePrivateProperties(user: User) {
  delete user.email;
  return user;
}