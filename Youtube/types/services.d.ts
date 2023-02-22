import { User } from "./resources";

export interface UserService {
  findAllUsers(): Promise<User[]>;
}