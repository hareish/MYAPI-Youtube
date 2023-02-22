import { Response, NextFunction } from "express";
import { MyApiRequest } from "~~/types/request";
import { authenticateUser } from "~/services/auth.service";

export function authentification(authentificationType: 'none' | 'required' | 'optional') {
  return async function (req: MyApiRequest, res: Response, next: NextFunction) {
    // None
    if (authentificationType === 'none') return next();

    const token = req.headers["authorization"];

    // Pas de token
    if (!token && authentificationType === "optional") { return next() }
    else if (token) {
      const validation = await authenticateUser(token);
      if (!validation.ok) return res.status(401).json({ message: "Unauthorized" });
      req.user = validation.user;

      // Optionnal
      if (authentificationType === "optional") return next()
      // Required
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      return next()

    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
}