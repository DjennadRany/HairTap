export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Service {
  name: string;
  price: number;
  duration: string;
}

export interface Coiffeur {
  id: string;
  name: string;
  photo: string;
  rating: number;
  totalReviews: number;
  description: string;
  address: string;
  services: Service[];
  reviews: Review[];
}

export const mockCoiffeurs: Coiffeur[] = [
  {
    id: "1",
    name: "Lina Hair Studio",
    photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
    rating: 4.8,
    totalReviews: 156,
    description: "Spécialiste de la coiffure féminine et des colorations. Notre équipe passionnée vous accueille dans un cadre moderne et chaleureux. Nous utilisons des produits de haute qualité pour des résultats exceptionnels.",
    address: "23 rue du Commerce, Paris",
    services: [
      { name: "Coupe Femme", price: 45, duration: "1h" },
      { name: "Brushing", price: 35, duration: "45 min" },
      { name: "Coloration", price: 75, duration: "2h" }
    ],
    reviews: [
      {
        id: "1",
        userName: "Sophie M.",
        rating: 5,
        comment: "Superbe travail sur ma coloration, je suis ravie !",
        date: "2024-03-18"
      },
      {
        id: "2",
        userName: "Emma L.",
        rating: 4.5,
        comment: "Très bon accueil et résultat au top.",
        date: "2024-03-14"
      }
    ]
  },
  {
    id: "2",
    name: "Studio Jean",
    photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    rating: 4.5,
    totalReviews: 128,
    description: "Plus de 15 ans d'expérience dans la coiffure. Spécialisé dans les coupes modernes et les colorations. Notre salon offre une expérience personnalisée dans une ambiance chaleureuse et professionnelle.",
    address: "15 rue de la République, Lyon",
    services: [
      { name: "Coupe Homme", price: 25, duration: "30 min" },
      { name: "Coupe + Barbe", price: 35, duration: "45 min" },
      { name: "Coupe Femme", price: 45, duration: "1h" },
      { name: "Coloration", price: 65, duration: "1h30" }
    ],
    reviews: [
      {
        id: "1",
        userName: "Marie L.",
        rating: 5,
        comment: "Excellent service, très professionnel et à l'écoute.",
        date: "2024-03-15"
      },
      {
        id: "2",
        userName: "Pierre D.",
        rating: 4,
        comment: "Très satisfait de ma coupe, je recommande !",
        date: "2024-03-10"
      }
    ]
  },
  {
    id: "3",
    name: "Marie Style",
    photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
    rating: 4.9,
    totalReviews: 89,
    description: "Experte en coloration et mèches. Je me déplace à votre domicile pour vous offrir un service personnalisé et professionnel. Produits haut de gamme et techniques innovantes.",
    address: "Service à domicile, Paris",
    services: [
      { name: "Coupe Femme", price: 50, duration: "1h" },
      { name: "Coloration", price: 80, duration: "2h" },
      { name: "Mèches", price: 90, duration: "2h30" }
    ],
    reviews: [
      {
        id: "1",
        userName: "Julie B.",
        rating: 5,
        comment: "Service à domicile impeccable, très pratique !",
        date: "2024-03-20"
      },
      {
        id: "2",
        userName: "Camille R.",
        rating: 5,
        comment: "Résultat parfait pour ma coloration, je recommande vivement.",
        date: "2024-03-16"
      }
    ]
  }
]; 