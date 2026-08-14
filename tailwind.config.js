import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                surface: {
                    DEFAULT: '#FFFFFF',
                    muted: '#FAFAFA',
                    subtle: '#F5F5F5',
                    border: '#E5E5E5',
                },
                ink: {
                    DEFAULT: '#000000',
                    primary: '#171717',
                    secondary: '#525252',
                    tertiary: '#737373',
                },
                status: {
                    warning: {
                        DEFAULT: '#DC2626',
                        light: '#FEE2E2',
                        dark: '#991B1B',
                    },
                    progress: {
                        DEFAULT: '#CA8A04',
                        light: '#FEF9C3',
                        dark: '#A16207',
                    },
                    success: {
                        DEFAULT: '#16A34A',
                        light: '#DCFCE7',
                        dark: '#15803D',
                    },
                },
            },
            boxShadow: {
                'bw-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'bw': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                'bw-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                'bw-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                'hard': '0 0 0 2px #000000',
            },
        },
    },

    plugins: [forms],
};
