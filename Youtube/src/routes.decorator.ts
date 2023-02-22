import { Router } from 'express';
export const router = Router();
interface IOptions {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  middlewares?: Function[],
}
function Route(options: IOptions) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    (router as any)[options.method](options.path, options.middlewares, target[propertyKey]);
  };
}
export default Route;