import type { FeedItem, PlatformType } from '../domain/entities/feed-item';
import type { Course } from '../domain/entities/course';
import type { ISyncRepository, SyncResult } from '../domain/interfaces/sync-repo.interface';

export class InMemorySyncRepository implements ISyncRepository {
  private items: FeedItem[];
  private courses: Course[];

  constructor(items: FeedItem[] = [], courses: Course[] = []) {
    this.items = items;
    this.courses = courses;
  }


  async syncPlatform(platform: PlatformType): Promise<FeedItem[]> {
    const fullResult = await this.syncAll([platform]);
    return fullResult.items.filter((item) => item.platform === platform);
  }

  async syncAll(platforms?: PlatformType[]): Promise<SyncResult> {
    const selectedPlatforms: PlatformType[] = platforms && platforms.length > 0
      ? platforms
      : ['sigaa', 'aprender3', 'teams'];

    const filteredItems = this.items.filter((item) =>
      selectedPlatforms.includes(item.platform)
    );

    const filteredCourses = this.courses.filter((course) =>
      selectedPlatforms.includes(course.platform)
    );

    return {
      items: filteredItems,
      courses: filteredCourses,
      syncedAt: new Date().toISOString(),
    };
  }
}

