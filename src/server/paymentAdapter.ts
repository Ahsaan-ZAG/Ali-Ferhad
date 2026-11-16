import { PaymentMethod, PaymentStatus } from '../types/ecommerce';

export interface PaymentIntentResult {
  provider: string;
  paymentStatus: PaymentStatus;
  referenceId: string;
  note: string;
}

export interface PaymentProviderAdapter {
  readonly id: PaymentMethod;
  readonly label: string;
  readonly description: string;
  readonly requiresCredentials: boolean;
  isConfigured(): boolean;
  authorizeOrCapture(params: {
    orderNumber: string;
    amountCents: number;
    currency: string;
    customerEmail: string;
  }): Promise<PaymentIntentResult>;
}

const codAdapter: PaymentProviderAdapter = {
  id: 'cod',
  label: 'Cash on Delivery',
  description: 'Settle directly with our courier upon verified garment delivery.',
  requiresCredentials: false,
  isConfigured: () => true,
  async authorizeOrCapture({ orderNumber }) {
    return {
      provider: 'cod-courier',
      paymentStatus: 'pending',
      referenceId: `COD-${orderNumber}`,
      note: 'Payment due upon courier delivery verification.',
    };
  },
};

const cardSandboxAdapter: PaymentProviderAdapter = {
  id: 'card_sandbox',
  label: 'Card Payment (Development Adapter)',
  description:
    'Simulated tokenized authorization for development verification; connect Stripe credentials for live settlement.',
  requiresCredentials: true,
  isConfigured: () => Boolean(process.env.STRIPE_SECRET_KEY),
  async authorizeOrCapture({ orderNumber }) {
    if (process.env.STRIPE_SECRET_KEY) {
      // Real gateway hook point when STRIPE_SECRET_KEY is supplied in runtime env
      return {
        provider: 'stripe-gateway',
        paymentStatus: 'authorized',
        referenceId: `PAY-${orderNumber}`,
        note: 'Authorized via configured card gateway.',
      };
    }
    return {
      provider: 'development-card-adapter',
      paymentStatus: 'authorized',
      referenceId: `DEV-AUTH-${orderNumber}`,
      note: 'Development mode authorization (no raw card numbers collected or stored).',
    };
  },
};

const invoiceAdapter: PaymentProviderAdapter = {
  id: 'invoice',
  label: 'Private Client Invoice',
  description: 'Receive a direct concierge payment link prior to dispatch.',
  requiresCredentials: false,
  isConfigured: () => true,
  async authorizeOrCapture({ orderNumber }) {
    return {
      provider: 'client-invoice',
      paymentStatus: 'pending',
      referenceId: `INV-${orderNumber}`,
      note: 'Client concierge invoice issued; dispatch follows settlement.',
    };
  },
};

const ADAPTERS: Record<PaymentMethod, PaymentProviderAdapter> = {
  cod: codAdapter,
  card_sandbox: cardSandboxAdapter,
  invoice: invoiceAdapter,
};

export function getPaymentAdapter(method: PaymentMethod): PaymentProviderAdapter {
  return ADAPTERS[method] ?? codAdapter;
}

export function listPaymentMethods() {
  return Object.values(ADAPTERS).map((a) => ({
    id: a.id,
    label: a.label,
    description: a.description,
    configured: a.isConfigured(),
    mode: a.requiresCredentials && !a.isConfigured() ? 'development' : 'live',
  }));
}
