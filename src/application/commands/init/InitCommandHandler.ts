import { InitCommand } from './InitCommand';
import { Result, ok, err } from '../../../shared/types/Result';
import { Container } from '../../../infrastructure/container/Container';
import { InitCommandHandlerService } from '../../../shared/types/CommandHandlers';

/**
 * Handles init command execution
 */
export class InitCommandHandler {
  constructor(private container: Container) {}

  async execute(command: InitCommand): Promise<Result<void, Error>> {
    const handler =
      this.container.resolve<InitCommandHandlerService>('initCommandHandler');
    const result = await handler.execute(command);

    if (result.isErr()) {
      return err(result.error!);
    }

    return ok(undefined);
  }
}
