import { serve } from "inngest/next";
import { inngest } from "@/lib/innjest/client";
import { 
  checkBudgetAlerts,
  generateMonthlyReports,
} from "@/lib/innjest/functions";

// Create an API that serves all functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    checkBudgetAlerts,
    generateMonthlyReports
  ],
});
