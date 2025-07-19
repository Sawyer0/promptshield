/**
 * Simple dependency injection container
 */
export class Container {
  private services = new Map<string, unknown>();
  private factories = new Map<string, () => unknown>();
  private singletons = new Map<string, unknown>();

  /**
   * Registers a service instance
   */
  register<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  /**
   * Registers a factory function
   */
  registerFactory<T>(
    name: string,
    factory: () => T,
    singleton: boolean = false
  ): void {
    this.factories.set(name, factory);
    if (singleton) {
      // Mark as singleton but don't instantiate yet
      this.singletons.set(name, null);
    }
  }

  /**
   * Resolves a service by name
   */
  resolve<T>(name: string): T {
    // Check if it's a direct instance
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }

    // Check if it's a singleton that's already created
    if (this.singletons.has(name) && this.singletons.get(name) !== null) {
      return this.singletons.get(name) as T;
    }

    // Check if it's a factory
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      if (!factory) throw new Error(`Factory for '${name}' not found`);
      const instance = factory();

      // If it's a singleton, cache it
      if (this.singletons.has(name)) {
        this.singletons.set(name, instance);
      }

      return instance as T;
    }

    throw new Error(`Service '${name}' not found in container`);
  }

  /**
   * Checks if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * Gets all registered service names
   */
  getServiceNames(): string[] {
    return [...this.services.keys(), ...this.factories.keys()];
  }

  /**
   * Clears all registrations
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * Creates a child container
   */
  createChild(): Container {
    const child = new Container();

    // Copy parent registrations
    this.services.forEach((value, key) => {
      child.services.set(key, value);
    });

    this.factories.forEach((value, key) => {
      child.factories.set(key, value);
    });

    // Don't copy singleton instances, only their registration
    this.singletons.forEach((_, key) => {
      child.singletons.set(key, null);
    });

    return child;
  }
}

/**
 * Service locator pattern for global access
 */
export class ServiceLocator {
  private static container: Container;

  static setContainer(container: Container): void {
    this.container = container;
  }

  static getContainer(): Container {
    if (!this.container) {
      throw new Error('Container not initialized');
    }
    return this.container;
  }

  static resolve<T>(name: string): T {
    return this.getContainer().resolve<T>(name);
  }
}
