declare module "@paystack/inline-js" {
  interface PaystackTransaction {
    reference: string;
    status: string;
    trans: string;
    transaction: string;
    trxref: string;
    message: string;
  }

  interface PaystackOptions {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    ref?: string;
    metadata?: {
      userId?: string;
      productName?: string;
      custom_fields?: Array<{
        display_name: string;
        variable_name: string;
        value: string;
      }>;
    };
    onSuccess: (transaction: PaystackTransaction) => void;
    onCancel: () => void;
  }

  export default class PaystackPop {
    newTransaction(options: PaystackOptions): void;
  }
}
