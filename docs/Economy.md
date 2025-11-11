# LedgerEntry System Overview

## Purpose

LedgerEntry replaces old “balance” fields on the User and Organization models.
It acts as an append-only transaction log for all financial events — revenue, expenses, debt, and payments.
This approach makes historical tracking, auditing, and time-based analytics easy and reliable.

## The Model

model LedgerEntry {
id String @id @default(cuid())
userId String?
organizationId String?
amountCents Int // + inflow, - outflow (stored in cents)
kind LedgerKind // enum: REVENUE | EXPENSE | PAYMENT | DEBT
occurredAt DateTime @default(now())
settledAt DateTime? // only used for DEBT entries when repaid
memo String?

user User? @relation(fields: [userId], references: [id])
organization Organization? @relation(fields: [organizationId], references: [id])

@@index([userId, occurredAt])
@@index([organizationId, occurredAt])
}

## The Enum

| Kind        | Meaning                                                   | Cash Impact | Notes                                                        |
| ----------- | --------------------------------------------------------- | ----------- | ------------------------------------------------------------ |
| **REVENUE** | Inflows like sales, grants, or income                     | `+`         | Counted in current balance & monthly revenue                 |
| **EXPENSE** | Outflows like purchases or costs                          | `-`         | Reduces balance                                              |
| **PAYMENT** | Miscellaneous cash movement (e.g., transfers, repayments) | `+` or `-`  | Treated as cash but not revenue                              |
| **DEBT**    | Liabilities, loans, or credit records                     | `0`         | Does _not_ affect cash until settled; track with `settledAt` |

## Query Methods

| Metric                | Description                                                     | Example Prisma Query                                                         |
| --------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Current Balance**   | Total of all non-DEBT entries (`REVENUE`, `EXPENSE`, `PAYMENT`) | `sum(amountCents)` where `NOT { kind: 'DEBT' }`                              |
| **Loan Balance**      | Total outstanding DEBT entries                                  | `sum(amountCents)` where `kind = 'DEBT' AND settledAt IS NULL`               |
| **MTD Revenue**       | Total REVENUE entries since start of month                      | `sum(amountCents)` where `kind = 'REVENUE' AND occurredAt >= startOfMonth()` |
| **Org-Level Balance** | Same as above but filtered by `organizationId`                  | replace `userId` with `organizationId`                                       |
