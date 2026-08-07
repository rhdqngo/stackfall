export class StatusAnnouncer {
  private timeout: number | null = null;
  private pendingMessage = "";

  constructor(private readonly element: HTMLElement) {}

  announce(message: string): void {
    this.pendingMessage = message;
    if (this.timeout !== null) return;
    this.timeout = window.setTimeout(() => {
      this.element.textContent = this.pendingMessage;
      this.pendingMessage = "";
      this.timeout = null;
    }, 500);
  }
}
