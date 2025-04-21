import { User as SchemaUser } from "@shared/schema";

// Extending the Express namespace to include our custom User type
declare global {
  namespace Express {
    interface User extends SchemaUser {}
  }
}

// Export our User type for use in other server files
export type User = SchemaUser;