export {};

declare global {
  function describe(name: string, body: () => void): void;
  function it(name: string, body: () => void | Promise<void>): void;
  function beforeEach(body: () => void | Promise<void>): void;
  function expect<T>(value: T): any;
}
