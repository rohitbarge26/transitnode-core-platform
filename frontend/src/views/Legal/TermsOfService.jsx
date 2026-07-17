import React from 'react';

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-md mt-10 rounded-lg text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: July 16, 2026</p>

      <p className="mb-4">
        Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the TransitNode ERP
        application (the "Service") operated by TransitNode ("us", "we", or "our").
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
      <p className="mb-4">
        Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These
        Terms apply to all visitors, users, and others who access or use the Service. By accessing or using the Service
        you agree to be bound by these Terms.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. Subscriptions and Payments</h2>
      <p className="mb-4">
        Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on
        a recurring and periodic basis ("Billing Cycle"). Billing cycles are set either on a monthly or annual basis,
        depending on the type of subscription plan you select when purchasing a Subscription.
      </p>
      <p className="mb-4">
        A valid payment method, including credit card, is required to process the payment for your Subscription. We use
        third-party payment processors (such as Cashfree) to handle these transactions securely.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
      <p className="mb-4">
        When you create an account with us, you must provide us information that is accurate, complete, and current at all
        times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your
        account on our Service.
      </p>
      <p className="mb-4">
        You are responsible for safeguarding the password that you use to access the Service and for any activities or
        actions under your password.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Prohibited Uses</h2>
      <p className="mb-4">You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:</p>
      <ul className="list-disc pl-8 mb-6 space-y-2">
        <li>In any way that violates any applicable national or international law or regulation.</li>
        <li>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service.</li>
        <li>To attempt to bypass or break any security mechanism of the Service.</li>
        <li>To reverse engineer, decompile, or disassemble any part of the Service.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Termination</h2>
      <p className="mb-4">
        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever,
        including without limitation if you breach the Terms. Upon termination, your right to use the Service will
        immediately cease.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
      <p className="mb-4">
        In no event shall TransitNode, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable
        for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of
        profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to
        access or use the Service.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to Terms</h2>
      <p className="mb-4">
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is
        material we will try to provide at least 30 days notice prior to any new terms taking effect.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
      <p className="mb-4">If you have any questions about these Terms, please contact us:</p>
      <ul className="list-disc pl-8 mb-6 space-y-2">
        <li>By email: support@prohitcoretech.com</li>
      </ul>
    </div>
  );
};

export default TermsOfService;
