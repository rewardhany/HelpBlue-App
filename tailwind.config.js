/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                // Menggunakan 'Hind' (alternatif Frutiger) agar tampilan web HelpBlue lebih "ngalem"
                sans: ['Hind', 'sans-serif'],
                // Font khusus untuk logo HelpBlue agar tidak berubah
                logo: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}