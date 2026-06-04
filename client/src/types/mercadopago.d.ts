/**
 * Type declarations for Mercado Pago JS SDK v2
 * Loaded via CDN in index.html
 */

interface MPCardFormOptions {
  amount: string;
  autoMount?: boolean;
  form: {
    id: string;
    cardholderName: { id: string; placeholder?: string };
    cardNumber: { id: string; placeholder?: string };
    expirationDate: { id: string; placeholder?: string };
    securityCode: { id: string; placeholder?: string };
    installments: { id: string; placeholder?: string };
    identificationType?: { id: string; placeholder?: string };
    identificationNumber?: { id: string; placeholder?: string };
    issuer?: { id: string; placeholder?: string };
  };
  callbacks: {
    onFormMounted?: (error?: Error) => void;
    onSubmit?: (event: Event) => void;
    onFetching?: (resource: string) => (() => void) | void;
    onError?: (errors: MPError[]) => void;
    onInstallmentsReceived?: (error: Error | null, data: MPInstallmentsData) => void;
    onPaymentMethodsReceived?: (error: Error | null, data: MPPaymentMethodsData) => void;
    onIssuersReceived?: (error: Error | null, data: MPIssuersData) => void;
    onCardTokenReceived?: (error: Error | null, token: MPCardToken) => void;
    onValidityChange?: (error: MPError | null, field: string) => void;
  };
}

interface MPError {
  field: string;
  message: string;
  cause?: string;
}

interface MPInstallmentsData {
  installments: Array<{
    installments: number;
    installment_rate: number;
    discount_rate: number;
    labels: string[];
    installment_rate_collector: string[];
    min_allowed_amount: number;
    max_allowed_amount: number;
    recommended_message: string;
    installment_amount: number;
    total_amount: number;
    payment_method_option_id: string;
  }>;
}

interface MPPaymentMethodsData {
  results: Array<{
    id: string;
    name: string;
    payment_type_id: string;
    status: string;
    secure_thumbnail: string;
    thumbnail: string;
    deferred_capture: string;
    settings: Array<{
      card_number: { validation: string; length: number };
      bin: { pattern: string; installments_pattern: string; exclusion_pattern: string };
      security_code: { mode: string; length: number; card_location: string };
    }>;
    additional_info_needed: string[];
    min_allowed_amount: number;
    max_allowed_amount: number;
    accreditation_time: number;
    financial_institutions: Array<{ id: string; description: string }>;
    processing_modes: string[];
  }>;
}

interface MPIssuersData {
  issuers: Array<{
    id: string;
    name: string;
    secure_thumbnail: string;
    thumbnail: string;
    processing_mode: string;
    merchant_account_id: string | null;
  }>;
}

interface MPCardToken {
  id: string;
  public_key: string;
  card_id: string | null;
  luhn_validation: boolean;
  status: string;
  date_used: string | null;
  card_number_length: number;
  date_created: string;
  first_six_digits: string;
  last_four_digits: string;
  security_code_length: number;
  expiration_month: number;
  expiration_year: number;
  date_last_updated: string;
  date_due: string;
  live_mode: boolean;
  cardholder: {
    identification: { number: string; type: string };
    name: string;
  };
}

interface MPCardFormInstance {
  mount: () => void;
  unmount: () => void;
  createCardToken: () => Promise<MPCardToken>;
  getCardData: () => {
    token: string;
    installments: string;
    paymentMethodId: string;
    issuerId: string;
    identificationType: string;
    identificationNumber: string;
  };
}

interface MercadoPagoInstance {
  cardForm: (options: MPCardFormOptions) => MPCardFormInstance;
  getIdentificationTypes: () => Promise<Array<{ id: string; name: string; type: string; min_length: number; max_length: number }>>;
  getPaymentMethods: (params: { bin: string }) => Promise<MPPaymentMethodsData>;
  getInstallments: (params: { amount: string; bin: string; paymentTypeId?: string }) => Promise<MPInstallmentsData>;
  getIssuers: (params: { paymentMethodId: string; bin: string }) => Promise<MPIssuersData>;
  createCardToken: (params: {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
    identificationType: string;
    identificationNumber: string;
  }) => Promise<MPCardToken>;
}

interface Window {
  MercadoPago: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
}
