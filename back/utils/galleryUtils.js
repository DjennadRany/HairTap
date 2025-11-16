export const normalizeServiceMedia = (service) => {
  const baseInfo = {
    serviceId: service._id?.toString?.() ?? '',
    serviceName: service.name,
    servicePrice: service.price,
    serviceDuration: service.duration,
    serviceCategory: service.category,
    serviceDescription: service.description
  };

  const galleryItems = (service.gallery || [])
    .map((media, index) => {
      const mediaUrl = media?.mediaUrl || media?.photoUrl || media;
      return mediaUrl
        ? {
            id: `${baseInfo.serviceId}-gallery-${index}`,
            origin: 'gallery',
            mediaUrl,
            mediaType: media.mediaType || 'image',
            caption: media.caption || baseInfo.serviceDescription,
            tags: media.tags || [],
            likes: media.likes ?? 0,
            createdAt: media.createdAt || service.createdAt,
            ...baseInfo
          }
        : null;
    })
    .filter(Boolean);

  const imageItems = (service.images || [])
    .map((url, index) =>
      url
        ? {
            id: `${baseInfo.serviceId}-images-${index}`,
            origin: 'images',
            mediaUrl: url,
            mediaType: 'image',
            caption: baseInfo.serviceDescription,
            tags: [],
            likes: service.likes ?? 0,
            createdAt: service.createdAt,
            ...baseInfo
          }
        : null
    )
    .filter(Boolean);

  const examplePhotoItems = (service.examplePhotos || [])
    .map((photoUrl, index) =>
      photoUrl
        ? {
            id: `${baseInfo.serviceId}-example-${index}`,
            origin: 'examplePhotos',
            mediaUrl: photoUrl,
            mediaType: 'image',
            caption: baseInfo.serviceDescription,
            tags: [],
            likes: service.likes ?? 0,
            createdAt: service.createdAt,
            ...baseInfo
          }
        : null
    )
    .filter(Boolean);

  return [...galleryItems, ...imageItems, ...examplePhotoItems];
};

export const aggregateGalleryFromServices = (services = []) => {
  const aggregatedItems = services.flatMap(normalizeServiceMedia);

  const seen = new Set();
  const dedupedItems = aggregatedItems.filter((item) => {
    const url = item.mediaUrl?.trim();

    if (!url) {
      return false;
    }

    if (seen.has(url)) {
      return false;
    }

    seen.add(url);
    return true;
  });

  return {
    items: dedupedItems,
    count: dedupedItems.length,
    deduplicatedFrom: aggregatedItems.length
  };
};

export default aggregateGalleryFromServices;
