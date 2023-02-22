import { sign, verify } from "jsonwebtoken";
import { User } from "~~/types/resources";
import { execute } from "~/utils/mysql.connector";
import { UserQueries } from "~/queries/user.queries";

// ===================================== Export functions

const SECRET = "secret";

export async function GenerateToken(userPayload: User) {
  return sign({ id: userPayload.id }, SECRET, { expiresIn: "1h" });;
}


/* 
  Middleware handling function
*/

export async function authenticateUser(token: string): Promise<{ ok: Boolean, message: String, user: User | null }> {
  try {
    const decoded: any = verify(token, SECRET) as any;
    const users = await execute<any[]>(UserQueries.GetUserById, [
      decoded.id
    ])
    if (!users.length) {
      return { ok: false, message: "Unauthorized", user: null };
    }
    delete users[0].password;
    const user: User = users[0];
    return { ok: true, message: "OK", user };
  } catch (err) {
    return { ok: false, message: "Unauthorized", user: null };
  }
}

export async function validateForm(form: any) {
  let errors: { ok: Boolean, data: string[], code: number } = {
    ok: true,
    data: [],
    code: 0
  }
  if (!form.login) {
    errors.ok = false;
    errors.data.push("login is required");
    errors.code = 7;
    return errors;
  }
  if (!form.password) {
    errors.ok = false;
    errors.data.push("password is required");
    errors.code = 8;
    return errors;
  }
  return errors;
}


// ============================================= Functions