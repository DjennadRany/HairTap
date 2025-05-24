export interface MockMessage {
  id: string;
  from: string; // user id
  to: string;   // user id
  content: string;
  date: string;
}

export const mockMessages: MockMessage[] = [
  {
    id: '1',
    from: '1', // John Client
    to: '2',   // Marie Coiffeuse
    content: "Bonjour Marie, j'aimerais prendre rendez-vous pour une coupe.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: '2',
    from: '2',
    to: '1',
    content: 'Bonjour John, bien sûr ! Quelle date souhaitez-vous ?',
    date: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString()
  },
  {
    id: '3',
    from: '5', // Rany Client
    to: '3',   // Paul Barbier
    content: 'Salut Paul, tu as de la place pour une taille de barbe demain ?',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
]; 