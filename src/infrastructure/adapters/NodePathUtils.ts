import * as path from 'path';
import { IPathUtils } from '../../shared/ports/PathUtils';

/**
 * Node.js implementation of the IPathUtils port
 */
export class NodePathUtils implements IPathUtils {
  extname(filePath: string): string {
    return path.extname(filePath);
  }

  basename(filePath: string): string {
    return path.basename(filePath);
  }

  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  join(...paths: string[]): string {
    return path.join(...paths);
  }
}
