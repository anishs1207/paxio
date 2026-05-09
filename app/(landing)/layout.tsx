import { Navbar, Footer } from "@/components/landing";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex flex-col min-h-screen w-full bg-background-dark text-white font-display overflow-x-hidden antialiased selection:bg-white selection:text-black">
            <Navbar />
            <main className="flex-grow flex flex-col items-center justify-start pt-32 pb-20 px-4 md:px-8">
                {children}
            </main>
            <Footer />
        </div>
    )
}
