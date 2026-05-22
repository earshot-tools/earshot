import { createWorkspaceConfig } from '../tools/eslint-workspace.config.js'

// eslint-disable-next-line import-x/no-default-export
export default createWorkspaceConfig({ tsconfigRootDir: import.meta.dirname })
