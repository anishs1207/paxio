export const metadata = {
    title: "Terms of Service",
    description:
        "Terms of Service governing access to and use of the Paxio application.",
};

export default function TermsOfServicePage() {
    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto max-w-4xl px-6 py-16">
                <header className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight text-white">
                        Terms of Service
                    </h1>
                    <p className="mt-4 text-sm text-gray-400">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </header>

                <section className="space-y-10 text-sm leading-6 text-gray-300">
                    <p>
                        These Terms of Service (“Terms”) govern your access to and use of
                        <strong className="text-white"> Paxio</strong> (“we”, “our”, or
                        “us”). By accessing or using the service, you agree to be bound by
                        these Terms.
                    </p>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            1. Use of the Service
                        </h2>
                        <p className="mt-3">
                            You may use the service only in compliance with these Terms and
                            all applicable laws and regulations. You are responsible for all
                            activity that occurs under your account.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            2. Account Registration
                        </h2>
                        <p className="mt-3">
                            To access certain features, you must sign in using supported
                            authentication providers. You agree to provide accurate and
                            complete information and to keep your account information
                            up-to-date.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            3. Third-Party Integrations
                        </h2>
                        <p className="mt-3">
                            Paxio allows you to connect third-party services such as Google
                            (Gmail and Calendar) and Notion. By connecting these services, you
                            grant Paxio permission to access and perform actions on your
                            behalf, strictly limited to the permissions you approve.
                        </p>
                        <p className="mt-3">
                            You may revoke access to these services at any time through your
                            account settings or directly via the third-party provider.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            4. Acceptable Use
                        </h2>
                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>Do not misuse or interfere with the service</li>
                            <li>Do not attempt to access unauthorized data or systems</li>
                            <li>Do not use the service for unlawful or harmful purposes</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            5. Data & Privacy
                        </h2>
                        <p className="mt-3">
                            Your use of the service is subject to our Privacy Policy, which
                            explains how we collect, use, and protect your information.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            6. Intellectual Property
                        </h2>
                        <p className="mt-3">
                            All content, software, and materials provided by Paxio are owned
                            by us or our licensors and are protected by intellectual property
                            laws. You may not copy, modify, or distribute any part of the
                            service without prior written permission.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            7. Termination
                        </h2>
                        <p className="mt-3">
                            We may suspend or terminate your access to the service at any
                            time if you violate these Terms or misuse the service.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            8. Disclaimer of Warranties
                        </h2>
                        <p className="mt-3">
                            The service is provided “as is” and “as available” without
                            warranties of any kind. We do not guarantee that the service will
                            be uninterrupted or error-free.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            9. Limitation of Liability
                        </h2>
                        <p className="mt-3">
                            To the fullest extent permitted by law, Paxio shall not be liable
                            for any indirect, incidental, or consequential damages arising
                            from your use of the service.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            10. Changes to These Terms
                        </h2>
                        <p className="mt-3">
                            We may update these Terms from time to time. Continued use of the
                            service after changes constitutes acceptance of the updated
                            Terms.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            11. Contact Us
                        </h2>
                        <p className="mt-3">
                            If you have any questions about these Terms, please contact us at{" "}
                            <a
                                href="mailto:paxioai@gmail.com"
                                className="underline text-white"
                            >
                                paxioai@gmail.com
                            </a>
                            .
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
