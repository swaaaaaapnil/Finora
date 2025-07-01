import { getUserAccounts } from "@/actions/accounts";
import { getTransaction } from "@/actions/transaction";
import { AddTransactionForm } from "./_components/transaction-form";
import { getCategories } from "@/data/category";

export default async function AddTransactionPage({ searchParams }) {
  // Extract edit ID from searchParams properly
  const {editId} = await searchParams;
  
  // Fetch accounts and categories
  const accounts = await getUserAccounts();
  const categories = getCategories();
  
  // Fetch transaction data if in edit mode
  let initialData = null;
  if (editId) {
    try {
      initialData = await getTransaction(editId);
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
    }
  }

  return (
    <main className="w-full px-2 sm:px-4 max-w-5xl mx-auto pt-16 sm:pt-20">
      <AddTransactionForm 
        accounts={accounts} 
        categories={categories}
        editMode={Boolean(editId)}
        initialData={initialData}
      />
    </main>
  );
}