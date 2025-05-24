export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'coiffeur';
  picture: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'client@test.com',
    name: 'John Client',
    role: 'client',
    picture: 'https://ui-avatars.com/api/?name=John+Client'
  },
  {
    id: '2',
    email: 'coiffeur@test.com',
    name: 'Marie Coiffeuse',
    role: 'coiffeur',
    picture: 'https://ui-avatars.com/api/?name=Marie+Coiffeuse'
  }
]; 