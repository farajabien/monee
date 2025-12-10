import { init, id, tx } from "@instantdb/admin";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_APP_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error("APP_ID:", APP_ID ? "✓" : "✗");
  console.error("ADMIN_TOKEN:", ADMIN_TOKEN ? "✓" : "✗");
  console.error("\nPlease ensure the following environment variables are set:");
  console.error("- NEXT_PUBLIC_INSTANT_APP_ID");
  console.error("- INSTANT_APP_ADMIN_TOKEN");
  process.exit(1);
}

const adminDb = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
});

const now = Date.now();
export const demoUserEmail = "pwkxlmcx0m@daouse.com";
export const demoUserId = "8c80bb73-846d-4fd3-812e-8f3170565d44";

export const seedData = {
  recipients: [
    {
      originalName: "AMO Liquor Store",
      nickname: "Liquor",
      paymentDetails: {
        tillNumber: "123456",
        phoneNumber: "0712345678",
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      originalName: "Joze Locals",
      nickname: "Joze",
      paymentDetails: {
        tillNumber: "654321",
        phoneNumber: "0723456789",
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      originalName: "Boda Riders",
      nickname: "Boda",
      paymentDetails: {
        phoneNumber: "0734567890",
        notes: "Cash payment",
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      originalName: "Food Store",
      nickname: "Food",
      paymentDetails: {
        tillNumber: "789012",
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      originalName: "Landlord",
      nickname: "Rent",
      paymentDetails: {
        paybillNumber: "522533",
        accountNumber: "1234567890",
        notes: "Monthly rent payment",
      },
      createdAt: now,
      updatedAt: now,
    },
  ],
  categories: [
    {
      name: "Sherehe",
      icon: "🍻",
      color: "#8e44ad",
      isDefault: true,
      isActive: true,
      createdAt: now,
    },
    {
      name: "Food",
      icon: "🍔",
      color: "#f39c12",
      isDefault: true,
      isActive: true,
      createdAt: now,
    },
    {
      name: "Transport",
      icon: "🏍️",
      color: "#2980b9",
      isDefault: true,
      isActive: true,
      createdAt: now,
    },
    {
      name: "Rent",
      icon: "🏠",
      color: "#27ae60",
      isDefault: true,
      isActive: true,
      createdAt: now,
    },
    {
      name: "Income",
      icon: "💸",
      color: "#d35400",
      isDefault: true,
      isActive: true,
      createdAt: now,
    },
  ],
  expenses: [
    // --- Sherehe Alcohol Purchases ---
    ...Array(8)
      .fill(null)
      .map((_, i) => ({
        amount: 900,
        category: "Sherehe",
        recipient: "AMO Liquor Store",
        date: now - i * 86400000,
        expenseType: "one-time",
        rawMessage: "KC Pineapple",
        parsedData: {},
        createdAt: now - i * 86400000,
      })),
    ...Array(6)
      .fill(null)
      .map((_, i) => ({
        amount: 900,
        category: "Sherehe",
        recipient: "Joze Locals",
        date: now - i * 86400000,
        expenseType: "one-time",
        rawMessage: "KC Lemon & Ginger",
        parsedData: {},
        createdAt: now - i * 86400000,
      })),
    ...Array(5)
      .fill(null)
      .map((_, i) => ({
        amount: 900,
        category: "Sherehe",
        recipient: "AMO Liquor Store",
        date: now - i * 86400000,
        expenseType: "one-time",
        rawMessage: "KC Citrus",
        parsedData: {},
        createdAt: now - i * 86400000,
      })),
    {
      amount: 2000,
      category: "Sherehe",
      recipient: "Joze Locals",
      date: now,
      expenseType: "one-time",
      rawMessage: "Captain Morgan Muck Pit",
      parsedData: {},
      createdAt: now,
    },
    ...Array(5)
      .fill(null)
      .map((_, i) => ({
        amount: 900,
        category: "Sherehe",
        recipient: "Joze Locals",
        date: now - i * 86400000,
        expenseType: "one-time",
        rawMessage: "Torrero",
        parsedData: {},
        createdAt: now - i * 86400000,
      })),

    // --- Boda / Smochas ---
    ...Array(50)
      .fill(null)
      .map((_, i) => ({
        amount: 70,
        category: "Transport",
        recipient: "Boda Riders",
        date: now - i * 3600000,
        expenseType: "one-time",
        rawMessage: "Smocha Ride",
        parsedData: {},
        createdAt: now - i * 3600000,
      })),

    // --- Food ---
    {
      amount: 650,
      category: "Food",
      recipient: "Food Store",
      date: now,
      expenseType: "one-time",
      rawMessage: "Eggs Tray x2",
      parsedData: {},
      createdAt: now,
    },
    {
      amount: 935,
      category: "Food",
      recipient: "Food Store",
      date: now,
      expenseType: "one-time",
      rawMessage: "Indomie Packs x17",
      parsedData: {},
      createdAt: now,
    },
    {
      amount: 650,
      category: "Food",
      recipient: "Food Store",
      date: now,
      expenseType: "one-time",
      rawMessage: "PEMBE 4KG",
      parsedData: {},
      createdAt: now,
    },

    // --- Rent ---
    {
      amount: 12000,
      category: "Rent",
      recipient: "Landlord",
      date: now,
      expenseType: "recurring",
      rawMessage: "Monthly Rent",
      isRecurring: true,
      parsedData: {},
      createdAt: now,
    },
  ],
  incomeSources: [
    {
      name: "Monthly Salary",
      amount: 20000,
      frequency: "monthly",
      paydayDay: 1,
      isActive: true,
      createdAt: now,
    },
    {
      name: "Family Support",
      amount: 10000,
      frequency: "monthly",
      paydayDay: 15,
      isActive: true,
      createdAt: now,
    },
    {
      name: "Side Hustle",
      amount: 30000,
      frequency: "one-time",
      paydayDay: 1,
      isActive: true,
      createdAt: now,
    },
  ],
  debts: [
    // Loaning apps
    {
      name: "Tala Loan",
      creditor: "Tala",
      totalAmount: 5000,
      remainingAmount: 3500,
      currentBalance: 3500,
      interestRate: 15,
      monthlyPaymentAmount: 500,
      paymentDueDay: 15,
      dueDate: now + 15 * 86400000, // 15 days from now
      minimumPayment: 500,
      status: "active",
      notes: "Emergency loan for rent",
      createdAt: now - 15 * 86400000,
      updatedAt: now,
    },
    {
      name: "Branch Loan",
      creditor: "Branch",
      totalAmount: 3000,
      remainingAmount: 2000,
      currentBalance: 2000,
      interestRate: 12,
      monthlyPaymentAmount: 300,
      paymentDueDay: 10,
      dueDate: now + 10 * 86400000, // 10 days from now
      minimumPayment: 300,
      status: "active",
      notes: "Quick cash for emergency",
      createdAt: now - 20 * 86400000,
      updatedAt: now,
    },
    {
      name: "Fuliza Overdraft",
      creditor: "M-Pesa Fuliza",
      totalAmount: 1500,
      remainingAmount: 1500,
      currentBalance: 1500,
      interestRate: 9,
      monthlyPaymentAmount: 200,
      paymentDueDay: 7,
      dueDate: now + 7 * 86400000, // 7 days from now
      minimumPayment: 200,
      status: "active",
      notes: "Overdraft for transport",
      createdAt: now - 5 * 86400000,
      updatedAt: now,
    },
    // Friends
    {
      name: "Loan from Kamau",
      creditor: "Kamau (Friend)",
      totalAmount: 2000,
      remainingAmount: 1000,
      currentBalance: 1000,
      interestRate: 0,
      monthlyPaymentAmount: 500,
      paymentDueDay: 20,
      dueDate: now + 20 * 86400000, // 20 days from now
      minimumPayment: 500,
      status: "active",
      notes: "Borrowed for food shopping",
      createdAt: now - 10 * 86400000,
      updatedAt: now,
    },
    {
      name: "Loan from Njeri",
      creditor: "Njeri (Friend)",
      totalAmount: 1500,
      remainingAmount: 1500,
      currentBalance: 1500,
      interestRate: 0,
      monthlyPaymentAmount: 500,
      paymentDueDay: 30,
      dueDate: now + 30 * 86400000, // 30 days from now
      minimumPayment: 500,
      status: "active",
      notes: "Borrowed for sherehe",
      createdAt: now - 3 * 86400000,
      updatedAt: now,
    },
    {
      name: "Loan from Wanjiku",
      creditor: "Wanjiku (Friend)",
      totalAmount: 3000,
      remainingAmount: 2500,
      currentBalance: 2500,
      interestRate: 0,
      monthlyPaymentAmount: 1000,
      paymentDueDay: 25,
      dueDate: now + 25 * 86400000, // 25 days from now
      minimumPayment: 1000,
      status: "active",
      notes: "Emergency medical expense",
      createdAt: now - 12 * 86400000,
      updatedAt: now,
    },
  ],
  savingsGoals: [
    {
      name: "New TV",
      targetAmount: 35000,
      currentAmount: 8500,
      targetDate: now + 90 * 86400000, // 90 days from now
      status: "active",
      isCompleted: false,
      notes: "Saving for a 43-inch smart TV",
      createdAt: now - 30 * 86400000,
      updatedAt: now,
    },
    {
      name: "New Phone",
      targetAmount: 25000,
      currentAmount: 12000,
      targetDate: now + 60 * 86400000, // 60 days from now
      status: "active",
      isCompleted: false,
      notes: "Upgrading to a better smartphone",
      createdAt: now - 45 * 86400000,
      updatedAt: now,
    },
    {
      name: "Birthday Celebration",
      targetAmount: 15000,
      currentAmount: 5000,
      targetDate: now + 120 * 86400000, // 120 days from now
      status: "active",
      isCompleted: false,
      notes: "Planning a nice birthday party",
      createdAt: now - 20 * 86400000,
      updatedAt: now,
    },
  ],
};

async function cleanDemoData() {
  console.log("Cleaning existing demo data...");

  try {
    // Query all data for the demo user
    const result = await adminDb.query({
      profiles: {
        $: {
          where: {
            id: demoUserId,
          },
        },
        expenses: {},
        categories: {},
        recipients: {},
        incomeSources: {},
        budgets: {},
        dailyCheckins: {},
        debts: {},
        savingsGoals: {},
        recurringTransactions: {},
        feedback: {},
      },
    });

    if (!result?.profiles || result.profiles.length === 0) {
      console.log("No existing demo data found.");
      return;
    }

    const profile = result.profiles[0];
    const deleteTxs: ReturnType<(typeof tx.expenses)[string]["delete"]>[] = [];

    // Delete all related entities
    if (profile.expenses) {
      profile.expenses.forEach((expense: { id: string }) => {
        deleteTxs.push(tx.expenses[expense.id].delete());
      });
      console.log(`Marked ${profile.expenses.length} expenses for deletion`);
    }

    if (profile.categories) {
      profile.categories.forEach((category: { id: string }) => {
        deleteTxs.push(tx.categories[category.id].delete());
      });
      console.log(
        `Marked ${profile.categories.length} categories for deletion`
      );
    }

    if (profile.recipients) {
      profile.recipients.forEach((recipient: { id: string }) => {
        deleteTxs.push(tx.recipients[recipient.id].delete());
      });
      console.log(
        `Marked ${profile.recipients.length} recipients for deletion`
      );
    }

    if (profile.incomeSources) {
      profile.incomeSources.forEach((income: { id: string }) => {
        deleteTxs.push(tx.income_sources[income.id].delete());
      });
      console.log(
        `Marked ${profile.incomeSources.length} income sources for deletion`
      );
    }

    if (profile.budgets) {
      profile.budgets.forEach((budget: { id: string }) => {
        deleteTxs.push(tx.budgets[budget.id].delete());
      });
      console.log(`Marked ${profile.budgets.length} budgets for deletion`);
    }

    if (profile.dailyCheckins) {
      profile.dailyCheckins.forEach((checkin: { id: string }) => {
        deleteTxs.push(tx.daily_checkins[checkin.id].delete());
      });
      console.log(
        `Marked ${profile.dailyCheckins.length} daily checkins for deletion`
      );
    }

    if (profile.debts) {
      profile.debts.forEach((debt: { id: string }) => {
        deleteTxs.push(tx.debts[debt.id].delete());
      });
      console.log(`Marked ${profile.debts.length} debts for deletion`);
    }

    if (profile.savingsGoals) {
      profile.savingsGoals.forEach((goal: { id: string }) => {
        deleteTxs.push(tx.savings_goals[goal.id].delete());
      });
      console.log(
        `Marked ${profile.savingsGoals.length} savings goals for deletion`
      );
    }

    if (profile.recurringTransactions) {
      profile.recurringTransactions.forEach((recurring: { id: string }) => {
        deleteTxs.push(tx.recurring_transactions[recurring.id].delete());
      });
      console.log(
        `Marked ${profile.recurringTransactions.length} recurring transactions for deletion`
      );
    }

    if (profile.feedback) {
      profile.feedback.forEach((fb: { id: string }) => {
        deleteTxs.push(tx.feedback[fb.id].delete());
      });
      console.log(
        `Marked ${profile.feedback.length} feedback items for deletion`
      );
    }

    // Execute all deletions
    if (deleteTxs.length > 0) {
      await adminDb.transact(deleteTxs);
      console.log(`✓ Deleted ${deleteTxs.length} records`);
    }

    console.log("✓ Cleanup completed");
  } catch (error) {
    console.error("Cleanup failed:", error);
    throw error;
  }
}

async function seedDemoData() {
  console.log("Starting seed process...");
  console.log("Admin DB initialized:", !!adminDb);

  try {
    // Clean existing data first
    await cleanDemoData();

    const batchSize = 100;

    // Create user profile using transact
    console.log("Creating demo user profile...");
    await adminDb.transact(
      tx.profiles[demoUserId].update({
        createdAt: now,
        currency: "KES",
        handle: "uuvjfgw8bk",
        locale: "en-KE",
        monthlyBudget: 0,
        onboardingCompleted: true,
        onboardingStep: "completed",
      })
    );
    console.log(`✓ Created user profile with handle: uuvjfgw8bk`);

    // Seed recipients
    console.log("Seeding recipients...");
    const recipientTxs = seedData.recipients.map((record) =>
      tx.recipients[id()].update(record).link({ profile: demoUserId })
    );
    await adminDb.transact(recipientTxs);
    console.log(`✓ Seeded ${seedData.recipients.length} recipients`);

    // Seed categories
    console.log("Seeding categories...");
    const categoryTxs = seedData.categories.map((record) =>
      tx.categories[id()].update(record).link({ profile: demoUserId })
    );
    await adminDb.transact(categoryTxs);
    console.log(`✓ Seeded ${seedData.categories.length} categories`);

    // Seed expenses in batches
    console.log("Seeding expenses...");
    const expenses = seedData.expenses;
    const batches: ReturnType<(typeof tx.expenses)[string]["update"]>[][] = [];
    let currentBatch: ReturnType<(typeof tx.expenses)[string]["update"]>[] = [];

    for (let i = 0; i < expenses.length; i++) {
      currentBatch.push(
        tx.expenses[id()].update(expenses[i]).link({ profile: demoUserId })
      );
      if (currentBatch.length >= batchSize) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }

    // Add any remaining expenses to the last batch
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    // Transact all batches
    for (const batch of batches) {
      await adminDb.transact(batch);
    }
    console.log(`✓ Seeded ${expenses.length} expenses`);

    // Seed income sources
    console.log("Seeding income sources...");
    const incomeSourceTxs = seedData.incomeSources.map((record) =>
      tx.income_sources[id()].update(record).link({ profile: demoUserId })
    );
    await adminDb.transact(incomeSourceTxs);
    console.log(`✓ Seeded ${seedData.incomeSources.length} income sources`);

    // Seed debts
    console.log("Seeding debts...");
    const debtTxs = seedData.debts.map((record) =>
      tx.debts[id()].update(record).link({ profile: demoUserId })
    );
    await adminDb.transact(debtTxs);
    console.log(`✓ Seeded ${seedData.debts.length} debts`);

    // Seed savings goals
    console.log("Seeding savings goals...");
    const savingsGoalTxs = seedData.savingsGoals.map((record) =>
      tx.savings_goals[id()].update(record).link({ profile: demoUserId })
    );
    await adminDb.transact(savingsGoalTxs);
    console.log(`✓ Seeded ${seedData.savingsGoals.length} savings goals`);

    console.log("Demo Kenyan data seeded successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  }
}

if (require.main === module) {
  seedDemoData().catch(console.error);
}
