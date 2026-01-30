import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "How does the 14-day free trial work?",
        answer: "Start using SaaSify immediately with full access to all features. No credit card required. After 14 days, choose a plan that fits your needs or continue using our free tier with limited features."
    },
    {
        question: "Can I change plans later?",
        answer: "Absolutely! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect immediately, and we'll prorate any charges or credits automatically."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and wire transfers for annual enterprise plans. All payments are processed securely through Stripe."
    },
    {
        question: "Is my data secure?",
        answer: "Security is our top priority. We use bank-grade encryption, are SOC 2 Type II certified, and comply with GDPR and HIPAA standards. Your data is backed up daily and stored in multiple secure locations."
    },
    {
        question: "Do you offer refunds?",
        answer: "Yes! We offer a 30-day money-back guarantee. If you're not satisfied with SaaSify for any reason, contact our support team within 30 days of purchase for a full refund."
    },
    {
        question: "Can I integrate with other tools?",
        answer: "SaaSify integrates with over 1000+ popular tools including Slack, Google Workspace, Microsoft Teams, Salesforce, and more. We also provide a robust API for custom integrations."
    }
];

const FAQ = () => {
    return (
        <section id="faq" className="py-24 bg-black">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold">
                        Frequently Asked{" "}

                        Questions

                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Got questions? We've got answers. Can't find what you're looking for? Contact our support team.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="space-y-4">
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                value={`item-${index}`}
                                className="border border-border bg-card rounded-lg px-6 shadow-card"
                            >
                                <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                    <span className="font-semibold">{faq.question}</span>
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
