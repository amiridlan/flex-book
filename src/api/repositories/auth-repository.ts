import type { ApiClient } from '../client/api-client';
import { resourceSchema } from '../schemas/common';
import { loginResponseSchema, userSchema, type LoginResponse, type User } from '../schemas/user';

export type AuthRepository = {
  login(email: string, password: string): Promise<LoginResponse>;
  logout(): Promise<void>;
  me(): Promise<User>;
};

export function createAuthRepository(api: ApiClient): AuthRepository {
  return {
    async login(email, password) {
      const response = await api.request('POST', '/auth/login', loginResponseSchema, {
        body: { email, password },
      });
      return response.data;
    },
    logout: () => api.send('POST', '/auth/logout'),
    async me() {
      const response = await api.request('GET', '/me', resourceSchema(userSchema));
      return response.data;
    },
  };
}
