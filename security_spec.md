# Security Specification for TeaTime Order

## Data Invariants
1. An order cannot exist without at least one item.
2. Total amount of an order must be the sum of item prices * quantity. (Server-side validation)
3. Orders can only be updated by admins (status change) or by the original creator (if we had specific auth, but for now we'll prioritize Admin for order management).
4. Products can only be created/updated/deleted by Admins.
5. All users can read products and categories.
6. Customers can create orders but not modify them once placed (except status updates by admin).

## Admin
- `ytchen@mail.tncvs.tn.edu.tw` is the initial admin.

## Collection Structure
- `/products`: Public Read, Admin Write.
- `/categories`: Public Read, Admin Write.
- `/orders`: Public Create, Admin Read/Update/Delete. (For a simple system, customers might need to 'read' their own order tracking, but we'll start with admin-only management).

## Dirty Dozen Payloads (to be rejected)
1. Creating a product with a negative price.
2. Updating product price as a non-admin.
3. Creating an order with no items.
4. Modifying an order's items after creation.
5. Skipping order status steps (e.g., pending -> completed directly, though Preparing is usually required).
6. Injecting a 1MB string into a product name.
7. Spoofing `ownerId` (if implemented).
8. Admin login attempt from unverified email.
9. Deleting the entire products collection.
10. Creating a category with no name.
11. Updating `createdAt` timestamp on an order.
12. Accessing orders collection listing as a guest.
