/**
 * Testing Utilities
 * Helpers for unit and integration testing
 */

export class TestUtils {
  /**
   * Wait for a specified amount of time
   */
  static wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random test data
   */
  static randomString(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static randomEmail(): string {
    return `${this.randomString(8)}@${this.randomString(6)}.com`;
  }

  static randomNumber(min = 0, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomDate(start = new Date('2020-01-01'), end = new Date()): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  static randomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  static randomFromArray<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Mock function that tracks calls
   */
  static createMockFunction<T extends (...args: any[]) => any>(): T & {
    calls: Parameters<T>[];
    callCount: number;
    reset: () => void;
    mockReturnValue: (value: ReturnType<T>) => void;
    mockImplementation: (impl: T) => void;
  } {
    const calls: Parameters<T>[] = [];
    let returnValue: ReturnType<T>;
    let implementation: T | undefined;

    const mockFn = ((...args: Parameters<T>) => {
      calls.push(args);
      
      if (implementation) {
        return implementation(...args);
      }
      
      return returnValue;
    }) as any;

    mockFn.calls = calls;
    Object.defineProperty(mockFn, 'callCount', {
      get: () => calls.length,
    });

    mockFn.reset = () => {
      calls.length = 0;
      returnValue = undefined;
      implementation = undefined;
    };

    mockFn.mockReturnValue = (value: ReturnType<T>) => {
      returnValue = value;
    };

    mockFn.mockImplementation = (impl: T) => {
      implementation = impl;
    };

    return mockFn;
  }

  /**
   * Create test fixtures
   */
  static createUser(overrides: any = {}) {
    return {
      id: this.randomString(8),
      email: this.randomEmail(),
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  static createNutritionData(overrides: any = {}) {
    return {
      calories: this.randomNumber(1500, 3000),
      protein: this.randomNumber(50, 200),
      carbohydrates: this.randomNumber(100, 400),
      fat: this.randomNumber(30, 150),
      fiber: this.randomNumber(20, 50),
      ...overrides,
    };
  }

  /**
   * Assertion helpers
   */
  static expectToBeCloseTo(actual: number, expected: number, tolerance = 0.1): boolean {
    return Math.abs(actual - expected) <= tolerance;
  }

  static expectArrayToContain<T>(array: T[], item: T): boolean {
    return array.includes(item);
  }

  static expectObjectToMatch(actual: any, expected: any): boolean {
    return Object.keys(expected).every(key => actual[key] === expected[key]);
  }
}

export const wait = TestUtils.wait;
export const randomString = TestUtils.randomString;
export const randomEmail = TestUtils.randomEmail;
export const randomNumber = TestUtils.randomNumber;
export const createMockFunction = TestUtils.createMockFunction;