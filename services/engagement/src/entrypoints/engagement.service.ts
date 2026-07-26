import { Inject, Injectable } from '@nestjs/common';
import { FAVORITE_REPOSITORY, type FavoriteRepositoryPort } from '../application/ports/favorite-repository.port.js';
import { RESPONSE_REPOSITORY, type ResponseRepositoryPort } from '../application/ports/response-repository.port.js';
import { VIEW_BUFFER, type ViewBufferPort } from '../application/ports/view-buffer.port.js';
import { VIEW_REPOSITORY, type ViewRepositoryPort } from '../application/ports/view-repository.port.js';
import { addFavorite, type AddFavoriteInput } from '../application/use-cases/add-favorite.usecase.js';
import { removeFavorite } from '../application/use-cases/remove-favorite.usecase.js';
import { listMyFavorites } from '../application/use-cases/list-my-favorites.usecase.js';
import { countFavorites } from '../application/use-cases/count-favorites.usecase.js';
import { createResponse, type CreateResponseInput } from '../application/use-cases/create-response.usecase.js';
import { listResponses } from '../application/use-cases/list-responses.usecase.js';
import { recordView } from '../application/use-cases/record-view.usecase.js';
import type { Favorite } from '../domain/favorite.js';
import type { Response } from '../domain/response.js';

@Injectable()
export class EngagementService {
  constructor(
    @Inject(FAVORITE_REPOSITORY) private readonly favoriteRepo: FavoriteRepositoryPort,
    @Inject(RESPONSE_REPOSITORY) private readonly responseRepo: ResponseRepositoryPort,
    @Inject(VIEW_BUFFER) private readonly viewBuffer: ViewBufferPort,
    @Inject(VIEW_REPOSITORY) private readonly viewRepo: ViewRepositoryPort,
  ) {}

  addFavorite(input: AddFavoriteInput): Promise<Favorite> {
    return addFavorite(input, this.favoriteRepo);
  }

  removeFavorite(userId: string, listingId: string): Promise<void> {
    return removeFavorite(userId, listingId, this.favoriteRepo);
  }

  listMyFavorites(userId: string): Promise<Favorite[]> {
    return listMyFavorites(userId, this.favoriteRepo);
  }

  countFavorites(listingId: string): Promise<number> {
    return countFavorites(listingId, this.favoriteRepo);
  }

  createResponse(input: CreateResponseInput): Promise<Response> {
    return createResponse(input, this.responseRepo);
  }

  listResponses(listingId: string): Promise<Response[]> {
    return listResponses(listingId, this.responseRepo);
  }

  recordView(listingId: string): Promise<void> {
    return recordView(listingId, this.viewBuffer);
  }

  getViewCount(listingId: string): Promise<number> {
    return this.viewRepo.getViewCount(listingId);
  }
}
