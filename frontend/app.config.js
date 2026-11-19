// Normal builds use app.json as is. The single-file test version (EXPO_PUBLIC_DEMO=1) needs all
// screens in one bundle, because a single HTML page cannot load extra pieces later.
module.exports = ({ config }) => {
  if (process.env.EXPO_PUBLIC_DEMO !== "1") return config;
  return {
    ...config,
    plugins: config.plugins.map((p) => (p === "expo-router" ? ["expo-router", { asyncRoutes: false }] : p)),
  };
};
