/**
 * Gestionnaire global pour limiter le nombre de vidéos chargées simultanément
 * - Maximum 3-4 vidéos en lecture simultanée
 * - Priorité basée sur intersectionRatio
 * - Pause automatique des moins visibles
 */

interface VideoState {
  videoElement: HTMLVideoElement;
  intersectionRatio: number;
  isPlaying: boolean;
  id: string;
}

class VideoManager {
  private static instance: VideoManager;
  private loadedVideos: Map<string, VideoState> = new Map();
  private readonly MAX_CONCURRENT_VIDEOS = 4; // Maximum 4 vidéos en lecture simultanée

  private constructor() {}

  static getInstance(): VideoManager {
    if (!VideoManager.instance) {
      VideoManager.instance = new VideoManager();
    }
    return VideoManager.instance;
  }

  /**
   * Enregistrer une vidéo chargée
   */
  registerVideo(id: string, videoElement: HTMLVideoElement, intersectionRatio: number): void {
    this.loadedVideos.set(id, {
      videoElement,
      intersectionRatio,
      isPlaying: false,
      id
    });
    this.manageConcurrentVideos();
  }

  /**
   * Mettre à jour le ratio d'intersection d'une vidéo
   */
  updateIntersectionRatio(id: string, intersectionRatio: number): void {
    const videoState = this.loadedVideos.get(id);
    if (videoState) {
      videoState.intersectionRatio = intersectionRatio;
      this.manageConcurrentVideos();
    }
  }

  /**
   * Marquer une vidéo comme en lecture
   */
  setPlaying(id: string, isPlaying: boolean): void {
    const videoState = this.loadedVideos.get(id);
    if (videoState) {
      videoState.isPlaying = isPlaying;
      this.manageConcurrentVideos();
    }
  }

  /**
   * Retirer une vidéo du gestionnaire
   */
  unregisterVideo(id: string): void {
    this.loadedVideos.delete(id);
    this.manageConcurrentVideos();
  }

  /**
   * Gérer le nombre de vidéos en lecture simultanée
   * - Garde seulement les MAX_CONCURRENT_VIDEOS les plus visibles en lecture
   * - Pause les autres
   */
  private manageConcurrentVideos(): void {
    // Trier les vidéos par intersectionRatio (les plus visibles en premier)
    const sortedVideos = Array.from(this.loadedVideos.values())
      .filter(v => v.isPlaying)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    // Si on dépasse la limite, pause les moins visibles
    if (sortedVideos.length > this.MAX_CONCURRENT_VIDEOS) {
      const videosToPause = sortedVideos.slice(this.MAX_CONCURRENT_VIDEOS);
      videosToPause.forEach(videoState => {
        try {
          videoState.videoElement.pause();
          videoState.isPlaying = false;
        } catch (error) {
          console.warn('Erreur lors de la pause de la vidéo:', error);
        }
      });
    }
  }

  /**
   * Obtenir le nombre de vidéos actuellement chargées
   */
  getLoadedCount(): number {
    return this.loadedVideos.size;
  }

  /**
   * Obtenir le nombre de vidéos en lecture
   */
  getPlayingCount(): number {
    return Array.from(this.loadedVideos.values()).filter(v => v.isPlaying).length;
  }
}

export default VideoManager;

