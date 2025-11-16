import { aggregateGalleryFromServices, normalizeServiceMedia } from './galleryUtils.js';

describe('galleryUtils', () => {
  const baseService = {
    _id: 'service-1',
    name: 'Coupe test',
    description: 'Description',
    price: 50,
    duration: 30,
    category: 'coupe',
    createdAt: new Date('2024-01-01'),
    likes: 2
  };

  it('agrège et déduplique les médias examplePhotos, gallery et images', () => {
    const services = [
      {
        ...baseService,
        gallery: [
          { mediaUrl: '/img/a.jpg', mediaType: 'image' },
          { mediaUrl: '/img/b.jpg', mediaType: 'image' }
        ],
        examplePhotos: ['/img/a.jpg', '/img/c.jpg'],
        images: ['/img/d.jpg', '']
      }
    ];

    const aggregated = aggregateGalleryFromServices(services);

    expect(aggregated.items).toHaveLength(3);
    expect(aggregated.deduplicatedFrom).toBe(5);
    const origins = aggregated.items.map((item) => item.origin).sort();
    expect(origins).toEqual(['examplePhotos', 'gallery', 'images']);
  });

  it('met à jour la galerie après modification des médias', () => {
    const service = {
      ...baseService,
      examplePhotos: ['/img/a.jpg'],
      gallery: [],
      images: []
    };

    const initialMedia = normalizeServiceMedia(service);
    expect(initialMedia.map((item) => item.mediaUrl)).toContain('/img/a.jpg');

    service.examplePhotos = ['/img/b.jpg'];
    const updatedMedia = normalizeServiceMedia(service);
    expect(updatedMedia.map((item) => item.mediaUrl)).toEqual(['/img/b.jpg']);
  });

  it('retire les médias liés à un service supprimé', () => {
    const services = [
      {
        ...baseService,
        _id: 'service-1',
        examplePhotos: ['/img/a.jpg']
      },
      {
        ...baseService,
        _id: 'service-2',
        examplePhotos: ['/img/b.jpg']
      }
    ];

    const aggregated = aggregateGalleryFromServices(services);
    expect(aggregated.items.map((item) => item.mediaUrl).sort()).toEqual(['/img/a.jpg', '/img/b.jpg']);

    const afterDeletion = aggregateGalleryFromServices(services.filter((s) => s._id === 'service-2'));
    expect(afterDeletion.items.map((item) => item.mediaUrl)).toEqual(['/img/b.jpg']);
  });
});
