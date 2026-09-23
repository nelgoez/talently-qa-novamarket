// graphify OpenCode plugin
// Injects a knowledge graph reminder before bash tool calls when the graph exists.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const GraphifyPlugin = async ({ directory }) => {
  let reminded = false;

  return {
    'tool.execute.before': async (input, output) => {
      if (reminded) {
        return;
      }
      if (!existsSync(join(directory, 'graphify-out', 'graph.json'))) {
        return;
      }

      if (input.tool === 'bash') {
        const reminder = 'echo "[graphify] knowledge graph at graphify-out/. For focused questions run graphify query instead of grepping raw files." && ';
        output.args.command = `${reminder}${output.args.command}`;
        reminded = true;
      }
    },
  };
};
