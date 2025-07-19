import { ListCommand } from './ListCommand';
import { Result, ok, err } from '../../../shared/types/Result';
import { Container } from '../../../infrastructure/container/Container';
import { ListCommandHandlerService } from '../../../shared/types/CommandHandlers';

/**
 * Handles list command execution
 */
export class ListCommandHandler {
  constructor(private container: Container) {}

  async execute(command: ListCommand): Promise<Result<void, Error>> {
    const handler =
      this.container.resolve<ListCommandHandlerService>('listCommandHandler');
    const result = await handler.execute(command);

    if (result.isErr()) {
      return err(result.error!);
    }

    return ok(undefined);
  }
}
