import type { ICredentialsRepository } from './domain/interfaces/credentials-repo.interface';
import type { ISyncRepository } from './domain/interfaces/sync-repo.interface';
import type { IFeedRepository } from './domain/interfaces/feed-repo.interface';
import type { IGradeRepository } from './domain/interfaces/grade-repo.interface';
import type { IAcademicProfileRepository } from './domain/interfaces/academic-profile-repo.interface';
import type { IDeadlineNotificationRepository } from './domain/interfaces/deadline-notification-repo.interface';
import type { IOSNotifier } from './domain/interfaces/os-notifier.interface';

import { SaveCredentialsUseCase } from './application/save-credentials.use-case';
import { GetCredentialsUseCase } from './application/get-credentials.use-case';
import { SyncPlatformsUseCase } from './application/sync-platforms.use-case';
import { GetFeedUseCase } from './application/get-feed.use-case';
import { EvaluateDeadlineNotificationsUseCase } from './application/evaluate-deadline-notifications.use-case';
import { GetCoursesUseCase } from './application/get-courses.use-case';
import { GetDepartmentsUseCase } from './application/get-departments.use-case';
import { GetSemestersUseCase } from './application/get-semesters.use-case';
import { ScrapeClassesUseCase } from './application/scrape-classes.use-case';
import { SolveScheduleUseCase } from './application/solve-schedule.use-case';
import { ManageGradeUseCase } from './application/manage-grade.use-case';
import { ManageAcademicProfileUseCase } from './application/manage-academic-profile.use-case';
import { GetFlowchartUseCase } from './application/get-flowchart.use-case';
import { ParseHistoricoUseCase } from './application/parse-historico.use-case';
import { GetAcademicCalendarUseCase } from './application/get-academic-calendar.use-case';

import { StrongholdCredentialsRepository } from './infrastructure/stronghold-credentials.repo';
import { TauriSyncRepository } from './infrastructure/tauri-sync.repo';
import { InMemorySyncRepository } from './infrastructure/in-memory-sync.repo';
import { SqliteFeedRepository } from './infrastructure/sqlite-feed.repo';
import { InMemoryFeedRepository } from './infrastructure/in-memory-feed.repo';
import { TauriGradeRepository } from './infrastructure/tauri-grade.repo';
import { InMemoryGradeRepository } from './infrastructure/in-memory-grade.repo';
import { TauriAcademicProfileRepository } from './infrastructure/tauri-academic-profile.repo';
import { InMemoryAcademicProfileRepository } from './infrastructure/in-memory-academic-profile.repo';
import { SqliteDeadlineNotificationRepository } from './infrastructure/sqlite-deadline-notification.repo';
import { InMemoryDeadlineNotificationRepository } from './infrastructure/in-memory-deadline-notification.repo';
import { TauriOSNotifier } from './infrastructure/tauri-os-notifier';
import { NullNotifier } from './infrastructure/tauri-os-notifier';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export interface Repositories {
  credentialsRepo: ICredentialsRepository;
  syncRepo: ISyncRepository;
  feedRepo: IFeedRepository;
  gradeRepo: IGradeRepository;
  academicProfileRepo: IAcademicProfileRepository;
  deadlineNotificationRepo: IDeadlineNotificationRepository;
  osNotifier: IOSNotifier;
}

export interface UseCases {
  saveCredentials: SaveCredentialsUseCase;
  getCredentials: GetCredentialsUseCase;
  syncPlatforms: SyncPlatformsUseCase;
  getFeed: GetFeedUseCase;
  evaluateDeadlines: EvaluateDeadlineNotificationsUseCase;
  getCourses: GetCoursesUseCase;
  getDepartments: GetDepartmentsUseCase;
  getSemesters: GetSemestersUseCase;
  scrapeClasses: ScrapeClassesUseCase;
  solveSchedule: SolveScheduleUseCase;
  manageGrade: ManageGradeUseCase;
  manageAcademicProfile: ManageAcademicProfileUseCase;
  getFlowchart: GetFlowchartUseCase;
  parseHistorico: ParseHistoricoUseCase;
  getAcademicCalendar: GetAcademicCalendarUseCase;
}

export interface Container {
  repos: Repositories;
  useCases: UseCases;
}

export interface ContainerOverrides {
  repos?: Partial<Repositories>;
}

export function createContainer(overrides?: ContainerOverrides): Container {
  const tauri = isTauriRuntime();

  const credentialsRepo: ICredentialsRepository =
    overrides?.repos?.credentialsRepo ?? new StrongholdCredentialsRepository();

  const syncRepo: ISyncRepository =
    overrides?.repos?.syncRepo ??
    (tauri ? new TauriSyncRepository(credentialsRepo) : new InMemorySyncRepository());

  const feedRepo: IFeedRepository =
    overrides?.repos?.feedRepo ??
    (tauri ? new SqliteFeedRepository() : new InMemoryFeedRepository());

  const gradeRepo: IGradeRepository =
    overrides?.repos?.gradeRepo ??
    (tauri ? new TauriGradeRepository() : new InMemoryGradeRepository());

  const academicProfileRepo: IAcademicProfileRepository =
    overrides?.repos?.academicProfileRepo ??
    (tauri ? new TauriAcademicProfileRepository() : new InMemoryAcademicProfileRepository());

  const deadlineNotificationRepo: IDeadlineNotificationRepository =
    overrides?.repos?.deadlineNotificationRepo ??
    (tauri
      ? new SqliteDeadlineNotificationRepository()
      : new InMemoryDeadlineNotificationRepository());

  const osNotifier: IOSNotifier =
    overrides?.repos?.osNotifier ?? (tauri ? new TauriOSNotifier() : new NullNotifier());

  const repos: Repositories = {
    credentialsRepo,
    syncRepo,
    feedRepo,
    gradeRepo,
    academicProfileRepo,
    deadlineNotificationRepo,
    osNotifier,
  };

  const useCases: UseCases = {
    saveCredentials: new SaveCredentialsUseCase(credentialsRepo),
    getCredentials: new GetCredentialsUseCase(credentialsRepo),
    syncPlatforms: new SyncPlatformsUseCase(syncRepo, feedRepo),
    getFeed: new GetFeedUseCase(feedRepo, deadlineNotificationRepo),
    evaluateDeadlines: new EvaluateDeadlineNotificationsUseCase(
      feedRepo,
      deadlineNotificationRepo,
      osNotifier,
    ),
    getCourses: new GetCoursesUseCase(feedRepo),
    getDepartments: new GetDepartmentsUseCase(gradeRepo),
    getSemesters: new GetSemestersUseCase(gradeRepo),
    scrapeClasses: new ScrapeClassesUseCase(gradeRepo),
    solveSchedule: new SolveScheduleUseCase(gradeRepo),
    manageGrade: new ManageGradeUseCase(gradeRepo),
    manageAcademicProfile: new ManageAcademicProfileUseCase(academicProfileRepo),
    getFlowchart: new GetFlowchartUseCase(),
    parseHistorico: new ParseHistoricoUseCase(),
    getAcademicCalendar: new GetAcademicCalendarUseCase(),
  };

  return {
    repos,
    useCases,
  };
}
