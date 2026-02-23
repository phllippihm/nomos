/**
 * Nomos - Tailwind CSS Unified Configuration
 * Single source of truth for design tokens across all pages.
 */
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Core Brand
                primary: "#1e40af",
                "primary-dark": "#0f5bbd",
                secondary: "#3b82f6",

                // Backgrounds
                "background-light": "#f8fafc",
                "background-dark": "#0f172a",

                // Surfaces
                "surface-light": "#ffffff",
                "surface-dark": "#1e293b",

                // Sidebar
                "sidebar-light": "#ffffff",
                "sidebar-dark": "#111827",

                // Icons
                "icon-pastel": "#e0e7ff",

                // Login-specific (also used globally)
                accent: "#f0f4f8",
                "text-main": "#0e141b",
                "text-muted": "#4e7097",
            },
            fontFamily: {
                display: ["Inter", "sans-serif"],
                body: ["Inter", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.5rem",
                lg: "0.5rem",
                xl: "1rem",
                "2xl": "1.5rem",
                full: "9999px",
            },
            boxShadow: {
                soft: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                card: "0 0 0 1px rgba(226, 232, 240, 1), 0 4px 6px rgba(0, 0, 0, 0.05)",
                "card-hover":
                    "0 0 0 1px rgba(25, 120, 229, 0.3), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
        },
    },
};
