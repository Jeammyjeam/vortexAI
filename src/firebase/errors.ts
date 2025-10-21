// DO NOT MODIFY. This file is auto-generated and managed by Firebase Studio.
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  constructor(public context: SecurityRuleContext) {
    super(
      `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
        context,
        null,
        2
      )}`
    );
    this.name = 'FirestorePermissionError';
  }

  toString() {
    return this.message;
  }
}
