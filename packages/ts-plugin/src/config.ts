export interface TsPluginConfig {
  moduleName?: string;
  routesFolder?: string;
  typedRouterDts?: string;
}

export function resolvePluginConfig(input: TsPluginConfig | undefined): Required<TsPluginConfig> {
  return {
    moduleName: input?.moduleName || 'essor-router',
    routesFolder: input?.routesFolder || 'src/pages',
    typedRouterDts: input?.typedRouterDts || 'typed-router.d.ts',
  };
}
