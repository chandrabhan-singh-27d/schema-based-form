export interface Notifier {
    success(title: string, description?: string): void;
    error(title: string, description?: string): void;
}
