const defaultPermissions = [
  {
    "name": "Users",
    "permissions": [
      "Create",
      "Read",
      "Update",
      "Delete",
      "Reset Password",
      "Activate",
      "Deactivate"
    ]
  },
  {
    "name": "Customers",
    "permissions": [
      "Read",
      "Delete",
      // "Activate",
      // "Deactivate"
    ]
  },
  {
    "name": "Roles",
    "permissions": [
      "Create",
      "Read",
      "Update",
      "Delete",
      "Activate",
      "Deactivate"
    ]
  },
  {
    "name": "Products",
    "permissions": [
      "Create",
      "Read",
      "Update",
      "Delete",
      "Activate",
      "Deactivate",
      "Add Stocks",
      "Decrease Stocks"
    ]
  },
  {
    "name": "Reports",
    "permissions": [
      "Stocks",
    ]
  },
  {
    "name": "Suppliers",
    "permissions": [
      "Create",
      "Read",
      "Update",
      "Delete",
      "Activate",
      "Deactivate"
    ],
  },
  {
    "name": "Brands",
    "permissions": [
      "Create",
      "Read",
      "Update",
      "Delete",
      "Activate",
      "Deactivate"
    ]
  },
  {
    "name": "Categories",
    "permissions": [
      "Create",
      "Read",
      "Update",
      "Delete",
      "Activate",
      "Deactivate"
    ]
  },
  {
    "name": "Tags",
    "permissions": [
      "Create",
      "Read",
      "Update",
      "Delete",
      "Activate",
      "Deactivate"
    ]
  },
  {
    "name": "Promotions",
    "permissions": [
      "Create",
      "Read",
      "Update",
      "Delete",
      "Activate",
      "Deactivate"
    ]
  },
  {
    "name": "Audits",
    "permissions": [
      "Read",
    ]
  },
  {
    "name": "Delivery Fee",
    "permissions": [
      "Read",
      "Update",
    ],
  },
  {
    "name": "Transactions",
    "permissions": [
      "Create",
      "Read",
    ],
  },
  {
    "name": "Stocks Report",
    "permissions": [
      "Read",
    ],
  },
  {
    "name": "Deliveries",
    "permissions": [
      "Read",
      "Assign Driver",
      "Completion",
      "Cancellation",
    ],
  },
  {
    "name": "Returned Items",
    "permissions": [
      "Read",
      "Approve",
    ],
  },
];

const paymentMethods = [
  {
    name: 'CASH_ON_DELIVERY',
    label: 'Cash on Delivery',
  },
  {
    name: 'GCASH',
    label: 'GCash',
  },
  {
    name: 'ONSITE',
    label: 'On Site',
  },
];

const orderStatus = {
  TO_PAY: 'TO_PAY',
  FOR_DELIVERY: 'FOR_DELIVERY',
  COMPLETED: 'COMPLETED',
  PENDING_RETURN: 'PENDING_RETURN',
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED',
};

module.exports = {
  defaultPermissions,
  paymentMethods,
  orderStatus,
};
