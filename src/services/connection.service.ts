import api from './api';
import { ConnectionCategory, ConnectionPrototype, ConnectionSchema } from '@/types/connection';

export const connectionService = {
  // 1. Get Categories (REST, File, Database)
  getCategories: () => 
    api.get<ConnectionCategory[]>('/connection-types/categories'),

  // 2. Get Prototypes for a category (e.g., PostgreSQL, S3, etc.)
  getPrototypes: (categoryId: string) => 
    api.get<ConnectionPrototype[]>(`/connection-types/categories/${categoryId}/prototypes`),

  // 3. Get the Dynamic JSON Schema for the AntD Form
  getSchema: (categoryId: string, prototypeId: string) => 
    api.get<ConnectionSchema>(`/connection-types/categories/${categoryId}/prototypes/${prototypeId}/schema`),

  // 4. Save the new connection
  createConnection: (data: any) => 
    api.post('/connections', data),
};