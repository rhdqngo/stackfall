interface RepeatedValue<T> {
  value: T;
  nextAt: number;
  interval: number;
}

export interface RepeatProfile {
  delay: number;
  interval: number;
}

export class RepeatController<T> {
  private readonly held = new Map<string, RepeatedValue<T>>();

  press(id: string, value: T, timestamp: number, profile: RepeatProfile): boolean {
    if (this.held.has(id)) return false;
    this.held.set(id, {
      value,
      nextAt: timestamp + profile.delay,
      interval: profile.interval,
    });
    return true;
  }

  release(id: string): void {
    this.held.delete(id);
  }

  update(timestamp: number, emit: (value: T) => void): void {
    for (const repeated of this.held.values()) {
      let repeats = 0;
      while (timestamp >= repeated.nextAt && repeats < 4) {
        emit(repeated.value);
        repeated.nextAt += repeated.interval;
        repeats += 1;
      }
      if (repeats === 4 && timestamp >= repeated.nextAt) {
        repeated.nextAt = timestamp + repeated.interval;
      }
    }
  }

  clear(): void {
    this.held.clear();
  }

  has(id: string): boolean {
    return this.held.has(id);
  }
}
