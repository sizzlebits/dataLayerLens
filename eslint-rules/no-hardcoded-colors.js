/**
 * ESLint rule to prevent hardcoded Tailwind color classes outside of theme files.
 * Encourages using semantic theme tokens (theme-*, dl-*) instead.
 */

const HARDCODED_COLOR_PATTERNS = [
  // Basic colors
  /\b(text|bg|border|from|to|via|ring|divide|placeholder|decoration|outline|shadow|caret|accent|fill|stroke)-(white|black)\b/,

  // Tailwind color scales
  /\b(text|bg|border|from|to|via|ring|divide|placeholder|decoration|outline|shadow|caret|accent|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
];

const ALLOWED_PATTERNS = [
  // Design system colors
  /\b(text|bg|border|from|to|via|ring|divide|placeholder|decoration|outline|shadow|caret|accent|fill|stroke)-dl-\w+\b/,

  // Semantic theme colors
  /\b(text|bg|border|from|to|via|ring|divide|placeholder|decoration|outline|shadow|caret|accent|fill|stroke)-theme-\w+\b/,

  // JSON syntax highlighting colors
  /\b(text|bg|border|from|to|via|ring|divide|placeholder|decoration|outline|shadow|caret|accent|fill|stroke)-json-\w+\b/,
];

function isHardcodedColor(className) {
  // Check if it matches any hardcoded pattern
  const isHardcoded = HARDCODED_COLOR_PATTERNS.some(pattern => pattern.test(className));
  if (!isHardcoded) return false;

  // Check if it's an allowed exception
  const isAllowed = ALLOWED_PATTERNS.some(pattern => pattern.test(className));
  return !isAllowed;
}

function extractClassNames(node) {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value.split(/\s+/);
  }

  if (node.type === 'TemplateLiteral') {
    // For template literals, extract the static parts
    const staticParts = node.quasis.map(q => q.value.raw).join(' ');
    return staticParts.split(/\s+/);
  }

  return [];
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded Tailwind color classes outside theme configuration',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      hardcodedColor: 'Avoid hardcoded color "{{className}}". Use theme tokens instead (e.g., text-theme-text, bg-dl-primary).',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Skip certain file types
    if (
      filename.includes('.test.') ||
      filename.includes('.stories.') ||
      filename.includes('/tokens/') ||
      filename.includes('tailwind.config') ||
      filename.includes('/storybook/')
    ) {
      return {};
    }

    return {
      JSXAttribute(node) {
        // Only check className attributes
        if (node.name.name !== 'className') return;

        const classNames = extractClassNames(node.value);

        for (const className of classNames) {
          if (isHardcodedColor(className)) {
            context.report({
              node: node.value,
              messageId: 'hardcodedColor',
              data: { className },
            });
          }
        }
      },
    };
  },
};
