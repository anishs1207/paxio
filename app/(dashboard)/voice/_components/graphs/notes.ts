//this is an example file which does not have any use case in the project  

import { callGemini } from "../../../../../utils/geminiClient";
import prisma from "../../../../../../../web/lib/db";
import { getDateDetails, extractJSONFromText } from "./expense.utils";

//@@todo add later:
//   budgetCategory: "Discretionary", // Fixed vs variable spending
//   projectId: null, // If tied to a project or trip
//   taxAmount: 20, // If applicable for business or reimbursement
//   isBusinessExpense: false, // Useful for business analysis
//   reimbursable: false, // If needs reimbursement from employer

// input formats:  Expense tracking:
// - input:
// image or pdf or bank statements or excel sheets
// or screenshot or bank statements
// - accountant handoff (to send the report of the p & l
// to the user's accountant here)
// - gives an expense and automtically tags it here and added

export default async function RunExpenseTracking(
  userId: string,
  prompt: string,
  files: any,
  task: string
) {
  let expensePrompt: string;
  switch (task) {
    case "add-expense":
      const { month, year, weekday, time, timeOfDay } = getDateDetails();
      expensePrompt = `
    <agent>
    You are an now responsible for converting the given user prompt: ${prompt}
    to be an expense in following format, if it is a single expense t
    </agent>

    <output>
    It contains an array of json object called expenses with the following properties, all following properties are required if the 
    property is not accessible then use empty string:

    - tags: Choose from following: "Food" or "Transport" or Housing" or "Utilities" or "Health" or "Education" or "Entertainment" or "Shopping" or "Travel" or "Subscriptions" or "Savings" or "Gifts" or "Taxes" or "Charity" or "Insurance" or "Fitness" or "Pets" or "Miscellaneous"
    - expenseDetails: Description of what was spent
    - amount: Amount spent
    - currency: Currency code: "INR" or "USD"
    - paymentMethods:  CASH | CARD | UPI | ETC
    - recurring: If this is a recurring expense
    - location: where it was spent
    - note: Optional extra notes
    - receiptUrl: Optional URL to a receipt image/pdf
    - sentiment: Derived from note (AI sentiment)- ("postiive" | "negative" | "neutral")
    - spendType: Could be 'Personal' or 'Business' ('Personal' | 'Business')
    - category: Standardized category (for analytics) - "Dining Out"
    - subCategory: Further refinement if needed - "Lunch",
    </output>

    <examples>

        <example-1>
        '''json
        {
            tags: ["Food", "Entertainment"],
            expenseDetails: "Lunch at Starbucks",
            amount: 450,
            currency: "INR",
            paymentMethods: "UPI",
            recurring: false,
            location: "Connaught Place, Delhi",
            note: "Met friends for coffee",
            merchant: "Cafe Coffee Day",
            sentiment: "positive", 
            spendType: "Personal",
            category: "Dining Out",
            subCategory: "Lunch",
        }
        '''
        </example-1>

        <example-2>
        '''json
        {
            tags: ["Travel", "Transport"],
            expenseDetails: "Cab ride to airport",
            amount: 600,
            currency: "INR",
            paymentMethods: "CARD",
            recurring: false,
            location: "Delhi Airport",
            note: "Ola Prime cab for early morning flight",
            merchant: "Ola Cabs",
            sentiment: "neutral",
            spendType: "Personal",
            category: "Transport",
            subCategory: "Cab"
        }
        '''
        </example-2>

        <example-3>
        '''json
        {
            tags: ["Subscriptions", "Entertainment"],
            expenseDetails: "Netflix monthly subscription",
            amount: 499,
            currency: "INR",
            paymentMethods: "CARD",
            recurring: true,
            location: "Online",
            note: "Automatic debit for Netflix Premium plan",
            merchant: "Netflix India",
            sentiment: "neutral",
            spendType: "Personal",
            category: "Subscriptions",
            subCategory: "Streaming Services"
        }
        '''
        </example-3>

        <example-4>
        '''json
        {
            tags: ["Business", "Food"],
            expenseDetails: "Client meeting dinner",
            amount: 2500,
            currency: "INR",
            paymentMethods: "CARD",
            recurring: false,
            location: "ITC Maurya, Delhi",
            note: "Dinner meeting with potential client for project discussion",
            merchant: "ITC Maurya",
            sentiment: "positive",
            spendType: "Business",
            category: "Dining Out",
            subCategory: "Client Meeting"
        }
        '''
        </example-4>
    
        </examples>
     `;
      const responseAddExpense = await callGemini(expensePrompt);
      //@@add response and suggestions list here

      const parsedAddExpense = extractJSONFromText(responseAddExpense);

      console.log("paredAddExpense", parsedAddExpense);

      const addExpensePayload = {
        ...parsedAddExpense,
        month,
        year,
        weekday,
        time,
        timeOfDay,
        userId,
      };

      try {
        // Directly insert to database instead of HTTP call to avoid circular dependencies
        const newExpense = await prisma.expenses.create({
          data: {
            expenseDetails: addExpensePayload.expenseDetails,
            tagsOfExpenses: addExpensePayload.tags || [],
            amount: Number(addExpensePayload.amount),
            month: month as any,
            year,
            weekDay: weekday as any,
            time: time,
            timeOfDay: timeOfDay as any,
            currency: addExpensePayload.currency,
            recurring: addExpensePayload.recurring || false,
            paymentMethods: addExpensePayload.paymentMethods,
            sentiment: addExpensePayload.sentiment,
            spendType: addExpensePayload.spendType,
            location: addExpensePayload.location,
            note: addExpensePayload.note,
            merchant: addExpensePayload.merchant,
            category: addExpensePayload.category,
            subCategory: addExpensePayload.subCategory,
            userId,
          },
        });
        console.log("Added expense:", newExpense);
      } catch (err: any) {
        console.log("Error adding expense", err);
      }

      break;

    case "analyse-expense":
      console.log("entwered anakyse expenses");
      expensePrompt = `
      <agent>
      You are resonsible for generating filters to search for given expenses here.
      the user has prompted ${prompt}. You have to analyse the expenses of the user which starts out
      with the required expenses fetched via use of the following filters below
      </agent>

      <filters>
        tags: "Food" | "Transport" | Housing" | "Utilities" | "Health" | "Education" | "Entertainment" | "Shopping" | "Travel" | "Subscriptions" | "Savings" | "Gifts" | "Taxes" | "Charity" | "Insurance" | "Fitness" | "Pets" | "Miscellaneous"
        amountGreaterThan: amount to be less than
        amountLesserThan: amount to be greater than
        currency: "INR" or "USD"
        paymentMethod: "CASH" | "CARD" | "UPI" | "ETC"
        sentiment: "Postive" | "Negative" | "Neutral"
        spendType: "Personal" | "Business"
        month: "January" | "February" | "March" | "April" | "May" | "June" | "July" | "August" | "September" | "October" | "November" | "December"
        year: the date of the year (ex: "2025")
        weekDay: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"
        timeOfDay: "Morning" | "Afternoon" | "Evening" | "Night"
        recurring: "true" | "false"
      </filters>
      
  <examples>

    <example-1>
    Input: "Show me all my food and transport expenses above ₹500 in March."
    Output:
    '''json
    {
      "tags": ["Food", "Transport"],
      "amountGreaterThan": 500,
      "currency": "INR",
      "month": "March",
      "spendType": "Personal"
    }
    '''
    </example-1>

    <example-2>
    Input: "Find business card transactions made in USD last quarter."
    Output:
    '''json
    {
      "spendType": "Business",
      "paymentMethod": "CARD",
      "currency": "USD"
    }
    '''
    </example-2>

    <example-3>
    Input: "List entertainment and shopping expenses below ₹1000 this Saturday evening."
    Output:
    '''json
    {
      "tags": ["Entertainment", "Shopping"],
      "amountLesserThan": 1000,
      "currency": "INR",
      "weekDay": "Saturday",
      "timeOfDay": "Evening",
      "spendType": "Personal"
    }
    '''
    </example-3>

    <example-4>
    Input: "Show all recurring utility bills paid via UPI this month."
    Output:
    '''json
    {
      "tags": ["Utilities"],
      "paymentMethod": "UPI",
      "recurring": true,
      "currency": "INR",
      "spendType": "Personal"
    }
    '''
    </example-4>

    <example-5>
    Input: "Filter out negative sentiment expenses related to subscriptions."
    Output:
    '''json
    {
      "tags": ["Subscriptions"],
      "sentiment": "Negative",
      "spendType": "Personal"
    }
    '''
    </example-5>

    <example-6>
    Input: "Show me my charity donations and gift expenses from December 2024."
    Output:
    '''json
    {
      "tags": ["Charity", "Gifts"],
      "month": "December",
      "year": "2024",
      "spendType": "Personal"
    }
    '''
    </example-6>

    <example-7>
    Input: "Find insurance payments done through bank transfer in USD during February mornings."
    Output:
    '''json
    {
      "tags": ["Insurance"],
      "paymentMethod": "BANK_TRANSFER",
      "currency": "USD",
      "month": "February",
      "timeOfDay": "Morning",
      "spendType": "Personal"
    }
    '''
    </example-7>

    <example-8>
    Input: "I want to see all my fitness and personal care expenses under ₹2000 this week."
    Output:
    '''json
    {
      "tags": ["Fitness", "Personal Care"],
      "amountLesserThan": 2000,
      "currency": "INR",
      "spendType": "Personal"
    }
    '''
    </example-8>

    <example-9>
    Input: "List my business travel and accommodation expenses from last year."
    Output:
    '''json
    {
      "tags": ["Travel", "Housing"],
      "spendType": "Business",
      "year": "2024"
    }
    '''
    </example-9>

    <example-10>
    Input: "Show all positive sentiment transport and utilities expenses in August evenings."
    Output:
    '''json
    {
      "tags": ["Transport", "Utilities"],
      "sentiment": "Positive",
      "month": "August",
      "timeOfDay": "Evening",
      "spendType": "Personal"
    }
    '''
    </example-10>
  </examples>
      `;
      // const responseAnalyseExpense = await callGemini(expensePrompt);

      // const parsedAnalyseExpense = extractJSONFromText(responseAnalyseExpense);

      // console.log("parsednalauseExpe", { userId, ...parsedAnalyseExpense });

      // let response: any;

      // try {
      //   response = await axios.post(`${BACKEND_URL}/analyse-expense`, {
      //     userId,
      //     ...parsedAnalyseExpense,
      //   });
      //   console.log("response", response);
      // } catch (err: any) {
      //   console.log("Error adding expense", err);
      // }

      // let expenses = await response.data;

      let expenses = [
        {
          id: "e1a2d3f4-5678-4321-9876-abcdef123456",
          expenseDetails: "Dinner with friends at Olive",
          tagsOfExpenses: ["Food", "Entertainment"],
          amount: 1500,
          month: "October",
          year: 2025,
          weekDay: "Saturday",
          time: "20:30",
          timeOfDay: "Evening",
          currency: "INR",
          recurring: false,
          paymentMethods: "UPI",
          sentiment: "Positive",
          spendType: "Personal",
          location: "Delhi",
          note: "Birthday dinner celebration",
          merchant: "Olive Bar & Kitchen",
          category: "Dining",
          subCategory: "Restaurants",
          createdAt: "2025-10-25T15:10:45.123Z",
          userId: "user123",
        },
        {
          id: "b7c8d9e0-f1a2-3456-b789-cdef456789ab",
          expenseDetails: "Monthly Netflix subscription",
          tagsOfExpenses: ["Entertainment", "Streaming"],
          amount: 649,
          month: "October",
          year: 2025,
          weekDay: "Wednesday",
          time: "22:15",
          timeOfDay: "Night",
          currency: "INR",
          recurring: true,
          paymentMethods: "CARD",
          sentiment: "Neutral",
          spendType: "Personal",
          location: "Online",
          note: "Recurring auto debit",
          merchant: "Netflix India",
          category: "Entertainment",
          subCategory: "Streaming Services",
          createdAt: "2025-10-23T18:20:00.000Z",
          userId: "user123",
        },
        {
          id: "d1e2f3a4-b5c6-7890-d1e2-f3a456789012",
          expenseDetails: "Groceries at Big Bazaar",
          tagsOfExpenses: ["Groceries", "Home"],
          amount: 3200,
          month: "October",
          year: 2025,
          weekDay: "Sunday",
          time: "11:45",
          timeOfDay: "Morning",
          currency: "INR",
          recurring: false,
          paymentMethods: "CASH",
          sentiment: "Positive",
          spendType: "Personal",
          location: "Delhi",
          note: "Weekly stock-up",
          merchant: "Big Bazaar",
          category: "Household",
          subCategory: "Groceries",
          createdAt: "2025-10-19T07:15:10.456Z",
          userId: "user123",
        },
        {
          id: "f6g7h8i9-j0k1-2345-l6m7-n8o9p0q1r2s3",
          expenseDetails: "Ola ride to airport",
          tagsOfExpenses: ["Transport", "Travel"],
          amount: 780,
          month: "October",
          year: 2025,
          weekDay: "Friday",
          time: "05:50",
          timeOfDay: "Morning",
          currency: "INR",
          recurring: false,
          paymentMethods: "UPI",
          sentiment: "Neutral",
          spendType: "Personal",
          location: "Delhi",
          note: "Airport drop",
          merchant: "Ola Cabs",
          category: "Transport",
          subCategory: "Taxi",
          createdAt: "2025-10-17T00:10:00.000Z",
          userId: "user123",
        },
        {
          id: "g1h2i3j4-k5l6-7890-m1n2-o3p4q5r6s7t8",
          expenseDetails: "Gym membership renewal",
          tagsOfExpenses: ["Health", "Fitness"],
          amount: 5000,
          month: "September",
          year: 2025,
          weekDay: "Monday",
          time: "08:00",
          timeOfDay: "Morning",
          currency: "INR",
          recurring: true,
          paymentMethods: "CARD",
          sentiment: "Positive",
          spendType: "Personal",
          location: "Delhi",
          note: "6-month membership",
          merchant: "Cult Fit",
          category: "Health & Fitness",
          subCategory: "Gym",
          createdAt: "2025-09-15T05:30:00.000Z",
          userId: "user123",
        },
        {
          id: "a9b8c7d6-e5f4-3210-g9h8-i7j6k5l4m3n2",
          expenseDetails: "New sneakers purchase",
          tagsOfExpenses: ["Shopping", "Footwear"],
          amount: 4200,
          month: "September",
          year: 2025,
          weekDay: "Tuesday",
          time: "16:20",
          timeOfDay: "Afternoon",
          currency: "INR",
          recurring: false,
          paymentMethods: "CARD",
          sentiment: "Positive",
          spendType: "Personal",
          location: "Delhi",
          note: "Nike sneakers from Myntra",
          merchant: "Myntra",
          category: "Shopping",
          subCategory: "Clothing & Accessories",
          createdAt: "2025-09-10T10:50:00.000Z",
          userId: "user123",
        },
        {
          id: "p1q2r3s4-t5u6-7890-v1w2-x3y4z5a6b7c8",
          expenseDetails: "Movie night at PVR",
          tagsOfExpenses: ["Entertainment", "Leisure"],
          amount: 950,
          month: "August",
          year: 2025,
          weekDay: "Saturday",
          time: "19:00",
          timeOfDay: "Evening",
          currency: "INR",
          recurring: false,
          paymentMethods: "UPI",
          sentiment: "Positive",
          spendType: "Personal",
          location: "Delhi",
          note: "Watched ‘Oppenheimer’",
          merchant: "PVR Cinemas",
          category: "Entertainment",
          subCategory: "Movies",
          createdAt: "2025-08-23T13:30:00.000Z",
          userId: "user123",
        },
        {
          id: "d2c3b4a5-e6f7-8901-g2h3-i4j5k6l7m8n9",
          expenseDetails: "Coffee with client",
          tagsOfExpenses: ["Food", "Networking"],
          amount: 350,
          month: "August",
          year: 2025,
          weekDay: "Wednesday",
          time: "15:10",
          timeOfDay: "Afternoon",
          currency: "INR",
          recurring: false,
          paymentMethods: "CARD",
          sentiment: "Neutral",
          spendType: "Personal",
          location: "Gurgaon",
          note: "Networking meeting",
          merchant: "Starbucks",
          category: "Dining",
          subCategory: "Cafe",
          createdAt: "2025-08-06T09:45:00.000Z",
          userId: "user123",
        },
        {
          id: "u8v9w0x1-y2z3-4567-a8b9-c0d1e2f3g4h5",
          expenseDetails: "Weekend trip to Rishikesh",
          tagsOfExpenses: ["Travel", "Leisure"],
          amount: 8700,
          month: "July",
          year: 2025,
          weekDay: "Friday",
          time: "06:30",
          timeOfDay: "Morning",
          currency: "INR",
          recurring: false,
          paymentMethods: "UPI",
          sentiment: "Positive",
          spendType: "Personal",
          location: "Rishikesh",
          note: "Road trip with friends",
          merchant: "Airbnb",
          category: "Travel",
          subCategory: "Accommodation",
          createdAt: "2025-07-11T01:00:00.000Z",
          userId: "user123",
        },
        {
          id: "i5j6k7l8-m9n0-1234-o5p6-q7r8s9t0u1v2",
          expenseDetails: "Book purchase from Amazon",
          tagsOfExpenses: ["Education", "Reading"],
          amount: 899,
          month: "June",
          year: 2025,
          weekDay: "Monday",
          time: "10:20",
          timeOfDay: "Morning",
          currency: "INR",
          recurring: false,
          paymentMethods: "CARD",
          sentiment: "Positive",
          spendType: "Personal",
          location: "Delhi",
          note: "Bought ‘Atomic Habits’",
          merchant: "Amazon India",
          category: "Education",
          subCategory: "Books",
          createdAt: "2025-06-16T04:50:00.000Z",
          userId: "user123",
        },
      ];

      console.log("fetched expenses", expenses);

      let expensesPrompt: string = "";

      const framework = `  
    <framework>
        use the following stuff to analyse

        <spending-pattern>
        Category-wise Trends: Identify which categories take up the most money (Food, Entertainment, Travel, Subscriptions).
        Insight: “You spent 40% of your income on dining out.”
        Advice: Suggest cooking at home more or setting a dining-out budget.
        Time-based Patterns: Daily, weekly, or hourly spending habits.
        Insight: “Your highest spending happens on weekends.”
        Advice: Plan your weekend activities with a budget in mind.
        Recurring Expenses: Track subscriptions, EMI, memberships.
        Insight: “₹1200 per month on multiple subscriptions you rarely use.”
        Advice: Cancel unused subscriptions or consolidate them.
        </spending-pattern>

        <payment-behaviour>
        Payment Methods: Cash, UPI, Card, Wallet.
        Insight: “90% of expenses are digital payments.”
        Advice: Set limits on card payments or use cash envelopes to control impulse spending.
        Splurges vs Essentials: Compare essential (groceries, bills) vs discretionary (entertainment, luxury).
        Insight: “Discretionary spending is higher than essential spending.”
        Advice: Reduce non-essential purchases by X% next month.
        </payment-behaviour>
        
        <location-contextual-spending>
        Location Analysis: Identify high-spending locations.
        Insight: “Most dining expenses happen in Connaught Place.”
        Advice: Try exploring cheaper alternatives or cooking at home.
        Event-based Spending: Correlate spending spikes with holidays, birthdays, or outings.
        Insight: “Shopping spikes before festival season.”
        Advice: Create a festival budget and track early purchases.
        </location-contextual-spending>
        
        <overspending-alerts>
        Compare against user-defined budgets for categories.
        Insight: “You exceeded your Entertainment budget by 25%.”
        Advice: Reduce spending in the next month and track weekly.
        Highlight unusual transactions or sudden spikes.
        Insight: “One-time purchase of ₹2000 on gadgets this month.”
        Advice: Plan such purchases in advance or allocate a ‘one-time buys’ budget.
        </overspending-alerts>
        
        <long-term-habits-recommendations>
        Savings Ratio: How much is being saved vs spent.
        Insight: “Only 10% of income saved this month.”
        Advice: Automate savings or create a “mandatory savings” rule.
        Goal Tracking: Compare against user goals (vacation fund, emergency fund).
        Insight: “You are 30% behind your emergency fund target.”
        Advice: Set small weekly targets to catch up.
        </long-term-habits-recommendations>
        
        <behavioral-insights>
        Impulse Spending: Identify small frequent unplanned purchases.
        Advice: Use a ‘24-hour rule’ before unplanned buys.
        Subscription Fatigue: Track rarely-used recurring services.
        Advice: Cancel or pause subscriptions.
        </behavioral-insights>

    </framework>
      `;

      const graphs = `
       <graphs>
        <line>
        {
        "type": line",
        "title": "Line Chart",
        "description":"An interactive line chart",
        "chartData": [
            { date: "2024-04-01", desktop: 222, mobile: 150 },
            { date: "2024-05-14", desktop: 448, mobile: 490 },
            { date: "2024-05-15", desktop: 473, mobile: 380 },
            { date: "2024-05-16", desktop: 338, mobile: 400 },
            { date: "2024-05-17", desktop: 499, mobile: 420 },
            { date: "2024-05-18", desktop: 315, mobile: 350 },
            { date: "2024-05-19", desktop: 235, mobile: 180 },
            { date: "2024-05-20", desktop: 177, mobile: 230 },
            { date: "2024-06-13", desktop: 81, mobile: 130 },
            { date: "2024-06-14", desktop: 426, mobile: 380 },
            { date: "2024-06-15", desktop: 307, mobile: 350 },
            { date: "2024-06-27", desktop: 448, mobile: 490 },
            { date: "2024-06-28", desktop: 149, mobile: 200 },
            { date: "2024-06-29", desktop: 103, mobile: 160 },
            { date: "2024-06-30", desktop: 446, mobile: 400 },
          ],
          "chartConfig": {
            desktop: {
              label: "Desktop",
              color: "var(--chart-1)",
            },
            mobile: {
              label: "Mobile",
              color: "var(--chart-2)",
            }
        }
        </line>

        <pie>
        {
        "type": "pie",
        "title": "Pie Chart",
        "description":"An interactive Pie chart",
        "chartData": [
            { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
            { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
            { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
            { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
            { browser: "other", visitors: 90, fill: "var(--color-other)" },
          ]
          "chartConfig": {
            visitors: {
              label: "Visitors",
            },
            chrome: {
              label: "Chrome",
              color: "var(--chart-1)",
            },
            safari: {
              label: "Safari",
              color: "var(--chart-2)",
            },
            firefox: {
              label: "Firefox",
              color: "var(--chart-3)",
            },
            edge: {
              label: "Edge",
              color: "var(--chart-4)",
            },
            other: {
              label: "Other",
              color: "var(--chart-5)",
            },
          }
        }
        </pie>

        <area>
         {
          "type": "area",
          "title": "Area Chart",
          "description":"An interactive Area chart",
          "chartData": [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
            "chartConfig": {
            desktop: {
              label: "Desktop",
              color: "var(--chart-1)",
            },
            mobile: {
              label: "Mobile",
              color: "var(--chart-2)",
            },
          }
      }
      </area>

      <radial>
         {
          "type": "radial",
          "title": "Radial Chart",
          "description": "An interactive radial chart",
          "chartData": [
            { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
            { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
            { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
            { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
            { browser: "other", visitors: 90, fill: "var(--color-other)" },
          ],
          "chartConfig": {
            visitors: {
              label: "Visitors",
            },
            chrome: {
              label: "Chrome",
              color: "var(--chart-1)",
            },
            safari: {
              label: "Safari",
              color: "var(--chart-2)",
            },
            firefox: {
              label: "Firefox",
              color: "var(--chart-3)",
            },
            edge: {
              label: "Edge",
              color: "var(--chart-4)",
            },
            other: {
              label: "Other",
              color: "var(--chart-5)",
            },
          }
      }
      </radial>

      <radar>
        {
          "type": "radar",
          "title": "Radar Chart",
          "description": "An interactive radar chart",
          "chartData": [
            { month: "January", desktop: 186 },
            { month: "February", desktop: 305 },
            { month: "March", desktop: 237 },
            { month: "April", desktop: 273 },
            { month: "May", desktop: 209 },
            { month: "June", desktop: 214 },
                ]
          "chartConfig":   {
            desktop: {
              label: "Desktop",
              color: "var(--chart-1)",
            },
          }
      }
      </radar>
      
      <bar>
      {
          "type": "bar",
          "title": "Bar Chart",
          "description": "An interactive bar chart",
          "chartData": [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          "chartConfig": {
            desktop: {
              label: "Desktop",
              color: "var(--chart-1)",
            },
            mobile: {
              label: "Mobile",
              color: "var(--chart-2)",
            },
          }
      }

      </bar>

    </graphs>

      `;

      for (let i = 0; i < expenses.length; i++) {
        const currentExpense = expenses[i];
        expensesPrompt += `
        <expense-${i}>
          expenseDetails: ${currentExpense.expenseDetails}
          amount: ${currentExpense.amount}
          currency: ${currentExpense.currency}
          date: ${currentExpense.month}, ${currentExpense.year}
          weekday: ${currentExpense.weekDay}
          timeOfDay; ${currentExpense.timeOfDay}
          time: ${currentExpense.time}
          paymentMethods: ${currentExpense.paymentMethods}
          location: ${currentExpense.location}
          merchant: ${currentExpense.merchant}
          recurring: ${currentExpense.recurring}
          sentiment": ${currentExpense.sentiment}
          spendType: ${currentExpense.spendType}
          category: ${currentExpense.category}
          subCategory: ${currentExpense.subCategory}
        </expense-${i}>
        `;
      }

      console.log("expensePrompt", expensePrompt);

      const analysisPrompt = `
      <agent>
      You are agent to analyse the given user expenses based on ${prompt}.
      Make sure you include all relevant analysis points which the user has asked
      and other metrics and analysis to help the user better improve themselves and other metrics which seem interesting.
      </agent>

      <input>
      Given the following Expenses:
      ${expensesPrompt}
      </input>

      <output>
      Output should be in following format here:
      - suggestions: suggestions on what other criteria on which user can analyse thier expenses
      - response: the compiled analysis of the expenses of the user in markdown format (preferablly more tabular format for best user experience)
      </output>

      ${framework}

      ${graphs}

      <important-instructions>
     
      - In each graph the chartConfig property has many properties (desktop and mobile) each of while MUST HAVE label & color 
      - Example:
      "chartConfig": {
            desktop: {
              label: "Desktop",
              color: "var(--chart-1)",
            },
            mobile: {
              label: "Mobile",
              color: "var(--chart-2)",
            },
      }
          
      </important-instructions>

      <examples>
        <example-1>
        Input: "Give me a summary of my monthly spending and insights."
        Output:
        '''json
        {
          "suggestions": [
            "Compare monthly spending trends to identify high-spend months.",
            "Review dining and travel categories for budget optimization.",
            "Track savings ratio to maintain at least 20% monthly savings."
          ],
          "response": "### 📊 Monthly Spending Overview (April–September 2025)\n\n**Total Spent:** ₹72,500\n**Average Monthly Spend:** ₹12,083\n**Top Categories:** Food (₹21,000), Travel (₹14,200), Entertainment (₹9,400)\n\n#### 🔍 Key Insights:\n- Spending **peaked in July (₹15,000)** due to travel and dining.\n- **Food** expenses account for 29% of total — consider meal prepping to cut 10%.\n- **Savings rate** dropped from 24% to 17% — automate transfers to restore balance.\n\n#### 💡 Recommendations:\n1. Set a ₹10,000 monthly dining limit.\n2. Use a travel pass for frequent commutes.\n3. Schedule weekly spending check-ins.",
          "graphs": [
            {
              "type": "line",
              "title": "Monthly Expense Trend",
              "description": "Visualizes total expenses per month to identify spending peaks.",
              "chartData": [
                { month: "April", total: 10800 },
                { month: "May", total: 11400 },
                { month: "June", total: 12500 },
                { month: "July", total: 15000 },
                { month: "August", total: 13200 },
                { month: "September", total: 11600 }
              ],
              "chartConfig": {
                total: { label: "Total Expense", color: "var(--chart-1)" }
              }
            },
            {
              "type": "bar",
              "title": "Category-Wise Spending (September 2025)",
              "description": "Shows top categories contributing to total monthly expenses.",
              "chartData": [
                { category: "Food", amount: 4500 },
                { category: "Travel", amount: 2800 },
                { category: "Entertainment", amount: 2100 },
                { category: "Shopping", amount: 1200 }
              ],
              "chartConfig": {
                amount: { label: "Amount (₹)", color: "var(--chart-2)" }
              }
            },
            {
              "type": "pie",
              "title": "Savings vs Expenses Ratio",
              "description": "Displays the proportion of spending vs savings in September 2025.",
              "chartData": [
                { name: "Expenses", value: 83 },
                { name: "Savings", value: 17 }
              ],
              "chartConfig": {}
            }
          ]
        }

        '''
        </example-1>

        <example-2>
        Input: "Analyse my spending habits and tell me how to improve savings."
        Output:
        '''json
        {
          "suggestions": [
            "Track discretionary categories like Entertainment and Coffee Shops.",
            "Identify recurring micro-spends to reduce unnecessary leakage.",
            "Automate monthly savings transfers."
          ],
          "response": "### 💰 Spending Habit Analysis (Q3 2025)\n\n**Total Spending:** ₹65,800\n**Discretionary Spend:** ₹22,400 (34%)\n**Recurring Payments:** ₹3,200/month\n\n#### 📈 Observations:\n- Frequent small spends (<₹400) in Entertainment & Snacks = ₹5,600 total.\n- Subscriptions like Spotify and Netflix run unnoticed — ₹1,200 wasted.\n- Weekend impulse spends form 40% of discretionary outflow.\n\n#### 💡 Recommendations:\n1. Implement the 50-30-20 rule.\n2. Use digital wallets for fixed limits on discretionary categories.\n3. Audit subscriptions quarterly.",
          "graphs": [
            {
              "type": "bar",
              "title": "Essential vs Discretionary Expenses",
              "description": "Compares spending across essential and non-essential categories.",
              "chartData": [
                { type: "Essential", amount: 43500 },
                { type: "Discretionary", amount: 22300 }
              ],
              "chartConfig": {
                amount: { label: "Amount (₹)", color: "var(--chart-1)" }
              }
            },
            {
              "type": "pie",
              "title": "Recurring vs One-Time Expenses",
              "description": "Highlights share of recurring payments versus one-time purchases.",
              "chartData": [
                { name: "Recurring", value: 15 },
                { name: "One-Time", value: 85 }
              ],
              "chartConfig": {}
            },
            {
              "type": "line",
              "title": "Weekend vs Weekday Spending Trend",
              "description": "Shows daily spending pattern highlighting weekend overspending.",
              "chartData": [
                { day: "Mon", total: 800 },
                { day: "Tue", total: 900 },
                { day: "Wed", total: 850 },
                { day: "Thu", total: 870 },
                { day: "Fri", total: 1100 },
                { day: "Sat", total: 1900 },
                { day: "Sun", total: 1750 }
              ],
              "chartConfig": {
                total: { label: "Total Spend (₹)", color: "var(--chart-2)" }
              }
            }
          ]
        }

        '''
        </example-2>

        <example-3>
        Input: "How are my business expenses performing compared to personal ones?"
        Output:
        '''json
        {
          "suggestions": [
            "Tag each transaction as personal or business to improve insights.",
            "Analyze ROI on business-related travel and meetings.",
            "Set monthly limits for both categories."
          ],
          "response": "### 🧾 Business vs Personal Spending Report (August 2025)\n\n**Business:** ₹38,600 | **Personal:** ₹52,400\n**Total:** ₹91,000\n\n#### 📉 Insights:\n- Business costs rose 12% due to software subscriptions.\n- Personal spending stable but entertainment overshoot by ₹1,500.\n- Combined travel expenses form 19% of total.\n\n#### 💡 Recommendations:\n1. Deduct business subscriptions as expenses.\n2. Merge duplicate personal and work tools.\n3. Review client-meeting ROI monthly.",
          "graphs": [
            {
              "type": "bar",
              "title": "Business vs Personal Monthly Comparison",
              "description": "Visual comparison of business and personal expenses for August 2025.",
              "chartData": [
                { category: "Business", amount: 38600 },
                { category: "Personal", amount: 52400 }
              ],
              "chartConfig": {
                amount: { label: "Amount (₹)", color: "var(--chart-1)" }
              }
            },
            {
              "type": "radar",
              "title": "Category Performance Radar",
              "description": "Shows expense distribution across shared categories for both segments.",
              "chartData": [
                { category: "Travel", business: 12000, personal: 5600 },
                { category: "Dining", business: 4500, personal: 8000 },
                { category: "Software", business: 7000, personal: 1200 },
                { category: "Entertainment", business: 2600, personal: 6200 },
                { category: "Utilities", business: 4500, personal: 5000 }
              ],
              "chartConfig": {
                business: { label: "Business", color: "var(--chart-2)" },
                personal: { label: "Personal", color: "var(--chart-3)" }
              }
            },
            {
              "type": "pie",
              "title": "Combined Category Distribution",
              "description": "Depicts share of total expenses across major categories.",
              "chartData": [
                { name: "Travel", value: 19 },
                { name: "Dining", value: 16 },
                { name: "Software", value: 10 },
                { name: "Entertainment", value: 13 },
                { name: "Utilities", value: 12 },
                { name: "Others", value: 30 }
              ],
              "chartConfig": {}
            }
          ]
        }

        '''
        </example-3>

        <example-4>
        Input: "Show a detailed analysis of my food and travel expenses."
        Output:
        '''json
        {
          "suggestions": [
            "Compare weekday vs weekend food and travel spends.",
            "Introduce a combined travel + food savings tracker.",
            "Track calorie or health-based impact of frequent dining out."
          ],
          "response": "### 🍔 Food & Travel Lifestyle Insights (September 2025)\n\n**Total Food Spend:** ₹14,200 | **Total Travel Spend:** ₹9,800\n\n#### 🔍 Insights:\n- Weekends account for 45% of food spending.\n- Long-distance trips caused a 30% spike in travel costs.\n- Frequent eating out near office area — high-cost cafés dominate 60%.\n\n#### 💡 Recommendations:\n1. Plan weekday meal packs to cut down ₹3,000/month.\n2. Use metro passes instead of cabs for short commutes.\n3. Log both meal & travel data to connect spending with lifestyle goals.",
          "graphs": [
            {
              "type": "line",
              "title": "Weekly Food vs Travel Trend",
              "description": "Tracks how food and travel expenses fluctuate across the week.",
              "chartData": [
                { day: "Mon", food: 500, travel: 400 },
                { day: "Tue", food: 700, travel: 450 },
                { day: "Wed", food: 650, travel: 500 },
                { day: "Thu", food: 800, travel: 480 },
                { day: "Fri", food: 1200, travel: 800 },
                { day: "Sat", food: 2000, travel: 1500 },
                { day: "Sun", food: 1700, travel: 1400 }
              ],
              "chartConfig": {
                food: { label: "Food", color: "var(--chart-1)" },
                travel: { label: "Travel", color: "var(--chart-2)" }
              }
            },
            {
              "type": "area",
              "title": "Weekend vs Weekday Expense Volume",
              "description": "Highlights how much of total spending occurs during weekends.",
              "chartData": [
                { category: "Weekdays", amount: 7800 },
                { category: "Weekends", amount: 6200 }
              ],
              "chartConfig": {
                amount: { label: "Amount (₹)", color: "var(--chart-3)" }
              }
            },
            {
              "type": "radial",
              "title": "Location-Wise Food Spending Share",
              "description": "Shows where most food spending occurs geographically.",
              "chartData": [
                { location: "Office Area", value: 55 },
                { location: "Home Area", value: 25 },
                { location: "Outings", value: 20 }
              ],
              "chartConfig": {}
            }
          ]
        }
        '''
        </example-4>

      </examples>
      `;

      // console.log("analyssPrompt", analysisPrompt);

      // const result = await callGemini(analysisPrompt);

      // console.log("result", result);

      // //@@error parsing here:

      // const parsed = extractJSONFromText(result);

      const parsed = {
        suggestions: [
          "Consider creating a weekly budget for each spending category, especially for groceries and dining out.",
          "Track all expenses meticulously, including small daily purchases, to get a complete picture of your spending habits.",
          "Set a target for reducing discretionary spending, perhaps by focusing on one category like 'Dining Out' or 'Entertainment' next week.",
        ],
        response: `### 📊 Last Week's Expense Analysis (October, 2025)

Based on the expenses recorded for last week, here's a detailed summary of your spending:

| Category        | Item                          | Amount (₹) | Payment Method | Weekday   | Time of Day | Recurring | Location  |
|:----------------|:------------------------------|:-----------|:---------------|:----------|:------------|:----------|:----------|
| **Household**   | Groceries at Big Bazaar       | 3200       | CASH           | Sunday    | Morning     | No        | Delhi     |
| **Dining**      | Dinner with friends at Olive  | 1500       | UPI            | Saturday  | Evening     | No        | Delhi     |
| **Transport**   | Ola ride to airport           | 780        | UPI            | Friday    | Morning     | No        | Delhi     |
| **Entertainment**| Monthly Netflix subscription | 649        | CARD           | Wednesday | Night       | Yes       | Online    |
| **Total**       |                               | **6129**   |                |           |         
    |           |           |

#### 🔍 Insights:
*   **Total Spending:** Your total recorded expenses for last week amounted to **₹6129**.
*   **Dominant Category:** **Household (Groceries)** was your largest spending area, accounting for ₹3200, which is approximately **52.2%** of your total weekly expenses. This suggests a significant portion of your budget is dedicated to essential household provisions.
*   **Discretionary vs. Essential:** Approximately **35%** (₹2149) of your spending was on discretionary items like Dining and Entertainment, while **65%** (₹3980) was on essential categories like Household and Transport.
*   **Recurring Costs:** A **₹649 monthly Netflix subscription** is identified as a fixed recurring expense, which is important to factor into your regular budget.
*   **Payment Behavior:** You utilized a variety of payment methods including **CASH** for groceries, **UPI** for dining and transport, and a **CARD** for your subscription. This diverse usage indicates adaptability in your transaction methods.
*   **Weekend Spending:** A substantial **₹4700 (76.7%)** of your total weekly spending occurred over the weekend (Sunday and Saturday), suggesting that weekends are periods of higher spending activity for you, particularly due to groceries and social dining.

#### 💡 Recommendations:
*   **Optimize Grocery Budget:** Given that groceries are your top expense, explore strategies like meal planning, buying non-perishable items in bulk, or comparing prices at different stores to potentially reduce costs in this category.
*   **Manage Discretionary Spending:** Set specific weekly or monthly limits for categories like 'Dining Out' and 'Entertainment'. Consider balancing more expensive social outings with budget-friendly alternatives.
*   **Budget Planning:** Create a comprehensive budget that allocates funds to each spending category. This will help you track against your targets and identify areas for potential savings.
*   **Review Recurring Subscriptions:** While Netflix is a relatively small portion, regularly reviewing all recurring subscriptions ensures you're only paying for services you actively use.

`,
        graphs: [
          {
            type: "pie",
            title: "Last Week's Spending by Category",
            description:
              "Distribution of expenses across different categories for last week.",
            chartData: [
              { category: "Household", amount: 3200, fill: "var(--chart-1)" },
              { category: "Dining", amount: 1500, fill: "var(--chart-2)" },
              { category: "Transport", amount: 780, fill: "var(--chart-3)" },
              {
                category: "Entertainment",
                amount: 649,
                fill: "var(--chart-4)",
              },
            ],
            chartConfig: {
              amount: { label: "Amount (₹)" },
              Household: { label: "Household", color: "var(--chart-1)" },
              Dining: { label: "Dining", color: "var(--chart-2)" },
              Transport: { label: "Transport", color: "var(--chart-3)" },
              Entertainment: {
                label: "Entertainment",
                color: "var(--chart-4)",
              },
            },
          },
          {
            type: "bar",
            title: "Last Week's Spending by Weekday",
            description: "Total expenses incurred on each day of the week.",
            chartData: [
              { weekday: "Wednesday", amount: 649 },
              { weekday: "Friday", amount: 780 },
              { weekday: "Saturday", amount: 1500 },
              { weekday: "Sunday", amount: 3200 },
            ],
            chartConfig: {
              amount: { label: "Amount (₹)", color: "var(--chart-1)" },
            },
          },
          {
            type: "pie",
            title: "Essential vs Discretionary Spending",
            description:
              "Breakdown of spending into essential and discretionary categories for last week.",
            chartData: [
              { type: "Essential", value: 65, fill: "var(--chart-1)" },
              { type: "Discretionary", value: 35, fill: "var(--chart-2)" },
            ],
            chartConfig: {
              value: { label: "Percentage" },
              Essential: { label: "Essential", color: "var(--chart-1)" },
              Discretionary: {
                label: "Discretionary",
                color: "var(--chart-2)",
              },
            },
          },
        ],
      };

      console.log("expnse analyse", parsed);

      return parsed;
    case "detailed-report":
      console.log("generating detauled report");
    case "create-budget":
      console.log("create-budget");
    case "view-budget":
      console.log("view-budget");
    default:
      expensePrompt = "Unknown task. Please select a valid option.";

      break;
  }

  console.log("bussiness analysis");
}

/*

1. analysis:
- Aggregates a weekly report or monthly report
- which highlights the expenses made by a user here
2. steps to be better:
- based on diff parameters
- like spend less on xyx and  invest more in xyx
- more with actiomabel steps to it
3. Deliverables PDF Reports & Professional-looking monthly:
- quarterly financial reports & Interactive Dashboards
- pdf reports with graphs, tables and detailed information about the user spending patterms here
4. Learns your spending patterns & suggests actionable steps to be a better investor (weekly and monthly spends)

- expense tagging + categorisation into needs, wants
- report (expenses, profit loss => categorise) => graphs
- Automatic Budgets for month and track & product analysis to anlayse trending products



6. Suggested Visualizations for Habits
- Stacked Bar Chart: Essentials vs discretionary vs splurges.
- Line Chart: Spending trends across the month highlighting spikes.
- Pie Chart: Category breakdown + % over budget.
- Heatmap Calendar: Days with highest spending.
- Goal vs Actual Graph: Savings and budget targets.
- Alerts / Notifications Section: Highlight overspending, recurring cost warnings.
- If you want, I can draft a full monthly report structure with metrics, charts, insights, 
- and advice laid out exactly like a dashboard, ready to be implemented.


Executable: (regular):
1. upload bank statements (pdf, image, excel) & analyse => report (expenses, profit loss => categorise) => graphs
2. revenue target (upload bussiness plan) => context & executable (data driven)
3. investemnets (track, growth, dashboard), google sheets (interactive) + templates (prebuilt)
4. loan managements (trackd diff options) - taking loan, edication, tracking, 
5. Automatic Budgets for month and track
6. product analysis


Suggest monthly budgets based on historical spending.


Thought Process of AI Accountant:
- for ai-accountant: aim is to help the users do thier financical tasks (keeping track of theier purchases)
- ability to add purchase or spend data manually or upload reciet data here (or manullay track purchases here graudally or at end f month here)
- in a excel sheet uploaded here (or in our excel like interface) => which ananylses the data and gives the user a report about thier spending habits 
- and some actions steps to be taken by the user (in a pdf style report) (being a expert finanical expert here)
- helps ou to fill your taxes & suggest ways to save upon it effectvely eliminating the need for a ca (for ordinary people with jobs)
- financial expert => helps to research on stock data & sends you a brief report on todasy arkets ect features

CORE FEATURES:
(upload transactions) => upload
1. track expenses & analyse them & dicusss with the ai voice powered financial expert, how to cut off unbesscary thigs & introduce to you some finanical concept & clear your doubts in an eaasy way
2. plan with voice powred ai expter(which has a lot of knolege about investing) => detailed report sof stock markte & ralted to it (tools to be used by retail vestor)
(CHATGPT for investor with hands sort of)
3. Helps to fill tax & tax realted queries ansyering bot (powered by rag on data & llms)
4. creates visualisations of the boridng stoc data to help you
5. .Helps compaanies track thier financiial & an great ui to witness it



Got it — you’re basically imagining an AI Accountant + Financial Partner that works like a “personal CFO” for ordinary people and small businesses.
Your core list already nails a lot of it. Let’s expand it into a much richer vision while keeping it practical.

🌟 Big Idea: AI Accountant & Financial Partner

An always-on voice + text AI that tracks, analyses, advises, and automates everyday and small-business finances.
Think: Mint + QuickBooks + a Financial Coach + a Tax Consultant + a Research Assistant — but voice-first and simple.

📝 Expanded Capabilities
1️⃣ Expense Tracking & Insights

Omnichannel Data Input

Voice input (“I spent ₹300 on groceries today”).
Scan/upload receipts or invoices.
Auto-fetch data from bank statements, UPI/credit card transactions, or e-commerce platforms.
Smart Categorisation
Auto-tags expenses (utilities, rent, marketing, travel, etc.).
Learn your spending patterns over time for more accuracy.
Trend Analysis
Weekly/monthly spending trends in easy visuals.
Compare against your budget & flag anomalies.
Cash Flow Forecasting
Predict future balance based on past spending & incoming income.

2️⃣ Budgeting & Planning


Real-time notifications when nearing limits.

Savings Goals

AI calculates how much to save weekly/monthly to hit targets.

Debt Management

Suggest ways to reduce interest payments.

Scenario Planning

“If I cut my restaurant spending by 15%, how much will I save yearly?”

3️⃣ Tax & Compliance

Tax Filing Assistant
Auto-categorise deductible expenses.
Generate tax-ready statements and forms.
Voice Q&A on tax rules (RAG from official sources).
Tax Saving Tips
Suggest legal deductions, rebates, and investment-linked savings schemes.

Deadline Tracking

Alerts for GST filings, income tax deadlines, invoice due dates.s

4️⃣ Investments & Wealth Building

Daily Market Briefings

Summaries of stock market, mutual funds, crypto, etc., tailored to the user’s portfolio or interests.

Investment Research Assistant

Pulls key financial ratios, analyst ratings, and news sentiment.

Portfolio Tracker

Unified dashboard of all holdings across brokers.

Risk Profiling & Allocation

Suggests optimal asset allocation based on your risk tolerance.

Goal-Based Investing

Aligns investments to life goals (education, retirement, buying a house).

5️⃣ Financial Education

Voice-First Financial Concepts

“Explain compound interest like I’m 15.”

Interactive Quizzes

Learn tax-saving instruments, budgeting hacks, or market basics.

Daily Money Tip

A 30-second tip or myth-busting fact to build literacy gradually.

6️⃣ For Small Businesses

Income & Expense Management
Track revenue, expenses, and profit margins.
Invoice & Payment Tracking
Generate invoices + reminders for overdue payments.
Cash Flow Dashboard
Live view of payables, receivables, and cash runway.
Payroll & Compliance
Basic payroll calculations and statutory filings support.
Tax-Optimised Business Structure

AI suggestions on GST, deductions, or compliance strategies.
7️⃣ Advanced Visualisations

Budget vs. Actual Graphs
Cash Flow Heatmaps
Category Drilldowns (see spending per vendor).
Investment Growth Projections
Scenario Modelling (what-if analysis).

8️⃣ Voice-Powered Expert / “AI CFO”

Natural Conversations
“Can I afford a vacation this month?”
“How much GST do I owe this quarter?”

Negotiation Insights
Suggest where you can renegotiate subscriptions or vendor contracts.

Financial Health Score
A single metric summarising your savings, spending, and risk level.

9️⃣ Automation & Integrations

Banking API Integrations (via Plaid-like services in India).

Accountant Handoff
Share AI-generated reports with a human CA instantly.

Cloud Sync
Works across devices, with Excel/Google Sheets import/export.

Personalised Alerts
E.g., “Your electricity bill doubled compared to last month.”
*/
