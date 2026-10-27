import { createFeatureLayersConfig } from '@doscientos/configs/architecture'
import { reactViteConfig } from '@doscientos/configs/oxlint/react-vite'

export default {
  extends: [reactViteConfig, createFeatureLayersConfig()],
  rules: {
    // Route modules intentionally compose pages from the app layer.
    'react/only-export-components': 'off',
  },
}
