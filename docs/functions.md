# ŷFL Documentation

This document describes key functions and logic in the ŷFL Financial Forecast Web Application, including their inputs, outputs, dependencies, and business logic.

## Organization CRUD Operations

This module provides functionality for creating, reading, updating, and deleting **organization** records within the system. An **organization** represents a structured entity that encapsulates the set of roles, permissions, and participants required to collaborate within a shared financial forecasting environment. These operations ensure data integrity, maintain consistent role assignments, and support the management of organizational structures across the application lifecycle.

### Creating a New Organization (createOrganization)

```
export async function createOrganization(data: CreateOrganizationInput) {
	return await prisma.organization.create({
		data: {
			name: data.name,
			description: data.description,
		}
	});
}
```

#### Parameters

Input requires a JSON Object with a name and description attribute
