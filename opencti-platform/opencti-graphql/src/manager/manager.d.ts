export interface Manager {
  id: string;
  name: string;
  lockKey: string;
  running: boolean;
  config: {
    enable: boolean;
    scheduleTime: number;
  }
}
