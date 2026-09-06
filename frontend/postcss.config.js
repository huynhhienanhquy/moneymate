import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

// CopilotKit v2 ships already-compiled, scoped CSS that still contains a
// Tailwind v4 `@layer base` wrapper. Tailwind v3 otherwise treats that wrapper
// as application source and rejects it because the vendor file has no local
// `@tailwind base` directive.
const unwrapCompiledCopilotKitLayers = {
  postcssPlugin: 'unwrap-compiled-copilotkit-layers',
  Once(root) {
    const sourceFile = root.source?.input.file?.replaceAll('\\', '/');
    if (!sourceFile?.includes('/@copilotkit/react-core/dist/v2/index.css')) return;

    root.walkAtRules('layer', (rule) => {
      if (rule.nodes) rule.replaceWith(...rule.nodes);
    });
  },
};

export default {
  plugins: [unwrapCompiledCopilotKitLayers, tailwindcss(), autoprefixer()],
};
