import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, defer, Observable, shareReplay } from 'rxjs';
import { PortfolioContent } from '../models/PortfolioContent';

@Injectable({ providedIn: 'root' })
export class ContentService {

  private readonly remoteUrl =
    'https://raw.githubusercontent.com/Anusha-Bharati/AB-portfolio-content/main/portfolio-content.json';

  private readonly fallbackUrl =
    'assets/portfolio-content.fallback.json';

  private readonly content$: Observable<PortfolioContent> = defer(() =>
    this.http.get<PortfolioContent>(
      `${this.remoteUrl}?v=${Date.now()}`
    )
  ).pipe(
    catchError(error => {
      console.warn(
        'Remote portfolio content unavailable; using bundled fallback.',
        error
      );

      return this.http.get<PortfolioContent>(this.fallbackUrl);
    }),

    shareReplay({
      bufferSize: 1,
      refCount: false
    })
  );

  constructor(private readonly http: HttpClient) {}

  getContent(): Observable<PortfolioContent> {
    return this.content$;
  }
}