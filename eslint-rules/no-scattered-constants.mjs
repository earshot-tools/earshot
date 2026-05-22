// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

/**
 * Custom ESLint rule: no-scattered-constants
 *
 * Flags numeric const declarations outside constants.ts or config.ts.
 * Allowlist: -1, 0, 1, 2, 10 + HTTP status codes (convention 17).
 */

const ALLOWED_VALUES = new Set([
  -1, 0, 1, 2, 10,
  // HTTP status codes
  200, 201, 204, 301, 302, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504,
])

const CONSTANTS_FILE_PATTERN = /(constants|config)\.ts$/

/** @type {import('eslint').Rule.RuleModule} */
export const noScatteredConstants = {
  meta: {
    type: 'problem',
    messages: {
      scattered:
        'Numeric constant "{{name}}" must be declared in constants.ts or config.ts (convention 17).',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename()
    if (CONSTANTS_FILE_PATTERN.test(filename)) return {}

    return {
      VariableDeclaration(node) {
        if (node.kind !== 'const') return

        for (const declarator of node.declarations) {
          if (!declarator.init || declarator.id.type !== 'Identifier') continue

          const value = resolveNumericValue(declarator.init)
          if (value === null) continue
          if (ALLOWED_VALUES.has(value)) continue

          context.report({
            node: declarator,
            messageId: 'scattered',
            data: { name: declarator.id.name },
          })
        }
      },
    }
  },
}

/** Resolve a numeric value from an AST node (handles Literal and UnaryExpression for negatives) */
function resolveNumericValue(node) {
  if (node.type === 'Literal' && typeof node.value === 'number') {
    return node.value
  }
  // Handle negative numbers: -5 is UnaryExpression { operator: '-', argument: Literal(5) }
  if (
    node.type === 'UnaryExpression' &&
    node.operator === '-' &&
    node.argument.type === 'Literal' &&
    typeof node.argument.value === 'number'
  ) {
    return -node.argument.value
  }
  return null
}
