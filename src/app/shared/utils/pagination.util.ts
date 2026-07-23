import { signal, WritableSignal, computed } from '@angular/core';

export class PaginationState<T> {
  readonly data: WritableSignal<T[]> = signal<T[]>([]);
  readonly loading: WritableSignal<boolean> = signal<boolean>(false);
  readonly error: WritableSignal<string | null> = signal<string | null>(null);
  
  readonly page: WritableSignal<number> = signal<number>(1);
  readonly limit: WritableSignal<number> = signal<number>(20);
  readonly totalItems: WritableSignal<number> = signal<number>(0);
  readonly totalPages: WritableSignal<number> = signal<number>(0);

  readonly hasMore = computed(() => this.page() < this.totalPages());

  reset() {
    this.data.set([]);
    this.page.set(1);
    this.totalItems.set(0);
    this.totalPages.set(0);
    this.error.set(null);
  }

  nextPage() {
    if (this.hasMore()) {
      this.page.update(p => p + 1);
    }
  }
}
