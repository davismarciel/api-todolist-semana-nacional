export class User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;

  constructor(email: string, password: string, name: string) {
    this.id = Math.random().toString(36).substring(2, 15);
    this.email = email;
    this.password = password;
    this.name = name;
    this.createdAt = new Date();
  }
}
