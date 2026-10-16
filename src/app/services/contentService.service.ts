import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Observable,
  defer,
  shareReplay,
  tap
} from 'rxjs';

import { PortfolioContent } from '../models/PortfolioContent';

@Injectable({
  providedIn: 'root'
})
export class ContentService {

  private readonly remoteUrl =
    'https://raw.githubusercontent.com/Anusha-Bharati/AB-portfolio-content/main/portfolio-content.json';

  private readonly content$: Observable<PortfolioContent> =
    defer(() =>
      this.http.get<PortfolioContent>(
        `${this.remoteUrl}?v=${Date.now()}`
      )
    ).pipe(

      tap({
        error: error => {
          console.error(
            'Could not load portfolio content from GitHub:',
            error
          );
        }
      }),

      shareReplay({
        bufferSize: 1,
        refCount: false
      })

    );

  constructor(
    private readonly http: HttpClient
  ) {}

  getContent(): Observable<PortfolioContent> {
    return this.content$;
  }
}