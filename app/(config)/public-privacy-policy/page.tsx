export const metadata = {
    title: "Privacy Policy",
    description:
        "Privacy Policy describing how we collect, use, and protect user data, including third-party integrations.",
};

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto max-w-4xl px-6 py-16">
                <header className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight text-white">
                        Privacy Policy
                    </h1>
                    <p className="mt-4 text-sm text-gray-400">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </header>

                <section className="space-y-10 text-sm leading-6 text-gray-300">
                    <p>
                        This Privacy Policy explains how we collect, use, disclose, and
                        protect your information when you use our application. By accessing
                        or using the service, you agree to the practices described in this
                        policy.
                    </p>

                    {/* 1 */}
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            1. Information We Collect
                        </h2>
                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>
                                <strong className="text-white">Account Information:</strong>{" "}
                                Your name and email address when you sign in using authentication
                                providers such as Google.
                            </li>
                            <li>
                                <strong className="text-white">Usage Data:</strong> Interactions
                                with features, actions taken within the app, and
                                performance-related data.
                            </li>
                            <li>
                                <strong className="text-white">Technical Data:</strong> IP
                                address, browser type, device information, and operating system.
                            </li>
                        </ul>
                    </div>

                    {/* 2 */}
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            2. Third-Party Integrations & Permissions
                        </h2>

                        <p className="mt-3">
                            Our application allows you to connect third-party services. Access
                            to these services is granted{" "}
                            <strong className="text-white">
                                only after your explicit consent
                            </strong>{" "}
                            and is limited to the permissions you approve.
                        </p>

                        <ul className="mt-4 list-disc space-y-3 pl-6">
                            <li>
                                <strong className="text-white">
                                    Google Account (Gmail):
                                </strong>{" "}
                                If you connect your Google account and grant permission, we may
                                access Gmail features such as reading, composing, sending,
                                drafting, and deleting emails on your behalf. Access is limited
                                to approved OAuth scopes.
                            </li>

                            <li>
                                <strong className="text-white">Google Calendar:</strong> With
                                your consent, we may read, create, update, or delete calendar
                                events to help manage schedules and workflows.
                            </li>

                            <li>
                                <strong className="text-white">Notion:</strong> If you connect
                                your Notion account, we may access selected pages or databases to
                                read, write, and render content as part of the application’s
                                features.
                            </li>
                        </ul>
                    </div>

                    {/* 3 */}
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            3. How We Use Your Information
                        </h2>
                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>To authenticate users and manage accounts</li>
                            <li>
                                To perform actions on connected services only as requested by the
                                user
                            </li>
                            <li>To improve functionality and user experience</li>
                            <li>To ensure security and prevent misuse</li>
                        </ul>
                    </div>

                    {/* 4 */}
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            4. Data Storage & Retention
                        </h2>
                        <p className="mt-3">
                            We do not permanently store third-party content unless explicitly
                            required for a feature. Any stored data is retained only as long as
                            necessary to provide the service or comply with legal obligations.
                        </p>
                    </div>

                    {/* 5 */}
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            5. Data Sharing
                        </h2>
                        <p className="mt-3">
                            We do not sell your personal data. Information is shared only with
                            trusted infrastructure providers strictly for operating the
                            application.
                        </p>
                    </div>

                    {/* 6 */}
                    <div>
                        <h2 className="text-lg font-semibold text-white">6. Security</h2>
                        <p className="mt-3">
                            We use industry-standard security measures to protect your data.
                            However, no method of transmission over the internet is completely
                            secure.
                        </p>
                    </div>

                    {/* 7 */}
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            7. Your Rights & Controls
                        </h2>
                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>Access, update, or delete your account data</li>
                            <li>Revoke third-party permissions at any time</li>
                            <li>Request information about how your data is used</li>
                        </ul>
                    </div>

                    {/* 8 */}
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            8. Changes to This Policy
                        </h2>
                        <p className="mt-3">
                            We may update this Privacy Policy from time to time. Updates will
                            be posted on this page with a revised date.
                        </p>
                    </div>

                    {/* 9 */}
                    <div>
                        <h2 className="text-lg font-semibold text-white">9. Contact Us</h2>
                        <p className="mt-3">
                            If you have any questions about this Privacy Policy, contact us at{" "}
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
