export const breakpoints = {
  sm: "576px",
  md: "768px",
  lg: "992px",
  xl: "1200px",
};

export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
};

export const typography = {
  // Exemple de typographie fluide pour le corps du texte
  // Ajustez les valeurs min, préférée et max selon vos besoins
  bodyFontSize: "clamp(1rem, 1.5vw + 0.5rem, 1.25rem)",
  // Vous pouvez ajouter d'autres tailles de police ici (h1, h2, etc.)
  // h1FontSize: 'clamp(2rem, 5vw + 1rem, 4rem)',
};

const theme = {
  breakpoints,
  space: {
    // styled-system utilise 'space' pour les marges et paddings
    0: "0",
    1: spacing.xs,
    2: spacing.sm,
    3: spacing.md,
    4: spacing.lg,
    5: spacing.xl,
    // Ajoutez d'autres valeurs si nécessaire ou mappez directement spacing
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
  },
  fontSizes: {
    // styled-system utilise 'fontSizes'
    body: typography.bodyFontSize,
    // h1: typography.h1FontSize,
    // Ajoutez d'autres tailles de police ici
  },
  // Vous pouvez ajouter d'autres éléments de thème ici (couleurs, etc.)
  colors: {
    primary: "#007bff",
    secondary: "#6c757d",
    // ... autres couleurs
  },
  // Pour styled-system, il est courant de fournir les breakpoints sous forme de tableau
  // pour faciliter leur utilisation dans les props responsives.
  // https://styled-system.com/responsive-styles
  mediaQueries: {
    sm: `@media screen and (min-width: ${breakpoints.sm})`,
    md: `@media screen and (min-width: ${breakpoints.md})`,
    lg: `@media screen and (min-width: ${breakpoints.lg})`,
    xl: `@media screen and (min-width: ${breakpoints.xl})`,
  },
};

export default theme;
